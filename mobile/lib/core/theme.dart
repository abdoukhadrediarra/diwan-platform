import 'package:flutter/material.dart';

/// The platform's colours, the same as on the website.
class DiwanColors {
  static const paper = Color(0xFFF3F4F0);
  static const sheet = Color(0xFFFBFCFA);
  static const ink = Color(0xFF15211D);
  static const muted = Color(0xFF5A6862);
  static const emerald = Color(0xFF0F5A44);
  static const emeraldDark = Color(0xFF0A4533);
  static const gold = Color(0xFFA3803A);
  static const stone = Color(0xFFE3E7E0);
  static const rule = Color(0xFFD3D9D2);
  static const rubric = Color(0xFF9B2C2C); // red ink for acrostic letters
}

const String arabicFont = 'Amiri';
const String wolofalFont = 'Wolofal'; // the Wolof way of writing, developed for this project
const String textFont = 'SourceSans3';

/// The two ways a poem can be shown.
enum ArabicScript {
  classic('Classique', 'عربي', arabicFont, 1.0, 1.0),
  // the Wolofal font is drawn larger and has a narrow space, so its size and spacing are adjusted
  wolofal('Wolofal', 'ولفل', wolofalFont, 1.28, 0.9);

  const ArabicScript(this.label, this.sample, this.family, this.sizeFactor, this.heightFactor);

  final String label;
  final String sample;
  final String family;
  final double sizeFactor;
  final double heightFactor;

  /// Space added between words (in logical pixels) for a given text size.
  double wordSpacing(double size) => this == ArabicScript.wolofal ? size * 0.18 : 0;
}

ThemeData buildDiwanTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: DiwanColors.emerald,
    primary: DiwanColors.emerald,
    secondary: DiwanColors.gold,
    surface: DiwanColors.paper,
    onSurface: DiwanColors.ink,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: DiwanColors.paper,
    fontFamily: textFont,
    appBarTheme: const AppBarTheme(
      backgroundColor: DiwanColors.paper,
      foregroundColor: DiwanColors.ink,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 1,
      titleTextStyle: TextStyle(fontFamily: arabicFont, fontSize: 22, fontWeight: FontWeight.w700, color: DiwanColors.ink),
    ),
    dividerTheme: const DividerThemeData(color: DiwanColors.rule, thickness: 1, space: 1),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: DiwanColors.emerald,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
        textStyle: const TextStyle(fontFamily: textFont, fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: DiwanColors.ink,
        side: const BorderSide(color: DiwanColors.rule),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: const BorderSide(color: DiwanColors.rule)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: const BorderSide(color: DiwanColors.rule)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: const BorderSide(color: DiwanColors.emerald, width: 2)),
    ),
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? Colors.white : null),
      trackColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? DiwanColors.emerald : null),
    ),
  );
}

/// Text style for Arabic, in the script the reader chose. Amiri and Wolofal are not drawn
/// at the same size, so the size and the line height follow the script.
TextStyle arabicStyle({
  double size = 22,
  FontWeight weight = FontWeight.w400,
  Color color = DiwanColors.ink,
  double height = 1.9,
  ArabicScript script = ArabicScript.classic,
}) {
  return TextStyle(
    fontFamily: script.family,
    fontSize: size * script.sizeFactor,
    fontWeight: weight,
    color: color,
    height: height * script.heightFactor,
    wordSpacing: script.wordSpacing(size * script.sizeFactor),
  );
}
