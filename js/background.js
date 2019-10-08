/*!
 *  @brief  background.js本体
 */
class Background {
    //
    constructor() {
        this.initialize();
    }

    /*!
     *  @brief  タブ登録
     *  @param  extention_id    拡張機能ID
     *  @param  tab_id          タブID
     *  @note   "Twitterフィルタ"が有効なタブを登録
     *  @note   返信は登録されたタブにのみ行う
     */
    entry(extention_id, tab_id) {
        this.extention_id = extention_id;
        this.connected_tab[tab_id] = null;
    }


    /*!
     *  @brief  起点短縮URL登録
     *  @param  short_url   起点短縮URL
     */
    entry_short_url(short_url) {
        var obj = {};
        obj.stage = [];
        this.short_url_map[short_url] = obj;
    }
    /*!
     *  @brief  起点短縮URL削除
     *  @param  short_url   起点短縮URL
     */
    remove_short_url(short_url) {
        delete this.short_url_map[short_url];
    }
    /*!
     *  @brief  展開後URL登録
     *  @param  short_url   起点短縮URL
     *  @param  exp_url     展開後URL
     */
    tell_expand_url(short_url, exp_url) {
        var obj = this.short_url_map[short_url];
        if (obj == null) {
            return; // error:なぜか存在しない
        }
        obj.expand_url = exp_url;
    }
    /*!
     *  @brief  起点短縮URLとHttpRequestの紐付け
     *  @param  short_url   起点短縮URL
     *  @param  requestId   (HttpRequest間で重複しないパラメータ)
     *  @note   展開後URLは起点となる短縮URLとセットでないと意味を為さないが
     *  @note   HttpRequestのResponseをListenerでフックして展開後URLを得てい
     *  @note   るため、短縮URLが多段だった場合、最終結果から起点を逆引きで
     *  @note   きない(Responseはその段のrequestURLとredirectURLしか持たない)
     *  @note   Request/Responseで共通かつuniqueなパラメータと起点短縮URLを
     *  @note   Requestごとに紐付けすることで逆引きを可能とする
     */
    bind_short_url_with_requestId(short_url, requestId) {
        var obj = this.short_url_map[short_url];
        if (obj == null) {
            return; // error:なぜか存在しない
        }
        obj.stage[requestId] = null;
    }

    /*!
     *  @brief  起点短縮URLを得る
     *  @param  requestId   ResponseのrequestId
     *  @param  url         Responseを得たurl
     *  @note   多段短縮URL対策
     */
    get_short_url_org(requestId) {
        for (const key in this.short_url_map) {
            const obj = this.short_url_map[key];
            if (requestId in obj.stage) {
                return key;
            }
        }
        return ''; // error:なぜか登録されてない
    }
    /*!
     *  @brief  短縮URLの段数を得る
     *  @param  short_url   起点短縮URL
     *  @return 段数(Request回数)
     */
    get_short_url_stage(short_url) {
        const obj = this.short_url_map[short_url];
        if (obj == null) {
            return 255; // error:なぜか存在しない
        }
        return Object.keys(obj.stage).length;
    }
    /*!
     *  @brief  展開済み短縮URLを得る
     *  @param  short_url   起点短縮URL
     */
    get_expand_url(short_url) {
        const obj = this.short_url_map[short_url];
        if (obj == null) {
            return null; // error:なぜか存在しない
        }
        return obj.expand_url;
    }

    /*!
     *  @bref   監視対象httpRequestか
     *  @param  details
     */
    in_monitoring_request(details) {
        return details.initiator != null    &&
               this.extention_id != ''      &&
               details.initiator.indexOf(this.extention_id) >= 0;
    }

