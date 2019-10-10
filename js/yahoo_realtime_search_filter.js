/*!
 *  @brief  Yahooリアルタイム検索フィルタ
 */
class YahooRealtimeSearchFilter extends FilterBase {

    /*!
     *  @param storage  ストレージインスタンス
     */
    constructor(storage) {
        super(storage);
    }


    /*!
     *  @brief  tweet詳細への中継URLから固有IDを得る
     *  @param  parent  親ノード
     *  @note   tweet詳細
     *  @note       twitter.com/$(user)/status/$(tweet_id)
     *  @note   への中継URL
     *  @note       ord.yahoo.co.jp/o/realtime/RV=1/RE=$(re)/RH=$(rh)/RB=/RU=$(ru)/RS=$(rs);_ylt=$(YLT);_ylu=$(YLU)
     *  @note   から"_ylt"を切り出して固有IDとする
     *  @note   (重複してなさそうだし一番短い[24文字]ので)
     */
    get_unique_id_from_tweet_url(parent) {
        var ret = {unique_id:'', middle_url:''};
        $(parent).find("span.time").each((inx, tm)=>{
            $(tm).find("a").each((inx, a)=> {
                const href = $(a).attr("href");
                const href_div = href.split('/');
                const RS_div = href_div[href_div.length-1].split(';');
                ret.unique_id = RS_div[1].split('=')[1];
                ret.middle_url = href;
                return false;
            });
            return false;
        });
        return ret;
    }

    /*!
     *  @brief  tweetを得る
     *  @param[in]  parent          親ノード
     *  @param[out] rep_usernames   返信ユーザ群(格納先)
     *  @param[out] link_url        リンクアドレス群(格納先)
     */
    get_tweet(parent, rep_usernames, link_url) {
        var tw = null;
        $(parent).children().each((inx, ch)=> {
            if (ch.nodeName == 'H2') {
                tw = ch;
                return false;
            }
        });
        var tweet = '';
        if (tw != null) {
            for (var inx = 0; inx < tw.childNodes.length; inx++) {
                const ch = tw.childNodes[inx];
                if (ch.nodeName == '#text'  ||
                    ch.nodeName == 'EM') {
                    tweet += $(ch).text();
                } else
                if (ch.nodeName == "A") {
                    const link = $(ch).text();
                    // note
                    // class:    target:blank -> replyユーザ
                    // class:url target:      -> ハッシュタグ
                    // class:url target:blank -> URL
                    if (ch.className == "url") {
                        if ($(ch).attr("target") != null) {
                            link_url.push(new urlWrapper('https://' + link));
                        }
                    } else if (ch.className == '') {
                        if ($(ch).attr("target") != null) {
                            rep_usernames.push(link.replace('@', ''));
                        }
                    }
                    tweet += link;
                } else
                if (ch.nodeName == 'SPAN') {
                    if (ch.className == 'rep') {
                        const repuser = $($(ch).find("a")).text();
                        rep_usernames.push(repuser.replace('@', ''));
                    }
                }
            }
        }
        return tweet;
    }

    /*!
     *  @brief  検索結果フィルタ
     */
    filtering_search_result() {
        $("div#TSm").each((inx, tsm)=> {
            $(tsm).find("div.cnt.cf").each((inx, data)=> {
                const ref = $(data).find("span.ref");
                if (ref.length == 0 || $(ref).text() != "Twitter") {
                    return;
                }
                const refname = $(data).find("span.refname");
                const nam = $(data).find("a.nam");
                if (refname.length == 0 || nam.length == 0) {
                    return;
                }
                var rep_usernames = [];
                var link_url = [];
                const dispname = $(refname).text();
                const username = $(nam).text().replace('@', '');
                const tweet = this.get_tweet(data, rep_usernames, link_url);
                if (this.filtering_tweet(dispname, username, tweet, rep_usernames)) {
                    $(data).detach();
                    return;
                }
                const ret = this.get_unique_id_from_tweet_url(data);
                var short_urls = [];
                urlWrapper.select_short_url(short_urls, link_url);
                if (short_urls.length > 0) {
                    if (this.short_url_decoder.filter(short_urls,
                                                      super.url_filter.bind(this))) {
                        $(data).detach();
                        return;
                    }
                    this.short_url_decoder.entry(short_urls, ret.unique_id);
                }
                // tweet詳細を得る(bgへ移譲)
                if ($(data).attr("tweet-item-id") == null) {
                    chrome.runtime.sendMessage({command:"get_tweet",
                                                middle_id: ret.unique_id,
                                                middle_url: ret.middle_url});
                }
            });
        });

        this.short_url_decoder.decode();
    }


