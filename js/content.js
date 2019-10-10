/*!
 *  @brief  content.js本体
 */
class Content {

    constructor() {
        this.current_location = new urlWrapper(location.href);
        this.filter = new Filter();
        this.kick();
    }

    kick() {
        chrome.runtime.sendMessage({command:"start_content"}, ()=>{});
        this.filter.load();
    }
}

/*!
 *  @brief  フィルタクラス
 */
class Filter {

    constructor() {
        this.after_domloaded_observer = null;
        this.filtering_timer = null;
        this.filter_instance = null;
        //
        this.initialize();
    }

    load() {
        this.storage = new StorageData();
        this.storage.load().then(() => {
            document.addEventListener("DOMContentLoaded", ()=> {
                this.callback_domloaded();
            });
        });
    }

    callback_domloaded() {
        const loc = gContent.current_location;
        if (loc.in_twitter()) {
            this.filter_instance = new TwitterFilter(this.storage);
        } else if(loc.in_yahoo_realtime_search_result()) {
            this.filter_instance = new YahooRealtimeSearchFilter(this.storage);
        } else {
        }
        //
        this.filtering();
        //
        if (!this.ready_element_observer()) {
            // DOM構築完了時点でキーelementが見つからない場合は
            // intervalTimerで生成を待ってobserver登録する
            this.observer_timer = setInterval(()=> {
                if (this.ready_element_observer()) {
                    clearInterval(this.observer_timer);
                    this.observer_timer = null;
                }
            }, 33); /* 1/30sec */
        }
    }

    /*!
     *  @brief  element追加observer準備
     *  @note   DOM構築完了後に追加される遅延elementもフィルタにかけたい
     *  @note   → observerでelement追加をhookしfiltering実行
     */
    ready_element_observer() {
        const loc = gContent.current_location;
        var elem = [];
        if (loc.in_twitter()) {
            // 上位フレームを起点にすることで、下位フレームの再構成もひっかける
            // (検索結果のタブ[話題/すべて/ユーザ/画像etc]切り替え対策)
            $("div#page-container").each((inx, e)=>{ elem.push(e); });
            // ツイート詳細(スレッド表示)対策
            $("div.PermalinkOverlay-modal").each((inx, e)=>{ elem.push(e); });
        } else if(loc.in_yahoo_realtime_search_result()) {
            $("div#TSm").each((inx, e)=>{ elem.push(e); });
        } else {
            return true;
        }
        for (var e of elem) {
            this.after_domloaded_observer.observe(e, {
                childList: true,
                subtree: true,
            });
        }
        return elem.length > 0;
    }

    /*!
     *  @brief  フィルタリング
     *  @note   DOM構築完了タイミング(またはelement追加時)に実行
     */
    filtering() {
        if (!this.storage.json.active) {
            return;
        }
        if (!this.filter_instance) {
            return;
        }
        this.filter_instance.filtering(gContent.current_location);
    }


    initialize() {
        // DOM構築完了後のノード追加observer
        this.after_domloaded_observer = new MutationObserver((records)=> {
            if (!this.storage.json.active) {
                return;
            }
            if (records.length == 0) {
                return; // なぜか空
            }
            const top_record = records[0];
            const top_className = top_record.target.className;
            const top_id = top_record.target.id;
            if (top_className.indexOf('dropdown-menu') >= 0) {
                // ドロップダウンメニューON/OFFは無視
                return; 
            }
            if (top_className.indexOf('js-relative-timestamp') >= 0) {
                // timestamp関連は無視
                return;
            }
            if (top_className.indexOf('PlayableMedia') >= 0) {
                // 動画再生は無視
                return;
            }
            if (top_className == '' && top_id == '') {
                // 無名ノードは無視(動画関連なので)
                return;
            }
            //
            if (gContent.current_location.url != location.href) {
                // URLが変わった(=下位フレーム再構成)らタイマー捨てて即処理
                if (this.filtering_timer != null) {
                    clearTimeout(this.filtering_timer);
                    this.filtering_timer = null;
                }
                gContent.current_location = new urlWrapper(location.href);
                this.filtering();
            } else {
                // 短時間の連続追加はまとめて処理したい気持ち
                if (null == this.filtering_timer) {
                    this.filtering_timer = setTimeout(()=> {
                        gContent.current_location = new urlWrapper(location.href);
                        this.filtering();
                        clearTimeout(this.filtering_timer);
                        this.filtering_timer = null;
                    }, 200);
                }
            }
        });
        // background用Listener
        chrome.runtime.onMessage.addListener(
            (request, sender, sendResponce)=> {
                if (request.command == "decode_short_url") {
                    if (request.result == 'success') {
                        if (this.filter_instance) {
                            this
                            .filter_instance
                            .tell_decoded_short_url(request.short_url,
                                                    request.url,
                                                    gContent.current_location);
                        }
                    }
                } else
                if (request.command == "get_tweet") {
                    if (request.result == 'success') {
                        if (this.filter_instance) {
                            this
                            .filter_instance
                            .tell_get_tweet(request.middle_id,
                                            request.tweet,
                                            gContent.current_location);
                        }
                    }
                } else
                if (request.command == "update-storage") {
                    this.storage.load().then();
                }
                return true;
            }
        );
    }
}

var gContent = new Content();
