/*!
 *  @brief  tweetアクセスクラス(background側)
 *  @note   twitter.comからtweetの詳細を得る
 */
class BGTweetAccessor extends BGMessageSender {
    //
    constructor() {
        super();
        this.middle_id_map = [];
    }

    static command() {
        return "get_tweet";
    }
    static command_get_tweet_json() {
        return "get_tweet_json";
    }
    static command_get_tweet_id() {
        return "get_tweet_id";
    }


    /*!
     *  @brief  中間URL識別ID登録
     *  @param  middle_id   中間URL識別ID
     */
    entry_middle_id(middle_id) {
        var obj = {};
        obj.requestId = '';
        this.middle_id_map[middle_id] = obj;
    }
    /*!
     *  @brief  中間URL識別ID削除
     *  @param  middle_id   中間URL識別ID
     */
    remove_middle_id(middle_id) {
        delete this.middle_id_map[middle_id];
    }
    /*!
     *  @brief  中間URL識別IDとHttpRequestの紐付け
     *  @param  middle_id   中間URL識別ID
     *  @param  requestId   (HttpRequest間で重複しないパラメータ)
     */
    bind_middle_id_with_requestId(middle_id, requestId) {
        var obj = this.middle_id_map[middle_id];
        if (obj == null) {
            return; // error:なぜか存在しない
        }
        obj.requestId = requestId;
    }
    /*!
     *  @brief  中間URL識別IDを得る
     *  @param  requestId   ResponseのrequestId
     */
    get_middle_id(requestId) {
        for (const key in this.middle_id_map) {
            const obj = this.middle_id_map[key];
            if (obj.requestId == requestId) {
                return key;
            }
        }
        return ''; // error:なぜか登録されてない
    }

    /*!
     *  @brief  tweet詳細をJSONで得る
     *  @param  tweet_id    tweet-id(全tweetでunique)
     *  @param  middle_id   中間URL識別ID
     */
    request_tweet_json(tweet_id, middle_id) {
        const tw_url = 'https://twitter.com/i/tweet/stickersHtml?id=' + tweet_id;
        fetch(tw_url, {
            method: "GET",
            credentials: "omit",
            headers: {
                "TwitterFilterCommand": BGTweetAccessor.command(),
                "TweetAccessorCommand": BGTweetAccessor.command_get_tweet_json(),
            },
        })
        .then(response => {
            return response.json();
        })
        .then(json => {
            this.send_reply({command: BGTweetAccessor.command(),
                             result: "success",
                             tweet: json,
                             middle_id: middle_id});
        })
        .catch(err => {
            // [error]fetchエラー
            this.remove_short_url(url_org);
            this.send_reply({command: BGTweetAccessor.command(),
                             result: "fail",
                             tweet_id: tweet_id,
                             middle_id: middle_id});
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
        const rep_command = BGTweetAccessor.command();
        //
        const responseHeaders = details.responseHeaders;
        const middle_id = this.get_middle_id(details.requestId);
        if (middle_id == '') {
            // [error]中間URL識別IDが取得できなかった
            console.log(func_name
                        + '> error:fail to get middle-id(from:'
                        + details.url
                        + ').');
            return;
        }
        this.remove_middle_id(middle_id);
        //
        const STC_FOUND = 302;
        if (details.statusCode == STC_FOUND) {
            const url = HttpUtil.get_param(details.responseHeaders, "location");
            if (url == '') {
                // [error]仕様変更？
                console.log(func_name
                            + '> error:fail to get tweet-url(from:'
                            + details.url
                            + ').');
                this.send_reply({command: rep_command,
                                 result: "fail",
                                 middle_id: middle_id});
                return;
            }
            const loc = new urlWrapper(url);
            const tweet_id = loc.subdir[2];
            // tweet取得
            this.request_tweet_json(tweet_id, middle_id);
        } else {
            // [error]展開失敗
            console.log(func_name
                        + '> error:fail to receive(url:'
                        + details.url
                        + ',status:'
                        + details.statusCode
                        + ').');
            this.send_reply({command: rep_command,
                             result: "fail",
                             middle_id: middle_id});
        }
    }

    /*!
     *  @brief  onBeforeSendHeadersコールバック
     *  @param  details
     */
    on_before_send_headers(details) {
        const sub_command
            = HttpUtil.get_param(details.requestHeaders, "TweetAccessorCommand");
        if (sub_command != BGTweetAccessor.command_get_tweet_id()) {
            return;
        }
        const middle_id = HttpUtil.get_param(details.requestHeaders, "MiddleID");
        if (middle_id == '') {
            // error:中間URL識別IDが取得できなかった
            const func_name = this.on_before_send_headers.name;
            console.log(func_name
                        + '> error:fail to get middle-id(to '
                        + details.url
                        + ').');
            return;
        }
        this.hold_request(details.requestId);
        this.bind_middle_id_with_requestId(middle_id, details.requestId);
    }

    /*!
     *  @brief  tweet-id取得要求
     *  @param  middle_url  中間URL(ord.yahoo.co.jpなど)
     *  @param  middle_id   中間URL識別ID
     */
    request_tweet_id(middle_url, middle_id) {
        fetch(middle_url, {
            method: "HEAD",
            redirect: "manual",
            credentials: "omit",
            headers: {
                "TwitterFilterCommand": BGTweetAccessor.command(),
                "TweetAccessorCommand": BGTweetAccessor.command_get_tweet_id(),
                "MiddleID": middle_id,
            },
        })
        .then(response => {})
        .catch(err => {
            // [error]fetchエラー
            this.remove_short_url(url_org);
            this.send_reply({command: BGShortUrlDecoder.command(),
                             result: "fail",
                             middle_id: middle_id});
        });
    }

    /*!
     *  @brief  onMessageコールバック
     *  @param  request
     */
    on_message_get_tweet(request) {
        if (request.middle_id != null) {
            this.entry_middle_id(request.middle_id);
            this.request_tweet_id(request.middle_url, request.middle_id);
        } else
        if (request.tweet_id != null) {
            this.request_tweet_json(request.tweet_id, '');
        }
    }
}
