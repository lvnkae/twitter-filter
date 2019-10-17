/*!
 *  @brief  Twitterフィルタ
 */
class TwitterFilter extends FilterBase {

    /*!
     *  @brief  tweetフィルタ
     *  @param  tw_info             ツイート情報
     *  @param  exclude_username    ミュート対象外ユーザ名(スレッドの親発言者など)
     *  @retval true    当該tweetがミュート対象だ
     */
    filtering_tweet(tw_info, exclude_username) {
        if (tw_info.is_empty()) {
            return false;
        }
        if (this.storage.userid_mute(tw_info.userid)) {
            return true;
        }
        const rep_usernames
            = FilterBase.exclusion(tw_info.rep_usernames, exclude_username);
        return super.filtering_tweet(tw_info.dispname,
                                     tw_info.username,
                                     tw_info.tweet,
                                     rep_usernames);
    }

    /*!
     *  @brief  twitter-TLフィルタ
     *  @param  parent              TLの親ノード
     *  @param  tw_tag              ツイート本文のノードキー
     *  @param  exclude_username    ミュート対象外ユーザ名
     */
    filtering_twitter_timeline(parent, tw_tag, exclude_username) {
        $(parent).find("ol#stream-items-id").each((inx, elem)=> {
            $($(elem).find("li").get().reverse()).each((inx, tw)=> {
                if (tw.className.indexOf("js-stream-item stream-item stream-item") < 0) {
                    return;
                }
                // ツイート
                var tw_info = TwitterUtil.get_tweet_info(tw, tw_tag);
                if (this.filtering_tweet(tw_info, exclude_username)) {
                    $(tw).detach();
                    return;
                }
                // 引用RT
                var qt_info = TwitterUtil.get_qwote_tweet_info(tw);
                if (this.filtering_tweet(qt_info, exclude_username)) {
                    $(tw).detach();
                    return;
                }
                // ツイートに含まれる短縮URLを処理する
                var short_urls = [];
                urlWrapper.select_short_url(short_urls, tw_info.link_urls);
                urlWrapper.select_short_url(short_urls, qt_info.link_urls);
                if (this.short_url_decoder.filter(short_urls,
                                                  super.url_filter.bind(this))) {
                    $(tw).detach();
                    return;
                }
                this.short_url_decoder.entry(short_urls, $(tw).attr("data-item-id"));
            });
        });

        this.short_url_decoder.decode();

        // ツイートを削除した分"document高"が縮むが、縮みすぎるとdocumentが画面内に収ま
        // ってしまう。TLの追加読み込みはスクロールをトリガーとして行われているため、画
        // 面内にdocumentが収まってしまうとTLを遡れなくなる。
        //  → document(を構成するTL表示の主ノード)高がwindow高を下回らないよう対処
        {
            var app_container = $("div.AppContent-main");
            const wh = $(window).height();
            const ah = $(app_container).height();
            if (wh > ah) {
                $(app_container).height(wh);
            }
        }
    }

    filtering_twitter_related_users() {
        $("div.RelatedUsers.module").each((inx, mod)=> {
            $(mod).find("div.UserSmallListItem.js-account-summary").each((inx, user)=> {
                const ar_dispname = $(user).find("strong.fullname")
                if (ar_dispname.length == 0) {
                    return;
                }
                const userid   = $(user).attr("data-user-id");
                const username = TwitterUtil.get_tw_username(user);
                const dispname = $(ar_dispname[0]).text();
                if (!super.filtering_tw_account(dispname, username, userid)) {
                    return;
                }
                // $(user)をdetachすると更新挙動が怪しくなるので内容物だけ消す
                $(user).find("div.content").each((inx, cont)=> {
                    $(cont).detach();
                });
            });
        });
    }

    filtering_twitter_option() { 
        const opt = this.storage.json.option;
        if (opt.off_login) {
            $("div.SignupCallOut.module.js-signup-call-out").each((inx, elem)=> {
                $(elem).detach();
            });
        }
        if (opt.off_related) {
            $("div.RelatedUsers.module").each((inx, elem)=> {
                $(elem).detach();
            });
        }
        if (opt.off_trend) {
            $("div.module.Trends.trends").each((inx, elem)=> {
                $(elem).detach();
            });
            
        }
    }

    /*!
     *  @brief  twitter画像検索結果全てにfuncを実行
     *  @param  func    実行する関数
     */
    twitter_searching_pict_each(func) {
        const tag
            = "div#timeline.AdaptiveSearchTimeline.AdaptiveSearchTimeline--mediaGrid";
        $(tag).each((inx, parent)=> {
            const ol_tag = "ol#stream-items-id.stream-items.js-navigable-stream";
            $(parent).find(ol_tag).each((inx, ol)=> {
                $(ol).children().each((inx, ch)=> {
                    if ($(ch).attr("data-resolved-url-small") == null) {
                        return true;
                    }
                    if (!func(ch)) {
                        return false;
                    }
                });
            });
        });
    }

