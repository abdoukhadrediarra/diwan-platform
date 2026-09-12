import 'package:flutter/material.dart';

import '../../core/settings.dart';
import '../../core/theme.dart';

/// Lets the reader choose the classical letterforms or the Wolofal ones.
/// The choice is kept on the phone and applies to every poem.
class ScriptToggle extends StatelessWidget {
  const ScriptToggle({super.key});

  @override
  Widget build(BuildContext context) {
    final settings = SettingsScope.of(context);
    return Wrap(
      spacing: 8,
      alignment: WrapAlignment.center,
      children: [
        for (final script in ArabicScript.values)
          ChoiceChip(
            selected: settings.script == script,
            onSelected: (_) => settings.setScript(script),
            showCheckmark: false,
            selectedColor: DiwanColors.emerald,
            backgroundColor: Colors.white,
            side: const BorderSide(color: DiwanColors.rule),
            labelStyle: TextStyle(
              fontWeight: FontWeight.w600,
              color: settings.script == script ? Colors.white : DiwanColors.ink,
            ),
            label: Row(mainAxisSize: MainAxisSize.min, children: [
              Text(script.label),
              const SizedBox(width: 8),
              Text(
                script.sample,
                textDirection: TextDirection.rtl,
                style: arabicStyle(
                  size: 17,
                  height: 1.1,
                  color: settings.script == script ? Colors.white : DiwanColors.ink,
                  script: script,
                ),
              ),
            ]),
          ),
      ],
    );
  }
}
