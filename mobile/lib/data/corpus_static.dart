/// Titles and figures of the 7 diwans, always available (even without a connection).
/// Counted on the complete text of the corpus; the number of poems online comes from the API.
class StaticDiwan {
  const StaticDiwan(this.number, this.title, this.abyat, this.hemistichs, this.words);

  final int number;
  final String title;
  final int abyat;
  final int hemistichs;
  final int words;

  String get slug => 'diwan-${number.toString().padLeft(2, '0')}';
}

const List<StaticDiwan> staticDiwans = [
  StaticDiwan(1, 'ديوان القرآنية', 5588, 11203, 65700),
  StaticDiwan(2, 'ديوان الأمداح النبوية', 6059, 13156, 71121),
  StaticDiwan(3, 'مراقي الأمن والسعادة', 3840, 7680, 44631),
  StaticDiwan(4, 'الفيوضات الربانية بالأعوام والشهور', 5523, 11046, 67682),
  StaticDiwan(5, 'القصائد المطرزة بغير الآيات القرآنية', 5387, 10774, 69448),
  StaticDiwan(6, 'الفيوضات الربانية في الذكر والشكر والتحدث بالنعم الإلهية', 4857, 9714, 57324),
  StaticDiwan(7, 'الفلك المشحون', 8994, 17988, 85164),
];

const int corpusPages = 1455;

int get totalAbyat => staticDiwans.fold(0, (sum, d) => sum + d.abyat);
int get totalHemistichs => staticDiwans.fold(0, (sum, d) => sum + d.hemistichs);
int get totalWords => staticDiwans.fold(0, (sum, d) => sum + d.words);
