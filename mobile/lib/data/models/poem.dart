import 'json.dart';

/// A khassida in a diwan's list.
class PoemSummary {
  const PoemSummary({
    required this.code,
    required this.number,
    required this.slug,
    required this.title,
    required this.titleSource,
    required this.isAcrostic,
    required this.baytCount,
    required this.hemistichsPerBayt,
  });

  final String code; // "D01K08"
  final int number;
  final String slug; // "008"
  final String title; // its own name, or its first sadr
  final String titleSource; // "name_line" or "first_sadr"
  final bool isAcrostic;
  final int baytCount;
  final int hemistichsPerBayt;

  factory PoemSummary.fromJson(Map<String, dynamic> json) => PoemSummary(
        code: readString(json['code']),
        number: readInt(json['number']),
        slug: readString(json['slug']),
        title: readString(json['title']),
        titleSource: readString(json['title_source']),
        isAcrostic: json['is_acrostic'] == true,
        baytCount: readInt(json['bayt_count']),
        hemistichsPerBayt: readInt(json['hemistichs_per_bayt']),
      );
}

/// One line of a poem: opening text, name, bayt or closing text.
class PoemLine {
  const PoemLine({
    required this.position,
    required this.section,
    required this.kind,
    required this.baytNumber,
    required this.hemistichs,
    required this.acrosticSpans,
    required this.transcription,
  });

  final int position;
  final String section; // muqaddima, title, matn, khatima
  final String kind; // prose, title, bayt
  final int? baytNumber;
  final List<String> hemistichs;
  final List<String> acrosticSpans; // bolded substring(s) of this line, to highlight in red
  final Map<String, List<String>> transcription; // {"local": ["...", "..."]}

  bool get isBayt => kind == 'bayt';

  List<String> get localTranscription => transcription['local'] ?? const [];

  factory PoemLine.fromJson(Map<String, dynamic> json) {
    final raw = json['transcription'];
    return PoemLine(
      position: readInt(json['position']),
      section: readString(json['section']),
      kind: readString(json['kind']),
      baytNumber: readIntOrNull(json['bayt_number']),
      hemistichs: readStrings(json['hemistichs']),
      acrosticSpans: readStrings(json['acrostic_spans']),
      transcription: raw is Map
          ? raw.map((style, parts) => MapEntry('$style', readStrings(parts)))
          : const {},
    );
  }
}

/// The previous or next khassida of the same diwan.
class PoemLink {
  const PoemLink({required this.slug, required this.title, required this.number});

  final String slug;
  final String title;
  final int number;

  static PoemLink? fromJson(Object? json) {
    if (json is! Map<String, dynamic>) return null;
    return PoemLink(slug: readString(json['slug']), title: readString(json['title']), number: readInt(json['number']));
  }
}

/// A full khassida: GET /api/v1/diwans/diwan-01/poems/008/.
class PoemDetail {
  const PoemDetail({
    required this.summary,
    required this.acrosticMatch,
    required this.incipit,
    required this.diwanNumber,
    required this.diwanSlug,
    required this.diwanTitle,
    required this.lines,
    required this.previous,
    required this.next,
  });

  final PoemSummary summary;
  final int? acrosticMatch;
  final String incipit;
  final int diwanNumber;
  final String diwanSlug;
  final String diwanTitle;
  final List<PoemLine> lines;
  final PoemLink? previous;
  final PoemLink? next;

  factory PoemDetail.fromJson(Map<String, dynamic> json) {
    final diwan = json['diwan'] as Map<String, dynamic>? ?? const {};
    return PoemDetail(
      summary: PoemSummary.fromJson(json),
      acrosticMatch: readIntOrNull(json['acrostic_match']),
      incipit: readString(json['incipit']),
      diwanNumber: readInt(diwan['number']),
      diwanSlug: readString(diwan['slug']),
      diwanTitle: readString(diwan['title']),
      lines: (json['lines'] as List<dynamic>? ?? const [])
          .map((e) => PoemLine.fromJson(e as Map<String, dynamic>))
          .toList(),
      previous: PoemLink.fromJson(json['previous']),
      next: PoemLink.fromJson(json['next']),
    );
  }
}
