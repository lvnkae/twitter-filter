/*!
 *  @brief  Yahooリアルタイム検索フィルタ
 */
class YahooRealtimeSearchFilter {

    /*!
     *  @param storage  ストレージインスタンス(shared_ptr的なイメージ)
     */
    constructor(storage) {
        this.storage = storage;
        this.fixed_filter = new fixedFilter();
        this.short_url_decoder = new ShortUrlDecoder();
    }


    /*!
     *  @brief  ツイートを得る(realtime検索用)
     *  @param[in]  parent          親ノード
     *  @param[out] rep_usernames   返信ユーザ群(格納先)
     *  @param[out] link_url        リンクアドレス群(格納先)
     */
    get_yahoo_realtime_seach_tweet(parent, rep_usernames, link_url) {
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
                    if (ch.className == "url") {
                        if ($(ch).attr("target") != null) {
                            link_url.push(link);
                        }
                        tweet += $(ch).text();
                    }
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
     *  @brief  ツイートフィルタ
     */
    filtering_yahoo_realtime_search_tweet() {
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
                const tweet = this.get_yahoo_realtime_seach_tweet(data,
                                                                  rep_usernames,
                                                                  link_url);
                if (this.storage.username_mute(username)||
                    this.storage.dispname_mute(dispname)||
                    this.storage.word_mute(tweet)) {
                } else
                if (this.storage.json.option.annoying_mute &&
                    this.fixed_filter.filter(username,
                                             rep_usernames,
                                             tweet)) {
                } else {
                    return;
                }
                $(data).detach();
            });
        });
    }


    /*!
     *  @brief  フィルタリング
     *  @param  loc 現在location(urlWrapper)
     */
    filtering(loc) {
        this.filtering_yahoo_realtime_search_tweet();
    }
}
