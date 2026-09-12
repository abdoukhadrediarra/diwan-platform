import 'json.dart';
import 'poem.dart';

/// A diwan as listed by GET /api/v1/diwans/.
class DiwanSummary {
  const DiwanSummary({
    required this.number,
    required this.slug,
    required this.title,
    required this.poemCount,
    required this.publishedAbyat,
    required this.corpusAbyat,
    required this.corpusHemistichs,
    required this.corpusWords,
  });

  final int number;
  final String slug;
  final String title;
  final int poemCount; // published khassaïdes
  final int publishedAbyat;
  final int corpusAbyat; // figures of the diwan's complete text
  final int corpusHemistichs;
  final int corpusWords;

  factory DiwanSummary.fromJson(Map<String, dynamic> json) => DiwanSummary(
        number: readInt(json['number']),
        slug: readString(json['slug']),
        title: readString(json['title']),
        poemCount: readInt(json['poem_count']),
        publishedAbyat: readInt(json['published_abyat']),
        corpusAbyat: readInt(json['corpus_abyat']),
        corpusHemistichs: readInt(json['corpus_hemistichs']),
        corpusWords: readInt(json['corpus_words']),
      );
}

/// One diwan and its published khassaïdes: GET /api/v1/diwans/diwan-01/.
class DiwanDetail {
  const DiwanDetail({required this.summary, required this.poems});

  final DiwanSummary summary;
  final List<PoemSummary> poems;

  factory DiwanDetail.fromJson(Map<String, dynamic> json) => DiwanDetail(
        summary: DiwanSummary.fromJson(json),
        poems: (json['poems'] as List<dynamic>? ?? const [])
            .map((e) => PoemSummary.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}
