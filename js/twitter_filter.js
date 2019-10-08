/*!
 *  @brief  ツイート情報
 */
class TweetInfo {
    constructor() {
        this.empty = true;
        this.userid = '';
        this.username = '';
        this.dispname = '';
        this.tweet = '';
        this.rep_usernames = [];
        this.link_urls = [];
    }
    is_empty() {
        return this.empty;
    }
}

/*!
 *  @brief  Twitterフィルタ
 */
class TwitterFilter {

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
    exclusion(dst, src) {
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
     *  @brief  twetter表示名を得る
     *  @param  parent  親ノード
     *  @param  key     ノードキー
     */
    get_tw_dispname(parent, key) {
        const ar_dispname = $(parent).find(key);
        if (ar_dispname.length == 0) {
            return '';
        }
        return $(ar_dispname[0])
            .text()
            .replace(/\u00A0|\r\n|\r|\n/g, '')
            .replace(/^\s+/g, '');
    }
    /*!
     *  @brief  twetterユーザ名を得る
     *  @param  parent  親ノード
     */
    get_tw_username(parent) {
        const ar_username = $(parent).find("span.username.u-dir");
        if (ar_username.length == 0) {
            return '';
        }
        return $(ar_username[0]).text().replace('@', '');
    }
    /*!
     *  @brief  ツイートを得る
     *  @param[out] tw_info ツイート情報格納先
     *  @param[in]  parent  ツイート全体のノード
     *  @param[in]  key     ノードキー
     */
    get_tweet(tw_info, parent, key) {
        const ar_tweet = $(parent).find(key);
        if (ar_tweet.length == 0) {
            return;
        }
        for (const ch of ar_tweet[0].childNodes) {
            if (ch.className == 'twitter-atreply pretty-link js-nav') {
                var username = $(ch).text();
                tw_info.tweet += username;
                tw_info.rep_usernames.push(username.replace('@', ''));
            } else if (ch.className == 'Emoji Emoji--forText') {
                tw_info.tweet += $(ch).attr("alt");
            } else if (ch.nodeName == '#text'  ||
                       ch.nodeName == 'STRONG') {
                tw_info.tweet += $(ch).text();
            } else if (ch.nodeName == 'A' ||
                       ch.nodeName == 'SPAN') {
                tw_info.tweet += $(ch).text();
                const link = $(ch).attr("data-expanded-url");
                if (link != null) {
                    tw_info.link_urls.push(new urlWrapper(link));
                }
            }
        }
    }
    /*!
     *  @brief  twitter公式reply対象ユーザ名を得る
     *  @param[out] dst 格納先
     *  @param[in]  tw  ツイート全体ノード
     */
    get_twitter_official_reply_usernames(dst, tw) {
        const ar_rep = $(tw).find("div.ReplyingToContextBelowAuthor");
        if (ar_rep.length == 0) {
            return;
        }
         $(ar_rep[0]).find("span.username.u-dir").each((inx, elem)=> {
            dst.push($(elem).text().replace('@', ''));
         });
    }


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
        const rep_usernames
            = this.exclusion(tw_info.rep_usernames, exclude_username);
        if (this.storage.userid_mute(tw_info.userid)    ||
            this.storage.username_mute(tw_info.username)||
            this.storage.dispname_mute(tw_info.dispname)||
            this.storage.word_mute(tw_info.tweet)       ||
            this.storage.usernames_mute(rep_usernames)) {
            return true;
        }
        if (!this.storage.json.option.annoying_mute) {
            return false;
        }
        return this.fixed_filter.filter(tw_info.username,
                                        rep_usernames,
                                        tw_info.tweet);
    }
    /*!
     *  @brief  URLフィルタ
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
     *  @brief  tweet情報を得る
     *  @param  tw      ツイート全体ノード
     *  @param  tw_tag  ツイート本文のノードキー
     */
    get_tweet_info(tw, tw_tag) {
        var ret = new TweetInfo();
        //
        const tw_info = $(tw).find("div.tweet.js-stream-tweet.js-actionable-tweet.js-profile-popup-actionable.dismissible-content");
        if (tw_info.length == 0) {
            return ret;
        }
        ret.empty = false;
        ret.dispname = $(tw_info).attr("data-name");
        ret.username = $(tw_info).attr("data-screen-name");
        ret.userid   = $(tw_info).attr("data-user-id");
        this.get_tweet(ret, tw, tw_tag);
        this.get_twitter_official_reply_usernames(ret.rep_usernames, tw);
        return ret;
    }
    /*!
     *  @brief  tweet情報を得る(引用RT)
     *  @param  tw      ツイート全体ノード
     *  @param  tw_tag  ツイート本文のノードキー
     */
    get_qwote_tweet_info(tw, tw_tag) {
        var ret = new TweetInfo();
        //
        const qttw = $(tw).find("div.QuoteTweet-container");
        if (qttw.length == 0) {
            return ret;
        }
        ret.empty = false;
        const QT_DISPNAME_TAG
            = "b.QuoteTweet-fullname.u-linkComplex-target";
        ret.dispname = this.get_tw_dispname(qttw, QT_DISPNAME_TAG);
        const QT_TWEET_TAG
            = "div.QuoteTweet-text.tweet-text.u-dir";
        this.get_tweet(ret, qttw, QT_TWEET_TAG);
        this.get_twitter_official_reply_usernames(ret.rep_usernames, qttw);
        //
        const qt_info = $(qttw).find("div.QuoteTweet-innerContainer");
        if (qt_info.length == 0) {
            return ret;
        }
        ret.username = $(qt_info).attr("data-screen-name");
        ret.userid   = $(qt_info).attr("data-user-id");
        return ret;
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
                var tw_info = this.get_tweet_info(tw, tw_tag);
                if (this.filtering_tweet(tw_info, exclude_username)) {
                    $(tw).detach();
                    return;
                }
                // 引用RT
                var qt_info = this.get_qwote_tweet_info(tw, tw_tag);
                if (this.filtering_tweet(qt_info, exclude_username)) {
                    $(tw).detach();
                    return;
                }
                // ツイートに含まれる短縮URLを処理する
                var short_urls = [];
                urlWrapper.select_short_url(short_urls, tw_info.link_urls);
                urlWrapper.select_short_url(short_urls, qt_info.link_urls);
                if (this.short_url_decoder.filter(short_urls, this.url_filter.bind(this))) {
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
                const username = this.get_tw_username(user);
                const dispname = $(ar_dispname[0]).text();
                if (this.storage.userid_mute(userid)    ||
                    this.storage.username_mute(username)||
                    this.storage.dispname_mute(dispname)) {
                } else
                if (this.storage.json.option.annoying_mute &&
                    this.fixed_filter.filter_username(username)) {
                } else {
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

    filtering_twitter_pict_search() {
        const tag
            = "div#timeline.AdaptiveSearchTimeline.AdaptiveSearchTimeline--mediaGrid";
        $(tag).each((inx, parent)=> {
            const ol_tag = "ol#stream-items-id.stream-items.js-navigable-stream";
            $(parent).find(ol_tag).each((inx, ol)=> {
                $(ol).children().each((inx, ch)=> {
                    if ($(ch).attr("data-resolved-url-small") == null) {
                        return;
                    }
                    const userid   = $(ch).attr("data-user-id");
                    const username = $(ch).attr("data-screen-name");
                    const dispname = $(ch).attr("data-name");
                    if (this.storage.userid_mute(userid)    ||
                        this.storage.username_mute(username)||
                        this.storage.dispname_mute(dispname)) {
                    } else
                    if (this.storage.json.option.annoying_mute &&
                        this.fixed_filter.filter_username(username)) {
                    } else {
                        return;
                    }
                    $(ch).detach();
                });
            });
        });
    }

    filtering_twitter_user_profile() {
        $("div.ProfileCard.js-actionable-user").each((inx, prof)=> {
            const DISPNAME_TAG
                = "a.fullname.ProfileNameTruncated-link.u-textInheritColor";
            const userid   = $(prof).attr("data-user-id");
            const username = this.get_tw_username(prof);
            const dispname = this.get_tw_dispname(prof, DISPNAME_TAG);
            if (this.storage.userid_mute(userid)    ||
                this.storage.username_mute(username)||
                this.storage.dispname_mute(dispname)) {
            } else
            if (this.storage.json.option.annoying_mute &&
                this.fixed_filter.filter_username(username)) {
            } else {
                return;
            }
            $(prof).detach();
        });
    }

    /*!
     *  @brief  フィルタリング
     *  @param  loc 現在location(urlWrapper)
     */
    filtering(loc) {
        if (loc.in_twitter_search()) {
            const tl_parent = $("div#timeline.content-main.AdaptiveSearchTimeline");
            const TWEET_TAG
                = "p.TweetTextSize.TweetTextSize.js-tweet-text.tweet-text";
            this.filtering_twitter_user_profile();
            this.filtering_twitter_timeline(tl_parent, TWEET_TAG);
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
     *  @param  loc 現在location(urlWrapper)
     *  @param  obj 短縮URL展開情報
     *  @note   短縮URL展開結果受信処理からの呼び出し用
     */
    filtering_tweet_from_id(loc, obj) {
        if (!this.url_filter(obj.url)) {
            return;
        }
        //
        var tl_parent = null;
        if (loc.in_twitter_search()) {
            tl_parent = $("div#timeline.content-main.AdaptiveSearchTimeline");
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
    }

    /*!
     *  @brief  短縮URL展開完了通知
     *  @param  short_url   展開元短縮URL
     *  @param  url         展開後URL
     *  @param  loc         現在location
     */
    tell_decoded_short_url(short_url, url, loc) {
        this.short_url_decoder.tell_decoded(short_url, url, loc,
                                            this.filtering_tweet_from_id.bind(this));
    }
}
