/*!
 *  @brief  messageユーティリティクラス
 */
class MessageUtil {
    /*!
     *  @brief  backgroundへのsendMessage
     *  @param  message
     *  @note   環境依存するのでラップしとく
     */
    static send_message(message) {
        chrome.runtime.sendMessage(message);
    }

    static command_start_content() { return "start_content"; }
    static command_update_contextmenu() { return "update_contextmenu"; }
    static command_mute_tw_user() { return "mute_twitter_user"; }

    static context_menu_item_id_mute_tw() { return "mute_tw_user_838861"; }
}
