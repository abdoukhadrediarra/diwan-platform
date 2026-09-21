import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

export type LanguageCode = 'fr' | 'en' | 'ar' | 'wo';

export interface LanguageOption {
  code: LanguageCode;
  badge: string;       // e.g. 'FR', 'EN', 'AR', 'WO'
  label: string;       // e.g. 'Français', 'English', 'العربية', 'Wolof'
  dir?: 'ltr' | 'rtl';
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'fr', badge: 'FR', label: 'Français', dir: 'ltr' },
  { code: 'en', badge: 'EN', label: 'English', dir: 'ltr' },
  { code: 'ar', badge: 'AR', label: 'العربية', dir: 'rtl' },
  { code: 'wo', badge: 'WO', label: 'Wolof', dir: 'ltr' },
];

const STORAGE_KEY = 'diwan.language';

export const TRANSLATIONS: Record<string, Record<LanguageCode, string>> = {
  // Navigation
  'nav.home': {
    fr: 'Accueil',
    en: 'Home',
    ar: 'الرئيسية',
    wo: 'Dalal',
  },
  'nav.cheikh': {
    fr: 'Le Cheikh',
    en: 'The Cheikh',
    ar: 'الشيخ',
    wo: 'Seex bi',
  },
  'nav.diwans': {
    fr: 'Les diwans',
    en: 'The Diwans',
    ar: 'الدواوين',
    wo: 'Béréb Xassida yi',
  },
  'nav.allDiwans': {
    fr: 'Tous les diwans',
    en: 'All diwans',
    ar: 'كل الدواوين',
    wo: 'Mbooleem xassida yi',
  },
  'nav.projet': {
    fr: 'Le projet',
    en: 'The project',
    ar: 'المشروع',
    wo: 'Liggéy bi',
  },
  'nav.corpus': {
    fr: 'Le corpus',
    en: 'The corpus',
    ar: 'المجموعة',
    wo: 'Dajaleb Xassida yi',
  },
  'nav.favorites': {
    fr: 'Favoris',
    en: 'Favorites',
    ar: 'المفضلة',
    wo: 'Tànn yi',
  },
  'nav.search': {
    fr: 'Recherche',
    en: 'Search',
    ar: 'البحث',
    wo: 'Seet',
  },

  // Hero Section
  'hero.epithet': {
    fr: 'Khadimou Rassoul, le Serviteur du Messager',
    en: 'Khadimou Rassoul, the Servant of the Messenger',
    ar: 'خَادِمُ الرَّسُولِ، صلى الله عليه وسلم',
    wo: 'Khadimou Rassoul, Jaamub Yónnent bi (PSL)',
  },
  'hero.dates': {
    fr: 'Mbacké, 1853 – Diourbel, 1927',
    en: 'Mbacké, 1853 – Diourbel, 1927',
    ar: 'مباكي، 1853 – ديوربل، 1927',
    wo: 'Mbàkke, 1853 – Jurbel, 1927',
  },
  'hero.lede': {
    fr: 'Théologien, juriste et maître soufi, fondateur de la voie mouride et de la ville de Touba. Il a consacré sa vie au service de Dieu et du Prophète, et laissé des milliers de vers de louange : ses khassaïdes, réunis ici dans sept diwans.',
    en: 'Theologian, jurist and Sufi master, founder of the Mouride brotherhood and the holy city of Touba. He dedicated his life to the service of God and the Prophet, leaving thousands of verses of praise: his khassaïdes, gathered here in seven diwans.',
    ar: 'عالم وفقيه وشيخ صوفي، مؤسس الطريقة المريدية ومدينة طوبى المقدسة. كرّس حياته لخدمة الله ورسوله، وترك آلاف الأبيات في مدح النبي والتوحيد، مجموعة هنا في سبعة دواوين.',
    wo: 'Boroom xam-xam, ku yiw ci diine te am xam-xamu Tasawwuf, ki sos yoonu Murid ak dëkk bu sell bi Touba. Da fa jébbal bakkanam ci jaamu Yàlla ak liggéeyal Yónnent bi (PSL), bàyyi fi junni-junniy bayt yu rafet : xassida yi, ñu boole leen ci juróom-ñaari diwan yii.',
  },
  'hero.ctaDiwans': {
    fr: 'Découvrir les diwans',
    en: 'Discover the diwans',
    ar: 'تصفح الدواوين',
    wo: 'Gis diwan yi',
  },
  'hero.ctaBio': {
    fr: 'Lire sa biographie',
    en: 'Read biography',
    ar: 'سيرة الشيخ',
    wo: 'Jàng dundam',
  },
  'hero.portraitCaption': {
    fr: 'Cheikh Ahmadou Bamba, photographie d’archive',
    en: 'Cheikh Ahmadou Bamba, archival photograph',
    ar: 'الشيخ أحمدو بمبا، صورة أرشيفية',
    wo: 'Seex Ahmadou Bamba, nataalu taariix',
  },

  // Author / Cheikh Section
  'author.title': {
    fr: 'Le Cheikh',
    en: 'The Cheikh',
    ar: 'الشيخ أحمد بمب',
    wo: 'Seex bi',
  },
  'author.p1': {
    fr: 'Cheikh Ahmadou Bamba, de son nom complet Muhammad ibn Muhammad ibn Habiballah, est né en 1853 à Mbacké, une ville fondée par son arrière-grand-père dans le royaume du Baol. Son père, Momar Anta Saly Mbacké, était un savant et un cadi respecté ; sa mère, Mame Diarra Bousso, est vénérée comme une sainte au Sénégal comme en Mauritanie.',
    en: 'Cheikh Ahmadou Bamba, in full Muhammad ibn Muhammad ibn Habiballah, was born in 1853 in Mbacké, a town founded by his great-grandfather in the kingdom of Baol. His father, Momar Anta Saly Mbacké, was a revered scholar and judge; his mother, Mame Diarra Bousso, is venerated as a saint in Senegal and Mauritania.',
    ar: 'ولد الشيخ أحمدو بمبا (محمد بن محمد بن حبيب الله) عام 1853 في إمباكي بمملكة باوول. كان والده مَمَار أنتا سالي عالماً وقاضياً جليلاً، وتُعد والدته مريم بوسو (مَامْ جَارَا) من أولياء الله الصالحين.',
    wo: 'Seex Ahmadou Bamba (Muhammad ibn Muhammad ibn Habiballah), mi ngi gane àdduna atum 1853 ca Mbàkke Baawol, dëkk bi maamam sampoon. Baayam, Séex Momar Anta Saly Mbàkke, boroom xam-xam la woon tey cadi bu mag ; yaayam, Soxna Diarra Bousso (Mame Diarra), wàlliyu Yàlla la Senegaal ak Gànnaar.',
  },
  'author.p2': {
    fr: 'Il apprend le Coran dès l\'âge de sept ans, puis la théologie, le droit et le soufisme. Très jeune, il met en vers des traités classiques : son Mawâhib al-Quddûs, adaptation en vers d\'un traité sur l\'unicité divine, entre dans le programme de l\'école de son père.',
    en: 'He memorized the Quran by age seven, then studied theology, jurisprudence, and Sufism. At an early age, he versified classic treatises: his Mawâhib al-Quddûs, a poetic adaptation on divine unity, became part of his father’s madrasa curriculum.',
    ar: 'حفظ القرآن الكريم في سن السابعة، ثم استبحر في علوم الفقه والتوحيد والتصوف. ونظم في مطلع شبابه متوناً علمية رصينة، منها «مواهب القدوس» في علم التوحيد.',
    wo: 'Mokkal na Alxuraan ci juróom-ñaari atam, soga jàng xam-xamu diine, fiqh ak tasawwuf. Ca ndawam la defar woy yu am solo yu mel ni Mawâhib al-Quddûs, bu yégg ci daara baayam.',
  },
  'author.p3': {
    fr: 'Après la mort de son père en 1881, il choisit d\'éduquer ses disciples par l\'élévation spirituelle plutôt que par la seule étude. C\'est la naissance de la voie mouride, la Mouridiyya. En 1888, il fonde Touba, un lieu retiré au cœur de la forêt, qui deviendra la ville sainte des mourides.',
    en: 'After the passing of his father in 1881, he chose to guide disciples through spiritual elevation alongside study. This marked the birth of the Murid path (Mouridiyya). In 1888, he founded Touba in the secluded Mbaffar forest, which became the holy capital of the Murids.',
    ar: 'بعد وفاة والده عام 1881، نهج مسلك التربية الروحية وتزكية النفوس إلى جانب التعليم، فكانت نشأة الطريقة المريدية. وفي عام 1888، أسس مدينة طوبى المباركة في قلب الغابة لتكون مهبطاً للقلوب ومهداً للطريقة.',
    wo: 'Gannaaw gaañu-gaañu baayam atum 1881, tànn na yare taalibe yi ci xol ak yëg-yëgu ruu. Foofu la yoonu Murid sosoo. Atum 1888, samp na Tuubaa ci biir àll bi, tay mu nekk dëkk bu sell bi.',
  },
  'author.p4': {
    fr: 'Son influence grandissante inquiète l\'administration coloniale française, bien qu\'aucun appel à la guerre ne puisse lui être reproché. Arrêté en 1895, il est exilé sept ans au Gabon, puis quatre ans en Mauritanie, avant d\'être placé en résidence surveillée. Il fera de l\'anniversaire de son départ en exil un jour d\'action de grâce, que les mourides célèbrent encore chaque année.',
    en: 'His growing influence alarmed the French colonial administration, even though he never preached violence. Arrested in 1895, he was exiled for seven years in Gabon, then four years in Mauritania, before enduring house arrest. He turned the anniversary of his departure into a thanksgiving day, celebrated annually as the Grand Magal.',
    ar: 'أثار نفوذه الروحي المتنامي مخاوف السلطات الاستعمارية الفرنسية، فاعتقل عام 1895 ونُفي إلى الغابون لسبع سنوات، ثم إلى موريتانيا لأربع سنوات، قبل وضعه تحت الإقامة الجبرية. وجعل من يوم نفيه يوم شكر وعرفان لله، وهو ما يُعرف بالمغال الكبير.',
    wo: 'Dooléem ak mbégel gi ko nit ñi bëggoon jaaxaloon na tubaab yi. Ñu jàpp ko atum 1895, yóbbu ko Gàbon juróom-ñaari at, teg ci Gànnaar ñeenti at. Bés ba mu jógé Senegaal la def bésub sant Yàlla, muy Màgalu Tuubaa bi ñuy màggal at mu nekk.',
  },
  'author.p5': {
    fr: 'Il s\'éteint en 1927 à Diourbel et repose à Touba. Son œuvre, écrite en arabe et en grande partie versifiée, couvre la théologie, le droit, la spiritualité et, surtout, la louange de Dieu et du Prophète.',
    en: 'He passed away in 1927 in Diourbel and rests in Touba. His vast literary corpus, written in Arabic and largely versified, encompasses theology, ethics, spiritual realization, and above all, praising Allah and His Messenger.',
    ar: 'انتقل إلى الرفيق الأعلى عام 1927 في ديوربل ودُفن في طوبى. ترك تراثاً أدبياً زاخراً باللغة العربية، نظماً ونثراً، في التوحيد والأخلاق والتصوف، وقصائد لا تُحصى في مدح المصطفى ﷺ.',
    wo: 'Gaañu na atum 1927 ca Njaaréem, ñu denc ko Tuubaa. Téereem yépp ci làkku araab la leen binde, te am na xam-xam bu yaatu ci diine, jikko yu rafet ak màggal Yàlla ak sànt Yonent bi ﷺ.',
  },
  'author.sourceWiki': {
    fr: 'D\'après l\'article Wikipédia',
    en: 'From the Wikipedia article',
    ar: 'نقلاً عن مقال ويكيبيديا',
    wo: 'Jële ko ci xëtub Wikipedia',
  },
  'author.datesTitle': {
    fr: 'Les grandes dates',
    en: 'Key dates',
    ar: 'المحطات الكبرى',
    wo: 'Taariix ak jamono',
  },
  'timeline.1853': {
    fr: 'Naissance à Mbacké, dans le royaume du Baol.',
    en: 'Birth in Mbacké, in the kingdom of Baol.',
    ar: 'ولادته في إمباكي بمملكة باوول.',
    wo: 'Juddu ci Mbàkke, ci réewum Baawol.',
  },
  'timeline.1881': {
    fr: 'Mort de son père. Il reprend son école à Mbacké Cayor.',
    en: 'Father’s death. He takes over the school in Mbacké Cayor.',
    ar: 'وفاة والده وتوليه إدارة المدرسة في إمباكي كايور.',
    wo: 'Gaañu-gaañu baayam. Dàl di yor daara ji ca Mbàkke Kajoor.',
  },
  'timeline.1888': {
    fr: 'Fondation de Touba, au cœur de la forêt de Mbaffar.',
    en: 'Foundation of Touba, in the heart of the Mbaffar forest.',
    ar: 'تأسيس مدينة طوبى في قلب غابة مضافر.',
    wo: 'Samp Tuubaa ci biir àllu Mbàffar.',
  },
  'timeline.1895': {
    fr: 'Arrestation et exil au Gabon, à Mayumba puis à Lambaréné.',
    en: 'Arrest and exile to Gabon, at Mayumba then Lambaréné.',
    ar: 'الاعتقال والنفي إلى الغابون (مايومبا ثم لامباريني).',
    wo: 'Jàpp ko ak yóbbu ko Gàbon, ca Mayumba ak Lambaréné.',
  },
  'timeline.1902': {
    fr: 'Retour au Sénégal, accueilli par ses disciples à Dakar.',
    en: 'Return to Senegal, warmly welcomed by disciples in Dakar.',
    ar: 'العودة إلى السنغال واستقبال حافل من المريدين في دكار.',
    wo: 'Dellusi Senegaal, taalibe yi dalal ko ak mbégte mu réy Ndakaaru.',
  },
  'timeline.1903': {
    fr: 'Nouvel exil, en Mauritanie, pendant quatre ans.',
    en: 'Second exile, in Mauritania, for four years.',
    ar: 'النفي الثاني إلى موريتانيا لمدة أربع سنوات.',
    wo: 'Yóbbu ko Gànnaar ñeenti at.',
  },
  'timeline.1907': {
    fr: 'Résidence surveillée à Thiéyène.',
    en: 'House arrest in Thiéyène.',
    ar: 'فرض الإقامة الجبرية في تيين.',
    wo: 'Tëj ko ci Céyéen ci loxoy tubaab yi.',
  },
  'timeline.1912': {
    fr: 'Installation à Diourbel, où il vit ses dernières années.',
    en: 'Relocation to Diourbel, where he spent his final years.',
    ar: 'الانتقال إلى ديوربل حيث قضى بقية حياته المباركة.',
    wo: 'Dal ca Njaaréem, fa la dunde at yi mu mujje.',
  },
  'timeline.1927': {
    fr: 'Décès à Diourbel. Il repose à Touba, près de la grande mosquée.',
    en: 'Passed away in Diourbel. Rests in Touba, near the Grand Mosque.',
    ar: 'وفاته في ديوربل، ودفنه في طوبى بجوار المسجد الكبير.',
    wo: 'Gaañu ca Njaaréem. Ñu denc ko Tuubaa, wetu jumaa ji.',
  },
  'author.verseCaption': {
    fr: 'Premier bayt du poème avec sa vocalisation et sa transcription en caractères latins.',
    en: 'First verse of the poem with vocalization and Latin transcription.',
    ar: 'البيت الأول من القصيدة مشكولاً ومترجماً صوتياً.',
    wo: 'Bayt bu njëkk bi ci woy wi, am yépp i araf ak mbindum wolofal.',
  },

  // Project Section
  'project.title': {
    fr: 'Le projet Diwan',
    en: 'The Diwan project',
    ar: 'مشروع ديوان',
    wo: 'Liggéy Diwan bi',
  },
  'project.aim': {
    fr: 'Rassembler les diwans de Cheikh Ahmadou Bamba dans une édition numérique complète et vocalisée, lisible par tous et partout : au Sénégal comme ailleurs, en arabe comme en caractères latins.',
    en: 'To bring together the diwans of Cheikh Ahmadou Bamba into a complete, vocalized digital edition, accessible to everyone everywhere: in Senegal and beyond, in Arabic script as well as Latin letters.',
    ar: 'جمع دواوين الشيخ أحمدو بمبا في طبعة رقمية شاملة ومشكولة، متاحة للجميع في كل مكان: في السنغال وخارجها، بالرسم العربي وبالحروف اللاتينية.',
    wo: 'Dajale mbooleem juróom-ñaari diwani Seex Ahmadou Bamba ci jumtukaay bu bees te am tëkki yu leer, ngir képp ku nekk Senegaal walla bitim réew mën koo jàng.',
  },
  'project.desc': {
    fr: 'Les khassaïdes sont récitées, chantées et étudiées chaque jour. Pourtant, beaucoup de lecteurs n’ont accès qu’à des éditions dispersées, souvent sans voyelles. Diwan donne à chaque poème une page, un texte fiable et les outils pour le lire, le retrouver et le partager.',
    en: 'The khassaïdes are recited, chanted, and studied daily. Yet many readers only have access to scattered, unvocalized copies. Diwan gives each poem its own dedicated page, an authenticated text, and tools to read, search, and share it.',
    ar: 'تُتلى القصائد وتُنشد وتُدرَس كل يوم. ومع ذلك يفتقر كثير من القراء لنسخ محققة ومشكولة. يوفر مشروع ديوان لكل قصيدة صفحة مخصصة ونصاً موثوقاً وأدوات للقراءة والمشاركة.',
    wo: 'Xassida yi, dëgg-dëgg dañu leen di jàng ak a woy bés bu nekk. Waaye nit ñu bare gisunu téere yu mat. Diwan mi ngi may benn xassida bu nekk xët bu leer, mbind mu sell ak pexe yuy tax nga mën koo jàng te séddoo ko.',
  },
  'project.offersTitle': {
    fr: 'Ce que vous trouverez ici',
    en: 'What you will find here',
    ar: 'ما تجده في المنصة',
    wo: 'Li nga fi fekk',
  },
  'project.offer1.title': {
    fr: 'Une page pour chaque poème',
    en: 'A page for each poem',
    ar: 'صفحة لكل قصيدة',
    wo: 'Xët ngir bépp xassida',
  },
  'project.offer1.text': {
    fr: 'Le texte entièrement vocalisé, bayt par bayt, sous le nom que lui a donné son auteur.',
    en: 'The fully vocalized text, verse by verse, under the name given by its author.',
    ar: 'النص مشكول بالكامل، بيتاً بيتاً، بالعنوان الذي وضعه المؤلف.',
    wo: 'Mbind mu am yépp i tëkki ak araf, bayt ci bayt, ci tur wi ko boroom jox.',
  },
  'project.offer2.title': {
    fr: 'La transcription en caractères latins',
    en: 'Latin transcription',
    ar: 'النسخ بالحروف اللاتينية',
    wo: 'Mbindum wolofal ak arafu latin',
  },
  'project.offer2.text': {
    fr: 'Pour lire et réciter les khassaïdes sans lire l’écriture arabe.',
    en: 'To read and recite the khassaïdes without reading Arabic script.',
    ar: 'لتلاوة القصائد وقراءتها لمن لا يجيد قراءة الحرف العربي.',
    wo: 'Ngir jàng ak a woy xassida yi te laajul nga mën a jàng arafu araab.',
  },
  'project.offer3.title': {
    fr: 'Des PDF à télécharger',
    en: 'Downloadable PDFs',
    ar: 'ملفات PDF للتحميل',
    wo: 'PDF yuy yéwéku',
  },
  'project.offer3.text': {
    fr: 'Chaque poème, chaque diwan et le corpus entier, prêts à imprimer ou à partager.',
    en: 'Each poem, each diwan, and the full corpus, ready to print or share.',
    ar: 'كل قصيدة، وكل ديوان، والمجموعة كاملة جاهزة للطباعة والمشاركة بدقة عالية.',
    wo: 'Bépp xassida, bépp diwan ak mboolem lepp, mën nga leen a moul walla séddoo leen.',
  },
  'project.offer4.title': {
    fr: 'Une recherche dans tout le corpus',
    en: 'Search across the corpus',
    ar: 'بحث شامل في المتون',
    wo: 'Seet ci mbooleem xassida yi',
  },
  'project.offer4.text': {
    fr: 'D’abord dans les noms des poèmes, ensuite dans les vers eux-mêmes.',
    en: 'First in poem names, then in the verses themselves.',
    ar: 'في عناوين القصائد أولاً، ثم في نصوص الأبيات ذاتها.',
    wo: 'Njëkk ci turu xassida yi, ba ci biir bayt yi.',
  },
  'project.offer5.title': {
    fr: 'Des classements utiles',
    en: 'Useful classifications',
    ar: 'فهارس وتصنيفات ميسرة',
    wo: 'Tànn yu am solo',
  },
  'project.offer5.text': {
    fr: 'Par diwan, par mois de l’année hégirienne, par événement et par jour.',
    en: 'By diwan, by Hijri month, by event, and by day.',
    ar: 'بحسب الدواوين، وشهور السنة الهجرية، والمناسبات والأيام.',
    wo: 'Ci diwan, ci weeru wolof ak lislaam, ci bés yi ak xew-xew yi.',
  },
  'project.stepsTitle': {
    fr: 'Comment le corpus est préparé',
    en: 'How the corpus is prepared',
    ar: 'كيف يتم إعداد وتدقيق المتون',
    wo: 'Naka lañuy toogale xassida yi',
  },
  'project.step1.title': {
    fr: 'Saisie',
    en: 'Entry',
    ar: 'التدوين والرقمنة',
    wo: 'Bind',
  },
  'project.step1.text': {
    fr: 'Le texte des sept diwans est saisi vers par vers, à partir des recueils imprimés.',
    en: 'The text of the seven diwans is entered verse by verse from printed collections.',
    ar: 'كتابة نصوص الدواوين بيتاً بيتاً انطلاقاً من المطبوعات المعتمدة.',
    wo: 'Duggal bayt yi benn benn jële ci téere yu mag yi ñu moos a moul.',
  },
  'project.step2.title': {
    fr: 'Normalisation',
    en: 'Standardization',
    ar: 'التوحيد والضبط',
    wo: 'Rafetal',
  },
  'project.step2.text': {
    fr: 'Tous les poèmes suivent le même format : un bayt par ligne, ses hémistiches séparés.',
    en: 'All poems follow the same standard: one verse per line, hemistichs clearly separated.',
    ar: 'توحيد نسق جميع القصائد: بيت واحد في كل سطر مع فصل دقيق بين الشطرين.',
    wo: 'Benn melo ci mbooleem woy yi : benn bayt ci rëdd bu nekk ak xaaj yu leer.',
  },
  'project.step3.title': {
    fr: 'Vocalisation',
    en: 'Vocalization',
    ar: 'التشكيل والمراجعة',
    wo: 'Tëkki',
  },
  'project.step3.text': {
    fr: 'Chaque mot reçoit sa vocalisation complète, puis chaque poème est relu à la main.',
    en: 'Each word receives its full vocalization, and every poem is thoroughly proofread.',
    ar: 'ضبط الحركات بالكامل لكل كلمة، مع مراجعة ومقارنة دقيقة كلمة بكلمة.',
    wo: 'Defal baat bu nekk yépp i tëkki, soga xoolaat woy wi ci loxo ba mu sell.',
  },
  'project.step4.title': {
    fr: 'Publication',
    en: 'Publication',
    ar: 'النشر والإتاحة',
    wo: 'Feeñal',
  },
  'project.step4.text': {
    fr: 'Les poèmes relus entrent dans la base de données et paraissent sur le site et l’application.',
    en: 'Proofread poems enter the database and appear immediately on the website and app.',
    ar: 'إدراج المتون المحققة في قاعدة البيانات لتظهر فوراً في الموقع والتطبيق.',
    wo: 'Woy yu ñu seet ba ñu sell dinañu dugg ci lëk-lëkaay bi te feeñ ci site bi.',
  },

  // Corpus Section
  'corpus.title': {
    fr: 'Le corpus',
    en: 'The corpus',
    ar: 'المجموعة الشعرية',
    wo: 'Dajaleb Xassida yi',
  },
  'corpus.desc': {
    fr: 'Les sept diwans constituent un monument de la poésie soufie africaine en langue arabe.',
    en: 'The seven diwans constitute a monument of African Sufi poetry in the Arabic language.',
    ar: 'تشكل الدواوين السبعة معلماً بارزاً في الشعر الصوفي الإفريقي باللغة العربية.',
    wo: 'Juróom-ñaari diwan yii da ñoo doy sëkk ciy téerey woy yu am solo ci diiney Lislaam ak làkku araab.',
  },
  'corpus.diwan': {
    fr: 'Diwan',
    en: 'Diwan',
    ar: 'ديوان',
    wo: 'Diwan',
  },
  'corpus.abyat': {
    fr: 'abyat',
    en: 'verses',
    ar: 'أبيات',
    wo: 'bayt',
  },
  'corpus.hemistichs': {
    fr: 'Hémistiches',
    en: 'Hemistichs',
    ar: 'الأشطار',
    wo: 'Xaaju bayt',
  },
  'corpus.words': {
    fr: 'Mots',
    en: 'Words',
    ar: 'الكلمات',
    wo: 'Baat yi',
  },
  'corpus.pages': {
    fr: 'Pages',
    en: 'Pages',
    ar: 'الصفحات',
    wo: 'Xët yi',
  },
  'corpus.online': {
    fr: 'En ligne',
    en: 'Online',
    ar: 'متاح',
    wo: 'Ci internet',
  },
  'corpus.share': {
    fr: 'Part des abyat du corpus',
    en: 'Share of corpus verses',
    ar: 'النسبة من أبيات المجموعة',
    wo: 'Wàll ci bayt yi',
  },
  'corpus.onlineCountLine': {
    fr: 'khassaïdes sont déjà en ligne. Chaque poème relu et importé paraît aussitôt dans son diwan.',
    en: 'poems are already online. Each reviewed poem immediately appears in its diwan.',
    ar: 'قصائد منشورة حالياً. تظهر كل قصيدة محققة فور نشرها في ديوانها.',
    wo: 'xassida nekk nañu ci internet. Bépp woy bu ñu xool dina fi feeñ.',
  },
  'corpus.singleOnlineLine': {
    fr: 'khassida est déjà en ligne. Chaque poème relu et importé paraît aussitôt dans son diwan.',
    en: 'poem is already online. Each reviewed poem immediately appears in its diwan.',
    ar: 'قصيدة منشورة حالياً. تظهر كل قصيدة محققة فور نشرها في ديوانها.',
    wo: 'xassida nekk na ci internet. Bépp woy bu ñu xool dina fi feeñ.',
  },
  'corpus.total': {
    fr: 'Total du corpus',
    en: 'Corpus total',
    ar: 'المجموع الكلي',
    wo: 'Mboolem lepp',
  },

  // Diwans List
  'diwans.title': {
    fr: 'Les diwans',
    en: 'The Diwans',
    ar: 'الدواوين',
    wo: 'Diwan yi',
  },
  'diwans.intro': {
    fr: 'Les sept recueils de khassaïdes de Cheikh Ahmadou Bamba. Chaque poème y paraît dès qu’il a été relu et importé.',
    en: 'The seven collections of Cheikh Ahmadou Bamba’s khassaïdes. Each poem appears here once proofread and imported.',
    ar: 'المجموعات الشعرية السبع لقصائد الشيخ أحمدو بمبا، مشكولة ومحققة.',
    wo: 'Juróom-ñaari téerey xassiday Seex Ahmadou Bamba. Bépp woy bu ñu mokkal te seet ko ba mu leer, dina fi feñ.',
  },
  'diwans.onlineCount': {
    fr: 'khassaïdes en ligne',
    en: 'poems online',
    ar: 'قصائد منشورة',
    wo: 'xassida ci lëk-lëkaay bi',
  },
  'diwans.singleOnline': {
    fr: 'khassida en ligne',
    en: 'poem online',
    ar: 'قصيدة منشورة',
    wo: 'xassida ci lëk-lëkaay bi',
  },
  'diwans.noneOnline': {
    fr: 'Aucune khassida en ligne',
    en: 'No poem online yet',
    ar: 'لا توجد قصائد منشورة بعد',
    wo: 'Amul benn xassida bu ñu duggal ag',
  },

  // Diwan Detail
  'detail.diwan': {
    fr: 'Diwan',
    en: 'Diwan',
    ar: 'ديوان',
    wo: 'Diwan',
  },
  'detail.poemsOnline': {
    fr: 'Khassaïdes en ligne',
    en: 'Poems online',
    ar: 'القصائد المنشورة',
    wo: 'Xassida yi ci lëk-lëkaay bi',
  },
  'detail.abyatOnline': {
    fr: 'Abyat en ligne',
    en: 'Verses online',
    ar: 'الأبيات المنشورة',
    wo: 'Bayt yi ci lëk-lëkaay bi',
  },
  'detail.corpusAbyat': {
    fr: 'Abyat du diwan',
    en: 'Diwan total verses',
    ar: 'مجموع أبيات الديوان',
    wo: 'Mbooleem bayti diwan bi',
  },
  'detail.searchPlaceholder': {
    fr: 'Rechercher une khassida par titre ou verset...',
    en: 'Search a poem by title or verse...',
    ar: 'اكتب اسم القصيدة للبحث...',
    wo: 'Bindal turu xassida bi...',
  },
  'detail.poemsCount': {
    fr: 'khassaïdes',
    en: 'poems',
    ar: 'قصائد',
    wo: 'xassida',
  },
  'detail.singlePoem': {
    fr: 'khassida',
    en: 'poem',
    ar: 'قصيدة',
    wo: 'xassida',
  },
  'detail.read': {
    fr: 'Lire',
    en: 'Read',
    ar: 'قراءة',
    wo: 'Jàng',
  },
  'detail.poemTag': {
    fr: 'Khassida',
    en: 'Khassida',
    ar: 'قصيدة',
    wo: 'Xassida',
  },
  'detail.acrosticTag': {
    fr: 'Acrostiche',
    en: 'Acrostic',
    ar: 'توشيح',
    wo: 'Akrostis',
  },
  'detail.empty': {
    fr: 'Aucune khassida de ce diwan n’est encore en ligne.',
    en: 'No poem from this diwan is online yet.',
    ar: 'لا توجد أي قصيدة منشورة من هذا الديوان بعد.',
    wo: 'Amul benn xassida ci diwan bi bu ñu duggal ag.',
  },
  'detail.viewOther': {
    fr: 'Voir les autres diwans',
    en: 'View other diwans',
    ar: 'عرض الدواوين الأخرى',
    wo: 'Gis yeneen diwan yi',
  },
  'detail.noMatch': {
    fr: 'Aucune khassida de ce diwan ne porte ce nom.',
    en: 'No poem found with this name.',
    ar: 'لم يتم العثور على أي قصيدة بهذا الاسم.',
    wo: 'Gisul benn xassida bu am tur wii.',
  },

  // Poem Page
  'poem.prev': {
    fr: 'Khassida précédente',
    en: 'Previous poem',
    ar: 'القصيدة السابقة',
    wo: 'Xassida bi jiitu',
  },
  'poem.next': {
    fr: 'Khassida suivante',
    en: 'Next poem',
    ar: 'القصيدة التالية',
    wo: 'Xassida bi topp',
  },
  'poem.acrosticDesc': {
    fr: 'Acrostiche : les premières lettres des abyat, en rouge, forment le nom du poème.',
    en: 'Acrostic: the initial letters of each verse, in red, spell out the title of the poem.',
    ar: 'توشيح: الحروف الأولى من كل بيت (باللون الأحمر) تؤلف اسم القصيدة.',
    wo: 'Akrostis : araf yu njëkk yi ci bayt yi (yu xonq yi), ñooy bind turu xassida bi.',
  },
  'poem.info': {
    fr: 'Informations sur la khassida',
    en: 'Poem information',
    ar: 'معلومات عن القصيدة',
    wo: 'Xibaar ci xassida bi',
  },
  'poem.verses': {
    fr: 'Nombre de vers',
    en: 'Number of verses',
    ar: 'عدد الأبيات',
    wo: 'Limu bayt yi',
  },
  'poem.type': {
    fr: 'Type',
    en: 'Type',
    ar: 'النوع',
    wo: 'Xeet',
  },
  'poem.diwan': {
    fr: 'Diwan',
    en: 'Diwan',
    ar: 'الديوان',
    wo: 'Diwan',
  },
  'poem.inFav': {
    fr: 'Dans les favoris',
    en: 'In favorites',
    ar: 'في المفضلة',
    wo: 'Neek na ci tànn yi',
  },
  'poem.addFav': {
    fr: 'Ajouter aux favoris',
    en: 'Add to favorites',
    ar: 'إضافة إلى المفضلة',
    wo: 'Doolil ci tànn yi',
  },
  'poem.share': {
    fr: 'Partager',
    en: 'Share',
    ar: 'مشاركة',
    wo: 'Séddoo',
  },
  'poem.showTrans': {
    fr: 'Afficher la transcription',
    en: 'Show transcription',
    ar: 'إظهار النسخ الصوتي',
    wo: 'Wone mbindum wolofal',
  },
  'poem.hideTrans': {
    fr: 'Masquer la transcription',
    en: 'Hide transcription',
    ar: 'إخفاء النسخ الصوتي',
    wo: 'Nëbb mbindum wolofal',
  },
  'poem.downloadPdf': {
    fr: 'Télécharger en PDF',
    en: 'Download PDF',
    ar: 'تحميل كـ PDF',
    wo: 'Yebal ci PDF',
  },
  'poem.printPdf': {
    fr: 'Imprimer / PDF HD',
    en: 'Print / HD PDF',
    ar: 'طباعة / PDF فائق الدقة',
    wo: 'Moul / PDF bu baax',
  },
  'poem.generating': {
    fr: 'Génération...',
    en: 'Generating...',
    ar: 'جارٍ التوليد...',
    wo: 'Mi ngi koy defar...',
  },
  'section.muqaddima': {
    fr: 'Ouverture',
    en: 'Opening',
    ar: 'المقدمة',
    wo: 'Temb',
  },
  'section.title': {
    fr: 'Nom du poème',
    en: 'Poem title',
    ar: 'عنوان القصيدة',
    wo: 'Turu woy wi',
  },
  'section.matn': {
    fr: 'Abyat',
    en: 'Verses',
    ar: 'الأبيات',
    wo: 'Bayt yi',
  },
  'section.khatima': {
    fr: 'Clôture',
    en: 'Closing',
    ar: 'الخاتمة',
    wo: 'Tëj',
  },

  // Favorites Page
  'fav.title': {
    fr: 'Mes khassaïdes favorites',
    en: 'My favorite khassaïdes',
    ar: 'قصائدي المفضلة',
    wo: 'Xassida yi ma tànn',
  },
  'fav.kicker': {
    fr: 'Collection personnelle',
    en: 'Personal collection',
    ar: 'مجموعتي الخاصة',
    wo: 'Samay tànn',
  },
  'fav.desc': {
    fr: 'Retrouvez ici les poèmes que vous avez enregistrés pour une lecture rapide ou quotidienne.',
    en: 'Find here the poems you have saved for quick or daily recitation.',
    ar: 'هنا تجد القصائد التي حفظتها للقراءة السريعة أو اليومية.',
    wo: 'Fi nga mën a gis xassida yépp yi nga bëgg te di leen jàng bés bu nekk.',
  },
  'fav.export': {
    fr: 'Exporter la liste',
    en: 'Export list',
    ar: 'تصدير القائمة',
    wo: 'Yebal lim bi',
  },
  'fav.clear': {
    fr: 'Tout vider',
    en: 'Clear all',
    ar: 'إفراغ الكل',
    wo: 'Fas yépp',
  },
  'fav.emptyTitle': {
    fr: 'Aucune khassida dans vos favoris',
    en: 'No poem in your favorites',
    ar: 'لا توجد قصائد في المفضلة',
    wo: 'Amuloo ag benn xassida ci say tànn',
  },
  'fav.emptyText': {
    fr: 'Lorsque vous consultez un poème ou parcourez la liste d’un diwan, cliquez sur le bouton ♡ Favori pour l’ajouter à votre collection.',
    en: 'When viewing a poem or browsing a diwan, click the ♡ Favorite button to add it to your collection.',
    ar: 'عند تصفح القصائد، اضغط على زر المفضلة لإضافتها إلى مجموعتك.',
    wo: 'Soo nekkee di jàng xassida, bësal butoŋ ♡ Tànn bi ngir duggal ko fi.',
  },
  'fav.browse': {
    fr: 'Parcourir les diwans',
    en: 'Browse diwans',
    ar: 'تصفح الدواوين',
    wo: 'Gis diwan yi',
  },
  'fav.searchPlaceholder': {
    fr: 'Filtrer vos favoris (titre, numéro, code...)',
    en: 'Filter your favorites (title, number, code...)',
    ar: 'البحث في المفضلة (العنوان، الرقم...)',
    wo: 'Seet ci say tànn (tur, lim, kood...)',
  },
  'fav.of': {
    fr: 'sur',
    en: 'of',
    ar: 'من',
    wo: 'ci',
  },

  'fav.remove': {
    fr: 'Retirer des favoris',
    en: 'Remove from favorites',
    ar: 'إزالة من المفضلة',
    wo: 'Dindi ci say tànn',
  },
  'fav.noMatch': {
    fr: 'Aucun poème favori ne correspond à cette recherche.',
    en: 'No favorite poem matches this search.',
    ar: 'لا توجد قصيدة مفضلة تطابق هذا البحث.',
    wo: 'Gisul benn xassida bu depook li nga seet.',
  },
  'fav.clearConfirm': {
    fr: 'Voulez-vous vraiment vider votre liste de favoris ?',
    en: 'Do you really want to clear your favorites list?',
    ar: 'هل تريد حقاً إفراغ قائمة المفضلة بالكامل؟',
    wo: 'Ndax dëgg dëgg bëgg nga fas say tànn yépp ?',
  },
  'fav.exportedTitle': {
    fr: 'Mes khassaïdes favorites - Diwan',
    en: 'My favorite poems - Diwan',
    ar: 'قصائدي المفضلة - ديوان',
    wo: 'Samay xassida yu ma tànn - Diwan',
  },

  // Reader Settings (Theme & Font Size)
  'reader.theme': {
    fr: 'Thème',
    en: 'Theme',
    ar: 'المظهر',
    wo: 'Melokaan',
  },
  'reader.light': {
    fr: 'Clair',
    en: 'Light',
    ar: 'فاتح',
    wo: 'Leer',
  },
  'reader.sepia': {
    fr: 'Sépia',
    en: 'Sepia',
    ar: 'عتيق',
    wo: 'Xonq-mboq',
  },
  'reader.dark': {
    fr: 'Nuit',
    en: 'Dark',
    ar: 'ليلي',
    wo: 'Guddi',
  },
  'reader.fontSize': {
    fr: 'Taille',
    en: 'Font size',
    ar: 'حجم الخط',
    wo: 'Dayoob mbind',
  },
  'reader.fontDecrease': {
    fr: 'Diminuer la police',
    en: 'Decrease font size',
    ar: 'تصغير الخط',
    wo: 'Wàññi mbind mi',
  },
  'reader.fontIncrease': {
    fr: 'Agrandir la police',
    en: 'Increase font size',
    ar: 'تكبير الخط',
    wo: 'Yokk mbind mi',
  },

  // Search Page
  'search.title': {
    fr: 'Recherche dans le corpus',
    en: 'Search the corpus',
    ar: 'البحث في الدواوين',
    wo: 'Seet ci dajaleb xassida yi',
  },
  'search.kicker': {
    fr: 'Moteur de recherche',
    en: 'Search engine',
    ar: 'محرك البحث',
    wo: 'Jumtukaayu seet',
  },
  'search.heading': {
    fr: 'Rechercher une khassida ou un vers',
    en: 'Search a poem or a verse',
    ar: 'ابحث عن قصيدة أو بيت',
    wo: 'Seetal xassida walla bayt',
  },
  'search.desc': {
    fr: 'Recherchez instantanément par titre, code (ex. D01K08), numéro ou extrait de vers parmi tous les diwans.',
    en: 'Search instantly by title, code (e.g. D01K08), number, or verse excerpt across all diwans.',
    ar: 'ابحث فوراً بالعنوان، أو الرمز (مثل D01K08)، أو الرقم، أو نص البيت عبر جميع الدواوين.',
    wo: 'Seetal ci sa saasi ci tur wi, kood bi (mel ni D01K08), lim bi walla biir bayt yi.',
  },
  'search.placeholder': {
    fr: 'Titre, mot arabe, code (ex: D01K08), verset...',
    en: 'Title, Arabic word, code (e.g. D01K08), verse...',
    ar: 'اسم القصيدة، كلمة عربية، الرمز (D01K08)...',
    wo: 'Turu xassida, baat ci araab, kood...',
  },
  'search.action': {
    fr: 'Rechercher',
    en: 'Search',
    ar: 'بحث',
    wo: 'Seet',
  },
  'search.scope': {
    fr: 'Périmètre de recherche',
    en: 'Search scope',
    ar: 'نطاق البحث',
    wo: 'Wàllug seet gi',
  },
  'search.scopeAll': {
    fr: 'Tout le corpus',
    en: 'All corpus',
    ar: 'الكل',
    wo: 'Lépp',
  },
  'search.scopeTitles': {
    fr: 'Titres seulement',
    en: 'Titles only',
    ar: 'العناوين فقط',
    wo: 'Tur yi rekk',
  },
  'search.scopeVerses': {
    fr: 'Vers (abyat)',
    en: 'Verses only',
    ar: 'الأبيات فقط',
    wo: 'Bayt yi rekk',
  },
  'search.suggestions': {
    fr: 'Exemples',
    en: 'Examples',
    ar: 'أمثلة',
    wo: 'Misaal',
  },
  'search.loading': {
    fr: 'Recherche dans les sept diwans en cours…',
    en: 'Searching across the seven diwans…',
    ar: 'جارٍ البحث في الدواوين السبعة…',
    wo: 'Mi ngi seet ci juróom-ñaari diwan yi…',
  },
  'search.resultsSingle': {
    fr: 'résultat trouvé',
    en: 'result found',
    ar: 'نتيجة موجودة',
    wo: 'xassida feñ na',
  },
  'search.resultsPlural': {
    fr: 'résultats trouvés',
    en: 'results found',
    ar: 'نتائج موجودة',
    wo: 'xassida feñ nañu',
  },
  'search.for': {
    fr: 'pour',
    en: 'for',
    ar: 'لـ',
    wo: 'ngir',
  },
  'search.matchTitle': {
    fr: 'Titre',
    en: 'Title',
    ar: 'مطابقة بالعنوان',
    wo: 'Ci tur wi',
  },
  'search.matchVerse': {
    fr: 'Dans le vers',
    en: 'In verse',
    ar: 'في نص البيت',
    wo: 'Ci biir bayt bi',
  },
  'search.foundInVerse': {
    fr: 'Extrait trouvé dans le texte',
    en: 'Excerpt found in verse',
    ar: 'مقتطف من البيت',
    wo: 'Misaalu bayt bi',
  },
  'search.noMatchTitle': {
    fr: 'Aucun résultat trouvé',
    en: 'No results found',
    ar: 'لم يتم العثور على نتائج',
    wo: 'Amul dara lu feñ',
  },
  'search.noMatchText': {
    fr: 'Vérifiez l’orthographe ou essayez un mot plus court sans ponctuation.',
    en: 'Check your spelling or try a shorter word without punctuation.',
    ar: 'تأكد من صحة الكلمات أو جرب البحث بكلمة أقصر.',
    wo: 'Xoolaat bu baax mbind mi walla nga seet benn baat bu gën a gàtt.',
  },
  'search.welcomeTitle': {
    fr: 'Comment faire une recherche efficace ?',
    en: 'How to search effectively?',
    ar: 'كيف تبحث بدقة وسهولة؟',
    wo: 'Naka nga mën a seete bu baax ?',
  },
  'search.tip1Title': {
    fr: 'Par nom de poème',
    en: 'By poem name',
    ar: 'باسم القصيدة',
    wo: 'Ci turu xassida bi',
  },
  'search.tip1Text': {
    fr: 'Tapez directement le nom en arabe (ex. طوبى) ou avec voyelles.',
    en: 'Type the title in Arabic (e.g. طوبى) with or without vowels.',
    ar: 'اكتب اسم القصيدة بالعربية بالحركات أو بدونها.',
    wo: 'Bindal tur wi ci araab am tëkki walla amul.',
  },
  'search.tip2Title': {
    fr: 'Par code d’archive',
    en: 'By archive code',
    ar: 'برمز المخطوط أو الديوان',
    wo: 'Ci koodu xassida bi',
  },
  'search.tip2Text': {
    fr: 'Entrez le code officiel de la khassida (ex: D01K08 pour Diwan 1, poème 8).',
    en: 'Enter the official code (e.g. D01K08 for Diwan 1, poem 8).',
    ar: 'ادخل الرمز الرسمي للقصيدة (مثال D01K08 لديوان 1، قصيدة 8).',
    wo: 'Duggal kood bi mel ni D01K08.',
  },
  'search.tip3Title': {
    fr: 'Dans les vers (Abyat)',
    en: 'Within verses',
    ar: 'في نصوص الأبيات',
    wo: 'Ci biir bayt yi',
  },
  'search.tip3Text': {
    fr: 'Recherchez une expression ou un mot sacré présent au cœur des poèmes.',
    en: 'Search for any phrase or sacred word appearing within the verses.',
    ar: 'ابحث عن أي عبارة أو دعاء وارد في متن الأبيات.',
    wo: 'Seet bépp baat walla ñaan bu nekk ci biir woy yi.',
  },

  // Footer
  'footer.brandDesc': {
    fr: 'Les sept diwans de Cheikh Ahmadou Bamba, vocalisés et consultables poème par poème.',
    en: 'The seven diwans of Cheikh Ahmadou Bamba, vocalized and readable poem by poem.',
    ar: 'الدواوين السبعة للشيخ أحمد بمب، مشكولة ومتاحة قصيدة بقصيدة.',
    wo: 'Juróom-ñaari téerey xassiday Seex Ahmadou Bamba, am yépp i araf ak mbind.',
  },
  'footer.sources': {
    fr: 'Sources',
    en: 'Sources',
    ar: 'المصادر',
    wo: 'Téere yi',
  },
  'footer.sourcesDesc': {
    fr: 'Biographie rédigée d\'après l\'article Wikipédia sur Ahmadou Bamba (CC BY-SA 4.0). Photographie issue de Wikimedia Commons. Chiffres calculés sur le texte intégral des sept diwans. Police wolofal développée par Abdou Khadre Mbacké (XIDMA-AI) ; texte arabe classique en Amiri.',
    en: 'Biography adapted from the Wikipedia article on Ahmadou Bamba (CC BY-SA 4.0). Photograph from Wikimedia Commons. Figures calculated from the unabridged text of the seven diwans. Wolofal font developed by Abdou Khadre Mbacké (XIDMA-AI); classical Arabic in Amiri.',
    ar: 'السيرة محررة من مقال ويكيبيديا (CC BY-SA 4.0). الصورة من ويكيميديا كومنز. الأرقام محسوبة على المتن الكامل للدواوين السبعة. خط الولوفال تطوير عبد القادر امباكي (XIDMA-AI)؛ والنص العربي بخط أميري.',
    wo: 'Jaar-jaar bi mi ngi jogé ci xëtub Wikipedia ci Seex Ahmadou Bamba. Nataal bi ca Wikimedia Commons la jóge. Lim yi ci mbooleem juróom-ñaari téere yi lañu leen waññe. Mbindum wolofal gi Abdou Khadre Mbacké (XIDMA-AI) moo ko defar ; mbindum araab mi ci Amiri la.',
  },
  'footer.xidma': {
    fr: 'Xidma',
    en: 'Xidma',
    ar: 'الخدمة',
    wo: 'Xidma',
  },
  'footer.xidmaText': {
    fr: 'Ce projet est mené dans l’esprit du xidma : travailler et servir sans rien attendre en retour, pour l’amour de Dieu et au service de l’œuvre de Cheikh Ahmadou Bamba.',
    en: 'This project is carried out in the spirit of xidma: working and serving unconditionally, for the love of God and Cheikh Ahmadou Bamba’s legacy.',
    ar: 'هذا المشروع قائم بروح الخدمة: العمل التطوعي الخالص لوجه الله في خدمة تراث الشيخ أحمدو بمبا.',
    wo: 'Liggéey bii, ci xidma la tegu : liggéey te dootu ci laaj dara, ngir bëgg Yàlla ak darajay Seex Ahmadou Bamba.',
  },
  'footer.copy': {
    fr: 'Projet Diwan',
    en: 'Diwan Project',
    ar: 'مشروع ديوان',
    wo: 'Liggéy Diwan',
  },
};

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly document = inject(DOCUMENT);

  readonly languages = LANGUAGES;
  readonly currentCode = signal<LanguageCode>('fr');

  readonly current = computed(() => {
    const code = this.currentCode();
    return this.languages.find((l) => l.code === code) ?? this.languages[0];
  });

  constructor() {
    const saved = this.getSavedLanguage();
    if (saved && this.languages.some((l) => l.code === saved)) {
      this.currentCode.set(saved);
    }

    effect(() => {
      const lang = this.current();
      this.saveLanguage(lang.code);
      if (this.document?.documentElement) {
        this.document.documentElement.lang = lang.code;
        this.document.documentElement.dir = lang.dir ?? 'ltr';
      }
    });
  }

  setLanguage(code: LanguageCode): void {
    if (this.languages.some((l) => l.code === code)) {
      this.currentCode.set(code);
    }
  }

  t(key: string, fallback?: string): string {
    const entry = TRANSLATIONS[key];
    if (!entry) return fallback ?? key;
    return entry[this.currentCode()] ?? entry.fr ?? fallback ?? key;
  }

  private getSavedLanguage(): LanguageCode | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
      }
    } catch {
      // Ignore security or storage errors
    }
    return null;
  }

  private saveLanguage(code: LanguageCode): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, code);
      }
    } catch {
      // Ignore
    }
  }
}
