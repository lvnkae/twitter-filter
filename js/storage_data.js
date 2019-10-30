/*!
 *  @brief  データクラス
 */
class StorageData {

    constructor() {
        this.clear();
    }

    filter_key() {
        return "Filter";
    }

    load() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get((items) => {
                if (this.filter_key() in items) {
                    this.json = JSON.parse(items[this.filter_key()]);
                    this.update_text();
                } else {
                    this.clear();
                }
                resolve();
            });
        }); 
    }

    save() {
        var jobj = {};
        jobj[this.filter_key()] = JSON.stringify(this.json);
        chrome.storage.local.set(jobj);
    }
    
    clear() {
        this.json = {}
        this.json.active = true;                // フィルタ 有効/無効
        this.json.userid_mute = [];             // ユーザIDフィルタ
        this.json.dispname_mute = [];           // 表示名フィルタ
        this.json.word_mute = [];               // ワードフィルタ
        this.json.post_rt_setting = [];         // RTツイート後設定
        this.json.tg_comment_user_mute = [];    // togetterユーザ名フィルタ
        this.json.option = {};
        this.json.option.off_login = false;     // オプション：ログイン案内非表示
        this.json.option.off_related = false;   // オプション：おすすめユーザ非表示
        this.json.option.off_trend = false;     // オプション：トレンド非表示
        this.json.option.annoying_mute = true;  // オプション：迷惑サイトフィルタ

        this.clear_text_buffer();
    }

    clear_text_buffer() {
        this.userid_mute_text = "";
        this.dispname_mute_text = "";
        this.word_mute_text = "";
        this.post_rt_setting_username_text = "";
        this.tg_comment_user_mute_text = "";
    }

    update_text() {
        this.clear_text_buffer();
        //  フィルタを改行コードで連結してバッファに格納
        const NLC = TextUtil.new_line_code();
        for (const uim of this.json.userid_mute) {
            var txt = uim.userid;
            if (uim.username != '') {
                txt += '/' + uim.username;
            }
            this.userid_mute_text += txt + NLC;
        }
        for (const dnm of this.json.dispname_mute) {
            this.dispname_mute_text += dnm.dispname + NLC;
        }
        for (const wmt of this.json.word_mute) {
            this.word_mute_text += wmt + NLC;
        }
        for (const prts of this.json.post_rt_setting) {
            var txt = prts.userid;
            if (prts.username != '') {
                txt += '/' + prts.username;
            }
            this.post_rt_setting_username_text += txt + NLC;
        }
        for (const tgcumt of this.json.tg_comment_user_mute) {
            this.tg_comment_user_mute_text += tgcumt + NLC;
        }
    }

    /*!
     *  @brief  ユーザIDミュート設定を追加
     *  @param  userid      ユーザID
     *  @param  username    ユーザ名
     *  @param  words       固有ミュートワード
     */
    add_userid_mute(userid, username, words) {
        var json_obj = {};
        json_obj.userid = userid;
        json_obj.username = username;
        json_obj.words = words;
        this.json.userid_mute.push(json_obj);
    }
    /*!
     *  @brief  ユーザIDミュート設定を追加(重複チェックあり)
     *  @param  userid      ユーザID
     *  @param  username    ユーザ名
     *  @param  words       固有ミュートワード
     *  @retval true        storage構成変更があった
     */
    add_userid_mute_with_check(userid, username, words) {
        for (const obj of this.json.userid_mute) {
            if (obj.userid == userid) {
                return false;
            }
        }
        this.add_userid_mute(userid, username, words);
        return true;
    }

    /*!
     *  @brief  ユーザIDでミュート
     *  @param  userid  調べるユーザID
     *  @retval true    除外対象だ
     */
    userid_mute(userid) {
        for (const uim of this.json.userid_mute) {
            // wordsが空でなければ単語指定がある
            if (uim.userid == userid) {
                return uim.words == '';
            }
        }
        return false;
    }
    /*!
     *  @brief  ユーザID群でミュート
     *  @param  userids 調べるユーザID
     *  @retval true    除外対象だ
     */
    userids_mute(userids) {
        for (const userid of userids) {
            if (this.userid_mute(userid)) {
                return true;
            }
        }
        return false;
    }

    /*!
     *  @brief  表示名でミュート
     *  @param  dispname    調べる表示名
     *  @retval true        除外対象だ
     */
    dispname_mute(dispname) {
        for (const dmt of this.json.dispname_mute) {
            if (TextUtil.compound_conditional_compare(dmt.dispname, 
                                                      dispname,
                                                      dmt.b_perfect_match,
                                                      dmt.b_normalize,
                                                      false,
                                                      true,
                                                      false)) {
                return true;
            }
        }
        return false;
    }

    /*!
     *  @brief  togetterユーザ名でミュート
     *  @param  username    togetterユーザ名
     *  @retval true    除外対象だ
     *  @note   twitter側と同一であることが保証されるのはtogetterに登録(連携)された瞬間のみ。
     *  @note   以降twitter側で変更されても自動反映されないし、削除や凍結も連動していない。
     *  @note   togetterに再ログインすると変更は反映されるが、ログイン(Cookie保持)し続けて
     *  @note   togetterとtwitterが別離したまま運用することは可能。また削除は別途申請が必要。
     *  @note   削除・凍結されてもコメントは消えない。新たにコメントできるかは不明だが、ログ
     *  @note   インし続けてたらできそうな気がする。
     */
    togetter_userame_mute(username) {
        for (const tcum of this.json.tg_comment_user_mute) {
            if (tcum == username) {
                return true;
            }
        }
        return false;
    }
    /*!
     *  @brief  togetterユーザ名でミュート
     *  @param  username    togetterユーザ名
     *  @retval true    除外対象が含まれている
     */
    togetter_usernames_mute(usernames) {
        for (const username of usernames) {
            if (this.togetter_userame_mute(username)) {
                return true;
            }
        }
        return false;
    }

    /*!
     *  @brief  ツイートをワード指定でミュート
     *  @param  tweet   調べるツイート
     *  @param  userid  調べるユーザID
     *  @retval true    除外対象だ
     *  @note   ユーザID固有ミュートワードも考慮する
     */
    word_mute(tweet, userid) {
        for (const wmt of this.json.word_mute) {
            if (TextUtil.regexp_indexOf(wmt, tweet, false, false, true, true)) {
                return true;
            }
        }
        if (userid == null) {
            return false;
        }
        for (const uim of this.json.userid_mute) {
            if (uim.userid == userid) {
                for (const wmt of uim.words) {
                    if (TextUtil.regexp_indexOf(wmt, tweet, false, false, true, true)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
}

