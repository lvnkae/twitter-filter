/*!
 *  @brief  Twitterプロフィール画像アクセスクラス(background側)
 *  @note   twitter.comからプロフィール画像URLを得る
 */
class BGTwProfileImageAccessor extends BGMessageSender {
    //
    constructor() {
        super();
    }

    static command() {
        return "get_tw_profile_image";
    }

    /*!
     *  @brief  Twitterプロフィール画像URLを得る
     *  @param  username    ユーザ名
     *  @param  _fparam     未使用
     *  @note   twiterではuseridをkeyにprofileを得る使われ方がメインだが
     *  @note   本extentionでは欠損しているuseridを得るために使用するため
     *  @note   usernameをkeyとする
     */
    request_tw_profile_image(username, _fparam) {
        const tw_url = 'https://twitter.com/' + username + '/profile_image?size=normal';
        this.mark_reply_queue(username);
        fetch(tw_url, {
            method: "HEAD",
            redirect: "manual",
            credentials: "omit",
            headers: {
                "TwitterFilterCommand": BGTwProfileImageAccessor.command(),
            },
        })
        .then(response => {})
        .catch(err => {
            const q = this.get_reply_queue(username);
            // [error]fetchエラー
            this.send_reply({command: BGTwProfileImageAccessor.command(),
                             result: "fail",
                             username: username}, q.tag_ids);
            super.update_reply_queue(username,
                                     this.request_tw_profile_image.bind(this));
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
        const rep_command = BGTwProfileImageAccessor.command();
        //
        const responseHeaders = details.responseHeaders;
        const req_url = new urlWrapper(details.url);
        const username = req_url.subdir[0];
        const q = this.get_reply_queue(username);
        if (q && q.tab_ids) {
        } else {
            console.log("error");
        }
        //
        const STC_REDIRECT_TO_IMAGE = 302;
        const STC_OVERTIMES_ACCESS = 200;
        const STC_ACCOUNT_SUSPENDED = 403;
        if (details.statusCode == STC_REDIRECT_TO_IMAGE) {
            const profile_image_url
                = HttpUtil.get_param(details.responseHeaders, "location");
            if (profile_image_url == '/') {
                // username変更orアカウント削除
                this.send_reply({command: rep_command,
                                 result: "not_found",
                                 username: username}, q.tab_ids);
            } else {
                this.send_reply({command: rep_command,
                                 result: "success",
                                 image_url: profile_image_url,
                                 username: username}, q.tab_ids);
            }
        } else
        if (details.statusCode == STC_ACCOUNT_SUSPENDED) {
            // アカウント凍結
            this.send_reply({command: rep_command,
                             result: "suspended",
                             username: username}, q.tab_ids);
        } else
        if (details.statusCode == STC_OVERTIMES_ACCESS) {
            // 連続アクセスしすぎ？ → リトライ
            super.reentry_wait_queue(username, q);
        } else {
            // [error]展開失敗
            console.log(func_name
                        + '> error:fail to receive(url:'
                        + details.url
                        + ',status:'
                        + details.statusCode
                        + ').');
        }
        super.update_reply_queue(username,
                                 this.request_tw_profile_image.bind(this));
    }

    /*!
     *  @brief  onBeforeSendHeadersコールバック
     *  @param  details
     */
    on_before_send_headers(details) {
        this.hold_request(details.requestId);
    }

    /*!
     *  @brief  onMessageコールバック
     *  @param  request
     *  @param  sender  送信者情報
     */
    on_message(request, sender) {
        if (!super.can_http_request(request.username, null, sender.tab.id)) {
            return;
        }
        this.request_tw_profile_image(request.username);
    }
}
