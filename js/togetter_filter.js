/*!
 *  @brief  Togetterフィルタ
 */
class TogetterFilter extends FilterBase {

    /*!
     *  @brief  遅延ロードobserverに登録
     *  @param  username    ユーザ名
     *  @param  nd_img      imgノード
     */
    entry_lazy_load_observer(username, nd_img) {
        var ret = {entry: false, loaded: false};
        if (nd_img.length == 0) {
            return ret;
        }
        if ($(nd_img).attr("observing") != null) {
            return ret; // 登録済み
        }
        if ($(nd_img).attr("class").indexOf("loaded") >= 0) {
            ret.loaded = true;
            return ret; // ロード済み
        }
        this.lazy_load_observer.observe(nd_img[0], {
            attributes: true,
            attributeFilter: ['class']
        });
        $(nd_img).attr("observing", username);
        ret.entry = true;
        return ret;
    }


    /*!
     *  @brief  まとめtweetをミュートする
     *  @param  user    tweetユーザノード
     *  @note   まとめが歯抜けになると読みづらいので警告を出すに留める
     */
    mute_curating_tweet(user) {
        const old_img = $(user).find("img.icon_48")
        $(old_img).detach();
        $(user).prepend('<img class="icon_48" src="'
                        + chrome.extension.getURL("img/danger_48.png")
                        + '" style="border: 2px dashed #880000;">');
        $(user).attr("muted", "");
    }

    /*!
     *  @brief  まとめtweet全てにfuncを実行
     *  @param  func
     */
    curating_tweets_each(func) {
        $("div.tweet_box").each((inx, box)=> {
            $(box).find("a.user_link").each((inx, user)=> {
                if (!func(user)) {
                    return false;
                }
            });
        });
    }

    /*!
     *  @brief  まとめtweetフィルタ
     */
    filtering_curating_tweets() {
        this.curating_tweets_each((user)=> {
            if ($(user).attr("muted") != null) {
                return true;
            }
            const nd_dispname = $(user).find("strong")
            const nd_username = $(user).find("span.status_name");
            if (nd_dispname.length == 0 || nd_username.length == 0) {
                return true;
            }
            const dispname = $(nd_dispname).text();
            if (super.filtering_tw_dispname(dispname)) {
                this.mute_curating_tweet(user);
                return true;
            }
            const username = $(nd_username).text().replace('@', '');
            const profile = this.tw_profile_accessor.get_profile(username);
            if (profile != null) {
                if (super.filtering_tw_profile(profile)) {
                    this.mute_curating_tweet(user);
                }
            } else {
                const ret = this.entry_lazy_load_observer(username, $(user).find("img"));
                if (ret.loaded) {
                    this.tw_profile_accessor.entry(username);
                }
            }
            return true;
        });
        this.tw_profile_accessor.publish_request();
    }


    get_comment_main_node(parent) {
        const tw = $(parent).find("div.tweet");
        if (tw.length == 0) {
            return tw;
        }
        return $(tw).find("span.emj");
    }

    /*!
     *  @brief  コメント全てにfuncを実行
     *  @param  func
     */
    comment_each(func) {
        $("div#comment_box.comment_box").each((inx, elem)=> {
            $(elem).find("div.list_tweet_box").each((inx, box)=> {
                const parent = $(box).parent();
                const com_id = $(parent).attr("id");
                if (com_id == null || com_id.indexOf("comment_id_") < 0) {
                    return true;
                }
                if (!func(parent, com_id, box)) {
                    return false;
                }
            });
        });
    }

    /*!
     *  @brief  コメントフィルタ
     */
    filtering_comment() {
        this.comment_each((parent, com_id, box)=> {
            const nd_user = $(box).find("span.user_link");
            const nd_tweet = this.get_comment_main_node(box);
            if (nd_user.length == 0 || nd_tweet.length == 0) {
                return true;
            }
            const nd_dispname = $(nd_user).find("strong")
            const nd_username = $(nd_user).find("a.status_name");
            if (nd_dispname.length == 0 || nd_username.length == 0) {
                return true;
            }
            const dispname = nd_dispname.text();
            const tw_info = TwitterUtil.get_togetter_comment(nd_tweet[0]);
            if (super.filtering_tw_dispname(dispname) ||
                super.url_filter(tw_info.tweet)) {
                $(parent).detach();
                return true;
            }
            const username = nd_username.text().replace('@', '');
            const profile = this.tw_profile_accessor.get_profile(username);
            if (profile != null) {
                if (super.filtering_tw_profile(profile)) {
                    $(parent).detach();
                    return true;
                }
            } else {
                const nd_img = $(nd_user).find("img");
                const ret = this.entry_lazy_load_observer(username, nd_img);
                if (ret.loaded) {
                    this.tw_profile_accessor.entry(username);
                }
            }
            var short_urls = [];
            urlWrapper.select_short_url(short_urls, tw_info.link_urls);
            if (short_urls.length == 0) {
                return true;
            }
            if (this.short_url_decoder.filter(short_urls,
                                              super.url_filter.bind(this))) {
                $(parent).detach();
                return true;
            }
            this.short_url_decoder.entry(short_urls, com_id);
            return true;
        });
        this.short_url_decoder.decode();
        this.tw_profile_accessor.publish_request();
    }

    /*!
     *  @brief  フィルタリング
     */
    filtering() {
        if (!this.current_location.in_togetter_content()) {
            return;
        }
        this.filtering_curating_tweets();
        this.filtering_comment();
    }


