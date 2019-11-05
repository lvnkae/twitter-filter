/*!
 *  @brief  右クリックメニュー制御(Yahooリアルタイム検索用)
 */
class ContextMenuController_YahooRS extends ContextMenuController {

    /*!
     *  @brief  event:右クリック
     *  @param  loc     現在location(urlWrapper)
     *  @param  target  右クリックされたelement
     */
    event_mouse_right_click(loc, element) {
        const nd_user = super.get_tweet_user_node(element);
        if (nd_user.length == 0) {
            ContextMenuController.off_original_menu();
        } else {
            ContextMenuController.on_usermute(nd_user);
        }
    }

    /*!
     */
    constructor() {
        super();
    }
}