    /*!
     *  @brief  返信
     *  @param  message メッセージ
     *  @note   登録されているタブにのみ送信
     */
    send_reply(message) {
        chrome.tabs.query({}, (tabs)=> {
            for (const tab of tabs) {
                if (tab.id in this.connected_tab) {
                    // note
                    // responseを設定するとerror
                    //   "The message port closed before a response was received."
                    // → 応答不要なのでnullにしておく
                    chrome.tabs.sendMessage(tab.id, message, null); 
                }
            }
        });
    }
    /*!
     *  @brief  遅延返信
     *  @note   content_scriptsメッセージ受信処理の途中で返信するのは気持ち悪い。
     *  @note   理想は受信関数を抜けたタイミングでの返信だが、関数終了eventは見当
     *  @note   たらず、Listner登録関数からPromiseを返す手法もうまくいかない。
     *  @note   原始的な手法(Timer)に頼る…
     */
    send_reply_delay(message) {
        if (this.delay_send_timer == null) {
            this.delay_send_timer = setTimeout(()=> {
                for (const msg of this.delay_message) {
                    this.send_reply(msg);
                }
                clearTimeout(this.delay_send_timer);
                this.delay_send_timer = null;
                this.delay_message = [];
            });
        }
        this.delay_message.push(message);
    }

    get_location_from_headers(responseHeaders) {
        for (const header of responseHeaders) {
            if (header.name == 'Location' ||
                header.name == 'location' ||
                header.name == 'x-redirect-to' ||
                header.name == 'X-Redirect-To') {
                return header.value;
            }
        }
        return '';
    }

    /*!
     *  @brief  responseHeadersから遷移先URLを得る
     *  @param  details 
     */
    get_location(details) {
        if (!this.in_monitoring_request(details)) {
            return;
        }
        const responseHeaders = details.responseHeaders;
        const short_url_org = this.get_short_url_org(details.requestId);
        if (short_url_org == '') {
            // [error]起点短縮URLが取得できなかった
            const func_name = this.get_location.name;
            console.log(func_name
                        + '> error:fail to get short-url-org(from:'
                        + details.url
                        + ').');
            return;
        }
        const rep_command = "decode_short_url";
        //
        const STC_MOVED_PERMANENTLY = 301;
        const STC_FOUND = 302;
        const STC_INTERNAL_REDIRECT = 307;
        const STC_HTNTO_REDIRECT = 204;
        if (details.statusCode == STC_MOVED_PERMANENTLY ||
            details.statusCode == STC_FOUND             ||
            details.statusCode == STC_INTERNAL_REDIRECT ||
            details.statusCode == STC_HTNTO_REDIRECT) {
            const url = this.get_location_from_headers(details.responseHeaders);
            if (url == '') {
                // [error]新種のHeader?
                const func_name = this.get_location.name;
                console.log(func_name
                            + '> error:fail to get redirect-url(from:'
                            + details.url
                            + ').');
                this.remove_short_url(short_url_org);
                this.send_reply({command: rep_command,
                                 result: "fail",
                                 short_url: short_url_org});
                return;
            }
            const loc = new urlWrapper(url);
            const b_is_short_url = loc.is_short_url();
            if (b_is_short_url) {
                loc.normalize_short_url();
            }
            if (b_is_short_url || loc.is_hatena_redirection()) {
                // 多段短縮URL
                const stage = this.get_short_url_stage(short_url_org);
                const MAX_SHORT_URL_STAGE = 4;  // 1URLにつき問い合わせは4回まで
                if (stage >= MAX_SHORT_URL_STAGE) {
                    // [error]段数多すぎ
                    const func_name = this.get_location.name;
                    console.log(func_name
                                + '> error:over limit of stage(orig:'
                                + short_url_org
                                + ',stage:'
                                + stage
                                + ').');
                    this.tell_expand_url(short_url_org, url); // 最終URLを登録しとく
                    this.send_reply({command: rep_command,
                                     result: "over_stage",
                                     short_url: short_url_org});
                } else {
                    // 次展開
                    this.request_expand_url(loc.url, short_url_org);
                }
            } else {
                // 展開成功
                this.tell_expand_url(short_url_org, url);
                this.send_reply({command: rep_command,
                                 result: "success",
                                 short_url: short_url_org,
                                 url: url});
            }
        } else {
            // [error]展開失敗
            const func_name = this.get_location.name;
            console.log(func_name
                        + '> error:fail to receive(orig:'
                        + short_url_org
                        + ',current:'
                        + details.url
                        + ',status:'
                        + details.statusCode
                        + ').');
            this.remove_short_url(short_url_org);
            this.send_reply({command: rep_command,
                             result: "fail",
                             short_url: short_url_org});
        }
    }

