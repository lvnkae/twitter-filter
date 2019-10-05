/*!
 *  @brief  バッジ(拡張機能入れるとchromeメニューバーに出るアイコン)管理クラス
 */
class Badge  {

    constructor() {
    }
    
    update(storage) {
        if (storage.json.active) {
            chrome.browserAction.setIcon({ path : "../img/badge_on.png"});
        } else {
            chrome.browserAction.setIcon({ path : "../img/badge_off.png"});
        }
    }
};

/*!
 */
class DispnameMuteParam
{
    constructor(perfect_match, normalize) {
        this.b_perfect_match = (perfect_match == null) ?false :perfect_match;
        this.b_normalize = (normalize == null) ?false :normalize;
    }
};



/*!
 *  @brief  popup.js本体
 */
class Popup {

    constructor() {
        this.initialize();
    }

    initialize() {
        this.badge = new Badge();
        this.storage = new StorageData();
        this.storage.load().then(()=> {
            this.updateCheckbox();
            this.updateTextarea();
            this.badge.update(this.storage);
        });
        this.ex_dispname_mute_buffer = [];  // 表示名ミュート詳細設定バッファ
        this.ex_dispname_mute_last = '';    // 最後に「表示名ミュート詳細設定」画面を開いた表示名
        this.post_rt_notation_buffer = [];  // RT後ツイート記法設定バッファ
        this.post_rt_username_last = '';    // 最後に「RG後ツイート記法設定」画面を開いたユーザ名
        //
        this.checkbox_sw_filter().change(()=> {
            this.button_save_enable();
        });
        //
        this.checkbox_perfect_match().change(()=> {
            this.button_save_enable();
        });
        this.checkbox_normalize().change(()=> {
            this.button_save_enable();
        });
        this.checkbox_off_login().change(()=> {
            this.button_save_enable();
        });
        this.checkbox_off_related().change(()=> {
            this.button_save_enable();
        });
        this.checkbox_off_trend().change(()=> {
            this.button_save_enable();
        });
        this.checkbox_annoying_mute().change(()=> {
            this.button_save_enable();
        });
        //
        this.selectbox_filter().change(()=> {
            this.selectbox_filter_change();
        });
        //
        this.textarea_userid_mute().keyup(()=> {
            this.textarea_userid_mute_keyup();
        });
        this.textarea_username_mute().keyup(()=> {
            this.textarea_username_mute_keyup();
        });
        this.textarea_dispname_mute().keyup(()=> {
            this.textarea_dispname_mute_keyup();
        });
        this.textarea_dispname_mute().dblclick(()=> {
            this.textarea_dispname_mute_dblclick();
        });
        this.textarea_word_mute().keyup(()=> {
            this.textarea_word_mute_keyup();
        });
        this.textarea_post_rt_setting_username().keyup(()=> {
            this.textarea_post_rt_setting_username_keyup();
        });
        this.textarea_post_rt_setting_username().dblclick(()=> {
            this.textarea_post_rt_setting_username_dblclick();
        });
        this.textarea_post_rt_notation().keyup(()=> {
            this.textarea_post_rt_notation_keyup();
        });
        //
        this.button_save().click(()=> {
            this.button_save_click();
        });
    }

    checkbox_sw_filter() {
        return  $("input[name=sw_filter]");
    }
    checkbox_perfect_match() {
        return  $("input#perfectmatch");
    }
    checkbox_normalize() {
        return  $("input#normalize");
    }
    checkbox_off_login() {
        return  $("input#off_login");
    }
    checkbox_off_related() {
        return  $("input#off_related");
    }
    checkbox_off_trend() {
        return  $("input#off_trend");
    }
    checkbox_annoying_mute() {
        return  $("input#annoying_mute");
    }

    checkbox_label_perfect_match() {
        return  $("label#perfectmatch");
    }
    checkbox_label_normalize() {
        return  $("label#normalize");
    }
    checkbox_label_off_login() {
        return  $("label#off_login");
    }
    checkbox_label_off_related() {
        return  $("label#off_related");
    }
    checkbox_label_off_trend() {
        return  $("label#off_trend");
    }
    checkbox_label_annoying_mute() {
        return  $("label#annoying_mute");
    }

    textarea_userid_mute() {
        return $("textarea[name=userid_mute]");
    }
    textarea_username_mute() {
        return $("textarea[name=username_mute]");
    }
    textarea_dispname_mute() {
        return $("textarea[name=dispname_mute]");
    }
    textarea_word_mute() {
        return $("textarea[name=word_mute]");
    }
    textarea_post_rt_setting_username() {
        return $("textarea[name=post_rt_setting_username]");
    }
    textarea_post_rt_notation() {
        return $("textarea[name=post_rt_notation]");
    }

