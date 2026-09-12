import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/format.dart';
import '../../core/settings.dart';
import '../../core/theme.dart';
import '../../data/corpus_static.dart';
import '../../data/models/diwan.dart';
import '../../shared/widgets/arabic_text.dart';
import '../../shared/widgets/number_badge.dart';
import 'diwan_screen.dart';

/// The 7 diwans. Titles and figures are always shown; the number of poems online comes from the API.
class DiwanListScreen extends StatefulWidget {
  const DiwanListScreen({super.key});

  @override
  State<DiwanListScreen> createState() => _DiwanListScreenState();
}

class _DiwanListScreenState extends State<DiwanListScreen> {
  Future<List<DiwanSummary>>? _counts;
  String? _apiUrl;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final url = SettingsScope.of(context).apiBaseUrl;
    if (url != _apiUrl) {
      _apiUrl = url;
      _counts = _fetch(); // no setState here: build() runs right after
    }
  }

  Future<List<DiwanSummary>> _fetch() => ApiClient(_apiUrl!).diwans();

  void _load() => setState(() => _counts = _fetch());

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Les diwans')),
      body: RefreshIndicator(
        onRefresh: () async {
          _load();
          await _counts?.catchError((_) => <DiwanSummary>[]);
        },
        child: FutureBuilder<List<DiwanSummary>>(
          future: _counts,
          builder: (context, snapshot) {
            final counts = snapshot.hasData ? {for (final d in snapshot.data!) d.number: d.poemCount} : null;
            return ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              children: [
                const Padding(
                  padding: EdgeInsets.fromLTRB(4, 0, 4, 16),
                  child: Text(
                    'Les sept recueils de khassaïdes. Chaque poème y paraît dès qu\u2019il a été relu et importé.',
                    style: TextStyle(fontSize: 16, color: DiwanColors.muted, height: 1.5),
                  ),
                ),
                if (snapshot.hasError)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Row(children: [
                      const Expanded(
                        child: Text('Le nombre de poèmes en ligne n\u2019a pas pu être chargé.', style: TextStyle(color: DiwanColors.muted)),
                      ),
                      TextButton(onPressed: _load, child: const Text('Réessayer')),
                    ]),
                  ),
                const Divider(color: DiwanColors.ink),
                for (final d in staticDiwans) ...[
                  _DiwanRow(
                    diwan: d,
                    poemCount: counts?[d.number],
                    loading: snapshot.connectionState != ConnectionState.done,
                    onTap: () => Navigator.of(context).push(MaterialPageRoute<void>(
                      builder: (_) => DiwanScreen(slug: d.slug, number: d.number, title: d.title),
                    )),
                  ),
                  const Divider(),
                ],
              ],
            );
          },
        ),
      ),
    );
  }
}

class _DiwanRow extends StatelessWidget {
  const _DiwanRow({required this.diwan, required this.poemCount, required this.loading, required this.onTap});

  final StaticDiwan diwan;
  final int? poemCount;
  final bool loading;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final String online;
    if (poemCount == null) {
      online = loading ? '…' : '';
    } else if (poemCount == 0) {
      online = 'Aucune khassida en ligne';
    } else {
      online = '${plural(poemCount!, 'khassida', 'khassaïdes')} en ligne';
    }
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 4),
        child: Row(children: [
          NumberBadge(diwan.number),
          const SizedBox(width: 14),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              ArabicText(diwan.title, size: 23, align: TextAlign.left, height: 1.6),
              Text('Diwan ${diwan.number}, ${formatNumber(diwan.abyat)} abyat', style: const TextStyle(fontSize: 14, color: DiwanColors.muted)),
              if (online.isNotEmpty)
                Text(
                  online,
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: (poemCount ?? 0) > 0 ? DiwanColors.emerald : DiwanColors.muted),
                ),
            ]),
          ),
          const Icon(Icons.chevron_right, color: DiwanColors.muted),
        ]),
      ),
    );
  }
}
