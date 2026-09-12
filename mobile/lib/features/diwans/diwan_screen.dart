import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/arabic.dart';
import '../../core/format.dart';
import '../../core/settings.dart';
import '../../core/theme.dart';
import '../../data/models/diwan.dart';
import '../../data/models/poem.dart';
import '../../shared/widgets/arabic_text.dart';
import '../../shared/widgets/message_view.dart';
import '../../shared/widgets/number_badge.dart';
import '../poem/poem_screen.dart';

/// One diwan and its published khassaïdes, with a search by name.
class DiwanScreen extends StatefulWidget {
  const DiwanScreen({super.key, required this.slug, required this.number, required this.title});

  final String slug;
  final int number;
  final String title;

  @override
  State<DiwanScreen> createState() => _DiwanScreenState();
}

class _DiwanScreenState extends State<DiwanScreen> {
  Future<DiwanDetail>? _diwan;
  String? _apiUrl;
  String _query = '';

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final url = SettingsScope.of(context).apiBaseUrl;
    if (url != _apiUrl) {
      _apiUrl = url;
      _diwan = _fetch();
    }
  }

  Future<DiwanDetail> _fetch() => ApiClient(_apiUrl!).diwan(widget.slug);

  void _reload() => setState(() => _diwan = _fetch());

  List<PoemSummary> _filter(List<PoemSummary> poems) {
    final q = normalizeArabic(_query);
    if (q.isEmpty) return poems;
    return poems.where((p) => normalizeArabic(p.title).contains(q) || '${p.number}' == q).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Diwan ${widget.number}')),
      body: FutureBuilder<DiwanDetail>(
        future: _diwan,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return MessageView.forError(snapshot.error, onRetry: _reload, notFoundMessage: 'Ce diwan n\u2019existe pas.');
          }
          final diwan = snapshot.requireData;
          final poems = _filter(diwan.poems);

          return RefreshIndicator(
            onRefresh: () async {
              _reload();
              await _diwan?.catchError((_) => diwan);
            },
            child: ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              itemCount: poems.length + 1,
              itemBuilder: (context, index) {
                if (index == 0) return _header(diwan, poems.length);
                final poem = poems[index - 1];
                return _PoemRow(
                  poem: poem,
                  onTap: () => Navigator.of(context).push(MaterialPageRoute<void>(
                    builder: (_) => PoemScreen(diwanSlug: diwan.summary.slug, poemSlug: poem.slug),
                  )),
                );
              },
            ),
          );
        },
      ),
    );
  }

  Widget _header(DiwanDetail diwan, int shown) {
    final s = diwan.summary;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(children: [
          NumberBadge(s.number, size: 34),
          const SizedBox(width: 10),
          Text('Diwan ${s.number}', style: const TextStyle(fontWeight: FontWeight.w600, color: DiwanColors.muted)),
        ]),
        const SizedBox(height: 8),
        ArabicText(s.title.isEmpty ? widget.title : s.title, size: 34, weight: FontWeight.w700, align: TextAlign.left, height: 1.5),
        const SizedBox(height: 12),
        const Divider(color: DiwanColors.ink),
        Wrap(children: [
          _Fact('Khassaïdes en ligne', formatNumber(s.poemCount)),
          _Fact('Abyat en ligne', formatNumber(s.publishedAbyat)),
          _Fact('Abyat du diwan', formatNumber(s.corpusAbyat)),
        ]),
        const Divider(),
        const SizedBox(height: 16),
        if (diwan.poems.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 24),
            child: Text(
              'Aucune khassida de ce diwan n\u2019est encore en ligne. Chaque poème relu et importé dans la base apparaît ici automatiquement.',
              style: TextStyle(fontSize: 16, color: DiwanColors.muted, height: 1.5),
            ),
          )
        else ...[
          TextField(
            textDirection: TextDirection.rtl,
            textAlign: TextAlign.right,
            style: arabicStyle(size: 20, height: 1.4),
            decoration: const InputDecoration(
              hintText: 'اكتب اسم القصيدة',
              hintTextDirection: TextDirection.rtl,
              labelText: 'Chercher une khassida par son nom',
              prefixIcon: Icon(Icons.search),
            ),
            onChanged: (value) => setState(() => _query = value),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(4, 8, 4, 8),
            child: Text(
              shown == 0 ? 'Aucune khassida ne porte ce nom.' : plural(shown, 'khassida', 'khassaïdes'),
              style: const TextStyle(color: DiwanColors.muted),
            ),
          ),
          const Divider(color: DiwanColors.ink),
        ],
      ],
    );
  }
}

class _Fact extends StatelessWidget {
  const _Fact(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 150,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: DiwanColors.muted)),
          Text(value, style: const TextStyle(fontFamily: arabicFont, fontSize: 26, fontWeight: FontWeight.w700, color: DiwanColors.emerald, height: 1.25)),
        ]),
      ),
    );
  }
}

class _PoemRow extends StatelessWidget {
  const _PoemRow({required this.poem, required this.onTap});

  final PoemSummary poem;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
        decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: DiwanColors.rule))),
        child: Row(children: [
          SizedBox(
            width: 40,
            child: Text('${poem.number}', style: const TextStyle(fontFamily: arabicFont, fontSize: 18, fontWeight: FontWeight.w700, color: DiwanColors.muted)),
          ),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              ArabicText(poem.title, size: 21, align: TextAlign.left, height: 1.7, maxLines: 2),
              Row(children: [
                if (poem.isAcrostic)
                  Container(
                    margin: const EdgeInsets.only(right: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 1),
                    decoration: BoxDecoration(border: Border.all(color: DiwanColors.gold), borderRadius: BorderRadius.circular(12)),
                    child: const Text('Acrostiche', style: TextStyle(fontSize: 12, color: DiwanColors.gold)),
                  ),
                Text('${formatNumber(poem.baytCount)} abyat', style: const TextStyle(fontSize: 14, color: DiwanColors.muted)),
              ]),
            ]),
          ),
          const Icon(Icons.chevron_right, color: DiwanColors.muted),
        ]),
      ),
    );
  }
}
