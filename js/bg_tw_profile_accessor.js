/*!
 *  @brief  Twitterプロフィールアクセスクラス(background側)
 *  @note   twitter.comからユーザプロフィールを得る
 */
class BGTwProfileAccessor extends BGMessageSender {
    //
    constructor() {
        super();
        //
        this.reply_queue = {full:false, queue:[]};
        this.wait_queue = [];
        this.http_request_timer = null;
        //
        this.wait_queue_from_tweet_id = [];
        this.http_request_timer_from_tweet_id = null;
    }

    static command() {
        return "get_tw_profile";
    }

    static entry_queue(queue, username) {
        if (queue.full) {
            return false;
        }
        const MAX_HTTPREQUEST_PALLAREL = 8;
        queue.queue[username] = null;
        if (Object.keys(queue.queue).length == MAX_HTTPREQUEST_PALLAREL) {
            queue.full = true;
        }
        return true;
    }

    remove_reply_queue(username) {
        delete this.reply_queue.queue[username];
    }

    entry_wait_queue(username) {
        for (var inx = 0; inx < this.wait_queue.length; inx++) {
            if (BGTwProfileAccessor.entry_queue(this.wait_queue[inx], username)) {
                return;
            }
        }
        var obj = {};
        obj.full = false;
        obj.queue = [];
        obj.queue[username] = null;
        this.wait_queue.push(obj);
    }

    can_http_request(username) {
        // 既にキューに積まれてる？ → request不要
        if (username in this.reply_queue) {
            return false;
        }
        for (var queue of this.wait_queue) {
            if (username in queue.queue) {
                return false;
            }
        }
        // 即時request可？
        if (BGTwProfileAccessor.entry_queue(this.reply_queue, username)) {
            return true;
        }
        //
        this.entry_wait_queue(username);
        return false;
    }

    update_reply_queue(username) {
        this.remove_reply_queue(username);
        // 応答待ちキューが空になったか？
        if (Object.keys(this.reply_queue.queue).length > 0) {
            // 残あり
            return;
        } else {
            if (this.wait_queue.length == 0) {
                // 空になったが待機キューがない
                this.reply_queue.full = false;
                return;
            }
        }
        // 待機キューの引き上げ
        this.reply_queue = this.wait_queue[0];
        const ow_queue = this.wait_queue;
        this.wait_queue = [];
        for (var inx = 1; inx < ow_queue.length; inx++) {
            this.wait_queue.push(ow_queue[inx]);
        }
        // http_request発射
        this.http_request_timer = setTimeout(()=> {
            for (const username in this.reply_queue.queue) {
                this.request_tw_profile(username);
            }
            clearTimeout(this.http_request_timer);
            this.http_request_timer = null;
        }, 200); /* ウェイト入れてみる*/
    }

    /*!
     *  @brief  TwitterプロフィールをJSONで得る
     *  @param  username    ユーザ名
     *  @note   twiterではuseridをkeyにprofileを得る使われ方がメインだが
     *  @note   本extentionでは欠損しているuseridを得るために使用するため
     *  @note   usernameをkeyとする
     */
    request_tw_profile(username) {
        const tw_url = 'https://twitter.com/i/profiles/popup?screen_name=';
        fetch(tw_url + username, {
            method: "GET",
            redirect: "manual",
            credentials: "omit",
        })
        .then(response => {
            if (response.status == 200) {
                const content_type = response.headers.get('content-type');
                if (content_type.indexOf('application/json') >= 0) {
                    return response.json();
                } else {
                    // error(連続アクセスしすぎ?) → リトライ
                    this.entry_wait_queue(username);
                    this.update_reply_queue(username);
                }
            } else
            if (response.status == 404) {
                // not found → ユーザ名変更またはアカウント削除
                this.update_reply_queue(username);
                this.send_reply({command: BGTwProfileAccessor.command(),
                                 result: "not_found",
                                 username: username});
            } else
            if (response.status == 0 &&response.type == 'opaqueredirect') {
                // redirect → 凍結
                this.update_reply_queue(username);
                this.send_reply({command: BGTwProfileAccessor.command(),
                                 result: "suspended",
                                 userid: 'suspended',
                                 username: username});
            }
        })
        .then(json => {
            if (json != null) {
                this.update_reply_queue(username);
                this.send_reply({command: BGTwProfileAccessor.command(),
                                 result: "success",
                                 userid: json.user_id,
                                 username: username});
            }
        })
        .catch(err => {
            // [error]fetchエラー
            this.send_reply({command: BGTwProfileAccessor.command(),
                             result: "fail",
                             username: username});
        });
    }


