/// Arabic helpers shared by the screens (same rules as the website and the backend).
library;

final RegExp _marks = RegExp('[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640\u200E\u200F]');

/// Removes the tashkeel and unifies letter forms, so "الْقُرْآنِ" is found by typing "القران".
String normalizeArabic(String text) {
  return text
      .replaceAll(_marks, '')
      .replaceAll(RegExp('[\u0621\u0626]\u0627'), '\u0627')
      .replaceAll(RegExp('[\u0623\u0625\u0622\u0671]'), '\u0627')
      .replaceAll('\u0624', '\u0648')
      .replaceAll('\u0626', '\u064A')
      .replaceAll('\u0621', '')
      .replaceAll('\u0649', '\u064A')
      .replaceAll('\u0629', '\u0647')
      .replaceAll(RegExp(r'\s+'), ' ')
      .trim();
}

/// The first letter of a sadr (with its harakat), split from the rest, to colour acrostic letters.
class InitialSplit {
  const InitialSplit(this.initial, this.joiner, this.rest);

  final String initial;

  /// A zero-width joiner when the letter connects to the next one, so colouring it does not break the word.
  final String joiner;
  final String rest;
}

const String _nonJoining = '\u0627\u0623\u0625\u0622\u0671\u062F\u0630\u0631\u0632\u0648\u0624\u0629\u0621';
final RegExp _initialPattern = RegExp('^([\u0621-\u064A][\u064B-\u065F\u0670]*)([\\s\\S]*)\$');
final RegExp _startsWithLetter = RegExp('^[\u0621-\u064A]');

InitialSplit splitInitial(String sadr) {
  final match = _initialPattern.firstMatch(sadr);
  if (match == null) return InitialSplit('', '', sadr);
  final initial = match.group(1)!;
  final rest = match.group(2)!;
  final joins = !_nonJoining.contains(initial[0]) && _startsWithLetter.hasMatch(rest);
  return InitialSplit(initial, joins ? '\u200D' : '', rest);
}