    get_start_url_from_headers(responseHeaders) {
        for (const header of responseHeaders) {
            if (header.name == 'StartURL') {
                return header.value;
            }
        }
        return ''; // error:起点短縮URLを持ってない
    }

    /*!
     *  @brief  requestHeadersからrequestIdを得る
     *  @param  details
     *  @note   起点短縮URLとresponseHedersを紐付ける仕組み
     *  @note   1. requestHeadersに起点短縮URLを書き込んでおく
     *  @note   2. onBeforeSendHeaders：requestIdと起点短縮URLを紐付ける
     *  @note   3. onHeadersReceived  ：requestIdから起点短縮URLを得られる
     *  @note   4. 短縮URLが多段だった場合1へ
     */
    get_request_id(details) {
        if (!this.in_monitoring_request(details)) {
            return;
        }
        const short_url_org = this.get_start_url_from_headers(details.requestHeaders);
        if (short_url_org == '') {
            // error:起点短縮URLが取得できなかった
            const func_name = this.get_request_id.name;
            console.log(func_name
                        + '> error:fail to get short-url-org(to '
                        + details.url
                        + ').');
            return;
        }
        this.bind_short_url_with_requestId(short_url_org, details.requestId);
    }

    /*!
     *  @brief  短縮URL展開要求
     *  @param  short_url   展開する短縮URL
     *  @param  url_org     多段短縮URLの起点
     */
    request_expand_url(short_url, url_org) {
        fetch(short_url, {
            method: "HEAD",
            redirect: "manual",
            credentials: "omit",
            headers: {
                "StartURL": url_org,
            },
        })
        .then(response => {})
        .catch(err => {
            // [error]fetchエラー
            this.remove_short_url(url_org);
            this.send_reply({command: "decode_short_url",
                             result: "fail",
                             short_url: url_org});
        });
    }

    initialize() {
        this.short_url_map = [];
        this.extention_id = '';
        this.connected_tab = [];
        this.delay_send_timer = null;
        this.delay_message = [];
        //
        const pattern = [
            'https://amba.to/*',
            'https://amzn.to/*',
            'https://bit.ly/*',
            'https://buff.ly/*',
            'https://dlvr.it/*',
            'https://goo.gl/*',
            'https://htn.to/*', 'https://b.hatena.ne.jp/-/*',
            'https://ino.to/*',
            'https://ift.tt/*',
            'https://is.gd/*',
            'https://j.mp/*',
            'https://kisu.me/*',
            'https://lb.to/*',
            'http://nav.cx/*',
            'https://npx.me/*',
            'http://ow.ly/*',
            'https://tinyurl.com/*'
        ];
        //
        chrome.webRequest.onHeadersReceived.addListener(
            this.get_location.bind(this),
            {urls: pattern},
            ['responseHeaders']
        );

        chrome.webRequest.onBeforeSendHeaders.addListener(
            this.get_request_id.bind(this),
            {urls: pattern},
            ['requestHeaders']
        );
    }
}


chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse)=> {
        const TIMEOUT_MS = 16000;
        //
        if (request.command == "decode_short_url") {
            const expand_url = gBackground.get_expand_url(request.short_url);
            if (expand_url == null) {
                gBackground.entry_short_url(request.short_url);
                gBackground.request_expand_url(request.short_url,
                                               request.short_url);
            } else {
                // 展開済み
                gBackground.send_reply_delay({command: "decode_short_url",
                                              result: "success",
                                              short_url: request.short_url,
                                              url: expand_url});
            }
        } else
        if (request.command == "start_content") {
            gBackground.entry(sender.id, sender.tab.id);
        }
        return true;
    }
);

var gBackground = new Background();
