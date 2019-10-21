/*!
 *  @brief  Twitterプロフィール画像取得クラス
 */
class TwProfileImageAccessor {

    constructor() {
        this.image_map = [];
    }

    /*!
     *  @brief  リクエスト登録
     *  @param  username    ユーザ名
     *  @param  local_id    プロフィール画像ID(local)
     */
    entry(username, local_id) {
        if (username in this.image_map) {
            this.image_map[username].local_id[local_id] = null;
        } else {
            // 新規登録
            var obj = {};
            obj.username = username;
            obj.local_id = [];
            obj.local_id[local_id] = null;
            obj.busy = false;
            this.image_map[username] = obj;
        }
    }

    /*!
     *  @brief  リクエスト発行
     *  @note   未処理のリクエストを処理する
     */
    publish_request() {
        for (const key in this.image_map) {
            const obj = this.image_map[key];
            if (!obj.busy && obj.image_url == null) {
                obj.busy = true;
                // content_script内で他domainへアクセスするとCORBされるためbgへ移譲
                MessageUtil
                .send_message({command:"get_tw_profile_image", username: key});
            }
        }
    }

    /*!
     *  @brief  プロフィール画像URL取得完了通知
     *  @param  image_url   画像URL
     *  @param  username    ユーザ名
     *  @param  post_func   後処理関数
     */
    tell_gotten(image_url, username, post_func) {
        if (username in this.image_map) {
            var obj = this.image_map[username];
            obj.image_url = image_url;
            obj.image_id = TwitterUtil.get_id_from_profile_image(image_url);
            obj.busy = false;
            post_func(obj);
        }
    }

    /*!
     *  @brief  ユーザ名とプロフィール画像IDが紐付けされているか？
     *  @param  username    ユーザ名
     *  @param  local_id    プロフィール画像ID(local)
     *  @note   usernameだけではアカウントの同定は行えない(twitter内では問題ないが
     *  @note   togeterやYahooリアルタイム検索で得られるusernameは収集されてから時
     *  @note   間が経っているため、既にそのアカウントでは使われていない可能性があ
     *  @note   る)
     *  @note   usernameをキーに現在の画像IDを取得し、それがローカルの画像IDと一致
     *  @note   すれば、usernameは現在もそのアカウントで使用されていると保証される。
     */
    is_connected(username, local_id) {
        if (username in this.image_map) {
            return this.image_map[username].image_id == local_id;
        }
        return false;
    }

    /*!
     *  @brief  識別用ID群を得る
     *  @param  username    ユーザ名
     */
    get_local_id(username) {
        if (username in this.image_map) {
            return this.image_map[username].local_id;
        }
        return null;
    }
}
