/*!
 *  @brief  短縮URL展開クラス(background側)
 *  @note   実務者
 */
class BGShortUrlDecoder extends BGMessageSender {
    //
    constructor() {
        super();
        this.short_url_map = [];
    }

    static command() {
        return "decode_short_url";
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
                "TwitterFilterCommand": BGShortUrlDecoder.command(),
                "StartURL": url_org,
            },
        })
        .then(response => {})
        .catch(err => {
            // [error]fetchエラー
            this.remove_short_url(url_org);
            this.send_reply({command: BGShortUrlDecoder.command(),
                             result: "fail",
                             short_url: url_org});
        });
    }

    /*!
     *  @brief  onHeadersReceivedコールバック
     *  @param  details 
     */
    on_headers_received(details) {
        if (!this.is_owned_request(details.requestId)) {
            return; // 監視対象外
        }
        this.release_request(details.requestId);
        //
        const func_name = this.on_headers_received.name;
        const rep_command = BGShortUrlDecoder.command();
        //
        const responseHeaders = details.responseHeaders;
        const short_url_org = this.get_short_url_org(details.requestId);
        if (short_url_org == '') {
            // [error]起点短縮URLが取得できなかった
            console.log(func_name
                        + '> error:fail to get short-url-org(from:'
                        + details.url
                        + ').');
            return;
        }
        //
        const STC_MOVED_PERMANENTLY = 301;
        const STC_FOUND = 302;
        const STC_INTERNAL_REDIRECT = 307;
        const STC_HTNTO_REDIRECT = 204;
        if (details.statusCode == STC_MOVED_PERMANENTLY ||
            details.statusCode == STC_FOUND             ||
            details.statusCode == STC_INTERNAL_REDIRECT ||
            details.statusCode == STC_HTNTO_REDIRECT) {
            const url = HttpUtil.get_location(details.responseHeaders);
            if (url == '') {
                // [error]新種のHeader?
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

    /*!
     *  @brief  onBeforeSendHeadersコールバック
     *  @param  details
     */
    on_before_send_headers(details) {
        // note
        // 起点短縮URLとresponseHedersを紐付ける
        //  1. requestHeadersに起点短縮URLを書き込んでおく
        //  2. onBeforeSendHeaders：requestIdと起点短縮URLを紐付ける
        //  3. onHeadersReceived  ：requestIdから起点短縮URLを得られる
        //  4. 短縮URLが多段だった場合1へ
        const short_url_org = HttpUtil.get_param(details.requestHeaders, "StartURL");
        if (short_url_org == '') {
            // error:起点短縮URLが取得できなかった
            const func_name = this.on_before_send_headers.name;
            console.log(func_name
                        + '> error:fail to get short-url-org(to '
                        + details.url
                        + ').');
            return;
        }
        this.hold_request(details.requestId);
        this.bind_short_url_with_requestId(short_url_org, details.requestId);
    }

    /*!
     *  @brief  onMessageコールバック
     *  @param  request
     */
    on_message_decode_short_url(request) {
        const expand_url = this.get_expand_url(request.short_url);
        if (expand_url == null) {
            this.entry_short_url(request.short_url);
            this.request_expand_url(request.short_url, request.short_url);
        } else {
            // 展開済み
            this.send_reply_delay({command: "decode_short_url",
                                   result: "success",
                                   short_url: request.short_url,
                                   url: expand_url});
        }
    }
}