    hide_textarea_all() {
        this.textarea_userid_mute().hide();
        this.textarea_username_mute().hide();
        this.textarea_dispname_mute().hide();
        this.hide_ex_dispname_mute();
        this.textarea_word_mute().hide();
        this.textarea_post_rt_setting_username().hide();
        this.textarea_post_rt_notation().hide();
        this.hide_option();
    }
    hide_ex_dispname_mute() {
        this.checkbox_perfect_match().hide();
        this.checkbox_normalize().hide();
        this.checkbox_label_perfect_match().hide();
        this.checkbox_label_normalize().hide();
    }
    hide_option() {
        this.checkbox_off_login().hide();
        this.checkbox_off_related().hide();
        this.checkbox_off_trend().hide();
        this.checkbox_annoying_mute().hide();
        this.checkbox_label_off_login().hide();
        this.checkbox_label_off_related().hide();
        this.checkbox_label_off_trend().hide();
        this.checkbox_label_annoying_mute().hide();
    }
    show_ex_dispname_mute() {
        this.checkbox_perfect_match().show();
        this.checkbox_normalize().show();
        this.checkbox_label_perfect_match().show();
        this.checkbox_label_normalize().show();
    }
    show_option() {
        this.checkbox_off_login().show();
        this.checkbox_off_related().show();
        this.checkbox_off_trend().show();
        this.checkbox_annoying_mute().show();
        this.checkbox_label_off_login().show();
        this.checkbox_label_off_related().show();
        this.checkbox_label_off_trend().show();
        this.checkbox_label_annoying_mute().show();
    }

    textarea_userid_mute_keyup() {
        if (this.textarea_userid_mute().val() != this.storage.userid_mute_text) {
            this.button_save().prop("disabled", false);
        }
    }
    textarea_username_mute_keyup() {
        if (this.textarea_username_mute().val() != this.storage.username_mute_text) {
            this.button_save().prop("disabled", false);
        }
    }
    textarea_dispname_mute_keyup() {
        if (this.textarea_dispname_mute().val() != this.storage.dispname_mute_text) {
            this.button_save().prop("disabled", false);
        }
    }
    textarea_word_mute_keyup() {
        if (this.textarea_word_mute().val() != this.storage.word_mute_text) {
            this.button_save().prop("disabled", false);
        }
    }
    textarea_post_rt_setting_username_keyup() {
        if (this.storage.post_rt_setting_username_text !=
            this.textarea_post_rt_setting_username().val()) {
            this.button_save().prop("disabled", false);
        }
    }
    textarea_post_rt_notation_keyup() {
        if (this.textarea_post_rt_notation().val()
            != this.post_rt_notation_buffer[this.post_rt_username_last]) {
            this.button_save().prop("disabled", false);
        }
    }

    /*!
     *  @brief  前回「表示名ミュート詳細設定」の後始末
     */
    cleanup_ex_dispname_mute() {
        if (this.ex_dispname_mute_last != '') {
            this.ex_dispname_mute_buffer_to_reflect_current(this.ex_dispname_mute_last);
            var key = this.selectbox_filter_key()
                    + " option[value=" + this.selectbox_value_ex_dispname_mute() + "]";
            $(key).remove();
        }
    }
    //
    textarea_dispname_mute_dblclick() {
        var t = this.textarea_dispname_mute();
        const dispname
            = text_utility.search_text_connected_by_new_line(
                t[0].selectionStart,
                t.val());
        if (dispname == null) {
            return;
        }
        this.cleanup_ex_dispname_mute();
        this.cleanup_post_rt_notation();
        this.ex_dispname_mute_last = dispname;
        // selectboxに「$(dispname)の詳細設定」を追加
        {
            const val = this.selectbox_value_ex_dispname_mute();
            const max_disp_dispname = 50;
            const text = dispname.slice(0, max_disp_dispname) + 'の詳細設定';
            this.selectbox_filter().append($("<option>").val(val).text(text));
        }
        //「$(dispname)詳細設定」準備
        {
            if (dispname in this.ex_dispname_mute_buffer) {
                const obj = this.ex_dispname_mute_buffer[dispname];
                this.checkbox_perfect_match().prop("checked", obj.b_perfect_match);
                this.checkbox_normalize().prop("checked", obj.b_normalize);
            } else {
                this.checkbox_perfect_match().prop("checked", false);
                this.checkbox_normalize().prop("checked", false);
                this.ex_dispname_mute_buffer[dispname]
                    = new DispnameMuteParam(false, false, false);
            }
        }
        this.selectbox_filter().val(this.selectbox_value_ex_dispname_mute());
        this.selectbox_filter_change();
    }

