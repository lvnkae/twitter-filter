/*!
 *  @brief  Togetterフィルタ
 */
class TogetterFilter extends FilterBase {

    /*!
     *  @brief  twitterプロフィール画像URL取得
     *  @param  nd_user twitterユーザ情報ノード
     */
    static get_profile_image_url(nd_user) {
        const nd_img = $(nd_user).find("img");
        if (nd_img.length == 0) {
            return null;
        }
        return $(nd_img).attr("data-lazy-src");
    }
    /*!
     *  @brief  twitterプロフィール画像ID取得
     *  @param  nd_user twitterユーザ情報ノード
     */
    static get_profile_image_id(nd_user) {
        const img_url = TogetterFilter.get_profile_image_url(nd_user);
        if (img_url == null) {
            return null;
        }
        return TwitterUtil.get_id_from_profile_image(img_url);
    }

    /*!
     *  @brief  警告用画像に差し替える
     *  @param  parent      画像の親ノード
     *  @param  img_file    警告用アイコン名
     */
    static replace_image_for_warning(parent, img_file) {
        const old_img = $(parent).find("img")
        $(old_img).detach();
        $(parent).prepend('<img class="icon" src="'
                          + chrome.extension.getURL('img/' + img_file + '.png')
                          + '" style="border: 2px dashed #880000;">');
    }

    /*!
     *  @brief  まとめユーザをミュートする
     *  @param  nd_user twitterユーザ情報ノード
     *  @param  is_prof プロフィールか(true:profile/false:tweet)
     *  @note   まとめが歯抜けになると読みづらいので警告を出すに留める
     */
    mute_curating_user(nd_user, is_prof) {
        if (is_prof) {
            TogetterFilter.replace_image_for_warning(nd_user, 'danger_64');
        } else {
            TogetterFilter.replace_image_for_warning(nd_user, 'danger_48');
        }
        $(nd_user).attr("muted", "");
    }

    /*!
     *  @brief  サムネイル画像を警告用に差し替える
     *  @param  parent  サムネイル画像の親ノード
     */
    replace_thumb_image_to_warning(parent) {
        TogetterFilter.replace_image_for_warning(parent, 'danger_128');
    }

    /*!
     *  @brief  まとめ物(list_box)全てにfuncを実行
     */
    curating_list_box_each(func) {
        $("div.tweet_box").each((inx, tw_box)=> {
            $(tw_box).find("div.list_box").each((inx, l_box)=> {
                if ($(l_box).attr("muted") != null) {
                    return true;
                }
                if (!func(l_box)) {
                    return false;
                }
            });
        });
    }

    /*!
     *  @brief  まとめtweet全てにfuncを実行
     */
    curating_tweets_each(func) {
        $("div.tweet_box").each((inx, tw_box)=> {
            $(tw_box).find("div.list_box").each((inx, l_box)=> {
                if (l_box.className.indexOf("type_tweet") < 0) {
                    return true;
                }
                const user =  $(l_box).find("a.user_link");
                if (user.length == 0) {
                    return true;
                }
                if ($(user).attr("muted") != null) {
                    return true;
                }
                if (!func(user, l_box)) {
                    return false;
                }
            });
        });
    }
    
    /*!
     *  @brief  まとめlinkフィルタ
     *  @param  l_box   list_boxノード
     *  @note   tweetでもprofileでもtogetterでもないlist_box用
     */
    filtering_curating_link(l_box) {
        const nd_site_name = $(l_box).find("span.site_name");
        const nd_thumb = $(l_box).find("div.thumb");
        if (nd_site_name.length == 0 || nd_thumb.length == 0) {
            return true;
        }
        const nd_link = $(nd_thumb).find("a");
        if (nd_link.length == 0) {
            return true;
        }
        const site_name = TextUtil.remove_blank_line($(nd_site_name).text());
        const site_url = $(nd_link).attr("href");
        if (super.filtering_word(site_name) || super.filtering_word(site_url)) {
            this.replace_thumb_image_to_warning(nd_link);
            $(l_box).attr("muted", "");
        }
        return true;
    }

