import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/format.dart';
import '../../core/settings.dart';
import '../../core/theme.dart';
import '../../data/corpus_static.dart';
import '../../data/models/corpus.dart';
import '../../shared/widgets/arabic_text.dart';
import '../diwans/diwan_list_screen.dart';
import '../settings/settings_screen.dart';

/// Home: Cheikh Ahmadou Bamba, the corpus in figures, his life, the project.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Future<CorpusOverview>? _live;
  String? _apiUrl;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final url = SettingsScope.of(context).apiBaseUrl;
    if (url != _apiUrl) {
      _apiUrl = url;
      _live = _fetch(); // no setState here: build() runs right after
    }
  }

  Future<CorpusOverview> _fetch() => ApiClient(_apiUrl!).corpus();

  void _load() => setState(() => _live = _fetch());

  void _openDiwans() {
    Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => const DiwanListScreen()));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Row(children: [
          Text('ديوان', textDirection: TextDirection.rtl, style: TextStyle(fontFamily: arabicFont, fontSize: 26, color: DiwanColors.emerald)),
          SizedBox(width: 8),
          Text('Diwan'),
        ]),
        actions: [
          IconButton(
            tooltip: 'Les diwans',
            icon: const Icon(Icons.menu_book_outlined),
            onPressed: _openDiwans,
          ),
          IconButton(
            tooltip: 'Paramètres',
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => const SettingsScreen())),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          _load();
          await _live?.catchError((_) => _emptyOverview);
        },
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
          children: [
            _Hero(onOpenDiwans: _openDiwans),
            const SizedBox(height: 36),
            _SectionTitle('Le corpus en chiffres'),
            _Figures(live: _live),
            const SizedBox(height: 36),
            _SectionTitle('Le Cheikh'),
            ..._biography.map((p) => _Paragraph(p)),
            const SizedBox(height: 12),
            const _Timeline(),
            const SizedBox(height: 36),
            _SectionTitle('Le projet'),
            const _Paragraph(
              'Rassembler les diwans de Cheikh Ahmadou Bamba dans une édition numérique complète et vocalisée, '
              'lisible par tous et partout : en arabe comme en caractères latins.',
            ),
            ..._offers.map((o) => _Offer(title: o.$1, text: o.$2)),
            const SizedBox(height: 32),
            const Divider(),
            const SizedBox(height: 16),
            const Text(
              'Biographie rédigée d\u2019après l\u2019article « Ahmadou Bamba » de Wikipédia (licence CC BY-SA 4.0). '
              'Photographie : Wikimedia Commons. Chiffres calculés sur le texte intégral des sept diwans.',
              style: TextStyle(fontSize: 13, color: DiwanColors.muted, height: 1.5),
            ),
          ],
        ),
      ),
    );
  }
}

const CorpusOverview _emptyOverview = CorpusOverview(
  diwanCount: 0, poemCount: 0, publishedAbyat: 0, corpusAbyat: 0, corpusHemistichs: 0, corpusWords: 0, diwans: [],
);

const List<String> _biography = [
  'Cheikh Ahmadou Bamba est né en 1853 à Mbacké, dans le royaume du Baol, dans une famille de savants. '
      'Il apprend le Coran dès l\u2019âge de sept ans, puis la théologie, le droit et le soufisme.',
  'Après la mort de son père en 1881, il choisit d\u2019éduquer ses disciples par l\u2019élévation spirituelle : '
      'c\u2019est la naissance de la voie mouride. En 1888, il fonde Touba.',
  'Son influence inquiète l\u2019administration coloniale : il est exilé sept ans au Gabon, puis quatre ans en Mauritanie, '
      'avant d\u2019être placé en résidence surveillée. Il s\u2019éteint en 1927 à Diourbel et repose à Touba.',
  'Son œuvre, écrite en arabe et en grande partie versifiée, est d\u2019abord une louange de Dieu et du Prophète.',
];

const List<(String, String)> _offers = [
  ('Une page pour chaque khassida', 'Le texte vocalisé, bayt par bayt, sous le nom donné par son auteur.'),
  ('La transcription latine', 'Pour lire et réciter sans connaître l\u2019écriture arabe.'),
  ('Toujours à jour', 'Chaque poème relu et importé paraît aussitôt, sur le site comme dans l\u2019application.'),
];

class _Hero extends StatelessWidget {
  const _Hero({required this.onOpenDiwans});

  final VoidCallback onOpenDiwans;