    /*!
     *  @brief  前回「RT後ツイート記法設定」の後始末
     */
    cleanup_post_rt_notation() {
        if (this.post_rt_username_last != '') {
            this.post_rt_notation_buffer_to_reflect_current(this.post_rt_username_last);
            var key = this.selectbox_filter_key()
                    + " option[value=" + this.selectbox_value_post_rt_notation() + "]";
            $(key).remove();
        }
    }
    //
    textarea_post_rt_setting_username_dblclick() {
        var t = this.textarea_post_rt_setting_username();
        const username
            = text_utility.search_text_connected_by_new_line(
                t[0].selectionStart,
                t.val());
        if (username == null) {
            return;
        }
        this.cleanup_post_rt_notation();
        this.cleanup_ex_dispname_mute();
        this.post_rt_username_last = username;
        // selectboxに「$(username)のRT後ツイート記法」を追加
        {
            const val = this.selectbox_value_post_rt_notation();
            const max_disp_username = 16;
            const text = username.slice(0, max_disp_username) + 'のRT後ツイート記法';
            this.selectbox_filter().append($("<option>").val(val).text(text));
        }
        //「$(username)固有RT後ツイート記法」設定用textareaの準備
        {
            if (username in this.post_rt_notation_buffer) {
                const rt_notation = this.post_rt_notation_buffer[username];
                this.textarea_post_rt_notation().val(rt_notation);
            } else {
                this.textarea_post_rt_notation().val('');
                this.post_rt_notation_buffer[username] = '';
            }
        }
        this.selectbox_filter().val(this.selectbox_value_post_rt_notation());
        this.selectbox_filter_change();
    }

    selectbox_filter_key() {
        return "select[name=select_filter]";
    }
    selectbox_filter() {
        return $(this.selectbox_filter_key());
    }

    selectbox_value_ex_dispname_mute() {
        return "ex_dispname_mute";
    }
    selectbox_value_post_rt_notation() {
        return "post_rt_notation";
    }

    is_selected_userid_mute() {
        return this.selectbox_filter().val() == "userid_mute";
    }
    is_selected_username_mute() {
        return this.selectbox_filter().val() == "username_mute";
    }
    is_selected_dispname_mute() {
        return this.selectbox_filter().val() == "dispname_mute";
    }
    is_selected_ex_dispname_mute() {
        return this.selectbox_filter().val() == 
               this.selectbox_value_ex_dispname_mute();
    }
    is_selected_word_mute() {
        return this.selectbox_filter().val() == "word_mute";
    }
    is_selected_post_rt_setting() {
        return this.selectbox_filter().val() == "post_rt_setting";
    }
    is_selected_post_rt_notation() {
        return this.selectbox_filter().val() == 
               this.selectbox_value_post_rt_notation();
    }
    is_selected_option() {
        return this.selectbox_filter().val() == "option";
    }

    selectbox_filter_change() {
        this.hide_textarea_all();
        if (this.is_selected_userid_mute()) {
            this.textarea_userid_mute().show();
        } else if (this.is_selected_username_mute()) {
            this.textarea_username_mute().show();
        } else if (this.is_selected_dispname_mute()) {
            this.textarea_dispname_mute().show();
        } else if (this.is_selected_ex_dispname_mute()) {
            this.show_ex_dispname_mute();
        } else if (this.is_selected_word_mute()) {
            this.textarea_word_mute().show();
        } else if (this.is_selected_post_rt_setting()) {
            this.textarea_post_rt_setting_username().show();
        } else if (this.is_selected_post_rt_notation()) {
            this.textarea_post_rt_notation().show();
        } else if (this.is_selected_option()) {
            this.show_option();
        }
    }

