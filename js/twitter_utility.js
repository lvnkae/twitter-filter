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
    static get_twitter_official_reply_usernames(dst, tw) {
        const ar_rep = $(tw).find("div.ReplyingToContextBelowAuthor");
        if (ar_rep.length == 0) {
            return;
        }
         $(ar_rep[0]).find("span.username.u-dir").each((inx, elem)=> {
            dst.push($(elem).text().replace('@', ''));
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
        ret.username = $(tw_info).attr("data-screen-name");
        ret.userid   = $(tw_info).attr("data-user-id");
        this.get_tweet(ret, tw, tw_tag);
        this.get_twitter_official_reply_usernames(ret.rep_usernames, tw);
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
}
