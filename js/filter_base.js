/*!
 *  @brief  フィルタベース
 *  @note   個別フィルタクラスの親
 */
class FilterBase {

    initialize() {
        const loc = this.current_location;
        if (loc.in_twitter()) {
            this.contextmenu_controller = new ContextMenuController_Twitter();
        } else if (loc.in_yahoo_realtime_search_result()) {
            this.contextmenu_controller = new ContextMenuController_YahooRS();
        } else if (loc.in_togetter_content()) {
            this.contextmenu_controller = new ContextMenuController_Togetter();
        }
    }

    /*!
     *  @param storage  ストレージインスタンス(shared_ptr的なイメージ)
     */
    constructor(storage) {
        this.storage = storage;
        this.fixed_filter = new fixedFilter();
        this.short_url_decoder = new ShortUrlDecoder();
        this.tw_profile_accessor = new TwProfileAccessor();
        this.tw_profile_image_accessor = new TwProfileImageAccessor();
        //
        this.current_location = new urlWrapper(location.href);
        this.after_domloaded_observer = null;
        this.observer_timer = null;
        this.filtering_timer = null;
        //
        this.initialize();
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

    /*!
     *  @brief  子iframeに右クリック監視を追加
     */
    add_iframe_onmouse_monitoring() {}

    /*!
     *  @brief  element追加observer生成
     *  @param  func_is_invalid_records DOMアイテムチェック関数
     *  @param  func_filtering          フィルタリング関数
     */
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
                this.add_iframe_onmouse_monitoring();
            } else {
                // 短時間の連続追加はまとめて処理したい気持ち
                if (this.filtering_timer == null) {
                    this.filtering_timer = setTimeout(()=> {
                        this.current_location = new urlWrapper(location.href);
                        func_filtering();
                        clearTimeout(this.filtering_timer);
                        this.filtering_timer = null;
                        this.add_iframe_onmouse_monitoring();
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
                    this.add_iframe_onmouse_monitoring();
                    clearInterval(this.observer_timer);
                    this.observer_timer = null;
                }
            }, 33); /* 1/30sec */
        } else {
            this.add_iframe_onmouse_monitoring();
        }
    }


    /*!
     *  @brief  tweetフィルタ
     *  @param  userid      ユーザID
     *  @param  dispname    表示名
     *  @param  tweet       ツイート本文
     *  @param  rep_userid  リプライ対象ユーザID
     *  @retval true    当該tweetはミュート対象だ
     */
    filtering_tweet(userid, dispname, tweet, rep_userids) {
        if (this.storage.userid_mute(userid)        ||
            this.storage.dispname_mute(dispname)    ||
            this.storage.word_mute(tweet, userid)  ||
            this.storage.userids_mute(rep_userids)) {
            return true;
        }
        if (!this.storage.json.option.annoying_mute) {
            return false;
        }
        return this.fixed_filter.filter(userid,
                                        rep_userids,
                                        tweet);
    }

    /*!
     *  @brief  tweetフィルタ(html形式)
     *  @param  tweet_html  twitter.comから得られるtweet詳細jsonのtweet_html
     *  @param  id          短縮URL展開処理にわたす識別情報
     *  @note   ミュートされない場合は短縮URL展開要求登録まで行う
     */
    tweet_html_filter(tweet_html, id) {
        var tw_info = TwitterUtil.get_tweet_info_from_html(tweet_html);
        if (this.filtering_tweet(tw_info.userid,
                                 tw_info.dispname,
                                 tw_info.tweet,
                                 tw_info.rep_users)) {
            return {result:true};
        }
        var short_urls = [];
        urlWrapper.select_short_url(short_urls, tw_info.link_urls);
        if (short_urls.length > 0) {
            if (this.short_url_decoder.filter(short_urls,
                                              this.filtering_word.bind(this))) {
                return {result:true};
            }
            this.short_url_decoder.entry(short_urls, id);
        }
        return {result:false, userid:tw_info.userid};
    }
    
    /*!
     *  @brief  togetterユーザフィルタ
     *  @param  username    ユーザ名
     *  @retval true    ミュート対象だ
     */
    filtering_togetter_user(username) {
        return this.storage.togetter_userame_mute(username);
    }

    /*!
     *  @brief  togetterコメントフィルタ
     *  @param  username        ユーザ名
     *  @param  comment         コメント
     *  @param  rep_usernames   リプライ対象ユーザ名
     *  @retval true    当該コメントはミュート対象だ
     */
    filtering_togetter_comment(username, comment, rep_usernames) {
        if (this.filtering_togetter_user(username)||
            this.storage.word_mute(comment) ||
            this.storage.togetter_usernames_mute(rep_usernames)) {
            return true;
        }
        if (!this.storage.json.option.annoying_mute) {
            return false;
        }
        return this.fixed_filter.filter('', [], comment);
    }

    /*!
     *  @brief  TwitterユーザIDフィルタ
     *  @param  userid  ユーザID
     *  @retval true    ミュート対象だ
     */
    filtering_tw_userid(userid) {
        if (this.storage.userid_mute(userid)) {
            return true;
        }
        if (!this.storage.json.option.annoying_mute) {
            return false;
        }
        return this.fixed_filter.filter_userid(userid);
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
     *  @brief  Twitterアカウントフィルタ
     *  @param  dispname    表示名
     *  @param  userid      ユーザID
     *  @retval true    ミュート対象だ
     */
    filtering_tw_account(userid, dispname) {
        return this.filtering_tw_userid(userid) ||
               this.filtering_tw_dispname(dispname);
    }

    /*!
     *  @brief  ワードフィルタ
     *  @param  text    テキスト
     *  @param  userid  ユーザID
     *  @retval true    ミュート対象だ
     */
    filtering_word(text, userid) {
        if (this.storage.word_mute(text, userid)) {
            return true;
        }
        if (!this.storage.json.option.annoying_mute) {
            return false;
        }
        return this.fixed_filter.filter('', [], text);
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
     *  @brief  Twiterプロフィール取得通知
     *  @note   仮想関数的な感じで
     */
    tell_get_tw_profile(result, userid, username, image_id, json) {}
    /*!
     *  @brief  Twiterプロフィール画像URL取得通知
     *  @note   仮想関数的な感じで
     */
    tell_get_tw_profile_image(result, image_url, username){}
}