    filtering_twitter_pict_search() {
        this.twitter_searching_pict_each((ch)=> {
            const userid   = $(ch).attr("data-user-id");
            const username = $(ch).attr("data-screen-name");
            const dispname = $(ch).attr("data-name");
            if (super.filtering_tw_account(dispname, username, userid)) {
                $(ch).detach();
                return true;
            }
            // tweet詳細を得る(bgへ移譲)
            if ($(ch).attr("has-detail") == null) {
                MessageUtil.send_message({command: "get_tweet",
                                          tweet_id: $(ch).attr("data-item-id")});
            }
            return true;
        });
    }

    /*!
     *  @brief  twitter検索結果(話題のツイート)に出る"記事"全てにfuncを実行
     *  @param  func    実行する関数
     */
    filtering_twitter_news_each(func) {
        $("div.AdaptiveNewsLargeImageHeadline").each((inx, parent)=> {
            func(parent);
        });
        $("div.AdaptiveNewsRelatedHeadlines-headline").each((inx, parent)=> {
            if (!func(parent)) {
                return false;
            }
        });
    }

    filtering_twitter_news() {
        this.filtering_twitter_news_each((parent)=> {
            const user = $(parent).find("a.AdaptiveNewsHeadlineDetails-user");
            if (user.length == 0) {
                return true;
            }
            const dn = $(user).find("span.AdaptiveNewsHeadlineDetails-userName");
            if (dn.length == 0) {
                return true;
            }
            const dispname = $(dn).text();
            const username = $(user).attr("href").replace('/', '');
            const userid = $(user).attr("data-user-id");
            if (super.filtering_tw_account(dispname, username, userid)) {
                $(parent).detach();
                return true;
            }
            const news_title
                = $(parent).find("a.AdaptiveNewsLargeImageHeadline-title");
            const news_desc
                = $(parent).find("a.AdaptiveNewsLargeImageHeadline-description");
            if ((news_title.length != 0 && super.url_filter(news_title.text())) ||
                (news_desc.length != 0 && super.url_filter(news_desc.text()))) {
                $(parent).detach();
                return true;
            }
            // tweet詳細を得る(bgへ移譲)
            if ($(parent).attr("has-detail") == null) {
                const org_tweet_id = TwitterUtil.get_news_org_tweet_id(parent);
                if (null == org_tweet_id) {
                    return true;
                }
                MessageUtil.send_message({command: "get_tweet",
                                          tweet_id: org_tweet_id});
            }
            return true;
        });
    }

    filtering_twitter_user_profile() {
        $("div.ProfileCard.js-actionable-user").each((inx, prof)=> {
            const DISPNAME_TAG
                = "a.fullname.ProfileNameTruncated-link.u-textInheritColor";
            const userid   = $(prof).attr("data-user-id");
            const username = TwitterUtil.get_tw_username(prof);
            const dispname = TwitterUtil.get_tw_dispname(prof, DISPNAME_TAG);
            if (!super.filtering_tw_account(dispname, username, userid)) {
                return;
            }
            $(prof).detach();
        });
    }

    /*!
     *  @brief  フィルタリング
     */
    filtering() {
        const loc = this.current_location;
        if (loc.in_twitter_search()) {
            const tl_parent = $("div#timeline.content-main.AdaptiveSearchTimeline");
            const TWEET_TAG
                = "p.TweetTextSize.TweetTextSize.js-tweet-text.tweet-text";
            this.filtering_twitter_user_profile();
            this.filtering_twitter_timeline(tl_parent, TWEET_TAG);
            this.filtering_twitter_news();
            this.filtering_twitter_pict_search();
            this.filtering_twitter_option();
        } else if (loc.in_twitter_user_page()) {
            const tl_parent = $("div#timeline.ProfileTimeline");
            const TWEET_TAG
                = "p.TweetTextSize.TweetTextSize--normal.js-tweet-text.tweet-text";
            this.filtering_twitter_timeline(tl_parent, TWEET_TAG);
            this.filtering_twitter_related_users();
            this.filtering_twitter_option();
        } else if (loc.in_twitter_tw_thread()) {
            const tl_parent = $("div#descendants.ThreadedDescendants");
            const TWEET_TAG
                = "p.TweetTextSize.js-tweet-text.tweet-text";
            const exclude_username = loc.subdir[0]; // ThreadAuthorはミュート除外
            this.filtering_twitter_timeline(tl_parent, TWEET_TAG, exclude_username);
        }
    }

