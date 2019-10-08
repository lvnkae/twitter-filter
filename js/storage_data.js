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
        this.json.username_mute = [];           // ユーザ名フィルタ
        this.json.dispname_mute = [];           // 表示名フィルタ
        this.json.word_mute = [];               // タイトルフィルタ
        this.json.post_rt_setting = [];         // コメントフィルタ(ユーザ)
        this.json.option = {};
        this.json.option.off_login = false;     // オプション：ログイン案内非表示
        this.json.option.off_related = false;   // オプション：おすすめユーザ非表示
        this.json.option.off_trend = false;     // オプション：トレンド非表示
        this.json.option.annoying_mute = true;  // オプション：迷惑サイトフィルタ

        this.clear_text_buffer();
    }

    clear_text_buffer() {
        this.userid_mute_text = "";
        this.username_mute_text = "";
        this.dispname_mute_text = "";
        this.word_mute_text = "";
        this.post_rt_setting_username_text = "";
    }

    update_text() {
        this.clear_text_buffer();
        //  フィルタを改行コードで連結してバッファに格納
        const NLC = TextUtil.new_line_code();
        for (const uim of this.json.userid_mute) {
            this.userid_mute_text += uim + NLC;
        }
        for (const unm of this.json.username_mute) {
            this.username_mute_text += unm + NLC;
        }
        for (const dnm of this.json.dispname_mute) {
            this.dispname_mute_text += dnm.dispname + NLC;
        }
        for (const wmt of this.json.word_mute) {
            this.word_mute_text += wmt + NLC;
        }
        for (const prts of this.json.post_rt_setting) {
            this.post_rt_setting_username_text += prts.username + NLC;
        }
    }

    /*!
     *  @brief  ユーザIDでミュート
     *  @param  userid      調べるユーザID
     *  @retval true        除外対象だ
     */
    userid_mute(userid) {
        for (const uim of this.json.userid_mute) {
            if (uim == userid) {
                return true;
            }
        }
        return false;
    }
    
    /*!
     *  @brief  ユーザ名でミュート
     *  @param  username    調べるユーザ名
     *  @retval true        除外対象だ
     */
    username_mute(username) {
        for (const umt of this.json.username_mute) {
            if (umt == username) {
                return true;
            }
        }
        return false;
    }

    /*!
     *  @brief  ユーザ名群でミュート
     *  @param  usernames   調べるユーザ名群
     *  @retval true        除外対象が含まれていた
     */
    usernames_mute(usernames) {
        for (const username of usernames) {
            if (this.username_mute(username)) {
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
     *  @brief  ツイートをワード指定でミュート
     *  @param  tweet   調べるツイート
     *  @retval true    除外対象だ
     */
    word_mute(tweet) {
        for (const wmt of this.json.word_mute) {
            if (TextUtil.regexp_indexOf(wmt, tweet, false, false, true, true)) {
                return true;
            }
        }
        return false;
    }
}

