/*!
 *  @brief  content.js本体
 */
class Content {

    initialize() {
        // background用Listener
        chrome.runtime.onMessage.addListener(
            (request, sender, sendResponce)=> {
                if (request.command == "decode_short_url") {
                    if (request.result == 'success') {
                        if (this.filter_instance) {
                            this
                            .filter_instance
                            .tell_decoded_short_url(request.short_url, request.url);
                        }
                    }
                } else
                if (request.command == "get_tweet") {
                    if (request.result == 'success') {
                        if (this.filter_instance) {
                            this
                            .filter_instance
                            .tell_get_tweet(request.middle_id, request.tweet);
                        }
                    }
                } else
                if (request.command == "get_tw_profile") {
                    if (this.filter_instance) {
                        this
                        .filter_instance
                        .tell_get_tw_profile(request.result,
                                             request.userid,
                                             request.username,
                                             request.json);
                    }
                } else
                if (request.command == "update-storage") {
                    this.storage.load().then();
                }
                return true;
            }
        );
    }

    callback_domloaded() {
        const loc = new urlWrapper(location.href);
        if (loc.in_twitter()) {
            if ($("a.dropdown-toggle.js-dropdown-toggle.dropdown-signin").length == 0) {
                // ログインしてたらなにもしない
                return;
            }
            this.filter_instance = new TwitterFilter(this.storage);
        } else if (loc.in_yahoo_realtime_search_result()) {
            this.filter_instance = new YahooRealtimeSearchFilter(this.storage);
        } else if (loc.in_togetter_content()) {
            this.filter_instance = new TogetterFilter(this.storage);
        } else {
            return;
        }
        //
        this.filter_instance.callback_domloaded();
    }

    load() {
        this.storage = new StorageData();
        this.storage.load().then(() => {
            document.addEventListener("DOMContentLoaded", ()=> {
                this.callback_domloaded();
            });
        });
    }

    kick() {
        MessageUtil.send_message({command:"start_content"});
        this.load();
    }

    constructor() {
        this.filter_instance = null;
        this.initialize();
        this.kick();
    }
}

var gContent = new Content();
