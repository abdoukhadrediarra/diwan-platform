// Replaces the default test created by `flutter create` (which refers to a counter app that no longer exists).
import 'package:flutter_test/flutter_test.dart';

import 'package:diwan_app/core/arabic.dart';
import 'package:diwan_app/core/format.dart';
import 'package:diwan_app/data/models/poem.dart';

void main() {
  test('normalizeArabic removes the tashkeel and unifies letters (same rule as the backend)', () {
    expect(normalizeArabic('الْقُرْآنِ'), 'القران');
    expect(normalizeArabic('القرءان'), 'القران');
    expect(normalizeArabic('إِلَى'), 'الي');
    expect(normalizeArabic('رَحْمَةً'), 'رحمه');
  });

  test('splitInitial keeps a joining letter attached to its word', () {
    final joining = splitInitial('عُذْتُ بِرَبِّيَ');
    expect(joining.initial, 'عُ');
    expect(joining.joiner, '\u200D');
    expect(joining.rest, 'ذْتُ بِرَبِّيَ');

    final nonJoining = splitInitial('وَصَلَ لِي');
    expect(nonJoining.initial, 'وَ');
    expect(nonJoining.joiner, '');
  });

  test('formatNumber uses French thousands separators', () {
    expect(formatNumber(40248), '40\u202F248');
    expect(formatNumber(7), '7');
    expect(plural(1, 'khassida', 'khassaïdes'), '1 khassida');
  });

  test('PoemLine reads the API JSON, including the transcription', () {
    final line = PoemLine.fromJson({
      'position': 3,
      'section': 'matn',
      'kind': 'bayt',
      'bayt_number': 1,
      'hemistichs': ['إِلَيَّ وَحْدِي سَلَبَ الْقُرْآنَا', 'مَنْ كَوْنُهُ لِي بِالْمُنَى قَدْ آنَا'],
      'transcription': {
        'local': ["ilayya wahdî salabal qour'ânâ", 'man kawnouhou lî bil mounâ qad ânâ'],
      },
    });
    expect(line.isBayt, isTrue);
    expect(line.baytNumber, 1);
    expect(line.localTranscription.first, "ilayya wahdî salabal qour'ânâ");
  });
}
