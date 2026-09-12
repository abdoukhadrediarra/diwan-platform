import 'diwan.dart';
import 'json.dart';

/// Totals of the corpus: GET /api/v1/corpus/.
class CorpusOverview {
  const CorpusOverview({
    required this.diwanCount,
    required this.poemCount,
    required this.publishedAbyat,
    required this.corpusAbyat,
    required this.corpusHemistichs,
    required this.corpusWords,
    required this.diwans,
  });

  final int diwanCount;
  final int poemCount; // khassaïdes already online
  final int publishedAbyat;
  final int corpusAbyat;
  final int corpusHemistichs;
  final int corpusWords;
  final List<DiwanSummary> diwans;

  factory CorpusOverview.fromJson(Map<String, dynamic> json) => CorpusOverview(
        diwanCount: readInt(json['diwan_count']),
        poemCount: readInt(json['poem_count']),
        publishedAbyat: readInt(json['published_abyat']),
        corpusAbyat: readInt(json['corpus_abyat']),
        corpusHemistichs: readInt(json['corpus_hemistichs']),
        corpusWords: readInt(json['corpus_words']),
        diwans: (json['diwans'] as List<dynamic>? ?? const [])
            .map((e) => DiwanSummary.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}
