import 'package:flutter/material.dart';

import '../../core/settings.dart';
import '../../core/theme.dart';

/// Arabic text, always right to left, in the Amiri font.
class ArabicText extends StatelessWidget {
  const ArabicText(
    this.text, {
    super.key,
    this.size = 22,
    this.weight = FontWeight.w400,
    this.color = DiwanColors.ink,
    this.align = TextAlign.center,
    this.height = 1.9,
    this.maxLines,
    this.script,
  });

  final String text;
  final double size;
  final FontWeight weight;
  final Color color;
  final TextAlign align;
  final double height;
  final int? maxLines;

  /// The script to use. When left out, the one the reader chose in the settings.
  final ArabicScript? script;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      textDirection: TextDirection.rtl,
      textAlign: align,
      maxLines: maxLines,
      overflow: maxLines == null ? null : TextOverflow.ellipsis,
      style: arabicStyle(size: size, weight: weight, color: color, height: height,
          script: script ?? SettingsScope.of(context).script),
    );
  }
}