    /*!
     */
    request_tw_profile_from_tweet_id_delay() {
        this.http_request_timer_from_tweet_id = setTimeout(()=> {
            var top = this.wait_queue_from_tweet_id[0];
            this.requet_tw_profile_from_tweet_id(top.username, top.tweet_id.shift());
            clearTimeout(this.http_request_timer_from_tweet_id);
            this.http_request_timer_from_tweet_id = null;
        });
    }

    /*!
     *  @brief  同一usernameの次tweet_idで問い合わせる
     */
    request_tw_profile_from_tweet_id_next() {
        const top = this.wait_queue_from_tweet_id[0];
        if (top.tweet_id.length == 0) {
            const rmv_top = this.wait_queue_from_tweet_id.shift();
            return false;
        }
        this.request_tw_profile_from_tweet_id_delay();
        return true;
    }

    /*!
     *  @brief  現在扱ってるusernameを破棄して次へ
     */
    update_queue_from_tweet_id() {
        const rmv_top = this.wait_queue_from_tweet_id.shift();
        if (this.wait_queue_from_tweet_id.length == 0) {
            return; // 空になった
        }
        this.request_tw_profile_from_tweet_id_delay();
    }

    /*!
     *  @brief  TwitterプロフィールをJSONで得る(tweet経由)
     *  @param  username    ユーザ名
     *  @param  tweet_id    tweet_id群
     */
    requet_tw_profile_from_tweet_id(username, tweet_id) {
        const tw_url = 'https://twitter.com/i/tweet/stickersHtml?id=';
        fetch(tw_url + tweet_id, {
            method: "GET",
            redirect: "manual",
            credentials: "omit",
        })
        .then(response => {
            if (response.status == 200) {
                const content_type = response.headers.get('content-type');
                if (content_type.indexOf('application/json') >= 0) {
                } else {
                    console.log(content_type);
                }
                return response.json();
            } else {
                if (response.status == 403) {
                    // not found → 削除済みツイート
                    if (!this.request_tw_profile_from_tweet_id_next()) {
                        // 全tweet_idで問い合わせたがダメだった
                        this.send_reply({command: BGTwProfileAccessor.command(),
                                         result: "retry_not_found",
                                         username: username});
                    }
                } else {
                    console.log(response.status);
                }
            }
        })
        .then(json => {
            if (json != null) {
                this.update_queue_from_tweet_id();
                this.send_reply({command: BGTwProfileAccessor.command(),
                                 result: "retry_success",
                                 json: json,
                                 username: username});
            }
        })
        .catch(err => {
            // [error]fetchエラー
            this.send_reply({command: BGTwProfileAccessor.command(),
                             result: "retry_fail",
                             username: username});
        });
    }

    /*!
     *  @brief  onMessageコールバック
     *  @param  request
     */
    on_message(request) {
        const username = request.username;
        if (request.tweet_id == null) {
            if (!this.can_http_request(username)) {
                return;
            }
            this.request_tw_profile(username);
        } else {
            const b_empty = this.wait_queue_from_tweet_id.length == 0;
            this.wait_queue_from_tweet_id.push({username: username,
                                                tweet_id: request.tweet_id});
            if (!b_empty) {
                return;
            }
            this.requet_tw_profile_from_tweet_id(username, request.tweet_id.shift());
        }
    }
}
