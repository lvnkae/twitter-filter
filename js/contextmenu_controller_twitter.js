/*!
 *  @brief  右クリックメニュー制御(twitter用)
 */
class ContextMenuController_Twitter extends ContextMenuController {

    /*!
     *  @brief  tweetユーザノードを得る
     *  @param  element 起点ノード
     */
    get_tweet_user_node(element) {
        if (element.classList[0] == "QuoteTweet-link") {
            // 引用RT例外
            return $(element)
                .parents("div.QuoteTweet-container")
                .find("div.QuoteTweet-innerContainer");
        } else {
            return super.get_tweet_user_node(element);
        }
    }

    /*!
     *  @brief  event:右クリック
     *  @param  loc     現在location(urlWrapper)
     *  @param  target  右クリックされたelement
     */
    event_mouse_right_click(loc, element) {
        if (!loc.in_twitter_search()    &&
            !loc.in_twitter_user_page() &&
            !loc.in_twitter_tw_thread() &&
            !loc.in_twitter_list()) {
            return;
        }
        const nd_user = this.get_tweet_user_node(element);
        if (nd_user.length == 0) {
            ContextMenuController.off_original_menu();
        } else {
            ContextMenuController.on_usermute(nd_user);
        }
    }

    /*!
     *  @brief  子iframeに右クリック監視を追加
     *  @note   windowレベルで別DOMなので上からは監視できない
     */
    add_iframe_monitoring(parent) {
        if (parent.length == 0) {
            return;
        }
        $(parent).find("ol#stream-items-id").each((inx, elem)=> {
            $(elem).find("iframe").each((inx, ifr)=> {
                this.disable_original_menu(ifr.contentDocument);
            });
        });
        // tweetスレッドの親発言分
        if (parent[0].classList[0] =="ThreadedDescendants") {
            $(parent)
            .parents("div.permalink.light-inline-actions")
            .find("div.permalink-inner.permalink-tweet-container")
            .find("iframe").each((inx, ifr)=> {
                this.disable_original_menu(ifr.contentDocument);
            });
        }
    }

    /*!
     */
    constructor() {
        super();
    }
}
