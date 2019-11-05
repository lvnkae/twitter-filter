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
     *  @brief  tweetユーザノードを得る
     *  @param  element 起点ノード
     */
    get_tweet_user_node(element) {
        return TwitterUtil.parent_each(element, (e)=> {
            return $(e).attr("data-user-id") != null &&
                   $(e).attr("data-screen-name") != null;
        });
    }

    /*!
     *  @brief  右クリックメニューの「$(username)をミュート」を有効化
     *  @param  nd_user tweetユーザノード
     */
    static on_usermute(nd_user) {
        if (nd_user.length == 0) {
            return;
        }
        const userid = $(nd_user).attr("data-user-id");
        const username = $(nd_user).attr("data-screen-name");
        const title = username + "をミュート";
        MessageUtil.send_message({
            command: MessageUtil.command_update_contextmenu(),
            click_command: MessageUtil.command_mute_tw_user(),
            title: title,
            username: username,
            userid: userid
        });
    }
    /*!
     *  @brief  右クリックメニューの拡張機能固有項目を無効化
     */
    static off_original_menu() {
        MessageUtil.send_message({
            command: MessageUtil.command_update_contextmenu(),
        });
    }

    /*!
     *  @brief  固有メニュー無効化
     *  @param  doc     無効化対象DOM
     *  @note   document外document用(子iframeとか)
     */
    disable_original_menu(doc) {
        doc.addEventListener('mousedown', (e)=> {
            if (!ContextMenuController.is_button_right(e.button)) {
                return;
            }
            ContextMenuController.off_original_menu();
            this.monitoring_target = null;
        });
        doc.addEventListener('mousemove', (e)=> {
            if (!ContextMenuController.is_button_right(e.buttons)) {
                return;
            }
            if (null == this.monitoring_target) {
                return;
            }
            ContextMenuController.off_original_menu();
            this.monitoring_target = null;
        });
    }


    constructor() {
        this.prevent = false;
        this.monitoring_target = null;
        // 右クリックListener
        // 'contextmenu'では間に合わない
        // 'mouseup'でも間に合わないことがある(togetterのみ確認)
        // しかもMacOSでは右mouseupが発火しない(宗教が違う)らしい
        // よって
        //   'mousedown' 右ボタン押下時にcontextmenuをupdate
        //   'mousemove' 右ボタン押下+移動してたらtargetの変化を監視し再update
        // の2段Listener体制でねじ込む
        document.addEventListener('mousedown', (e)=> {
            if (!ContextMenuController.is_button_right(e.button)) {
                return;
            }
            this.event_mouse_right_click(new urlWrapper(location.href), e.target);
            this.monitoring_target = e.target;
        });
        document.addEventListener('mousemove', (e)=> {
            // note
            // 移動中のマウスボタン押下は"buttons"で見る
            if (!ContextMenuController.is_button_right(e.buttons)) {
                return;
            }
            if (e.target == this.monitoring_target) {
                return;
            }
            this.event_mouse_right_click(new urlWrapper(location.href), e.target);
            this.monitoring_target = e.target;
        });
    }
}
