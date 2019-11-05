/*!
 *  @brief  右クリックメニュー制御(togetter用)
 */
class ContextMenuController_Togetter extends ContextMenuController {

    /*!
     *  @brief  右クリックメニュー「$(username)をコメントミュート」を有効化
     *  @param  nd_user tweetユーザノード
     */
    static on_tg_usermute(nd_tg_user) {
        const username = $(nd_tg_user).text().replace('@', '');
        const title = username + "をコメントミュート";
        MessageUtil.send_message({
            command: MessageUtil.command_update_contextmenu(),
            click_command: MessageUtil.command_mute_tg_user(),
            title: title,
            username: username,
        });
    }
    
    /*!
     *  @brief  togetterユーザノードを得る
     *  @param  element 起点ノード
     */
    get_togetter_user_node(element) {
        return $(element).parents("div.list_tweet_box").find("a.status_name");
    }
    
    /*!
     *  @brief  event:右クリック
     *  @param  loc     現在location(urlWrapper)
     *  @param  target  右クリックされたelement
     */
    event_mouse_right_click(loc, element) {
        const nd_user = super.get_tweet_user_node(element);
        if (nd_user.length != 0) {
            ContextMenuController.on_usermute(nd_user);
            return;
        }
        const nd_tg_user = this.get_togetter_user_node(element);
        if (nd_tg_user.length != 0) {
            ContextMenuController_Togetter.on_tg_usermute(nd_tg_user);
            return;
        }
        //
        ContextMenuController.off_original_menu();
    }

    /*!
     */
    constructor() {
        super();
    }
}
