/*!
 *  @brief  ツイート情報
 */
class TweetInfo {
    constructor() {
        this.empty = true;
        this.userid = '';
        this.dispname = '';
        this.tweet = '';
        this.rep_users = [];
        this.link_urls = [];
    }
    is_empty() {
        return this.empty;
    }
}

/*!
 *  @brief  Twitterユーティリティ
 *  @note   twitter.comのhtml解析関連
 */
class TwitterUtil {

    /*!
     *  @brief  twetter表示名を得る
     *  @param  parent  親ノード
     *  @param  key     ノードキー
     */
    static get_tw_dispname(parent, key) {
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
    static get_tw_username(parent) {
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
    static get_tweet(tw_info, parent, key) {
        const ar_tweet = $(parent).find(key);
        if (ar_tweet.length == 0) {
            return;
        }
        for (const ch of ar_tweet[0].childNodes) {
            if (ch.className == 'twitter-atreply pretty-link js-nav') {
                tw_info.tweet += $(ch).text();
                tw_info.rep_users.push($(ch).attr("data-mentioned-user-id"));
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
     *  @brief  twitter公式reply対象ユーザIDを得る
     *  @param[out] dst 格納先
     *  @param[in]  tw  ツイート全体ノード
     */
    static get_twitter_official_reply_userids(dst, tw) {
        const ar_rep = $(tw).find("div.ReplyingToContextBelowAuthor");
        if (ar_rep.length == 0) {
            return;
        }
         $(ar_rep[0]).find("a.pretty-link.js-user-profile-link").each((inx, elem)=> {
            dst.push($(elem).attr("data-user-id"));
         });
    }

    /*!
     *  @brief  tweet情報を得る
     *  @param  tw      ツイート全体ノード
     *  @param  tw_tag  ツイート本文のノードキー
     */
    static get_tweet_info(tw, tw_tag) {
        var ret = new TweetInfo();
        //
        const tw_info = $(tw).find("div.tweet.js-stream-tweet.js-actionable-tweet.js-profile-popup-actionable.dismissible-content");
        if (tw_info.length == 0) {
            return ret;
        }
        ret.empty = false;
        ret.dispname = $(tw_info).attr("data-name");
        ret.userid   = $(tw_info).attr("data-user-id");
        this.get_tweet(ret, tw, tw_tag);
        this.get_twitter_official_reply_userids(ret.rep_users, tw);
        return ret;
    }

    /*!
     *  @brief  tweet情報を得る(引用RT)
     *  @param  tw  ツイート全体ノード
     */
    static get_qwote_tweet_info(tw) {
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
        this.get_twitter_official_reply_userids(ret.rep_users, qttw);
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
     *  @brief  htmlからtweet情報を得る
     *  @param  tweet_html  tweet(html)
     */
    static get_tweet_info_from_html(tweet_html) {
        const parser = new DOMParser();
        const tw = parser.parseFromString(tweet_html, "text/html");
        const tw_tag = "p.TweetTextSize.js-tweet-text.tweet-text";
        return this.get_tweet_info(tw, tw_tag);
    }

    /*!
     *  @brief  ニュースから元tweetのid(data-item-id)を得る
     *  @note   検索結果(話題のツイート)で採用されている、tweetを変形し"記事"として表示
     *  @note   する特殊形式に対する操作。リンク先記事のタイトル・見出し(記事の出だし)と
     *  @note   リンク先記事の公式アカウントが表示され、元tweetユーザや本文は隠蔽されて
     *  @note   いるので厄介。
     */
    static get_news_org_tweet_id(parent) {
        const detail = $(parent).find("a.AdaptiveNewsHeadlineDetails-date");
        if (detail.length == 0) {
            return null;
        }
        // detailのhrefが元tweetへのリンク
        // 　href="/$(username)/status/$(data-item-id)"
        const href_div = $(detail).attr("href").split('/');
        return href_div[href_div.length-1];
    }

    /*!
     *  @brief  プロフィール画像URLからidを切り出す
     *  @param  image_url   プロフィール画像URL
     *  @note   http[s]://pbs.twimg.com/profile_images/$(id)/$(image_file)
     */
    static get_id_from_profile_image(image_url) {
        const img_url_wrapper = new urlWrapper(image_url);
        if (img_url_wrapper.domain != 'pbs.twimg.com' ||
            img_url_wrapper.subdir.length != 3 ||
            img_url_wrapper.subdir[0] != 'profile_images') {
            return null;
        } else {
            return img_url_wrapper.subdir[1];
        }
    }

    /*!
     *  @brief  togetterコメントを得る
     *  @param  parent  コメントノード
     *  @note   tweet連携してる場合も多いのでここに置いとく
     */
    static get_togetter_comment(nd_tweet) {
        var tw_info = new TweetInfo();
        tw_info.empty = false;
        for (const ch of nd_tweet.childNodes) {
            if (ch.nodeName == 'A') {
                const txt = $(ch).text();
                tw_info.tweet += txt;
                if (ch.className == "comment_reply") {
                    tw_info.rep_users.push(txt);
                } else {
                    const url = new urlWrapper(txt);
                    if (url.domain != '') {
                        tw_info.link_urls.push(url);
                    }
                }
            } else {
                tw_info.tweet +=  $(ch).text();
            }
        }
        return tw_info;
    }

    /*!
     *  @brief  デフォルトアイコンか？
     *  @param  profile_image_url   プロフィール画像URL
     */
    static is_default_icon(profile_image_url) {
        const wrapper = new urlWrapper(profile_image_url);
        return  wrapper.domain == 'abs.twimg.com' &&
                wrapper.subdir.length == 3 &&
                wrapper.subdir[1] == 'default_profile_images';
    }

    /*!
     *  @brief  親ノードにfuncを実行し、選択的にノードを得る
     *  @param  e       基準ノード
     *  @param  func
     *  @note   自身も含める
     *  @note   parentが空になったら打ち切り(空ノードを返す)
     */
    static parent_each(e, func) {
        var obj = $(e);
        while(obj.length > 0) {
            if (func(obj)) {
                return obj;
            } else {
                obj = $(obj).parent();
            }
        }
        return obj;
    }
}
