/*!
 *  @brief  message送信クラス(background側)
 *  @note   継承して使う
 */
class BGMessageSender {
    //
    constructor() {
        this.connected_tab = [];
        this.delay_send_timer = null;
        this.delay_message = [];
        this.my_request = [];
    }

    /*!
     *  @brief  タブ登録
     *  @param  tab_id          タブID
     *  @note   返信は登録されたタブにのみ行う
     */
    entry(tab_id) {
        this.connected_tab[tab_id] = null;
    }

    /*!
     *  @brief  返信
     *  @param  message メッセージ
     *  @note   登録されているタブにのみ送信
     */
    send_reply(message) {
        chrome.tabs.query({}, (tabs)=> {
            for (const tab of tabs) {
                if (tab.id in this.connected_tab) {
                    // note
                    // responseを設定するとerror
                    //   "The message port closed before a response was received."
                    // → 応答不要なのでnullにしておく
                    chrome.tabs.sendMessage(tab.id, message, null); 
                }
            }
        });
    }

    /*!
     *  @brief  遅延返信
     *  @note   content_scriptsメッセージ受信処理の途中で返信するのは気持ち悪い。
     *  @note   理想は受信関数を抜けたタイミングでの返信だが、関数終了eventは見当
     *  @note   たらず、Listner登録関数からPromiseを返す手法もうまくいかない。
     *  @note   原始的な手法(Timer)に頼る…
     */
    send_reply_delay(message) {
        if (this.delay_send_timer == null) {
            this.delay_send_timer = setTimeout(()=> {
                for (const msg of this.delay_message) {
                    this.send_reply(msg);
                }
                clearTimeout(this.delay_send_timer);
                this.delay_send_timer = null;
                this.delay_message = [];
            });
        }
        this.delay_message.push(message);
    }

    is_owned_request(requestId) {
        return requestId in this.my_request;
    }
    hold_request(requestId) {
        this.my_request[requestId] = null;
    }
    release_request(requestId) {
        delete this.my_request[requestId];
    }
}