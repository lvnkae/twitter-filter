/*!
 *  @brief  Yahooリアルタイム検索フィルタ
 */
class YahooRealtimeSearchFilter extends FilterBase {

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
     *  @param[in]  parent      親ノード
     *  @param[out] link_url    リンクアドレス群(格納先)
     */
    get_tweet(parent, link_url) {
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
                            // 非公式reply
                            // usernameだけではミュートできないのでスルー
                        }
                    }
                    tweet += link;
                } else
                if (ch.nodeName == 'SPAN' && ch.className == 'rep') {
                    // 公式reply
                    // usernameだけではミュートできないのでスルー
                }
            }
        }
        return tweet;
    }

    /*!
     *  @brief  検索結果tweet全てにfuncを実行
     */
    search_result_each(func) {
        $("div#TSm").each((inx, tsm)=> {
            $(tsm).find("div.cnt.cf").each((inx, data)=> {
                const ref = $(data).find("span.ref");
                if (ref.length == 0 || $(ref).text() != "Twitter") {
                    return true;
                }
                return func(data);
            });
        });        
    }

    /*!
     *  @brief  検索結果フィルタ
     */
    filtering_search_result() {
        this.search_result_each((data)=> {
            const refname = $(data).find("span.refname");
            const nam = $(data).find("a.nam");
            if (refname.length == 0 || nam.length == 0) {
                return true;
            }
            var link_url = [];
            const userid = $(data).attr("data-user-id");
            if (userid != null && super.filtering_tw_userid(userid)) {
                $(data).detach();
                return true;
            }
            const dispname = $(refname).text();
            const tweet = this.get_tweet(data, link_url);
            if (super.filtering_tw_dispname(dispname) || super.filtering_word(tweet)) {
                $(data).detach();
                return true;
            }
            const ret = this.get_unique_id_from_tweet_url(data);
            var short_urls = [];
            urlWrapper.select_short_url(short_urls, link_url);
            if (short_urls.length > 0) {
                if (this.short_url_decoder.filter(short_urls,
                                                  super.filtering_word.bind(this))) {
                    $(data).detach();
                    return true;
                }
                this.short_url_decoder.entry(short_urls, ret.unique_id);
            }
            // tweet詳細を得る(bgへ移譲)
            if ($(data).attr("used-tweet") == null) {
                $(data).attr("used-tweet", "");
                MessageUtil.send_message({command: "get_tweet",
                                          middle_id: ret.unique_id,
                                          middle_url: ret.middle_url});
            }
            return true;
        });

        this.short_url_decoder.decode();
    }


    /*!
     *  @brief  フィルタリング
     */
    filtering() {
        if (!this.current_location.in_yahoo_realtime_search_result()) {
            return;
        }
        this.filtering_search_result();
    }


    /*!
     *  @brief  検索結果フィルタ(id指定)
     *  @param  obj 短縮URL展開結果
     *  @note   短縮URL展開結果受信処理からの呼び出し用
     */
    filtering_search_result_from_id(obj) {
        if (!super.filtering_word(obj.url)) {
            return;
        }
        this.search_result_each((data)=> {
            const ret = this.get_unique_id_from_tweet_url(data);
            if (ret.unique_id in obj.id) {
                $(data).detach();
                return false;
            } else {
                return true;
            }
        }); 
    }

    /*!
     *  @brief  短縮URL展開完了通知
     *  @param  short_url   展開元短縮URL
     *  @param  url         展開後URL
     */
    tell_decoded_short_url(short_url, url) {
        if (!this.current_location.in_yahoo_realtime_search_result()) {
            return;
        }
        this.short_url_decoder.tell_decoded(short_url, url,
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
        this.search_result_each((data)=> {
            const ret = this.get_unique_id_from_tweet_url(data);
            if (ret.unique_id != middle_id) {
                return true;
            }
            const ret2
                = super.get_tweet_userid_and_filtering_from_html(tweet.tweet_html,
                                                                 middle_id);
            if (ret2.result) {
                $(data).detach();
            } else {
                // 右クリックメニュy－用に書き込んでおく
                $(data).attr("data-tweet-id", tweet.id);
                $(data).attr("data-user-id", ret2.userid);
                $(data).attr("data-screen-name",
                             $(data).find("a.nam").text().replace('@', ''));
            }
            return false;
        }); 
        //
        this.short_url_decoder.decode();
    }

    /*!
     *  @brief  tweet詳細取得完了通知
     *  @param  middle_id   中間URL識別ID
     *  @param  tweet       tweet詳細(未解析JSON)
     */
    tell_get_tweet(middle_id, tweet) {
        if (!this.current_location.in_yahoo_realtime_search_result()) {
            return;
        }
        this.filtering_search_result_from_tweet_detail(middle_id, tweet);
    }


    get_observing_node(elem) {
        $("div#TSm").each((inx, e)=>{ elem.push(e); });
    }

    callback_domloaded() {
        super.filtering(this.filtering.bind(this));
        super.callback_domloaded(this.get_observing_node.bind(this));
    }

    /*!
     *  @brief  無効な追加elementか？
     *  @retun  true    無効
     */
    is_valid_records(records) {
        return false;
    }

    /*!
     *  @param storage  ストレージインスタンス
     */
    constructor(storage) {
        super(storage);
        super.create_after_domloaded_observer(this.is_valid_records.bind(this),
                                              this.filtering.bind(this));
    }
}
