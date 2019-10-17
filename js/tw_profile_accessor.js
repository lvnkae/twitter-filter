/*!
 *  @brief  Twitterユーザプロフィール取得クラス
 */
class TwProfileAccessor {

    constructor() {
        this.profile_map = [];
    }

    /*!
     *  @brief  ユーザ名登録
     *  @param  username    ユーザ名
     */
    entry(username) {
        if (username in this.profile_map) {
            return;
        } else {
            // 新規登録
            var obj = {};
            obj.username = username;
            obj.busy = false;
            this.profile_map[username] = obj;
        }
    }

    /*!
     *  @brief  プロフィール取得要求
     *  @note   未処理のリクエストを処理する
     */
    publish_request() {
        for (const key in this.profile_map) {
            const obj = this.profile_map[key];
            if (!obj.busy && obj.userid == null) {
                obj.busy = true;
                // content_script内で他domainへアクセスするとCORBされるためbgへ移譲
                MessageUtil.send_message({command:"get_tw_profile", username: key});
            }
        }
    }

    /*!
     *  @brief  プロフィール取得完了通知
     *  @param  userid      ユーザID
     *  @param  username    ユーザ名
     *  @param  filter_func フィルタ関数
     */
    tell_gotten(userid, username, filter_func) {
        if (username in this.profile_map) {
            var obj = this.profile_map[username];
            obj.userid = userid;
            obj.last_username = username;
            obj.busy = false;
            filter_func(obj);
        }
    }

    /*!
     *  @brief  プロフィール取得完了通知
     *  @param  json        tweet詳細(json)
     *  @param  username    ユーザ名
     *  @param  filter_func フィルタ関数
     *  @note   ユーザ名から取得できず、tweet_idでの再取得が成功した場合に使用
     */
    tell_gotten_retry(json, username, filter_func) {
        if (username in this.profile_map) {
            var obj = this.profile_map[username];
            const tw_info = TwitterUtil.get_tweet_info_from_html(json.tweet_html);
            obj.userid = tw_info.userid;
            obj.last_username = tw_info.username; // 最新のusername
            obj.busy = false;
            filter_func(obj);
        }
    }

    /*!
     *  @brief  プロフィール取得
     *  @note   取得済み(キャッシュ)を得る
     */
    get_profile(username) {
        if (username in this.profile_map) {
            const obj = this.profile_map[username];
            if (obj.userid != null) {
                return obj;
            }
        }
        return null;
    }
}
