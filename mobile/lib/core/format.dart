/// French number format: 40 248 (narrow no-break space between thousands).
String formatNumber(int value) {
  final digits = value.abs().toString();
  final buffer = StringBuffer(value < 0 ? '-' : '');
  for (var i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 == 0) buffer.write('\u202F');
    buffer.write(digits[i]);
  }
  return buffer.toString();
}

/// "1 khassida", "12 khassaïdes".
String plural(int count, String one, String many) => '${formatNumber(count)} ${count > 1 ? many : one}';
