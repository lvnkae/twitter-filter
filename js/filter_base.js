/*!
 *  @brief  フィルタベース
 *  @note   個別フィルタクラスの親
 */
class FilterBase {

    /*!
     *  @param storage  ストレージインスタンス(shared_ptr的なイメージ)
     */
    constructor(storage) {
        this.storage = storage;
        this.fixed_filter = new fixedFilter();
        this.short_url_decoder = new ShortUrlDecoder();
    }

    /*!
     *  @brief  配列dstからsrcを取り除く
     *  @return 除外後配列
     */
    static exclusion(dst, src) {
        if (src == null || dst.lenght == 0) {
            return dst;
        }
        var ret = [];
        for (const e of dst) {
            if (e != src) {
                ret.push(e);
            }
        }
        return ret;
    }

    /*!
     *  @brief  tweetフィルタ
     *  @param  dispname        表示名
     *  @param  username        ユーザ名
     *  @param  tweet           ツイート本文
     *  @param  rep_usernames   リプライ対象ユーザ名
     *  @retval true    当該tweetはミュート対象だ
     */
    filtering_tweet(dispname, username, tweet, rep_usernames) {
        if (this.storage.username_mute(username)||
            this.storage.dispname_mute(dispname)||
            this.storage.word_mute(tweet)       ||
            this.storage.usernames_mute(rep_usernames)) {
            return true;
        }
        if (!this.storage.json.option.annoying_mute) {
            return false;
        }
        return this.fixed_filter.filter(username,
                                        rep_usernames,
                                        tweet);
    }

    /*!
     *  @brief  tweetユーザフィルタ
     *  @param  dispname        表示名
     *  @param  username        ユーザ名
     *  @param  userid          ユーザID
     *  @retval true    当該ユーザはミュート対象だ
     */
    filtering_tw_user(dispname, username, userid) {
        if (this.storage.userid_mute(userid)    ||
            this.storage.username_mute(username)||
            this.storage.dispname_mute(dispname)) {
            return true;
        }
        if (!this.storage.json.option.annoying_mute) {
            return false;
        }
        return this.fixed_filter.filter_username(username);
    }

    /*!
     *  @brief  URLフィルタ
     *  @retval true    ミュート対象だ
     */
    url_filter(url) {
        if (this.storage.word_mute(url)) {
            return true;
        }
        if (!this.storage.json.option.annoying_mute) {
            return false;
        }
        return this.fixed_filter.filter('', [], url);
    }
}
