/*!
 *  @brief  Twitterプロフィールアクセスクラス(background側)
 *  @note   twitter.comからユーザプロフィールを得る
 */
class BGTwProfileAccessor extends BGMessageSender {
    //
    constructor() {
        super();
        //
        this.wait_queue_from_tweet_id = [];
        this.http_request_timer_from_tweet_id = null;
    }

    static command() {
        return "get_tw_profile";
    }

    /*!
     *  @brief  TwitterプロフィールをJSONで得る
     *  @param  username    ユーザ名
     *  @param  image_id    プロフィール画像ID
     *  @note   twiterではuseridをkeyにprofileを得る使われ方がメインだが
     *  @note   本extentionでは欠損しているuseridを得るために使用するため
     *  @note   usernameをkeyとする
     */
    request_tw_profile(username, image_id) {
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
                    super.entry_wait_queue(username, image_id);
                    super.update_reply_queue(username,
                                             this.request_tw_profile.bind(this));
                }
            } else
            if (response.status == 404) {
                // not found → ユーザ名変更またはアカウント削除
                super.update_reply_queue(username,
                                         this.request_tw_profile.bind(this));
                this.send_reply({command: BGTwProfileAccessor.command(),
                                 result: "not_found",
                                 username: username,
                                 image_id: image_id});
            } else
            if (response.status == 0 &&response.type == 'opaqueredirect') {
                // redirect → 凍結
                super.update_reply_queue(username,
                                         this.request_tw_profile.bind(this));
                this.send_reply({command: BGTwProfileAccessor.command(),
                                 result: "suspended",
                                 username: username,
                                 image_id: image_id});
            }
        })
        .then(json => {
            if (json != null) {
                super.update_reply_queue(username,
                                         this.request_tw_profile.bind(this));
                this.send_reply({command: BGTwProfileAccessor.command(),
                                 result: "success",
                                 userid: json.user_id,
                                 username: username,
                                 image_id: image_id});
            }
        })
        .catch(err => {
            // [error]fetchエラー
            this.send_reply({command: BGTwProfileAccessor.command(),
                             result: "fail",
                             username: username,
                             image_id: image_id});
        });
    }


    /*!
     */
    request_tw_profile_from_tweet_id_delay() {
        this.http_request_timer_from_tweet_id = setTimeout(()=> {
            var top = this.wait_queue_from_tweet_id[0];
            this.requet_tw_profile_from_tweet_id(top.image_id, top.tweet_id.shift());
            clearTimeout(this.http_request_timer_from_tweet_id);
            this.http_request_timer_from_tweet_id = null;
        });
    }

    /*!
     *  @brief  同一image_idの次tweet_idで問い合わせる
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
     *  @brief  現在扱ってるimage_idを破棄して次へ
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
     *  @param  image_id    プロフィール画像ID
     *  @param  tweet_id    tweet_id群
     */
    requet_tw_profile_from_tweet_id(image_id, tweet_id) {
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
                    return response.json();
                } else {
                    console.log(content_type);
                }
            } else {
                if (response.status == 403) {
                    // not found → 削除済みツイート
                    if (!this.request_tw_profile_from_tweet_id_next()) {
                        // 全tweet_idで問い合わせたがダメだった
                        this.send_reply({command: BGTwProfileAccessor.command(),
                                         result: "tweet_id_not_found",
                                         image_id: image_id});
                        this.update_queue_from_tweet_id();
                    }
                } else {
                    console.log(response.status);
                }
            }
        })
        .then(json => {
            if (json != null) {
                this.send_reply({command: BGTwProfileAccessor.command(),
                                 result: "tweet_id_success",
                                 json: json,
                                 image_id: image_id});
                this.update_queue_from_tweet_id();
            }
        })
        .catch(err => {
            // [error]fetchエラー
            this.send_reply({command: BGTwProfileAccessor.command(),
                             result: "tweet_id_fail",
                             image_id: image_id});
        });
    }

    /*!
     *  @brief  onMessageコールバック
     *  @param  request
     */
    on_message(request) {
        if (request.tweet_id == null) {
            const username = request.username;
            const image_id = request.image_id;
            if (!super.can_http_request(username, image_id)) {
                return;
            }
            this.request_tw_profile(username, image_id);
        } else {
            const b_empty = this.wait_queue_from_tweet_id.length == 0;
            this.wait_queue_from_tweet_id.push({image_id: request.image_id,
                                                tweet_id: request.tweet_id});
            if (!b_empty) {
                return;
            }
            this.requet_tw_profile_from_tweet_id(request.image_id,
                                                 request.tweet_id.shift());
        }
    }
}
