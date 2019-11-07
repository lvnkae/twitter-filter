/*!
 *  @brief  Twitterユーザプロフィール取得クラス
 */
class TwProfileAccessor {

    constructor() {
        this.image_id_map = [];
    }

    /*!
     *  @brief  ユーザ名登録
     *  @param  key_obj 登録キーオブジェクト
     */
    entry(key_obj) {
        if (key_obj.image_id in this.image_id_map) {
            return;
        } else {
            // 新規登録
            var obj = {};
            obj.username = key_obj.username;
            obj.image_id = key_obj.image_id;
            obj.busy = false;
            this.image_id_map[key_obj.image_id] = obj;
        }
    }

    /*!
     *  @brief  プロフィール取得要求
     *  @note   未処理のリクエストを処理する
     */
    publish_request() {
        for (const key in this.image_id_map) {
            const obj = this.image_id_map[key];
            if (!obj.busy && obj.userid == null) {
                obj.busy = true;
                // content_script内で他domainへアクセスするとCORBされるためbgへ移譲
                MessageUtil.send_message({command:"get_tw_profile",
                                          username: obj.username,
                                          image_id: obj.image_id});
            }
        }
    }

    /*!
     *  @brief  プロフィール取得完了通知
     *  @param  userid      ユーザID
     *  @param  username    ユーザ名
     *  @param  local_id    プロフィール画像ID(local)
     *  @param  filter_func フィルタ関数
     */
    tell_gotten(userid, username, local_id, filter_func) {
        if (local_id in this.image_id_map) {
            var obj = this.image_id_map[local_id];
            if (obj.username == username) {
                obj.userid = userid;
                obj.busy = false;
                filter_func(obj);
            }
        }
    }

    /*!
     *  @brief  プロフィール取得完了通知
     *  @param  json        tweet詳細(json)
     *  @param  local_id    プロフィール画像ID(local)
     *  @param  filter_func フィルタ関数
     */
    tell_gotten_from_tweet_id(json, local_id, filter_func) {
        const tw_info = TwitterUtil.get_tweet_info_from_html(json.tweet_html);
        var obj = {};
        obj.userid = tw_info.userid;
        obj.img_id = local_id;
        this.image_id_map[local_id] = obj;
        filter_func(obj);
    }

    /*!
     *  @brief  ユーザID取得
     *  @param  local_id    プロフィール画像ID(local)
     *  @note   取得済み(キャッシュ)を得る
     */
    get_userid(local_id) {
        if (local_id in this.image_id_map) {
            const obj = this.image_id_map[local_id];
            if (obj.userid != null) {
                return obj.userid;
            } else {
                return null;
            }
        }
        return null;
    }
}
