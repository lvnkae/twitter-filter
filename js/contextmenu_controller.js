/*!
 *  @brief  右クリックメニュー制御(ベース)
 */
class ContextMenuController {

    /*!
     *  @brief  マウスの右ボタンか
     *  @param  button  ボタン情報
     */
    static is_button_right(button) {
        return button == 2;
    }

    /*!
     *  @brief  右クリックメニューの「$(username)をミュート」を有効化
     */
    static on_usermute(element, parent_calls) {
        const nd_user = TwitterUtil.get_parent(element, parent_calls);
        if (nd_user.length == 0) {
            return;
        }
        const userid = $(nd_user).attr("data-user-id");
        const username = $(nd_user).attr("data-screen-name");
        const title = username + "をミュート";
        MessageUtil.send_message({
            command: MessageUtil.command_update_contextmenu(),
            item_id: MessageUtil.context_menu_item_id_mute_tw(),
            title: title,
            username: username,
            userid: userid
        });
    }

    /*!
     *  @param  loc 現在location(urlWrapper)
     *  @param  cb  右クリックeventコールバック
     */
    constructor(loc, cb) {
        this.current_location = loc;
        this.cb_mouse_right_click = cb;

        // 右クリックListener
        // 'contextmenu'では間に合わないことがあるので'mouseup'
        document.addEventListener('mouseup', (e)=> {
            if (!ContextMenuController.is_button_right(e.button)) {
                return;
            }
            this.cb_mouse_right_click(this.current_location, e.target);
        });
    }
}
