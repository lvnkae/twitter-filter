/*!
 *  @brief  message送信クラス(background側)
 *  @note   継承して使う
 */
class BGMessageSender {
    //
    constructor() {
        this.connected_tab = [];
        //
        this.delay_send_timer = null;
        this.delay_message = [];
        this.my_request = [];
        //
        this.reply_queue = {full:false, queue:[]};
        this.wait_queue = [];
        this.http_request_timer = null;
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


    /*!
     *  @brief  queueにkeyを登録する
     *  @param[dst] queue   登録先
     *  @param[in]  key     登録キー
     *  @param[in]  fparam  フリーパラメータ
     */
    static entry_queue(queue, key, fparam) {
        if (queue.full) {
            return false;
        }
        const MAX_HTTPREQUEST_PALLAREL = 8;
        queue.queue[key] = fparam;
        if (Object.keys(queue.queue).length == MAX_HTTPREQUEST_PALLAREL) {
            queue.full = true;
        }
        return true;
    }

    /*!
     *  @brief  応答待ちキーから削除
     *  @param  key 登録キー
     */
    remove_reply_queue(key) {
        delete this.reply_queue.queue[key];
    }

    /*!
     *  @brief  http_request発行待ちキューに積む
     *  @param  key     登録キー
     *  @param  fparam  フリーパラメータ
     */
    entry_wait_queue(key, fparam) {
        for (var inx = 0; inx < this.wait_queue.length; inx++) {
            if (BGMessageSender.entry_queue(this.wait_queue[inx], key, fparam)) {
                return;
            }
        }
        var obj = {};
        obj.full = false;
        obj.queue = [];
        obj.queue[key] = fparam;
        this.wait_queue.push(obj);
    }

    /*!
     *  @brief  http_requestを発行して良いか
     *  @param  key     登録キー
     *  @param  fparam  フリーパラメータ
     *  @retval true    発行してよし
     */
    can_http_request(key, fparam) {
        // 既にキューに積まれてるか
        if (key in this.reply_queue) {
            // 応答待ちキューに積まれてる
            return false;
        }
        for (var queue of this.wait_queue) {
            if (key in queue.queue) {
                // 発行待ちキューに積まれてる
                return false;
            }
        }
        // 即時request可？
        if (BGMessageSender.entry_queue(this.reply_queue, key, fparam)) {
            return true;
        }
        //
        this.entry_wait_queue(key, fparam);
        return false;
    }

    /*!
     *  @brief  応答待ちキュー更新
     *  @param  key                 登録キー
     *  @param  http_request_func   http_request発行関数
     */
    update_reply_queue(key, http_request_func) {
        this.remove_reply_queue(key);
        if (Object.keys(this.reply_queue.queue).length > 0) {
            return;
        } else {
            if (this.wait_queue.length == 0) {
                this.reply_queue.full = false;
                return;
            }
        }
        // 応答待ちキューが空になったら待機キュー先頭を昇格する
        this.reply_queue = this.wait_queue[0];
        const prev_wait_queue = this.wait_queue;
        this.wait_queue = [];
        for (var inx = 1; inx < prev_wait_queue.length; inx++) {
            this.wait_queue.push(prev_wait_queue[inx]);
        }
        // http_request発射
        this.http_request_timer = setTimeout(()=> {
            for (const key in this.reply_queue.queue) {
                http_request_func(key, this.reply_queue.queue[key]);
            }
            clearTimeout(this.http_request_timer);
            this.http_request_timer = null;
        }, 200); /* ウェイト入れてみる*/
    }
 }