    /*!
     *  @brief  フィルタ(id指定)
     *  @param  obj 短縮URL展開情報
     *  @note   短縮URL展開結果受信処理からの呼び出し用
     */
    filtering_comment_from_id(obj) {
        if (!this.current_location.in_togetter_content()) {
            return;
        }
        if (!super.url_filter(obj.url)) {
            return;
        }
        this.comment_each((parent, com_id, box)=> {
            if (com_id in obj.id) {
                $(parent).detach();
                return false;
            }
            return true;
        });
    }

    /*!
     *  @brief  短縮URL展開完了通知
     *  @param  short_url   展開元短縮URL
     *  @param  url         展開後URL
     */
    tell_decoded_short_url(short_url, url) {
        this.short_url_decoder.tell_decoded(short_url, url,
                                            this.filtering_comment_from_id.bind(this));
    }


    /*!
     *  @brief  tweet_idでのプロフィール再取得
     *  @param  pr_username ユーザ名
     *  @note   ユーザ名で取得できなかった(not_found)らtweet_idで再挑戦する
     *  @note   (ユーザ名変更時に起こる)
     */
    retry_get_tw_profile_from_tweet(pr_username) {
        if (!this.current_location.in_togetter_content()) {
            return;
        }
        var tweet_id = [];
        $("div.tweet_box").each((inx, tw_box)=> {
            $(tw_box).find("div.list_box.type_tweet").each((inx, lbox)=> {
                if ($(lbox).attr("used-tweet") != null) {
                    return; // このtweetは使用済み
                }
                const nd_username = $(lbox).find("span.status_name");
                if (nd_username.length == 0) {
                    return;
                }
                const username = $(nd_username).text().replace('@', '');
                if (pr_username != username) {
                    return;
                }
                const nd_status = $(lbox).find("div.status");
                if (nd_status.length == 0) {
                    return;
                }
                tweet_id.push($(nd_status).attr("data-id"));
                $(lbox).attr("used-tweet", "");
            });
        });
        if (tweet_id.length == 0) {
            return;
        }
        MessageUtil.send_message({command:"get_tw_profile",
                                  username: pr_username,
                                  tweet_id: tweet_id});
    }

    /*!
     *  @brief  フィルタ(profile指定)
     *  @param  profile
     *  @note   Twitterプロフィール結果受信処理からの呼び出し用
     */
    filtering_from_profile(profile) {
        if (!this.current_location.in_togetter_content()) {
            return;
        }
        const pr_username = profile.username;
        this.curating_tweets_each((user)=> {
            const nd_username = $(user).find("span.status_name");
            if (nd_username.length == 0) {
                return true;
            }
            const username = $(nd_username).text().replace('@', '');
            if (pr_username != username) {
                return true;
            }
            if ($(user).attr("muted") != null) {
                return true;
            }
            if (super.filtering_tw_profile(profile)) {
                this.mute_curating_tweet(user);
            }
            return true;
        });
        this.comment_each((parent, com_id, box)=> {
            const nd_user = $(box).find("span.user_link");
            if (nd_user.length == 0) {
                return true;
            }
            const nd_username = $(nd_user).find("a.status_name");
            if (nd_username.length == 0) {
                return true;
            }
            const username = nd_username.text().replace('@', '');
            if (pr_username != username) {
                return true;
            }
            if (super.filtering_tw_profile(profile)) {
                $(parent).detach();
            }
            return true;
        });
    }

    /*!
     *  @brief  Twiterプロフィール取得通知
     *  @param  userid      ユーザID
     *  @param  username    ユーザ名
     */
    tell_get_tw_profile(result, userid, username, json) {
        if (result == 'success' || result == 'suspended') {
            this
            .tw_profile_accessor
            .tell_gotten(userid,
                         username,
                         this.filtering_from_profile.bind(this));
        } else
        if (result == 'not_found') {
            this.retry_get_tw_profile_from_tweet(username);
        } else 
        if (result == 'retry_success') {
            this
            .tw_profile_accessor
            .tell_gotten_retry(json,
                               username,
                               this.filtering_from_profile.bind(this));
        }
    }


    get_observing_node(elem) {
        // まとめ作成者情報
        //$("div.info_status_box.offfix").each((inx, e)=>{ elem.push(e); });
        // まとめられたtweet
        $("div.tweet_box").each((inx, e)=>{ elem.push(e); });
        // コメント
        //$("div#comment_box.comment_box").each((inx, e)=>{ elem.push(e); });
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
     *  @brief  遅延ロードobserver生成
     *  @note   アイコン画像の監視用
     */
    create_lazy_load_observer() {
        this.lazy_load_observer = new MutationObserver((records)=> {
            for (const record of records) {
                const nd_img = record.target;
                const attr_class = $(nd_img).attr("class");
                if (attr_class.indexOf("loaded") < 0) {
                    return; // ロード終わってない
                }
                this.tw_profile_accessor.entry($(nd_img).attr("observing"));
            }
            this.tw_profile_accessor.publish_request();
        });
    }

    /*!
     *  @param storage  ストレージインスタンス
     */
    constructor(storage) {
        super(storage);
        super.create_after_domloaded_observer(this.is_valid_records.bind(this),
                                              this.filtering.bind(this));
        this.create_lazy_load_observer();
    }
}