    /*!
     *  @brief  フィルタリング
     *  @param  loc 現在location(urlWrapper)
     */
    filtering(loc) {
        this.filtering_search_result();
    }

    /*!
     *  @brief  検索結果フィルタ(id指定)
     *  @param  loc 現在location(urlWrapper)
     *  @param  obj 短縮URL展開情報
     *  @note   短縮URL展開結果受信処理からの呼び出し用
     */
    filtering_search_result_from_id(loc, obj) {
        if (!super.url_filter(obj.url)) {
            return;
        }
        //
        $("div#TSm").each((inx, tsm)=> {
            $(tsm).find("div.cnt.cf").each((inx, data)=> {
                const ref = $(data).find("span.ref");
                if (ref.length == 0 || $(ref).text() != "Twitter") {
                    return true;
                }
                const ret = this.get_unique_id_from_tweet_url(data);
                if (ret.unique_id in obj.id) {
                    $(data).detach();
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
                                            this
                                            .filtering_search_result_from_id
                                            .bind(this));
    }

    /*!
     *  @brief  検索結果フィルタ(tweet詳細)
     *  @param  middle_id   中間URL識別ID
     *  @param  tweet       tweet詳細(json)
     *  @note   tweet詳細取得結果受信からの呼び出し用
     *  @note   ※tweet詳細に"引用RT"は含まれない
     */
    filtering_search_result_from_tweet_detail(middle_id, tweet) {
        $("div#TSm").each((inx, tsm)=> {
            $(tsm).find("div.cnt.cf").each((inx, data)=> {
                const ref = $(data).find("span.ref");
                if (ref.length == 0 || $(ref).text() != "Twitter") {
                    return true;
                }
                const ret = this.get_unique_id_from_tweet_url(data);
                if (ret.unique_id != middle_id) {
                    return true;
                }
                const parser = new DOMParser();
                const tw = parser.parseFromString(tweet.tweet_html, "text/html");
                // ツイートフィルタ
                const tw_tag = "p.TweetTextSize.js-tweet-text.tweet-text";
                var tw_info = TwitterUtil.get_tweet_info(tw, tw_tag);
                if (super.filtering_tweet_info(tw_info)) {
                    $(data).detach();
                    return false;
                }
                // ツイートに含まれる短縮URLを処理する
                var short_urls = [];
                if (short_urls.length > 0) {
                    urlWrapper.select_short_url(short_urls, tw_info.link_urls);
                    if (this.short_url_decoder.filter(short_urls,
                                                      super.url_filter.bind(this))) {
                        $(data).detach();
                        return false;
                    }
                    this.short_url_decoder.entry(short_urls, middle_id);
                }
                $(data).attr("tweet-item-id", tweet.id);
                return false;
            });
        }); 
        //
        this.short_url_decoder.decode();
    }

    /*!
     *  @brief  tweet詳細取得完了通知
     *  @param  middle_id   中間URL識別ID
     *  @param  tweet       tweet詳細(未解析JSON)
     *  @param  loc         現在location
     */
    tell_get_tweet(middle_id, tweet, loc) {
        this.filtering_search_result_from_tweet_detail(middle_id, tweet);
    }
}
