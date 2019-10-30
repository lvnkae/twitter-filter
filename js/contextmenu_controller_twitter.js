/*!
 *  @brief  右クリックメニュー制御(twitter用)
 */
class ContextMenuController_Twitter extends ContextMenuController {

    /*!
     *  @brief  event:右クリック
     *  @param  loc     現在location(urlWrapper)
     *  @param  target  右クリックされたelement
     */
    static event_mouse_right_click(loc, element) {
        const nodename = element.nodeName;
        const classname = element.className;
        var parent_calls = -1;
        if (loc.in_twitter_search()) {
            if (nodename == 'B') {
                if (classname == '') {
                    const pr = $(element).parent();
                    if (pr[0].nodeName == 'SPAN' &&
                        pr[0].className.indexOf('username u-dir') >= 0) {
                        parent_calls = 5;
                    }
                }
            } else
            if (nodename == 'DIV') {
                if (classname == 'stream-item-header' ||
                    classname == 'stream-item-footer') {
                    parent_calls = 2;
                } else
                if (classname.indexOf('ProfileTweet-actionList') >= 0) {
                    parent_calls = 3;
                }
            } else
            if (nodename == 'IMG') {
                if (classname.indexOf('avatar') >= 0) {
                    parent_calls = 4;
                }
            } else
            if (nodename == 'P') {
                if (classname.indexOf('TweetTextSize') >= 0) {
                    parent_calls = 3;
                }
            } else
            if (nodename == 'STRONG') {
                if (classname.indexOf('fullname show-popup') >= 0) {
                    parent_calls = 5;
                }
            } else {
            }
        } else if (loc.in_twitter_user_page()) {
            //tl_parent = $("div#timeline.ProfileTimeline");
        } else if (loc.in_twitter_tw_thread()) {
            //tl_parent = $("div#descendants.ThreadedDescendants");
        } else if (loc.in_twitter_list()) {
            //tl_parent = $("div.stream-container");
        } else {
            return;
        }
        if (parent_calls < 0) {
            MessageUtil.send_message({
                command: MessageUtil.command_update_contextmenu(),
                item_id: MessageUtil.context_menu_item_id_mute_tw(),
            });
        } else {
            super.on_usermute(element, parent_calls);
        }
    }

    /*!
     *  @param  loc 現在location(urlWrapper)
     */
    constructor(loc) {
        super(loc, ContextMenuController_Twitter.event_mouse_right_click);
    }
}
