/*!
 *  @brief  短縮URL展開クラス
 */
class ShortUrlDecoder {

    constructor() {
        this.short_url_map = [];
    }

    /*!
     *  @brief  展開済み短縮URLフィルタ
     *  @param  short_urls  短縮URL群(urlWrapper)
     *  @param  filer_func  フィルタ関数
     *  @retval true    除外対象を含んでいる
     */
    filter(short_urls, filter_func) {
        for (const loc of short_urls) {
            if (loc.url in this.short_url_map) {
                const obj = this.short_url_map[loc.url];
                if (obj.url != null && filter_func(obj.url)) {
                    return true;
                }
            }
        }
        return false;
    }

    /*!
     *  @brief  短縮URL登録
     *  @param  short_urls  短縮URL群(urlWrapper)
     *  @param  id          識別情報
     */
    entry(short_urls, id) {
        for (const loc of short_urls) {
            if (loc.url in this.short_url_map) {
                // 登録済みで未展開ならidのみ追加
                const obj = this.short_url_map[loc.url];
                if (obj.url != null) {
                    const r = obj.id.find(itm=> itm == id)
                    if (r == null) {
                        obj.id.push(id);
                    }
                }
            } else {
                // 新規登録
                var obj = {};
                obj.id = [];
                obj.id[id] = null;
                obj.short_url = loc.url;
                obj.busy = false;
                this.short_url_map[loc.url] = obj;
            }
        }
    }

    /*!
     *  @brief  短縮URL展開
     *  @note   未展開かつ未処理の短縮URLがあれば展開処理開始
     */
    decode() {
        for (const key in this.short_url_map) {
            const obj = this.short_url_map[key];
            if (!obj.busy && obj.url == null) {
                obj.busy = true;
                // content_script内で他domainへアクセスするとCORBされるためbgへ移譲
                chrome.runtime.sendMessage(
                    {command:"decode_short_url", short_url: key});
            }
        }
    }

    /*!
     *  @brief  短縮URL展開完了通知
     *  @param  short_url   展開元短縮URL
     *  @param  url         展開後URL
     *  @param  loc         現在location
     *  @param  filter_func フィルタ関数
     */
    tell_decoded(short_url, url, loc, filter_func) {
        if (short_url in this.short_url_map) {
            var obj = this.short_url_map[short_url];
            obj.url = url;
            obj.busy = false;
            filter_func(loc, obj);
        }
    }
}