  @override
  Widget build(BuildContext context) {
    final photoWidth = (MediaQuery.sizeOf(context).width * 0.62).clamp(180.0, 300.0);
    return Column(
      children: [
        const SizedBox(height: 12),
        SizedBox(
          width: photoWidth + 14,
          child: Stack(
            children: [
              // thin gold arch behind the photograph, like a mihrab
              Positioned(
                left: 0,
                top: 0,
                right: 14,
                bottom: 26,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    border: Border.all(color: DiwanColors.gold),
                    borderRadius: BorderRadius.vertical(top: Radius.circular(photoWidth), bottom: const Radius.circular(4)),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(left: 14, top: 14),
                child: ClipRRect(
                  borderRadius: BorderRadius.vertical(top: Radius.circular(photoWidth / 2), bottom: const Radius.circular(4)),
                  child: Image.asset(
                    'assets/images/cheikh-ahmadou-bamba.jpg',
                    width: photoWidth,
                    height: photoWidth * 1.46,
                    fit: BoxFit.cover,
                    alignment: Alignment.topCenter,
                    semanticLabel: 'Cheikh Ahmadou Bamba debout, vêtu d\u2019un boubou blanc',
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 22),
        ArabicText('الشيخ أحمد بمب', size: 46, weight: FontWeight.w700, color: DiwanColors.emerald, height: 1.4),
        const Text(
          'Cheikh Ahmadou Bamba',
          textAlign: TextAlign.center,
          style: TextStyle(fontFamily: arabicFont, fontSize: 32, fontWeight: FontWeight.w700, height: 1.2),
        ),
        const SizedBox(height: 8),
        ArabicText('خَادِمُ الرَّسُولِ', size: 22, color: DiwanColors.gold, height: 1.6),
        const Text('Khadimou Rassoul, le Serviteur du Messager', textAlign: TextAlign.center, style: TextStyle(fontSize: 17)),
        const SizedBox(height: 4),
        const Text('Mbacké, 1853 – Diourbel, 1927', textAlign: TextAlign.center, style: TextStyle(color: DiwanColors.muted)),
        const SizedBox(height: 16),
        const Text(
          'Théologien, juriste et maître soufi, fondateur de la voie mouride et de la ville de Touba. '
          'Ses khassaïdes sont réunies ici dans sept diwans.',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 17, height: 1.5),
        ),
        const SizedBox(height: 20),
        FilledButton(onPressed: onOpenDiwans, child: const Text('Découvrir les diwans')),
      ],
    );
  }
}

class _Figures extends StatelessWidget {
  const _Figures({required this.live});

  final Future<CorpusOverview>? live;

  @override
  Widget build(BuildContext context) {
    final figures = <(String, String)>[
      ('Diwans', '${staticDiwans.length}'),
      ('Abyat', formatNumber(totalAbyat)),
      ('Hémistiches', formatNumber(totalHemistichs)),
      ('Mots', formatNumber(totalWords)),
      ('Pages', formatNumber(corpusPages)),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          spacing: 0,
          runSpacing: 0,
          children: [
            for (final f in figures)
              SizedBox(
                width: 150,
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(f.$1, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: DiwanColors.muted)),
                    Text(f.$2, style: const TextStyle(fontFamily: arabicFont, fontSize: 30, fontWeight: FontWeight.w700, color: DiwanColors.emerald, height: 1.25)),
                  ]),
                ),
              ),
          ],
        ),
        FutureBuilder<CorpusOverview>(
          future: live,
          builder: (context, snapshot) {
            if (!snapshot.hasData) return const SizedBox.shrink(); // loading or offline: figures above are enough
            final count = snapshot.data!.poemCount;
            return Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                '${plural(count, 'khassida', 'khassaïdes')} déjà en ligne.',
                style: const TextStyle(fontSize: 16, color: DiwanColors.muted),
              ),
            );
          },
        ),
      ],
    );
  }
}

class _Timeline extends StatelessWidget {
  const _Timeline();

  static const _events = [
    ('1853', 'Naissance à Mbacké, dans le Baol.'),
    ('1881', 'Mort de son père.'),
    ('1888', 'Fondation de Touba.'),
    ('1895', 'Exil au Gabon.'),
    ('1902', 'Retour au Sénégal.'),
    ('1903', 'Exil en Mauritanie.'),
    ('1907', 'Résidence surveillée à Thiéyène.'),
    ('1912', 'Installation à Diourbel.'),
    ('1927', 'Décès à Diourbel ; il repose à Touba.'),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.only(left: 16),
      decoration: const BoxDecoration(border: Border(left: BorderSide(color: DiwanColors.gold))),
      child: Column(
        children: [
          for (final e in _events)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                SizedBox(
                  width: 64,
                  child: Text(e.$1, style: const TextStyle(fontFamily: arabicFont, fontSize: 20, fontWeight: FontWeight.w700, color: DiwanColors.emerald)),
                ),
                Expanded(child: Padding(padding: const EdgeInsets.only(top: 3), child: Text(e.$2, style: const TextStyle(fontSize: 16)))),
              ]),
            ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Text(text, style: const TextStyle(fontFamily: arabicFont, fontSize: 30, fontWeight: FontWeight.w700, height: 1.2)),
    );
  }
}

class _Paragraph extends StatelessWidget {
  const _Paragraph(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(text, style: const TextStyle(fontSize: 17, height: 1.55)),
    );
  }
}

class _Offer extends StatelessWidget {
  const _Offer({required this.title, required this.text});

  final String title;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: DiwanColors.rule))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        const SizedBox(height: 2),
        Text(text, style: const TextStyle(fontSize: 15, color: DiwanColors.muted, height: 1.45)),
      ]),
    );
  }
}
