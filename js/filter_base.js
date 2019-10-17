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
        this.tw_profile_accessor = new TwProfileAccessor();
        //
        this.current_location = new urlWrapper(location.href);
        this.after_domloaded_observer = null;
        this.observer_timer = null;
        this.filtering_timer = null;
    }

    /*!
     *  @brief  配列dstからsrcを取り除く
     *  @return 除外後配列
     */
    static exclusion(dst, src) {
        if (src == null || dst.length == 0) {
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

    create_after_domloaded_observer(func_is_invalid_records, func_filtering) {    
        this.after_domloaded_observer = new MutationObserver((records)=> {
            if (!this.storage.json.active) {
                return;
            }
            if (records.length == 0) {
                return; // なぜか空
            }
            if (func_is_invalid_records(records)) {
                return; // 無効
            }
            const loc = this.current_location;
            if (loc.url != location.href) {
                // URLが変わった(=下位フレーム再構成)らタイマー捨てて即処理
                if (this.filtering_timer != null) {
                    clearTimeout(this.filtering_timer);
                    this.filtering_timer = null;
                }
                this.current_location = new urlWrapper(location.href);
                func_filtering();
            } else {
                // 短時間の連続追加はまとめて処理したい気持ち
                if (this.filtering_timer == null) {
                    this.filtering_timer = setTimeout(()=> {
                        this.current_location = new urlWrapper(location.href);
                        func_filtering();
                        clearTimeout(this.filtering_timer);
                        this.filtering_timer = null;
                    }, 200); /* 1/5sec */
                }
            }
        });
    }

    /*!
     *  @brief  element追加observer準備
     *  @note   DOM構築完了後に追加される遅延elementもフィルタにかけたい
     *  @note   → observerでelement追加をhookしfiltering実行
     */
    ready_element_observer(func_get_observing_node) {
        var elem = [];
        func_get_observing_node(elem);
        for (var e of elem) {
            this.after_domloaded_observer.observe(e, {
                childList: true,
                subtree: true,
            });
        }
        return elem.length > 0;
    }

    callback_domloaded(func_get_observing_node) {
        if (!this.ready_element_observer(func_get_observing_node)) {
            // DOM構築完了時点でキーelementが見つからない場合は
            // intervalTimerで生成を待ってobserver登録する
            this.observer_timer = setInterval(()=> {
                if (this.ready_element_observer(func_get_observing_node)) {
                    clearInterval(this.observer_timer);
                    this.observer_timer = null;
                }
            }, 33); /* 1/30sec */
        }
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
     *  @brief  tweetフィルタ(fullパラメータ)
     *  @param  dispname        表示名
     *  @param  username        ユーザ名
     *  @param  userid          ユーザID
     *  @param  tweet           ツイート本文
     *  @param  rep_usernames   リプライ対象ユーザ名
     *  @retval true    当該tweetはミュート対象だ
     */
    filtering_tweet_info(tw_info) {
        if (this.storage.userid_mute(tw_info.userid)    ||
            this.storage.username_mute(tw_info.username)||
            this.storage.dispname_mute(tw_info.dispname)||
            this.storage.word_mute(tw_info.tweet)       ||
            this.storage.usernames_mute(tw_info.rep_usernames)) {
            return true;
        }
        if (!this.storage.json.option.annoying_mute) {
            return false;
        }
        return this.fixed_filter.filter(tw_info.username,
                                        tw_info.rep_usernames,
                                        tw_info.tweet);
    }
    
    /*!
     *  @brief  tweetフィルタ(html形式)
     *  @param  tweet_html  twitter.comから得られるtweet詳細jsonのtweet_html
     *  @param  id          短縮URL展開処理にわたす識別情報
     *  @retval true    ミュート対象だ
     *  @note   ミュートされない場合は短縮URL展開要求登録まで行う
     */
    tweet_html_filter(tweet_html, id) {
        var tw_info = TwitterUtil.get_tweet_info_from_html(tweet_html);
        if (this.filtering_tweet_info(tw_info)) {
            return true;
        }
        var short_urls = [];
        urlWrapper.select_short_url(short_urls, tw_info.link_urls);
        if (short_urls.length > 0) {
            if (this.short_url_decoder.filter(short_urls,
                                              this.url_filter.bind(this))) {
                return true;
            }
            this.short_url_decoder.entry(short_urls, id);
        }
    }

    /*!
     *  @brief  Twitterプロフィールフィルタ
     *  @param  profile プロフィール
     *  @retval true    ミュート対象だ
     */
    filtering_tw_profile(profile) {
        if (this.storage.userid_mute(profile.userid) ||
            this.storage.username_mute(profile.last_username)) {
            return true;
        }
        if (!this.storage.json.option.annoying_mute) {
            return false;
        }
        return this.fixed_filter.filter_username(profile.last_username);
    }
    /*!
     *  @brief  Twitter表示名フィルタ
     *  @param  dispname    表示名
     *  @retval true    ミュート対象だ
     */
    filtering_tw_dispname(dispname) {
        return this.storage.dispname_mute(dispname);
    }
    /*!
     *  @brief  Twitter名前フィルタ
     *  @param  dispname    表示名
     *  @param  username    ユーザ名
     *  @retval true    ミュート対象だ
     */
    filtering_tw_name(dispname, username) {
        if (this.storage.username_mute(username)||
            this.filtering_tw_dispname(dispname)) {
            return true;
        }
        if (!this.storage.json.option.annoying_mute) {
            return false;
        }
        return this.fixed_filter.filter_username(username);
    }
    /*!
     *  @brief  Twitterアカウントフィルタ
     *  @param  dispname    表示名
     *  @param  username    ユーザ名
     *  @param  userid      ユーザID
     *  @retval true    ミュート対象だ
     */
    filtering_tw_account(dispname, username, userid) {
        if (this.storage.userid_mute(userid)) {
            return true;
        }
        return this.filtering_tw_name(dispname, username);
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

    /*!
     *  @brief  フィルタリング
     */
    filtering(func_filtering) {
        if (!this.storage.json.active) {
            return;
        }
        func_filtering();
    }

    /*!
     *  @brief  tweet詳細取得完了通知
     *  @note   仮想関数的な感じで
     */
    tell_get_tweet(middle_id, tweet) {}
    /*!
     *  @brief  Twiterプロフィール取得通知
     *  @note   仮想関数的な感じで
     */
    tell_get_tw_profile(result, userid, username, json) {}
}
