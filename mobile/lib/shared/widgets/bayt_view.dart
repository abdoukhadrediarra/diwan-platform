import 'package:flutter/material.dart';

import '../../core/arabic.dart';
import '../../core/settings.dart';
import '../../core/theme.dart';
import '../../data/models/poem.dart';

/// One bayt: its number, its hemistichs (side by side on wide screens, one under the other on phones),
/// the first letter in red when the poem's name is an acrostic, and the transcription if asked.
class BaytView extends StatelessWidget {
  const BaytView({super.key, required this.line, required this.highlightInitial, required this.showTranscription});

  final PoemLine line;
  final bool highlightInitial;
  final bool showTranscription;

  static const double _numberWidth = 30;

  @override
  Widget build(BuildContext context) {
    final script = SettingsScope.of(context).script;
    return LayoutBuilder(builder: (context, constraints) {
      final wide = constraints.maxWidth >= 560;
      final fontSize = wide ? 24.0 : 21.0;
      final hemistichs = <Widget>[
        for (var i = 0; i < line.hemistichs.length; i++)
          _hemistich(line.hemistichs[i], first: i == 0, size: fontSize, align: wide ? TextAlign.center : TextAlign.right, script: script),
      ];

      final Widget text = wide
          ? Row(
              textDirection: TextDirection.rtl,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [for (final h in hemistichs) Expanded(child: h)],
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                for (var i = 0; i < hemistichs.length; i++)
                  Padding(padding: EdgeInsets.only(right: i == 0 ? 0 : 22), child: hemistichs[i]),
              ],
            );

      final parts = line.localTranscription;
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              textDirection: TextDirection.rtl, // the number sits on the right, where the Arabic line starts
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: _numberWidth,
                  child: Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Text('${line.baytNumber ?? ''}', textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, color: DiwanColors.muted)),
                  ),
                ),
                Expanded(child: text),
              ],
            ),
            if (showTranscription && parts.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(right: _numberWidth, bottom: 10),
                child: wide
                    ? Text(parts.join('   |   '), textAlign: TextAlign.center, style: _transcriptionStyle)
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [for (final p in parts) Text(p, style: _transcriptionStyle)],
                      ),
              ),
          ],
        ),
      );
    });
  }

  static const TextStyle _transcriptionStyle = TextStyle(fontSize: 15, color: Color(0xFF44524D), height: 1.45);

  Widget _hemistich(String text, {required bool first, required double size, required TextAlign align, required ArabicScript script}) {
    final style = arabicStyle(size: size, height: 2.0, script: script);
    if (!(first && highlightInitial)) {
      return Text(text, textDirection: TextDirection.rtl, textAlign: align, style: style);
    }
    final split = splitInitial(text);
    return Text.rich(
      TextSpan(
        style: style,
        children: [
          TextSpan(text: split.initial + split.joiner, style: const TextStyle(color: DiwanColors.rubric)),
          TextSpan(text: split.joiner + split.rest),
        ],
      ),
      textDirection: TextDirection.rtl,
      textAlign: align,
    );
  }
}
