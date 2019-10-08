/*!
 *  @brief  urlWrapper
 *  @note   urlを扱いやすくしたもの
 */
class urlWrapper {

    constructor(url) {
        this.url = url;
        this.domain = '';
        this.subdir = [];
        //
        const href_div = this.div_href();
        if (href_div.length > 0) {
            this.domain = href_div[0];
        }
        if (href_div.length > 1) {
            for (var i = 1; i < href_div.length; i++) {
                this.subdir.push(href_div[i]);
            }
        }
    }

    div_href() {
        const header = this.get_header();
        if (header == '') {
            return [];
        } else {
            var ret = [];
            for (const div of this.url.substr(header.length).split('/')) {
                if (div.replace(/\s+/g, '') != '') {
                    ret.push(div);
                }
            }
            return ret;
        }
    }

    get_header() {
        const href_header = [
            'http://',
            'https://'
        ];
        for (const header of href_header) {
            if (this.url.substr(0, header.length) == header) {
                return header;
            }
        }
        return '';
    }

    in_twitter() {
        return this.domain.indexOf("twitter.com") >= 0;
    }
    in_twitter_user_page() {
        if (!this.in_twitter()|| this.in_twitter_search()) {
            return false;
        }
        if (this.subdir.length == 1) {
            return !this.is_illegal_tw_username(this.subdir[0]);
        } else if (this.subdir.length > 1) {
            return !this.is_illegal_tw_username(this.subdir[0]) &&
               (this.subdir[1] == '' || this.subdir[1] == 'media');
        } else {
            return false;
        }
    }
    in_twitter_tw_thread() {
        if (!this.in_twitter()|| this.in_twitter_search()) {
            return false;
        }
        if (this.subdir.length != 3) {
            return false;
        }
        if (this.is_illegal_tw_username(this.subdir[0])) {
            return false;
        }
        return this.subdir[1] == 'status';
    }
    in_twitter_search() {
        return this.in_twitter() &&
               this.subdir.length > 0 &&
               this.subdir[0].search((RegExp("^search\?", ""))) >= 0;
    }


    is_illegal_tw_username(username) {
        return username == 'i'; // momentで使用
    }


    in_yahoo_realtime_search() {
        return this.domain == 'search.yahoo.co.jp';
    }
    in_yahoo_realtime_search_top() {
        return this.in_yahoo_realtime_search() &&
               this.subdir.lenght == 1 &&
               this.subdir[0] == "realtime";
    }
    in_yahoo_realtime_search_result() {
        return this.in_yahoo_realtime_search() &&
               this.subdir.length > 1 &&
               this.subdir[0] == "realtime" &&
               this.subdir[1].indexOf("search") >= 0;
    }

    is_short_url_domain() {
        // note
        // "対象domainを連想配列で持ちinで判定する方法"は2～5倍ほど遅かった
        return this.domain == 'amba.to' ||
               this.domain == 'amzn.to' ||
               this.domain == 'bit.ly'  ||
               this.domain == 'buff.ly' ||
               this.domain == 'dlvr.it' ||
               this.domain == 'goo.gl'  ||
               this.domain == 'htn.to'  ||
               this.domain == 'ino.to'  ||
               this.domain == 'ift.tt'  ||
               this.domain == 'is.gd'   ||
               this.domain == 'j.mp'    ||
               this.domain == 'kisu.me' ||
               this.domain == 'lb.to'   ||
               this.domain == 'nav.cx'  ||
               this.domain == 'npx.me'  ||
               this.domain == 'ow.ly'   ||
               this.domain == "tinyurl.com";
    }
    is_short_url() {
        if (this.subdir.length != 1 &&
            this.subdir.length != 2) {
            // 短縮URLの形式は下記のいずれか
            // hoge.com/fuge
            // hoge.com/piyo/fuge 
            return false;
        }
        return this.is_short_url_domain();
    }
    /*!
     *  @brief  htn.toリダイレクトページか
     *  @note   htn.toにHttpsRequestした場合
     *  @note    b.hatena.ne.jp/-/redirect?code=hoge&location_id=page&signature=puge
     *  @note   に一度飛ばされる(httpではクッションなし)
     */
    is_hatena_redirection() {
        if (this.domain != "b.hatena.ne.jp") {
            return false;
        }
        if (this.subdir.length != 2) {
            return false;
        }
        return this.subdir[0] == '-' &&
               this.subdir[1].indexOf('redirect?code=') >= 0 &&
               this.subdir[1].indexOf('&location_id=') >= 0 &&
               this.subdir[1].indexOf('&signature=') >= 0;
    }

    /*!
     *  @brief  短縮URLを正規化
     *  @note   不要なパラメータを除去する
     */
    normalize_short_url() {
        const last_sub = this.subdir.length - 1;
        const nsub
            = this.subdir[last_sub].split(/\?|\&|\=/)[0].replace(/\s+/g, '');
        this.subdir[last_sub] = nsub;
        //
        var domsub = this.domain;
        for (const sub of this.subdir) {
            domsub += '/' + sub;
        }
        //
        if (this.domain == 'nav.cx' ||
            this.domain == 'ow.ly') {
            // 安全性に問題がありhttps不可の(ブラウザに弾かれる)ドメインもある
            this.url = 'http://' + domsub;
        } else {
            // 基本的にはhttpsで統一
            this.url = 'https://' + domsub;
        }
    }

    /*!
     *  @brief  URL群から短縮URLを選別する
     *  @param[out] dst 格納先
     *  @param[in]  src URL群(urlWrapper)
     *  @note   選別時に正規化も行う
     */
    static select_short_url(dst, src) {
        for (const loc of src) {
            if (loc.is_short_url()) {
                loc.normalize_short_url();
                dst.push(loc);
            }
        }
    }
}
