/*!
 *  @brief  HTTPユーティリティクラス
 */
class HttpUtil {
    /*!
     *  @brief  responseHeadersからlocationを得る
     *  @param  responseHeaders HTTP応答ヘッダ
     */
    static get_location(responseHeaders) {
        for (const header of responseHeaders) {
            if (header.name == 'Location' ||
                header.name == 'location' ||
                header.name == 'x-redirect-to' ||
                header.name == 'X-Redirect-To') {
                return header.value;
            }
        }
        return '';
    }

    /*!
     *  @brief  request/responseHeadersから任意のパラメータを得る
     *  @param  headers HTTP要求/応答ヘッダ
     */
    static get_param(headers, param_name) {
        for (const header of headers) {
            if (header.name == param_name) {
                return header.value;
            }
        }
        return ''; // error:param_nameを持ってない
    }
}
