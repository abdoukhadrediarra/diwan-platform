/**
 * Every word of the interface, in the four languages of the platform.
 * The poems themselves are never translated: they stay in Arabic.
 *
 * fr French · en English · ar العربية · wo Wolof written in Latin letters
 */
export const LANGUAGES = ['fr', 'en', 'ar', 'wo'] as const;
export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_NAMES: Record<Language, { label: string; short: string; rtl: boolean }> = {
  fr: { label: 'Français', short: 'FR', rtl: false },
  en: { label: 'English', short: 'EN', rtl: false },
  ar: { label: 'العربية', short: 'ع', rtl: true },
  wo: { label: 'Wolof', short: 'WO', rtl: false },
};

type Entry = Record<Language, string>;

export const TRANSLATIONS: Record<string, Entry> = {
  // ---------------------------------------------------------------- menu and footer
  'menu.cheikh': { fr: 'Le Cheikh', en: 'The Cheikh', ar: 'الشيخ', wo: 'Sëriñ bi' },
  'menu.diwans': { fr: 'Les diwans', en: 'The diwans', ar: 'الدواوين', wo: 'Diwan yi' },
  'menu.project': { fr: 'Le projet', en: 'The project', ar: 'المشروع', wo: 'Liggéy bi' },
  'menu.corpus': { fr: 'Le corpus', en: 'The corpus', ar: 'المدونة', wo: 'corpus' },
  'menu.all': { fr: 'Tous les diwans', en: 'All the diwans', ar: 'كل الدواوين', wo: 'Diwan yépp' },
  'menu.open': { fr: 'Menu', en: 'Menu', ar: 'القائمة', wo: 'Menu' },
  'menu.language': { fr: 'Langue', en: 'Language', ar: 'اللغة', wo: 'Làkk' },
  'nav.home': { fr: 'Accueil', en: 'Home', ar: 'الرئيسية', wo: 'Accueil' },
  'nav.skip': { fr: 'Aller au contenu', en: 'Skip to content', ar: 'انتقل إلى المحتوى', wo: 'Dem ci mbind mi' },
  'footer.tagline': {
    fr: 'Les sept diwans de Cheikh Ahmadou Bamba, vocalisés et consultables poème par poème.',
    en: 'The seven diwans of Cheikh Ahmadou Bamba, vocalised and readable poem by poem.',
    ar: 'دواوين الشيخ أحمد بمب السبعة، مشكولة ومتاحة قصيدة قصيدة.',
    wo: 'Juróom-ñaari diwani Sëriñ Ahmadu Bamba, ñu leen tekki te ñu mën leen a jàng benn-benn.',
  },
  'footer.sources': { fr: 'Sources', en: 'Sources', ar: 'المصادر', wo: 'Ballu waay' },
  'footer.xidma': { fr: 'Xidma', en: 'Xidma', ar: 'الخدمة', wo: 'Xidma' },

  // ---------------------------------------------------------------- home page
  'home.epithet': {
    fr: 'Khadimou Rassoul, le Serviteur du Messager',
    en: 'Khadimou Rassoul, the Servant of the Messenger',
    ar: 'خادم الرسول',
    wo: 'Xaadimu Rasuul, Liggéy katu Yonent bi',
  },
  'home.dates': { fr: 'Mbacké, 1853 – Diourbel, 1927', en: 'Mbacké, 1853 – Diourbel, 1927',
                  ar: 'مباكي ١٨٥٣ – ديوربل ١٩٢٧', wo: 'Mbàkke, 1853 – Jurbel, 1927' },
  'home.lede': {
    fr: 'Théologien, juriste et maître soufi, fondateur de la voie mouride et de la ville de Touba. Ses khassaïdes sont réunies ici dans sept diwans.',
    en: 'Theologian, jurist and Sufi master, founder of the Mouride way and of the city of Touba. His khassaïdes are gathered here in seven diwans.',
    ar: 'عالم وفقيه وشيخ صوفي، مؤسس الطريقة المريدية ومدينة طوبى. قصائده مجموعة هنا في سبعة دواوين.',
    wo: 'Boroom xam-xam, faqiih di sëriñ sufianké, ki sos yoonu Murid ak dëkku Tuubaa. Xasidaam yi ñoo nekk fi ci juróom-ñaari diwan.',
  },
  'home.discover': { fr: 'Découvrir les diwans', en: 'Discover the diwans', ar: 'اكتشف الدواوين', wo: 'Xoolal diwan yi' },
  'home.readBio': { fr: 'Lire sa biographie', en: 'Read his life', ar: 'اقرأ سيرته', wo: 'Jàng dundam' },
  'home.photoAlt': {
    fr: 'Cheikh Ahmadou Bamba debout, vêtu d’un boubou blanc',
    en: 'Cheikh Ahmadou Bamba standing, in a white robe',
    ar: 'الشيخ أحمد بمب واقفًا بثوب أبيض',
    wo: 'Sëriñ Ahmadu Bamba mu taxaw, sol mbubb mu weex',
  },
  'home.photoCaption': { fr: 'Photographie d’archive', en: 'Archive photograph', ar: 'صورة من الأرشيف', wo: 'Nataal bu yàgg' },
  'home.cheikhTitle': { fr: 'Le Cheikh', en: 'The Cheikh', ar: 'الشيخ', wo: 'Sëriñ bi' },
  'home.timeline': { fr: 'Les grandes dates', en: 'Key dates', ar: 'أهم التواريخ', wo: 'Bés yu am solo' },
  'home.projectTitle': { fr: 'Le projet', en: 'The project', ar: 'المشروع', wo: 'Liggééy bi' },
  'home.projectAim': {
    fr: 'Rassembler les diwans de Cheikh Ahmadou Bamba dans une édition numérique complète et vocalisée, lisible par tous et partout : en arabe comme en caractères latins.',
    en: 'To gather the diwans of Cheikh Ahmadou Bamba in one complete, vocalised digital edition, readable by everyone and everywhere: in Arabic and in Latin letters.',
    ar: 'جمع دواوين الشيخ أحمد بمب في نشرة رقمية كاملة مشكولة، يقرؤها الجميع في كل مكان، بالعربية وبالحروف اللاتينية.',
    wo: 'Dajale diwani Sëriñ Ahmadu Bamba ci benn téere bu dijital bu mat te takku, ku nekk mën ko jàng fu nekk: ci araab walla ci araafu latin.',
  },
  'home.offers': { fr: 'Ce que vous trouverez ici', en: 'What you will find here', ar: 'ما تجده هنا', wo: 'Lu nga fiy gis' },
  'home.corpusTitle': { fr: 'Le corpus en chiffres', en: 'The corpus in figures', ar: 'المدونة بالأرقام', wo: 'Xassidayi cib lim' },
  'home.online': { fr: 'en ligne', en: 'online', ar: 'متاحة', wo: 'ci kaw internet' },

  // ---------------------------------------------------------------- figures
  'figure.diwans': { fr: 'Diwans', en: 'Diwans', ar: 'الدواوين', wo: 'Diwan yi' },
  'figure.abyat': { fr: 'Abyat', en: 'Abyat', ar: 'الأبيات', wo: 'bayyit yi' },
  'figure.hemistichs': { fr: 'Hémistiches', en: 'Hemistichs', ar: 'الأشطر', wo: 'Xaaji-bayyit yi' },
  'figure.words': { fr: 'Mots', en: 'Words', ar: 'الكلمات', wo: 'Baat yi' },
  'figure.pages': { fr: 'Pages', en: 'Pages', ar: 'الصفحات', wo: 'Xët yi' },

  // ---------------------------------------------------------------- diwans and poems
  'diwans.title': { fr: 'Les diwans', en: 'The diwans', ar: 'الدواوين', wo: 'Diwan yi' },
  'diwans.intro': {
    fr: 'Les sept recueils de khassaïdes. Chaque poème y paraît dès qu’il a été relu et importé.',
    en: 'The seven collections of khassaïdes. Each poem appears as soon as it has been reviewed and imported.',
    ar: 'مجاميع الخصائد السبعة. تظهر كل قصيدة بمجرد مراجعتها وإدخالها.',
    wo: 'Juróom-ñaari diwaanu xasida. Bépp xasida dina fi feeñ bu ñu ko saytoo ba duggal ko.',
  },
  'diwan.label': { fr: 'Diwan', en: 'Diwan', ar: 'ديوان', wo: 'Diwan' },
  'diwan.poemsOnline': { fr: 'khassaïdes en ligne', en: 'khassaïdes online', ar: 'خصائد متاحة', wo: 'xasida yu nekk ci internet' },
  'diwan.poemOnline': { fr: 'khassida en ligne', en: 'khassida online', ar: 'قصيدة متاحة', wo: 'xasida bu nekk ci kaw internet' },
  'diwan.none': { fr: 'Aucune khassida en ligne', en: 'No khassida online yet', ar: 'لا توجد قصيدة بعد', wo: 'Amagul xasida ba tey' },
  'diwan.abyatOnline': { fr: 'Abyat en ligne', en: 'Abyat online', ar: 'الأبيات المتاحة', wo: 'Bayyit yi jaappandi' },
  'diwan.abyatTotal': { fr: 'Abyat du diwan', en: 'Abyat in the diwan', ar: 'أبيات الديوان', wo: 'Abyaat yu diwan bi' },
  'diwan.searchLabel': { fr: 'Chercher une khassida par son nom', en: 'Search a khassida by its name',
                         ar: 'ابحث عن قصيدة باسمها', wo: 'Seet xasida ci turam' },
  'diwan.searchHint': { fr: 'اكتب اسم القصيدة', en: 'اكتب اسم القصيدة', ar: 'اكتب اسم القصيدة', wo: 'اكتب اسم القصيدة' },
  'diwan.noMatch': { fr: 'Aucune khassida ne porte ce nom.', en: 'No khassida bears that name.',
                     ar: 'لا توجد قصيدة بهذا الاسم.', wo: 'Amul xasida bu tudd noonu.' },
  'diwan.emptyTitle': { fr: 'Aucune khassida de ce diwan n’est encore en ligne.', en: 'No khassida of this diwan is online yet.',
                        ar: 'لم تنشر بعد أي قصيدة من هذا الديوان.', wo: 'Amul ba tey xasida bu diwan bii ci kaw internet.' },
  'diwan.emptyText': { fr: 'Chaque poème relu et importé apparaît ici automatiquement.',
                       en: 'Every poem reviewed and imported appears here automatically.',
                       ar: 'كل قصيدة تُراجع وتُدخل تظهر هنا تلقائيًا.',
                       wo: 'Bépp xasida bu ñu seetlu te duggal dina fi feeñ ci boppam.' },
  'poem.label': { fr: 'Khassida', en: 'Khassida', ar: 'قصيدة', wo: 'Xasida' },
  'poem.abyat': { fr: 'abyat', en: 'abyat', ar: 'بيتًا', wo: 'abyaat' },
  'poem.acrostic': { fr: 'Acrostiche', en: 'Acrostic', ar: 'أكروستيش', wo: 'Teunku' },
  'poem.acrosticNote': {
    fr: 'Acrostiche : les premières lettres des abyat, en rouge, forment le nom du poème.',
    en: 'Acrostic: the first letters of the abyat, in red, spell the name of the poem.',
    ar: 'أكروستيش: أوائل حروف الأبيات، بالأحمر، تكوّن اسم القصيدة.',
    wo: 'Akrostish: araaf yu njëkk yu abyaat yi, ci xonq, ñoo bind turu xasida bi.',
  },
  'poem.showTranscription': { fr: 'Afficher la transcription', en: 'Show the transcription',
                              ar: 'إظهار النقل بالحروف اللاتينية', wo: 'Wone bind bu latin bi' },
  'poem.hideTranscription': { fr: 'Masquer la transcription', en: 'Hide the transcription',
                              ar: 'إخفاء النقل بالحروف اللاتينية', wo: 'Nëbb bind bu latin bi' },
  'poem.previous': { fr: 'Khassida précédente', en: 'Previous khassida', ar: 'القصيدة السابقة', wo: 'Xasida bi jiitu' },
  'poem.next': { fr: 'Khassida suivante', en: 'Next khassida', ar: 'القصيدة التالية', wo: 'Xasida bi topp' },
  'poem.download': { fr: 'Télécharger en PDF', en: 'Download as PDF', ar: 'تحميل PDF', wo: 'Yeb PDF bi' },
  'script.classic': { fr: 'Classique', en: 'Classical', ar: 'كلاسيكي', wo: 'Araab bu mag' },
  'script.wolofal': { fr: 'Wolofal', en: 'Wolofal', ar: 'ولفل', wo: 'Wolofal' },
  'script.label': { fr: 'Style d’écriture', en: 'Writing style', ar: 'نمط الخط', wo: 'Melo wu mbind mi' },

  'section.muqaddima': { fr: 'Ouverture', en: 'Opening', ar: 'المقدمة', wo: 'Ubbite' },
  'section.title': { fr: 'Nom du poème', en: 'Name of the poem', ar: 'اسم القصيدة', wo: 'Turu xasida bi' },
  'section.matn': { fr: 'Abyat', en: 'Abyat', ar: 'الأبيات', wo: 'Abyaat' },
  'section.khatima': { fr: 'Clôture', en: 'Closing', ar: 'الخاتمة', wo: 'Muj' },

  // ---------------------------------------------------------------- states
  'state.loading': { fr: 'Chargement…', en: 'Loading…', ar: 'جارٍ التحميل…', wo: 'Mu ngi yeb…' },
  'state.retry': { fr: 'Réessayer', en: 'Try again', ar: 'أعد المحاولة', wo: 'Jéemaat' },
  'error.diwanTitle': { fr: 'Le diwan n’a pas pu être chargé', en: 'The diwan could not be loaded',
                        ar: 'تعذّر تحميل الديوان', wo: 'Diwan bi mënul yeb' },
  'error.poemTitle': { fr: 'La khassida n’a pas pu être chargée', en: 'The khassida could not be loaded',
                       ar: 'تعذّر تحميل القصيدة', wo: 'Xasida bi mënul yeb' },
  'error.server': { fr: 'Le serveur ne répond pas pour le moment. Réessayez dans quelques instants.',
                    en: 'The server is not answering. Please try again in a moment.',
                    ar: 'الخادم لا يستجيب حاليًا. أعد المحاولة بعد قليل.',
                    wo: 'Serwóor bi tontuwul leegi. Jéemaat ci ëllëg tuuti.' },
  'error.diwanNotFound': { fr: 'Ce diwan n’existe pas. Le corpus compte sept diwans.',
                           en: 'This diwan does not exist. The corpus has seven diwans.',
                           ar: 'هذا الديوان غير موجود. المدونة تضم سبعة دواوين.',
                           wo: 'Diwan bii amul. Corpus bi juróom-ñaari diwan la am.' },
  'error.poemNotFound': { fr: 'Ce poème n’est pas encore en ligne. Il paraîtra ici dès qu’il aura été relu et importé.',
                          en: 'This poem is not online yet. It will appear here once reviewed and imported.',
                          ar: 'هذه القصيدة ليست متاحة بعد. ستظهر هنا بعد مراجعتها وإدخالها.',
                          wo: 'Xasida bii nekkagul ci kaw internet. Dina fi feeñ bu ñu ko seetlu te duggal ko.' },
  'error.pageTitle': { fr: 'Page introuvable', en: 'Page not found', ar: 'الصفحة غير موجودة', wo: 'Xët wi gisuñu ko' },
  'error.pageText': { fr: 'Cette adresse ne correspond à aucune page du site. Les khassaïdes sont classées par diwan.',
                      en: 'This address matches no page of the site. The khassaïdes are arranged by diwan.',
                      ar: 'هذا العنوان لا يقابل أي صفحة. الخصائد مرتبة حسب الديوان.',
                      wo: 'Adres bii àndul ak benn xët. Xasida yi, diwan lañu leen tëral.' },
  'error.notFound': { fr: 'Introuvable', en: 'Not found', ar: 'غير موجود', wo: 'Gisuñu ko' },
};
