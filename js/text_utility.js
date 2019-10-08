/*!
 *  @brief  テキストユーティリティクラス
 */
class TextUtil {

    static new_line_code() {
        return "\r\n";
    }

    static split_by_new_line(string) {
        var result = string.split(/\r\n|\r|\n/);
        var ret = [];
        for (const word of result) {
            if (word.length > 0 &&
                word != "\r\n" &&
                word != "\r" &&
                word != "\n") {
                ret.push(word);
            }
        }
        return ret;
    }

    /*!
     *  @brief  空行削除
     *  @note   空(0文字、または空白のみ)の行を削除し、残りを連結して返す
     */
    static remove_blank_line(string) {
        const div_nl = TextUtil.split_by_new_line(string);
        var ret_string = '';
        for (const dv of div_nl) {
            if (TextUtil.remove_line_head_space(dv) != '') {
                ret_string += dv;
            }
        }
        return ret_string;
    }
    /*!
     *  @brief  行頭スペースを削除
     */
    static remove_line_head_space(string) {
        return string.replace(/^\s+/g, "");
    }
    /*!
     *  @brief  改行とスペースを削除
     */
    static remove_new_line_and_space(string) {
        return string.replace(/[\s|\r\n|\r|\n]+/g, "");
    }

    /*!
     *  @brief  改行で連結された文字列から座標でワード検索する
     *  @param  pos     文字位置
     *  @param  text    改行で連結された文字列
     */
    static search_text_connected_by_new_line(pos, text) {
        if (text.length > 0) {
            var t_len = 0;
            var split_text = TextUtil.split_by_new_line(text);
            for (const word of split_text) {
                t_len += word.length + 1; // 1はsplit前改行
                if (pos < t_len) {
                    return word;
                }
            }
        }
        return null;
    }


    /*!
     *  @brief  srcとdstの条件付き比較
     *  @param  b_perfect_match 完全一致のON/OFF
     *  @param  i_ignoreCase    iオプション(大/小文字区別なし)の有無
     *  @param  g_global        gオプション(繰り返し)の有無
     *  @param  u_unicode       uオプション(サロゲートペアを1文字として扱う)の有無
     *  @param  m_multiline     mオプション(行頭/行末判定で改行を考慮する)の有無
     *  @note   keywordとdstの比較
     */
    static compound_conditional_compare(src_org, dst,
                                        b_perfect_match,
                                        i_ignoreCase, g_global, u_unicode, m_multiline) {
        var b_regexp = false;
        var src = src_org;
        if (src_org.length > 2) {
            if (src_org.substr(0, 2) == "<>") {
                b_regexp = true;
                src = src_org.slice(2);
            }
        }
        if (b_regexp) {
            // 正規表現
            return TextUtil.regexp(src, dst,
                                   i_ignoreCase,
                                   g_global,
                                   u_unicode,
                                   m_multiline);
        } else {
            if (b_perfect_match) {
                // 完全一致
                if (i_ignoreCase) {
                    return src.toLowerCase() == dst.toLowerCase();
                } else {
                    return src == dst;
                }
            } else {
                // 部分一致
                if (i_ignoreCase) {
                    return dst.toLowerCase().indexOf(src.toLowerCase()) >= 0;
                } else {
                    return dst.indexOf(src) >= 0;
                }
            }
        }
    }

    /*!
     *  @brief  srcがdstに含まれているか調べる(部分一致)
     *  @param  i_ignoreCase    iオプション(大/小文字区別なし)の有無
     *  @param  g_global        gオプション(繰り返し)の有無
     *  @param  u_unicode       uオプション(サロゲートペアを1文字として扱う)の有無
     *  @param  m_multiline     mオプション(行頭/行末判定で改行を考慮する)の有無
     *  @note   srcの頭2文字が<>だったら正規表現として扱う
     */
    static regexp_indexOf(src, dst, i_ignoreCase, g_global, u_unicode, m_multiline) {
        if (src.length > 2) {
            if (src.substr(0, 2) == "<>") {            
                return TextUtil.regexp(src.slice(2), dst,
                                       i_ignoreCase,
                                       g_global,
                                       u_unicode,
                                       m_multiline);
            }
        }
        return dst.indexOf(src) >= 0;
    }

    /*!
     *  @brief  srcとdstの部分一致を調べる
     *  @param  src             キー文字列(正規表現)
     *  @param  dst             調べる文字列
     *  @param  i_ignoreCase    iオプション(大/小文字区別なし)の有無
     *  @param  g_global        gオプション(繰り返し)の有無
     *  @param  u_unicode       uオプション(サロゲートペアを1文字として扱う)の有無
     *  @param  m_multiline     mオプション(行頭/行末判定で改行を考慮する)の有無
     */
    static regexp(src, dst, i_ignoreCase, g_global, u_unicode, m_multiline) {
        var flag = (i_ignoreCase) ?'i' :'';
            flag = (g_global) ?flag+'g' :flag;
            flag = (u_unicode) ?flag + 'u' :flag;
            flag = (m_multiline) ?flag + 'm' :flag;
        var ret = dst.search(RegExp(src, flag));
        return ret >= 0;
    }
}
