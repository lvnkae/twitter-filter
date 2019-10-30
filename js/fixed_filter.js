/*!
 *  @brief  固定フィルタ
 */
class fixedFilter {

    /*!
     *  @brief  フィルタ関数(全部入り)
     *  @param  userid      ツイートユーザID
     *  @param  rep_userids リプライユーザID群
     *  @oaran  tweet       ツイート
     *  @retval true        ミュート対象だ
     */
    filter(userid, rep_userids, tweet) {
        if (userid in this.annoying_site_userid) {
            return true;
        }
        const rep_len = rep_userids.length;
        for (let inx = 0; inx < rep_len; inx++) {
            if (rep_userids[inx] in this.annoying_site_userid) {
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
     *  @param  userid      ツイートユーザID
     *  @retval true        ミュート対象だ
     */
    filter_userid(userid) {
        return userid in this.annoying_site_userid;
    }

    constructor() {
        // note
        // 完全一致なら配列全探査より連想配列の方が速い
        this.annoying_site_userid = {
            //
            '210303117': 0,             // @2chmm           2chmm.com
            '279850278': 0,             // @2chnavi10       2chnavi.net
            '1276765963': 0,            // @2chsokuho       [*.]
            '44855541': 0,              // @2mm_news        2ch-m.info
            '914365119601283072': 0,    // @5chmm           5chmm.jp
            '964346450523045888': 0,    // @antennamatome01 antenna-matome.net
            '2977633724': 0,            // @higemarkantenna higemark.atna.jp
            '2996560764': 0,            // @ImageNewsNet    imagenews.net
            '1119854577702932481': 0,   // @ImageNewsNet2
            '1731475724': 0,            // @nichmatome      [*.]
            '870896270587551744': 0,    // @rsstweet2       [*.]
            '1111990024453545984': 0,   // @vipmatomeMAP    vip.5chmap.com
            //
            '1107260433558233093': 0,   // @vG2AZlCr4F3hx6Y anonymous-post.mobi
            '75827044': 0,              // @alfalfafafa     alfalfalfa.com
            '959778923209924608': 0,    // @alfalfaGeinow
            '959789786570477568': 0,    // @alfalfaNews
            '959797041449742336': 0,    // @alfalfaPopular
            '959792583068172288': 0,    // @alfalfaSeikei
            '959795861755650049': 0,    // @alfalfaSubcul
            '85291785': 0,              // @htmk73          blog.esuteru.com
            '771252503006420992': 0,    // @htmkch
            '576944891': 0,             // @BluejayPC       blog.livedoor.jp/bluejay01-review
            '100503925': 0,             // @ajyajya                         /chihhylove
            '20009427': 0,              // @goldentimes                     /goldennews
            '2380233386': 0,            // @it_sokuhou                      /itsoku
            '453830599': 0,             // @News_VIP_Blog                   /insidears
            '206100941': 0,             // @kinisoku                        /kinisoku
            '9420872': 0,               // @news23vip                       /news23vip
            '234658632': 0,             // @nwknews                         /nwknews
            '180390918': 0,             // @galasoku        galapgs.com
            '354135607': 0,             // @GensenKankoku   gensen2ch.com
            '44502620': 0,              // @hamusoku        hamusoku.com
            '112691080': 0,             // @himasoku123     himasoku.com
            '563646483': 0,             // @hoshusokuhou    hosyusokuhou.jp
            '405941688': 0,             // @2chmeijin       i2chmeijin.blog.fc2.com
            '22273191': 0,              // @Jin115          jin115.com
            '954697496244109317': 0,    // @Jin115_2nd
            '2994398670': 0,            // @oreteki_douga
            '229826452': 0,             // @kabumatome      kabumatome.doorblog.jp
            '865011104329588738': 0,    // @katasumisokuhou katasumisokuhou.blog.jp
            '2841762558': 0,            // @kijomatomelog   kijomatomelog.com
            '420278501': 0,             // @kijyosoku       kijosoku.com
            '3246604891': 0,            // @matomame3       matomame.jp
            '894993723871842304': 0,    // @matomedane      matomedane.jp
            '2373510307': 0,            // @michaelsan0285  michaelsan.livedoor.biz
            '65096162': 0,              // @news4vip2       news4vip.livedoor.biz
            '310867113': 0,             // @oryourisokuho   oryouri.2chblog.jp
            '2276883054': 0,            // @tsuisoku        tsuisoku.com
            '3224644271': 0,            // @2chmatome9bin   vic-coi.matome.cs81.link
            '3279293856': 0,            // @vippersjp       vippers.jp
            '291697042': 0,             // @warakan2ch      wara2ch.com
            '1051044682325680128': 0,   // @yaraon_kanrinin yaraon-blog.com
            //
            '1866469460': 0,            // @breakingnews_jp breaking-news.jp
            '703171604105154560': 0,    // @AnatagaB        entert.jyuusya-yoshiko.com
            '730262208005857281': 0,    // @homoeopathysait homoeopathy-saitama.com
            '739765676319997953': 0,    // @impressionsnote impressionsnote.com
            '769371570712129536': 0,    // @gotty131        stoicclub131.com
            //
            '2282134542': 0,            // @all_nations2    all-nationz.com
            '318460079': 0,             // @drazuli         blog.livedoor.jp/drazuli
            '982585806': 0,             // @kaikaihanno                     /kaikaihanno
            '3479893512': 0,            // @caramel_buzz    caramelbuzz.com
            '1052699911': 0,            // @netalia_news
            '198796772': 0,             // @chouyakuc       chouyakuc.blog134.fc2.com
            '2295136212': 0,            // @osyoube         dng65.com
            '831653567647801344': 0,    // @kaigaicolle     kaikore.blogspot.com
            '811751621461876736': 0,    // @OoAz8SE9bT2yoTf
            '1401335041': 0,            // @mizukikenkan    oboega-01.blog.jp
            '587419701': 0,             // @surarudo        sow.blog.jp
            //
            '1820632082': 0,            // @appmedia_jp     appmedia.jp
            '759971245773291521': 0,    // @appmedia_news
            '1057806179034746880': 0,   // @AppMedia_altern
            '1040464249271738368': 0,   // @appmedia_ao
            '1052387335470366720': 0,   // @appmedia_baku
            '802094861356703745': 0,    // @appmedia_bandre
            '979942584276496386': 0,    // @appmedia_DBLE
            '1022349031685509120': 0,   // @appmedia_DFront
            '778438606025220096': 0,    // @appmedia_dffoo
            '1107890952738242560': 0,   // @appmedia_Drpg
            '938269846978154497': 0,    // @AppMedia_DTB
            '2309695190': 0,            // @appmedia_duel
            '1135854628568911872': 0,   // @appmedia_dqwalk
            '826401627292590080': 0,    // @appmedia_feh
            '827867204846706689': 0,    // @appmedia_fgo
            '4025528353': 0,            // @appmediafgo
            '873133821826224128': 0,    // @appmedia_FL
            '1130368157875523584': 0,   // @appmedia_gracro
            '887887509866160129': 0,    // @appmedia_grasma
            '1070865067212599296': 0,   // @appmediaguren
            '907799541059010560': 0,    // @Appmedia_joker
            '878135735861116928': 0,    // @appmedia_kamura
            '930389867598528520': 0,    // @appmedia_kirara
            '851292997274685443': 0,    // @appmedia_mgrc
            '1169452552242393088': 0,   // @appmedia_mkt
            '1141340082': 0,            // @AppMedia_pad
            '923054717629972480': 0,    // @appmedia_pkmori
            '753517507630080001': 0,    // @appmedia_pokego
            '966166388279713792': 0,    // @appmedia_pricon
            '892606203120844801': 0,    // @AppmediaRevolve
            '1056372494511173632': 0,   // @appmedia_starRe
            '1139031854718246912': 0,   // @appmedia_syugo
            '1054189149790494720': 0,   // @AppMedia_tocon
            '1136124960647159808': 0,   // @app_babel
            '4816770115': 0,            // @appgrimms
            '778438849970044928': 0,    // @app_pawasaka
            '1153880210032357376': 0,   // @app_pokemas
            '1087201742469517312': 0,   // @app_shinomas
            '2733312658': 0,            // @appsiro
            '759713152120479746': 0,    // @app_shirotennis
            '869771221675630593': 0,    // @app_theaterdays
            '1136469887348461568': 0,   // @AC_appmedia
            '928971557707268096': 0,    // @am_azurlane
            '1126820640143450112': 0,   // @AM_lineagem
            '1034652054805835777': 0,   // @dragali_app
            '1166933081309138944': 0,   // @magicami_app
            '2287803792': 0,            // @monnsoku
            '909975812824109056': 0,    // @pani_appmedia
            '1011886734227881984': 0,   // @pkke_AppMedia
            '1173772291987034112': 0,   // @pokemon_appm
            '816216907246288896': 0,    // @umamusuAppMedia
            '2816142019': 0,            // @AltemaGame          altema.jp
            '232782257': 0,             // @game8jp             game8.jp
            '2452743973': 0,            // @gamy_jp             gamy.jp
            '1906814766': 0,            // @GameWith_inc        gamewith.jp
            '1014099455820193792': 0,   // @gamewith_app
            '3444137113': 0,            // @gamewith_review
            '904571991893598212': 0,    // @gamewith_bw
            '1111516980928876544': 0,   // @gawewith_cd
            '2514531438': 0,            // @gamewith_chainC
            '979543369004154881': 0,    // @GameWith_CaraSt
            '712833506963955715': 0,    // @gamewith_digimo
            '736111414025158657': 0,    // @gamewith_dp
            '2646973152': 0,            // @gamewith_dqmsl
            '822269560673824768': 0,    // @Gamewith_FEH
            '4020416425': 0,            // @gamewith_ffbe
            '3088218594': 0,            // @gamewith_ffrk
            '979537569242169344': 0,    // @GameWith_fn
            '1135414043341025280': 0,   // @gamewith_GrandX
            '921274460501504005': 0,    // @gamewith_grsm
            '832056577888641024': 0,    // @gamewith_hk3rd
            '3240382772': 0,            // @gamewith_horsag
            '2540940462': 0,            // @gamewith_jojoss
            '892208916817297408': 0,    // @gamewith_kmtr
            '968074164903931905': 0,    // @gamewith_ko
            '3097265119': 0,            // @gamewith_ma
            '1057555166688272384': 0,   // @gamewith_megido
            '3344079079': 0,            // @gamewith_mobius
            '2479212218': 0,            // @gamewith_monst
            '4914947083': 0,            // @gamewith_mt
            '2501119320': 0,            // @gamewith_onepi
            '950656546224070656': 0,    // @gamewith_os
            '2590638140': 0,            // @gamewith_pad
            '752346815161184257': 0,    // @gamewith_pkgo
            '719823855406030848': 0,    // @gamewith_pkkm
            '1013627986359115776': 0,   // @gamewith_pkque
            '996277833394569217': 0,    // @GameWith_pubg
            '4365713773': 0,            // @gamewith_puni
            '3025181510': 0,            // @gamewith_pwpr
            '790441243100651520': 0,    // @gamewith_pwsk
            '742222605915062272': 0,    // @gamewith_sk
            '887479935991808000': 0,    // @gamewith_sm
            '711788704780591106': 0,    // @gamewith_sv
            '788221554861584384': 0,    // @GW_pokemonswsh
            '2728850766': 0,            // @gamewith_wcat
            '2570363586': 0,            // @gamewith_wiz
            '773731856642666496': 0,    // @gamewith_yugioh
            '1024974352171692032': 0,   // @GW_CrashFever
            '1145647976825536512': 0,   // @GWMahouDoumei
            '3093186756': 0,            // @GW_Phankill
            '1166931286474125313': 0,   // @gw_pokemas
            '1006360336096583680': 0,   // @GW_summons
            '1052732327271354369': 0,   // @GW_VENDETTA
            '1091292841244909569': 0,   // @BlackdesertM_GW
            '1027026116937015297': 0,   // @dfl_gw
            '872690796478083072': 0,    // @DQrivals_GW
            '887566608012529666': 0,    // @FGO_GW
            '933254138145554438': 0,    // @fightleague_gw
            '1097764578748882944': 0,   // @FLO_gamewith
            '765113040345833473': 0,    // @Granblue_GW
            '1087590985876398081': 0,   // @ICARUSM_GW
            '1164000963771817984': 0,   // @Kidotoshix_GW
            '1118328310520401922': 0,   // @langrisser_gw
            '2971354934': 0,            // @logres_gamewith
            '966598806430130176': 0,    // @pricone_GW
            '1070895466210947072': 0,   // @romars_GW
            '877438278013562880': 0,    // @SymphogearXD_GW
            '1151007827801993216': 0,   // @terrawars_gw
            '1054549354986463232': 0,   // @tocon_gamewith
            '1019866094012526592': 0,   // @dappswith
            '979283758716092416': 0,    // @Mipple_movie
            //
            '463444372': 0,             // @Buzzap_JP           buzzap.jp
            '905414939552112640': 0,    // @buzzap_mobile
            '1013715355955486720': 0,   // @Buzzap_Social
            '2380201350': 0,            // @buzzplus_news       buzz-plus.com
            '2237053939': 0,            // @buzznewsjapan       buzznews.jp
            '2835395191': 0,            // @55gogotsu           gogotsu.com
            '2835412794': 0,            // @japan_indepth       japan-indepth.jp
            '2497555580': 0,            // @litera_web          lite-ra.com
            '1333916737': 0,            // @mery_news           mery.jp
            '1146291502869618690': 0,   // @netgeek_media       netgeek.biz
            '3120029737': 0,            // @netgeek8
            '1448401272': 0,            // @netgeekAnimal
            '354550035': 0,             // @netgeekBusiness
            '1677854496': 0,            // @netgeekGeinou
            '1936446986': 0,            // @netgeekGIF
            '1526805780': 0,            // @netgeekGourmet
            '1475216582': 0,            // @netgeekLiam
            '455413659': 0,             // @netgeekLily
            '490401003': 0,             // @netgeekOogiri
            '1664428124': 0,            // @netgeekPolitics
            '1479247273': 0,            // @netgeekIT2
            '123244725': 0,             // @merumonews          news.merumo.ne.jp
            '245702130': 0,             // @skincare_univ       skincare-univ.com
            '4916851874': 0,            // @sharenewsjapan      snjpn.net
            '1161186227279654912': 0,   // @sharenewsjapan1
            '169721558': 0,             // @mynavi_woman        woman.mynavi.jp
            '15391706': 0,              // @byokan              yukawanet.com
            '869709246438363136': 0,    // @yukawakira
        };

        this.annoying_site_domain = [
            '2ch-m.info',
            '2chmm.com',
            '5chmm.jp',
            'antenna-matome.net',
            //
            '3ten5jigen.officialblog.jp',
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
            'gensen2ch.com',
            'hamusoku.com',
            'himasoku.com',
            'hosyusokuhou.jp',
            'i2chmeijin.blog.fc2.com',
            'jin115.com',
            'kabumatome.doorblog.jp',
            'katasumisokuhou.blog.jp',
            'kawaiisokuhou.com',
            'kijosoku.com',
            'kijomatomelog.com',
            'machipatome.publog.jp',
            'matomame.jp',
            'matomedane.jp',
            'michaelsan.livedoor.biz',
            'news4vip.livedoor.biz',
            'oryouri.2chblog.jp',
            'tsuisoku.com',
            'vippers.jp',
            'wara2ch.com',
            'yaraon-blog.com',
            //
            'aiulog.com',
            'breaking-news.jp',
            'entert.jyuusya-yoshiko.com',
            'homoeopathy-saitama.com',
            'impressionsnote.com',
            'stoicclub131.com',
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
    }
}
