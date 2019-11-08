/*!
 *  @brief  content.js本体
 */
class Content {

    initialize() {
        // background用Listener
        browser.runtime.onMessage.addListener(
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
                                             request.image_id,
                                             request.json);
                    }
                } else
                if (request.command == "get_tw_profile_image") {
                    if (this.filter_instance) {
                        this
                        .filter_instance
                        .tell_get_tw_profile_image(request.result,
                                                   request.image_url,
                                                   request.username);
                    }
                } else
                if (request.command == "update-storage") {
                    this.storage.load().then();
                } else
                if (request.command == MessageUtil.command_mute_tw_user()) {
                    const update
                        = this.storage.add_userid_mute_with_check(request.userid,
                                                                  request.username,
                                                                  []);
                    if (update && request.tab_active) {
                        this.storage.save();
                        if (this.storage.json.active) {
                            this.filter_instance.filtering();
                        }
                    }
                } else
                if (request.command == MessageUtil.command_mute_tg_user()) {
                    const update
                        = this
                          .storage
                          .add_togetter_username_mute_with_check(request.username);
                    if (update && request.tab_active) {
                        this.storage.save();
                        if (this.storage.json.active) {
                            this.filter_instance.filtering();
                        }
                    }
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
