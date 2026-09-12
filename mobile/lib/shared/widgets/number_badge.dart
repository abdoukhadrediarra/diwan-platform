import 'package:flutter/material.dart';

import '../../core/theme.dart';

/// A number in a thin gold circle (diwan numbers), as on the website.
class NumberBadge extends StatelessWidget {
  const NumberBadge(this.number, {super.key, this.size = 38});

  final int number;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: DiwanColors.gold)),
      child: Text(
        '$number',
        style: TextStyle(fontFamily: arabicFont, fontSize: size * 0.45, fontWeight: FontWeight.w700, color: DiwanColors.emerald, height: 1.2),
      ),
    );
  }
}