    /*!
     *  @brief  まとめユーザフィルタ
     *  @param  l_box   list_boxノード
     *  @param  is_prof プロフィールか(true:profile/false:tweet)
     */
    filtering_curating_user(l_box, is_prof) {
        const user = $(l_box).find("a.user_link")
        if (user.length == 0) {
            return true;
        }
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
            this.mute_curating_user(user, is_prof);
            return true;
        }
        const profile_image_url = TogetterFilter.get_profile_image_url(user);
        if (profile_image_url == null) {
            return true;
        }
        const profile_image_id
            = TwitterUtil.get_id_from_profile_image(profile_image_url);
        if (profile_image_id != null) {
            const username = $(nd_username).text().replace('@', '');
            if (this.tw_profile_image_accessor.is_connected(username,
                                                            profile_image_id)) {
                const userid = this.tw_profile_accessor.get_userid(profile_image_id);
                if (userid != null) {
                    if (super.filtering_tw_userid(userid)) {
                        this.mute_curating_user(user, is_prof);
                        return true;
                    }
                }
            } else {
                this.tw_profile_image_accessor.entry(username, profile_image_id);
            }
        } else
        if (is_prof) {
            return true;
        } else {
            if (TwitterUtil.is_default_icon(profile_image_url)) {
                const nd_status = $($(user).parent()).find("div.status");
                if (nd_status.length == 0) {
                    return true;
                }
                if ($(nd_status).attr("used-tweet") != null) {
                    return true;
                }
                // プロフィール画像がデフォルトのままだった場合
                // usernameとアカウントを紐付けできないので、tweet詳細からuseridを得る
                // (tweetごとに処理するのでフィルタ挙動がまちまちになる)
                MessageUtil.send_message({command:"get_tweet",
                                          tweet_id: $(nd_status).attr("data-id")});
                $(nd_status).attr("used-tweet", "");
            }
        }
        return true;
    }

    /*!
     *  @brief  まとめフィルタ
     */
    filtering_curating_items() {
        this.curating_list_box_each((l_box)=> {
            const clsname = l_box.className;
            if (clsname.indexOf("type_tweet") >= 0) {
                return this.filtering_curating_user(l_box, false);
            } else
            if (clsname.indexOf("type_profile") >= 0) {
                return this.filtering_curating_user(l_box, true);
            } else 
            if (clsname.indexOf("type_togetter") >= 0) {
                return true;
            } else {
                return this.filtering_curating_link(l_box);
            }
        });
        this.tw_profile_image_accessor.publish_request();
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
            const nd_username = $(nd_user).find("a.status_name");
            if (nd_username.length == 0) {
                return true;
            }
            const username = nd_username.text().replace('@', '');
            const tw_info = TwitterUtil.get_togetter_comment(nd_tweet[0]);
            if (super.filtering_togetter_comment(username,
                                                 tw_info.tweet,
                                                 tw_info.rep_users)) {
                $(parent).detach();
                return true;
            }
            var short_urls = [];
            urlWrapper.select_short_url(short_urls, tw_info.link_urls);
            if (short_urls.length == 0) {
                return true;
            }
            if (this.short_url_decoder.filter(short_urls,
                                              super.filtering_word.bind(this))) {
                $(parent).detach();
                return true;
            }
            this.short_url_decoder.entry(short_urls, com_id);
            return true;
        });
        this.short_url_decoder.decode();
    }

    /*!
     *  @brief  favユーザアイコンフィルタ
     */
    filtering_favorite_user_icons() {
        $("div.favorite_box").each((inx, box)=> {
            $(box).find("a.icon_image.hint--top").each((inx, icon)=> {
                const username = $(icon).attr("data-hint");
                if (super.filtering_togetter_user(username)) {
                    $(icon).detach();
                }
            });
        });
    }
    
    /*!
     *  @brief  フィルタリング
     */
    filtering() {
        if (!this.current_location.in_togetter_content()) {
            return;
        }
        this.filtering_curating_items();
        this.filtering_comment();
        this.filtering_favorite_user_icons();
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
        if (!super.filtering_word(obj.url)) {
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
     *  @param  short_url   短縮URL
     *  @param  url         展開後URL
     */
    tell_decoded_short_url(short_url, url) {
        this.short_url_decoder.tell_decoded(short_url, url,
                                            this.filtering_comment_from_id.bind(this));
    }


    /*!
     *  @brief  まとめtweetフィルタ(userid/tweet(json))
     *  @param  tweet   tweet詳細(json)
     */
    filtering_curating_tweets_by_userid_and_json(tweet) {
        const tw_info = TwitterUtil.get_tweet_info_from_html(tweet.tweet_html);
        this.curating_tweets_each((user, l_box)=> {
            const nd_status = $($(user).parent()).find("div.status");
            if (nd_status.length == 0) {
                return true;
            }
            const tweet_id = $(nd_status).attr("data-id");
            if (tweet_id != tweet.id) {
                return true;
            }
            if (super.filtering_tw_userid(tw_info.userid)) {
                this.mute_curating_user(user, false);
            }
            return false;
        });
    }

    /*!
     *  @brief  tweet詳細取得完了通知
     *  @param  middle_id   中間URL識別ID(未使用)
     *  @param  tweet       tweet詳細(json)
     */
    tell_get_tweet(middle_id, tweet) {
        if (!this.current_location.in_togetter_content()) {
            return;
        }
        this.filtering_curating_tweets_by_userid_and_json(tweet);
    }
    

    /*!
     *  @brief  まとめtwitterオブジェクト全てにfuncを実行
     *  @note   tweetまたはtwitterプロフィール
     */
    curating_user_each(func) {
        this.curating_list_box_each((l_box)=> {
            var is_prof = false;
            const clsname = l_box.className;
            if (clsname.indexOf("type_tweet") >= 0) {
            } else
            if (clsname.indexOf("type_profile") >= 0) {
                is_prof = true;
            } else {
                return true;
            }
            const nd_user =  $(l_box).find("a.user_link");
            if (nd_user.length == 0) {
                return true;
            }
            if ($(user).attr("muted") != null) {
                return true;
            }
            return func(nd_user, is_prof);
        });
    }

    /*!
     *  @brief  まとめtweetフィルタ(userid/username)
     *  @param  obj TwProfileAccessor管理オブジェクト
     */
    filtering_curating_tweets_by_userid_and_username(obj) {
        const userid = obj.userid;
        const username = obj.username;
        this.curating_user_each((nd_user, is_prof)=> {
            const nd_username = $(nd_user).find("span.status_name");
            if (nd_username.length == 0) {
                return true;
            }
            const un = $(nd_username).text().replace('@', '');
            if (un != username) {
                return true;
            }
            if (super.filtering_tw_userid(userid)) {
                this.mute_curating_user(nd_user, is_prof);
            }
            return true;
        });
    }
    /*!
     *  @brief  まとめtweetフィルタ(userid/img_id)
     *  @param  obj TwProfileAccessor管理オブジェクト
     */
    filtering_curating_tweets_by_userid_and_img_id(obj) {
        const userid = obj.userid;
        const img_id = obj.img_id;
        // 'tweet_id_success'からしか呼ばれないのでプロフィールは対象外
        this.curating_tweets_each((nd_user, l_box)=> {
            const profile_image_id = TogetterFilter.get_profile_image_id(nd_user);
            if (profile_image_id != img_id) {
                return true;
            }
            if (super.filtering_tw_userid(userid)) {
                this.mute_curating_user(nd_user, false);
            }
            return true;
        });        
    }

    /*!
     *  @brief  Twiterプロフィール取得通知
     *  @param  result      取得結果
     *  @param  userid      ユーザID
     *  @param  username    ユーザ名
     *  @param  img_id      プロフィール画像ID
     *  @param  json        ツイート詳細(json)
     *  @note   'success'       usernameがキー/useridが取得物
     *  @note   'tw_id_success' img_idがキー/jsonが取得物
     */
    tell_get_tw_profile(result, userid, username, img_id, json) {
        if (!this.current_location.in_togetter_content()) {
            return;
        }
        if (result == 'success') {
            const func
                = this.filtering_curating_tweets_by_userid_and_username.bind(this);
            this.tw_profile_accessor.tell_gotten(userid, username, img_id, func);
        } else
        if (result == 'not_found' || result == 'suspend') {
        } else 
        if (result == 'tweet_id_success') {
            const func
                = this.filtering_curating_tweets_by_userid_and_img_id.bind(this);
            this.tw_profile_accessor.tell_gotten_from_tweet_id(json, img_id, func);
        }
    }


    /*!
     *  @brief  Twitterプロフィール取得要求(ツイートID版)
     *  @param  local_ids   プロフィール画像ID群(local)
     */
    request_tw_profile_from_tweet_id(local_ids) {
        var tweet_id = [];
        for (const image_id in local_ids) {
            tweet_id[image_id] = [];
        }
        this.curating_tweets_each((user, l_box)=> {
            if ($(l_box).attr("used-tweet") != null) {
                return; // このtweetは使用済み
            }
            const nd_status = $(l_box).find("div.status");
            if (nd_status.length == 0) {
                return;
            }
            const profile_image_id = TogetterFilter.get_profile_image_id(user);
            if (profile_image_id == null) {
                return;
            }
            if (profile_image_id in local_ids) {
                tweet_id[profile_image_id].push($(nd_status).attr("data-id"));
                $(l_box).attr("used-tweet", "");
            }
        });
        for (const image_id in tweet_id) {
            MessageUtil.send_message({command:"get_tw_profile",
                                      image_id: image_id,
                                      tweet_id: tweet_id[image_id]});
        }
    }

    /*!
     *  @brief  Twitterプロフィール取得要求
     *  @param  obj TwProfileImageAccessorの管理オブジェクト
     */
    request_tw_profile(obj) {
        var image_id = null;
        var local_ids = [];
        for (const local_id in obj.local_id) {
            if (obj.image_id == local_id) {
                image_id = local_id;
            } else {
                local_ids[local_id] = null;
            }
        }
        if (image_id != null) {
            this.curating_user_each((nd_user, is_prof)=> {
                const profile_image_id = TogetterFilter.get_profile_image_id(nd_user);
                if (profile_image_id == null) {
                    return true;
                }
                if (profile_image_id == image_id) {
                    this.tw_profile_accessor.entry(obj);
                    this.tw_profile_accessor.publish_request();
                    return false;
                }
                return true;
            });
        }
        if (Object.keys(local_ids).length == 0) {
            return;
        }
        this.request_tw_profile_from_tweet_id(local_ids);
    }

    /*!
     *  @brief  Twiterプロフィール画像取得通知
     *  @param  result      取得結果
     *  @param  image_url   画像URL
     *  @param  username    ユーザ名
     */
    tell_get_tw_profile_image(result, image_url, username) {
        if (result == 'success') {
            this
            .tw_profile_image_accessor
            .tell_gotten(image_url,
                         username,
                         this.request_tw_profile.bind(this));
        } else
        if (result == 'not_found') {
            const local_ids = 
                this .tw_profile_image_accessor.get_local_id(username);
            if (local_ids == null) {
                console.log('error:local_ids is null(' + username + ')');
                return;
            }
            this.request_tw_profile_from_tweet_id(local_ids);
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
     *  @param storage  ストレージインスタンス
     */
    constructor(storage) {
        super(storage);
        super.create_after_domloaded_observer(this.is_valid_records.bind(this),
                                              this.filtering.bind(this));
    }
}
