/*!
 *  @brief  background.js本体
 */
class Background {
    //
    constructor() {
        this.extention_id = '';
        this.short_url_decoder = new BGShortUrlDecoder();
        this.tweet_accessor = new BGTweetAccessor();
        this.tw_profile_accessor = new BGTwProfileAccessor();
        //
        this.initialize();
    }

    /*!
     *  @brief  登録
     *  @param  extention_id    拡張機能ID
     *  @param  tab_id          タブID
     */
    entry(extention_id, tab_id) {
        this.extention_id = extention_id;
        this.short_url_decoder.entry(tab_id);
        this.tweet_accessor.entry(tab_id);
        this.tw_profile_accessor.entry(tab_id);
    }
    
    /*!
     *  @bref   監視対象httpRequestか
     *  @param  details
     */
    in_monitoring_request(details) {
        return details.initiator != null    &&
               this.extention_id != ''      &&
               details.initiator.indexOf(this.extention_id) >= 0;
    }

    /*!
     *  @brief  onHeadersReceivedコールバック
     *  @param  details 
     */
    on_headers_received(details) {
        if (!this.in_monitoring_request(details)) {
            return;
        }
        this.short_url_decoder.on_headers_received(details);
        this.tweet_accessor.on_headers_received(details);
    }

    /*!
     *  @brief  onBeforeSendHeadersコールバック
     *  @param  details
     */
    on_before_send_headers(details) {
        if (!this.in_monitoring_request(details)) {
            return;
        }
        const command = HttpUtil.get_param(details.requestHeaders,
                                           "TwitterFilterCommand");
        if (command == BGShortUrlDecoder.command()) {
            this.short_url_decoder.on_before_send_headers(details);
        } else
        if (command == BGTweetAccessor.command()) {
            this.tweet_accessor.on_before_send_headers(details);
        }
    }

    /*!
     *
     */
    initialize() {
        const pattern = [
            'https://amba.to/*',
            'https://amzn.to/*',
            'https://bit.ly/*',
            'https://buff.ly/*',
            'https://dlvr.it/*',
            'https://goo.gl/*',
            'https://htn.to/*', 'https://b.hatena.ne.jp/-/*',
            'https://ino.to/*',
            'https://ift.tt/*',
            'https://is.gd/*',
            'https://j.mp/*',
            'https://kisu.me/*',
            'https://lb.to/*',
            'http://nav.cx/*',
            'https://npx.me/*',
            'http://ow.ly/*',
            'https://tinyurl.com/*',
            'https://ord.yahoo.co.jp/o/realtime/*'
        ];
        //
        chrome.webRequest.onHeadersReceived.addListener(
            this.on_headers_received.bind(this),
            {urls: pattern},
            ['responseHeaders']
        );

        chrome.webRequest.onBeforeSendHeaders.addListener(
            this.on_before_send_headers.bind(this),
            {urls: pattern},
            ['requestHeaders']
        );

        chrome.runtime.onMessage.addListener(
            (request, sender, sendResponse)=> {
                if (request.command == BGShortUrlDecoder.command()) {
                    this.short_url_decoder.on_message(request);
                } else
                if (request.command == BGTweetAccessor.command()) {
                    this.tweet_accessor.on_message(request);
                } else
                if (request.command == BGTwProfileAccessor.command()) {
                    this.tw_profile_accessor.on_message(request);
                } else 
                if (request.command == "start_content") {
                    this.entry(sender.id, sender.tab.id);
                }
                return true;
            }
        );
    }
}

var gBackground = new Background();
