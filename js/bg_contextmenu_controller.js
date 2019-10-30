/*!
 *  @brief  右クリックメニュー制御(background側)
 *  @note   実務者
 */
class BGContextMenuController extends BGMessageSender {

    /*!
     *  @brief  onMessageコールバック
     *  @param  request
     */
    on_message(request) {
        if (request.title == null) {
            chrome.contextMenus.update(request.item_id, { 
                "visible": false
            });
        } else {
            const param = {userid: request.userid,
                           username: request.username}
            this.menu_param[request.item_id] = param;
            //
            chrome.contextMenus.update(request.item_id, {
                "title": request.title,
                "visible": true
            });
        }                                                
    }

    /*!
     */
    constructor() {
        super();
        this.menu_param = [];
        chrome.contextMenus.create({
            "title": "mute",
            "id": MessageUtil.context_menu_item_id_mute_tw(),
            "type": "normal",
            "contexts" : ["all"],
            "visible" : false,
            "onclick" : (info)=> {
                const item_id = MessageUtil.context_menu_item_id_mute_tw();
                const param = this.menu_param[item_id];
                this.send_reply({command: MessageUtil.command_mute_tw_user(),
                                 userid: param.userid,
                                 username: param.username});
            }
        });
    }
}