    button_save() {
        return $("button[name=req_save]");
    }
    button_save_click() {
        this.storage.clear();
        if (this.ex_dispname_mute_last != '') {
            this.ex_dispname_mute_buffer_to_reflect_current(this.ex_dispname_mute_last);
        }
        if (this.post_rt_username_last != '') {
            this.post_rt_notation_buffer_to_reflect_current(this.post_rt_username_last);
        }
        //
        {
            var filter
                = text_utility.split_by_new_line(this.textarea_userid_mute().val());
            for (const userid of filter) {
                const ui = text_utility.remove_new_line_and_space(userid);
                if (ui != "") {
                    this.storage.json.userid_mute.push(ui);
                }
            }
        }
        {
            var filter
                = text_utility.split_by_new_line(this.textarea_username_mute().val());
            for (const username of filter) {
                const un = text_utility.remove_new_line_and_space(username);
                if (un != "") {
                    this.storage.json.username_mute.push(un);
                }
            }
        }
        {
            var filter
                = text_utility.split_by_new_line(this.textarea_dispname_mute().val());
            for (const dispname of filter) {
                if (dispname != "") {
                    var json_obj = {};
                    json_obj.dispname = dispname;
                    if (dispname in this.ex_dispname_mute_buffer) {
                        const obj = this.ex_dispname_mute_buffer[dispname];
                        json_obj.b_perfect_match = obj.b_perfect_match;
                        json_obj.b_normalize = obj.b_normalize;
                    } else {
                        json_obj.b_perfect_match = false;
                        json_obj.b_normalize = false;
                    }
                    //
                    this.storage.json.dispname_mute.push(json_obj);
                }
            }
        }
        {
            var filter
                = text_utility.split_by_new_line(this.textarea_word_mute().val());
            for (const word of filter) {
                if (word != "") {
                    this.storage.json.word_mute.push(word);
                }
            }
        }
        {
            var filter
                = text_utility.split_by_new_line(
                    this.textarea_post_rt_setting_username().val());
            for (const username of filter) {
                if (username != "") {
                    var json_obj = {};
                    json_obj.username = username;
                    if (username in this.post_rt_notation_buffer) {
                        json_obj.notations = 
                            text_utility.split_by_new_line(
                                this.post_rt_notation_buffer[username]);
                    } else {
                        json_obj.notations = [];
                    }
                    //
                    this.storage.json.post_rt_setting.push(json_obj);
                }
            }
        }
        //
        this.storage.json.active = this.checkbox_sw_filter().prop("checked");
        this.storage.json.option.off_login = this.checkbox_off_login().prop("checked");
        this.storage.json.option.off_related
            = this.checkbox_off_related().prop("checked");
        this.storage.json.option.off_trend = this.checkbox_off_trend().prop("checked");
        this.storage.json.option.annoying_mute
            = this.checkbox_annoying_mute().prop("checked");
        //
        this.storage.save();
        this.send_message_to_relative_tab({command:"update-storage"});
        //
        this.button_save_disable();
        this.badge.update(this.storage);
        this.storage.update_text();
    }
    button_save_enable() {
        this.button_save().prop("disabled", false);
    }
    button_save_disable() {
        this.button_save().prop("disabled", true);
    }

    updateCheckbox() {
        var json = this.storage.json;
        this.checkbox_sw_filter().prop("checked", json.active);
        this.checkbox_off_login().prop("checked", json.option.off_login);
        this.checkbox_off_related().prop("checked", json.option.off_related);
        this.checkbox_off_trend().prop("checked", json.option.off_trend);
        this.checkbox_annoying_mute().prop("checked", json.option.annoying_mute);
    }

    updateTextarea() {
        this.textarea_userid_mute().val(this.storage.userid_mute_text);
        this.textarea_username_mute().val(this.storage.username_mute_text);
        this.textarea_dispname_mute().val(this.storage.dispname_mute_text);
        this.textarea_word_mute().val(this.storage.word_mute_text);
        this.textarea_post_rt_setting_username().val(
            this.storage.post_rt_setting_username_text);
        //
        this.ex_dispname_mute_buffer = [];
        for (const dnm of this.storage.json.dispname_mute) {
            this.ex_dispname_mute_buffer[dnm.dispname]
                = new DispnameMuteParam(dnm.b_perfect_match,
                                        dnm.b_normalize);
        }
        //
        const NLC = text_utility.new_line_code();
        this.post_rt_notation_buffer = [];
        for (const prts of this.storage.json.post_rt_setting) {
            var notations = "";
            for (const notaion of prts.notations) {
                notations += notaion + NLC;
            }
            this.post_rt_notation_buffer[prts.username] = notations;
        }
    }

    /*!
     *  @brief  現状を「表示名ミュート詳細設定」バッファへ反映する
     */
    ex_dispname_mute_buffer_to_reflect_current(dispname) {
        this.ex_dispname_mute_buffer[dispname]
            = new DispnameMuteParam(this.checkbox_perfect_match().prop("checked"),
                                    this.checkbox_normalize().prop("checked"));
    }
    /*!
     *  @brief  現状を「RT後ツイート記法」バッファへ反映する
     */
    post_rt_notation_buffer_to_reflect_current(username) {
        this.post_rt_notation_buffer[username] = this.textarea_post_rt_notation().val();
    }

    /*!
     *  @brief  content-scriptへ通知
     */
    send_message_to_relative_tab(message) {
        chrome.tabs.query({}, (tabs)=> {
            for (const tab of tabs) {
                const url = new urlWrapper(tab.url);
                if (url.in_twitter()) {
                    chrome.tabs.sendMessage(tab.id, message, ()=> {});
                }
            }
        });
    }};

var popup = new Popup();
