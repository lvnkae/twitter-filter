/*!
 *  @brief  固定フィルタ
 */
class fixedFilter {

    /*!
     *  @brief  フィルタ関数(全部入り)
     *  @param  username        ツイートユーザ名
     *  @param  rep_usernames   リプライユーザ名群
     *  @oaran  tweet           ツイート
     *  @retval true            ミュート対象だ
     */
    filter(username, rep_usernames, tweet) {
        if (username in this.annoying_site_username) {
            return true;
        }
        const rep_len = rep_usernames.length;
        for (let inx = 0; inx < rep_len; inx++) {
            if (rep_usernames[inx] in this.annoying_site_username) {
                return true;
            }
        }
        const asd_len = this.annoying_site_domain.length;
        for (let inx = 0; inx < asd_len; inx++) {
            if  (tweet.indexOf(this.annoying_site_domain[inx]) >= 0) {
                return true;
            }
        }
        return false;
    }

    /*!
     *  @brief  フィルタ関数
     *  @param  username    ツイートユーザ名
     *  @retval true        ミュート対象だ
     */
    filter_username(username) {
        return username in this.annoying_site_username;
    }

    constructor() {
        // note
        // 完全一致なら配列全探査より連想配列の方が速い
        this.annoying_site_username = {
            //
            '2chmm': 0,             // 2chmm.com
            '2chnavi10': 0,
            '2chsokuho': 0,
            '2mm_news': 0,          // 2ch-m.info
            '5chmm': 0,             // 5chmm.jp
            'higemarkantenna': 0,   // higemark.atna.jp
            'ImageNewsNet': 0,
            'nichmatome': 0,
            'rsstweet2': 0,
            'vipmatomeMAP': 0,
            //
            'vG2AZlCr4F3hx6Y': 0,   // anonymous-post.mobi
            'alfalfafafa ': 0,      // alfalfalfa.com
            'alfalfaGeinow': 0,     //
            'alfalfaNews': 0,       //
            'alfalfaPopular': 0,    //
            'alfalfaSeikei': 0,     //
            'alfalfaSubcul': 0,     //
            'htmk73': 0,            // blog.esuteru.com
            'htmkch': 0,            //
            'BluejayPC': 0,         // blog.livedoor.jp/bluejay01-review
            'ajyajya': 0,           //                 /chihhylove
            'goldentimes': 0,       //                 /goldennews
            'itsoku1': 0,           //                 /itsoku
            'News_VIP_Blog': 0,     //                 /insidears
            'kinisoku': 0,          //                 /kinisoku
            'news23vip': 0,         //                 /news23vip
            'nwknews': 0,           //                 /nwknews
            'galasoku': 0,          // galapgs.com
            'hamusoku': 0,          // hamusoku.com
            'himasoku123': 0,       // himasoku.com
            'hoshusokuhou': 0,      // hosyusokuhou.jp
            '2chmeijin': 0,         // i2chmeijin.blog.fc2.com
            'Jin115': 0,            // jin115.com
            'Jin115_2nd': 0,        //
            'oreteki_douga': 0,     //
            'kabumatome': 0,        // kabumatome.doorblog.jp
            'katasumisokuhou': 0,   // katasumisokuhou.blog.jp
            'kijyosoku': 0,         // kijosoku.com
            'matomame3': 0,         // matomame.jp
            'matomedane': 0,        // matomedane.jp
            'michaelsan0285': 0,    // michaelsan.livedoor.biz
            'news4vip2': 0,         // news4vip.livedoor.biz
            'oryourisokuho': 0,     // oryouri.2chblog.jp
            'tsuisoku': 0,          // 
            'yaraon_kanrinin ?': 0,  // yaraon-blog.com
            //                      
            'breakingnews_jp': 0,   // breaking-news.jp
            'yosiko_geino_bot': 0,  // entert.jyuusya-yoshiko.com
            'impressionsnote': 0,   // impressionsnote.com
            //
            'all_nations2': 0,      // all-nationz.com
            'drazuli': 0,           // blog.livedoor.jp/drazuli
            'kaikaihanno': 0,       //                 /kaikaihanno
            'caramel_buzz': 0,      // caramelbuzz.com
            'netalia_news': 0,      //
            'chouyakuc': 0,         // chouyakuc.blog134.fc2.com
            'osyoube': 0,           // dng65.com
            'kaigaicolle': 0,       // kaikore.blogspot.com
            'OoAz8SE9bT2yoTf': 0,
            'mizukikenkan': 0,      // oboega-01.blog.jp
            'surarudo': 0,          // sow.blog.jp
            //
            'appmedia_news':0,      // appmedia.jp
            'AppMedia_altern':0,
            'appmedia_baku':0,
            'appmedia_bandre':0,
            'appmedia_DBLE':0,
            'appmedia_DFront':0,
            'appmedia_Drpg':0,
            'AppMedia_DTB':0,
            'appmedia_duel':0,
            'appmedia_dqwalk':0,
            'appmedia_feh':0,
            'appmedia_fgo':0,
            'appmediafgo':0,
            'appmedia_FL':0,
            'appmedia_gracro':0,
            'appmedia_grasma':0,
            'appmediaguren':0,
            'Appmedia_joker':0,
            'appmedia_kamura':0,
            'appmedia_kirara':0,
            'appmedia_mgrc':0,
            'appmedia_mkt':0,
            'AppMedia_pad':0,
            'appmedia_pkmori':0,
            'appmedia_pokego':0,
            'appmedia_pricon':0,
            'AppmediaRevolve':0,
            'appmedia_starRe':0,
            'appmedia_syugo':0,
            'AppMedia_tocon':0,
            'app_babel':0,
            'app_theaterdays':0,
            'app_pawasaka':0,
            'app_pokemas':0,
            'app_shinomas':0,
            'appsiro':0,
            'app_shirotennis':0,
            'am_azurlane':0,
            'AM_lineagem':0,
            'dragali_app':0,
            'magicami_app':0,
            'monnsoku':0,
            'pani_appmedia':0,
            'pkke_AppMedia':0,
            'umamusuAppMedia':0,
            'AltemaGame':0,         // altema.jp
            'game8jp':0,            // game8.jp
            'gamy_jp':0,            // gamy.jp
            'GameWith_inc':0,       // gamewith.jp
            'gamewith_app':0,
            'gamewith_review':0,
            'gamewith_bw':0,
            'gawewith_cd':0,
            'gamewith_chainC':0,
            'GameWith_CaraSt':0,
            'gamewith_digimo':0,
            'gamewith_dp':0,
            'gamewith_dqmsl' :0,
            'Gamewith_FEH':0,
            'gamewith_ffbe':0,
            'gamewith_ffrk':0,
            'GameWith_fn':0,
            'gamewith_GrandX':0,
            'gamewith_grsm':0,
            'gamewith_hk3rd':0,
            'gamewith_horsag':0,
            'gamewith_jojoss':0,
            'gamewith_kmtr':0,
            'gamewith_ko':0,
            'gamewith_ma':0,
            'gamewith_megido':0,
            'gamewith_mobius':0,
            'gamewith_monst':0,
            'gamewith_mt':0,
            'gamewith_onepi':0,
            'gamewith_os':0,
            'gamewith_pad':0,
            'gamewith_pkgo':0,
            'gamewith_pkkm':0,
            'gamewith_pkque':0,
            'GameWith_pubg':0,
            'gamewith_puni':0,
            'gamewith_pwpr':0,
            'gamewith_pwsk':0,
            'gamewith_sk':0,
            'gamewith_sm':0,
            'gamewith_sv':0,
            'Gamewith_pkusum':0,
            'gamewith_wcat':0,
            'gamewith_wiz':0,
            'gamewith_yugioh':0,
            'GW_CrashFever':0,
            'GWMahouDoumei':0,
            'GW_Phankill':0,
            'gw_pokemas':0,
            'GW_summons':0,
            'GW_VENDETTA':0,
            'BlackdesertM_GW':0,
            'dfl_gw':0,
            'DQrivals_GW':0,
            'FGO_GW':0,
            'fightleague_gw':0,
            'FLO_gamewith':0,
            'Granblue_GW':0,
            'ICARUSM_GW':0,
            'Kidotoshix_GW':0,
            'langrisser_gw':0,
            'logres_gamewith':0,
            'pricone_GW':0,
            'romars_GW':0,
            'SymphogearXD_GW':0,
            'terrawars_gw':0,
            'tocon_gamewith':0,
            'dappswith':0,
            'Mipple_movie':0,
            //
            'Buzzap_JP':0,          // buzzap.jp
            'buzzap_mobile':0,
            'Buzzap_Social':0,
            'buzzplus_news':0,      // buzz-plus.com
            'buzznewsjapan':0,      // buzznews.jp
            '55gogotsu':0,          // gogotsu.com
            'japan_indepth':0,      // japan-indepth.jp
            'litera_web':0,         // lite-ra.com
            'mery_news':0,          // mery.jp
            'netgeek_media':0,      // netgeek.biz
            'netgeek8':0,
            'netgeekAnimal':0,
            'netgeekBusiness':0,
            'netgeekGeinou':0,
            'netgeekGIF':0,
            'netgeekGourmet':0,
            'netgeekLiam':0,
            'netgeekLily':0,
            'netgeekOogiri':0,
            'netgeekPolitics':0,
            'netgeekIT2':0,
            'merumonews':0,         // news.merumo.ne.jp
            'skincare_univ':0,      // skincare-univ.com
            'sharenewsjapan':0,     // snjpn.net
            'sharenewsjapan1':0,
            'mynavi_woman':0,       // woman.mynavi.jp
            'byokan':0,             // yukawanet.com
            'yukawakira':0,
        };

        this.annoying_site_domain = [
            '2ch-m.info',
            '2chmm.com',
            '3ten5jigen.officialblog.jp',
            '5chmm.jp',
            'alfalfalfa.com',
            'anonymous-post.mobi',
            'bimatome.weblog.to',
            'blog.esuteru.com',
            'blog.m.livedoor.jp/hatima/', // ※↑へ転送される
            '/bluejay01-review/',
            '/chihhylove/',
            '/dqnplus/',
            '/goldennews/',
            '/insidears/',
            '/itsoku/',
            '/kinisoku/',
            '/news23vip/',
            '/nwknews/',
            'galapgs.com',
            'hamusoku.com',
            'himasoku.com',
            'hosyusokuhou.jp',
            'i2chmeijin.blog.fc2.com',
            'jin115.com',
            'kabumatome.doorblog.jp',
            'katasumisokuhou.blog.jp',
            'kawaiisokuhou.com',
            'kijosoku.com',
            'machipatome.publog.jp',
            'matomame.jp',
            'matomedane.jp',
            'michaelsan.livedoor.biz',
            'news4vip.livedoor.biz',
            'oryouri.2chblog.jp',
            'tsuisoku.com',
            'yaraon-blog.com',
            //
            'aiulog.com',
            'breaking-news.jp',
            'entert.jyuusya-yoshiko.com',
            'impressionsnote.com',
            //
            'all-nationz.com',
            '/drazuli/',
            '/kaikaihanno/',
            'caramelbuzz.com',
            'chinesestyle.seesaa.net',
            'chouyakuc.blog134.fc2.com ',
            'dng65.com',
            'kaigainohannoublog.blog55.fc2.com',
            'kaikore.blogspot.com',
            'oboega-01.blog.jp',
            'sow.blog.jp',
            //
            'appmedia.jp',
            'altema.jp',
            'game8.jp',
            'gamy.jp',
            'gamewith.jp',
            //
            'buzzap.jp',
            'buzz-plus.com',
            'buzznews.jp',
            'gogotsu.com',
            'iemo.jp',
            'japan-indepth.jp',
            'lite-ra.com',
            'mens-skincare-univ.com',
            'mery.jp',
            'netgeek.biz',
            'news.merumo.ne.jp',
            'skincare-univ.com',
            'snjpn.net',
            'welq.jp',
            'woman.mynavi.jp',
            'yukawanet.com',
        ];

        var fixed_ng_url_black_titles = [];
        fixed_ng_url_black_titles['headlines.yahoo.co.jp'] = [
            'Japan In-depth'
        ];
    }
}