    /*!
     *  @brief  tweetフィルタ(id指定)
     *  @param  obj 短縮URL展開情報
     *  @note   短縮URL展開結果受信処理からの呼び出し用
     */
    filtering_tweet_from_id(obj) {
        if (!super.url_filter(obj.url)) {
            return;
        }
        //
        var b_search = false;
        var tl_parent = null;
        const loc = this.current_location;
        if (loc.in_twitter_search()) {
            tl_parent = $("div#timeline.content-main.AdaptiveSearchTimeline");
            b_search = true;
        } else if (loc.in_twitter_user_page()) {
            tl_parent = $("div#timeline.ProfileTimeline");
        } else if (loc.in_twitter_tw_thread()) {
            tl_parent = $("div#descendants.ThreadedDescendants");
        }
        $(tl_parent).find("ol#stream-items-id").each((inx, elem)=> {
            $($(elem).find("li").get().reverse()).each((inx, tw)=> {
                if (tw.className.indexOf("js-stream-item stream-item stream-item") < 0) {
                    return true;
                }
                // note
                // 引用RTに含まれる短縮URLも親tweetのIDで登録されている
                const id = $(tw).attr("data-item-id");
                if (id in obj.id) {
                    // tweet-idはuniqueなのでbreakして良し
                    $(tw).detach();
                    return false;
                }
            });
        }); 
        if (b_search) {
            this.twitter_searching_pict_each((ch)=> {
                const id = $(ch).attr("data-item-id");
                if (id in obj.id) {
                    $(ch).detach();
                    return false;
                }
                return true;
            });
            this.filtering_twitter_news_each((parent)=> {
                const org_tweet_id = TwitterUtil.get_news_org_tweet_id(parent);
                if (null == org_tweet_id) {
                    return true;
                }
                if (org_tweet_id in obj.id) {
                    $(parent).detach();
                    return false;
                }
                return true;
            });
        }
    }

    /*!
     *  @brief  短縮URL展開完了通知
     *  @param  short_url   展開元短縮URL
     *  @param  url         展開後URL
     */
    tell_decoded_short_url(short_url, url) {
        this.short_url_decoder.tell_decoded(short_url, url,
                                            this.filtering_tweet_from_id.bind(this));
    }

    /*!
     *  @brief  tweetフィルタ(詳細判定)
     *  @param  tweet   tweet詳細(json)
     *  @note   tweet詳細取得結果受信からの呼び出し用
     *  @note   画像検索結果などtweet詳細が欠落したページの追加フィルタ
     *  @note   ※tweet詳細に"引用RT"は含まれない
     */
    filtering_tweet_from_tweet_detail(tweet) {
        if (!this.current_location.in_twitter_search()) {
            // 検索結果フィルタでしか使わない
            return;
        }
        this.twitter_searching_pict_each((ch)=> {
            if (tweet.id != $(ch).attr("data-item-id")) {
                return true;
            }
            if (super.tweet_html_filter(tweet.tweet_html, tweet.id)) {
                $(ch).detach();
            } else {
                $(ch).attr("has-detail", "");
            }
            return false;
        });
        this.filtering_twitter_news_each((parent)=> {
            if ($(parent).attr("has-detail") != null) {
                return true;
            }
            const org_tweet_id = TwitterUtil.get_news_org_tweet_id(parent);
            if (null == org_tweet_id || tweet.id != org_tweet_id) {
                return true;
            }
            if (super.tweet_html_filter(tweet.tweet_html, tweet.id)) {
                $(parent).detach();
            } else {
                $(parent).attr("has-detail", "");
            }
            return false;
        });
        //
        this.short_url_decoder.decode();
    }

    /*!
     *  @brief  tweet詳細取得完了通知
     *  @param  middle_id   中間URL識別ID
     *  @param  tweet       tweet詳細(json)
     */
    tell_get_tweet(middle_id, tweet) {
        this.filtering_tweet_from_tweet_detail(tweet);
    }


    get_observing_node(elem) {
        // 上位フレームを起点にすることで、下位フレームの再構成もひっかける
        // (検索結果のタブ[話題/すべて/ユーザ/画像etc]切り替え対策)
        $("div#page-container").each((inx, e)=>{ elem.push(e); });
        // tweet詳細(スレッド表示)対策
        $("div.PermalinkOverlay-modal").each((inx, e)=>{ elem.push(e); });
    }

    callback_domloaded() {
        super.filtering(this.filtering.bind(this));
        super.callback_domloaded(this.get_observing_node.bind(this));
    }

    /*!
     *  @brief  無効な追加elementか？
     *  @note   指定ノードへのelement追加/削除を監視する処理で使用
     *  @note   無視して良い"追加element"だったらtrueを返す
     */
    is_valid_records(records) {
        const top_record = records[0];
        const top_className = top_record.target.className;
        const top_id = top_record.target.id;
        if (top_className.indexOf('dropdown-menu') >= 0) {
            // ドロップダウンメニューON/OFFは無視
            return true;
        }
        if (top_className.indexOf('js-relative-timestamp') >= 0) {
            // timestamp関連は無視
            return true;
        }
        if (top_className.indexOf('PlayableMedia') >= 0) {
            // 動画再生は無視
            return true;
        }
        if (top_className == '' && top_id == '') {
            // 無名ノードは無視(動画関連なので)
            return true;
        }
        return false;
    }

    /*!
     *  @param storage  ストレージインスタンス
     */
    constructor(storage) {
        super(storage);
        this.create_after_domloaded_observer(
            this.is_valid_records.bind(this),
            this.filtering.bind(this));
    }
}
