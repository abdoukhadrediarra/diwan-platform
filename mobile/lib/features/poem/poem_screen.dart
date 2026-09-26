import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/format.dart';
import '../../core/settings.dart';
import '../../core/theme.dart';
import '../../data/models/poem.dart';
import '../../shared/widgets/arabic_text.dart';
import '../../shared/widgets/bayt_view.dart';
import '../../shared/widgets/message_view.dart';
import '../../shared/widgets/script_toggle.dart';

/// One khassida: its name, opening text, abyat, closing text, transcription and neighbours.
class PoemScreen extends StatefulWidget {
  const PoemScreen({super.key, required this.diwanSlug, required this.poemSlug});

  final String diwanSlug;
  final String poemSlug;

  @override
  State<PoemScreen> createState() => _PoemScreenState();
}

class _PoemScreenState extends State<PoemScreen> {
  Future<PoemDetail>? _poem;
  String? _apiUrl;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final url = SettingsScope.of(context).apiBaseUrl;
    if (url != _apiUrl) {
      _apiUrl = url;
      _poem = _fetch();
    }
  }

  Future<PoemDetail> _fetch() => ApiClient(_apiUrl!).poem(widget.diwanSlug, widget.poemSlug);

  void _reload() => setState(() => _poem = _fetch());

  void _open(PoemLink link) {
    Navigator.of(context).pushReplacement(MaterialPageRoute<void>(
      builder: (_) => PoemScreen(diwanSlug: widget.diwanSlug, poemSlug: link.slug),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final settings = SettingsScope.of(context);
    return FutureBuilder<PoemDetail>(
      future: _poem,
      builder: (context, snapshot) {
        final poem = snapshot.data;
        return Scaffold(
          appBar: AppBar(
            title: Text(poem == null ? 'Khassida' : 'Khassida ${poem.summary.number}'),
            actions: [
              IconButton(
                tooltip: settings.showTranscription ? 'Masquer la transcription' : 'Afficher la transcription',
                isSelected: settings.showTranscription,
                icon: const Icon(Icons.translate_outlined),
                selectedIcon: const Icon(Icons.translate, color: DiwanColors.emerald),
                onPressed: () => settings.setShowTranscription(!settings.showTranscription),
              ),
            ],
          ),
          body: _body(snapshot, settings.showTranscription),
        );
      },
    );
  }

  Widget _body(AsyncSnapshot<PoemDetail> snapshot, bool showTranscription) {
    if (snapshot.connectionState != ConnectionState.done) {
      return const Center(child: CircularProgressIndicator());
    }
    if (snapshot.hasError) {
      return MessageView.forError(
        snapshot.error,
        onRetry: _reload,
        notFoundMessage: 'Ce poème n\u2019est pas encore en ligne. Il paraîtra ici dès qu\u2019il aura été relu et importé.',
      );
    }
    final poem = snapshot.requireData;
    final lines = poem.lines;
    // item 0: header; then one item per line; last item: previous / next
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 28),
      itemCount: lines.length + 2,
      itemBuilder: (context, index) {
        if (index == 0) return _PoemHeader(poem: poem, showTranscription: showTranscription);
        if (index == lines.length + 1) return _Neighbours(poem: poem, onOpen: _open);
        final line = lines[index - 1];
        final previous = index > 1 ? lines[index - 2] : null;
        final newSection = previous != null && previous.section != line.section;
        return _Sheet(
          first: index == 1,
          last: index == lines.length,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (newSection) const Padding(padding: EdgeInsets.symmetric(vertical: 10), child: Divider()),
              if (line.isBayt)
                BaytView(line: line, highlightInitial: poem.summary.isAcrostic, showTranscription: showTranscription)
              else
                _ProseLine(line: line, acrostic: poem.summary.isAcrostic, showTranscription: showTranscription),
            ],
          ),
        );
      },
    );
  }
}

/// The text is set on a light "sheet", like a printed diwan page. Each line is one piece of the sheet.
class _Sheet extends StatelessWidget {
  const _Sheet({required this.child, required this.first, required this.last});

  final Widget child;
  final bool first;
  final bool last;

  @override
  Widget build(BuildContext context) {
    const side = BorderSide(color: DiwanColors.rule);
    return Container(
      padding: EdgeInsets.fromLTRB(12, first ? 18 : 0, 12, last ? 18 : 0),
      decoration: BoxDecoration(
        color: DiwanColors.sheet,
        border: Border(left: side, right: side, top: first ? side : BorderSide.none, bottom: last ? side : BorderSide.none),
      ),
      child: child,
    );
  }
}

class _PoemHeader extends StatelessWidget {
  const _PoemHeader({required this.poem, required this.showTranscription});

  final PoemDetail poem;
  final bool showTranscription;

  @override
  Widget build(BuildContext context) {
    final settings = SettingsScope.of(context);
    final s = poem.summary;
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 8, 4, 18),
      child: Column(
        children: [
          ArabicText(poem.diwanTitle, size: 19, color: DiwanColors.emerald, height: 1.5),
          Text('Khassida ${s.number}, ${formatNumber(s.baytCount)} abyat', style: const TextStyle(color: DiwanColors.muted)),
          const SizedBox(height: 10),
          ArabicText(s.title, size: 32, weight: FontWeight.w700, height: 1.6),
          if (s.isAcrostic)
            const Padding(
              padding: EdgeInsets.only(top: 6),
              child: Text(
                'Acrostiche : les premières lettres des abyat, en rouge, forment le nom du poème.',
                textAlign: TextAlign.center,
                style: TextStyle(color: DiwanColors.muted, height: 1.4),
              ),
            ),
          const SizedBox(height: 14),
          const ScriptToggle(),
          const SizedBox(height: 4),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Afficher la transcription', style: TextStyle(fontWeight: FontWeight.w600)),
            subtitle: const Text('En caractères latins, sous chaque ligne'),
            value: showTranscription,
            onChanged: settings.setShowTranscription,
          ),
        ],
      ),
    );
  }
}

class _ProseLine extends StatelessWidget {
  const _ProseLine({required this.line, required this.acrostic, required this.showTranscription});

  final PoemLine line;
  final bool acrostic;
  final bool showTranscription;

  @override
  Widget build(BuildContext context) {
    final isTitle = line.kind == 'title';
    // a grouped acrostic ("اللام"...): the header names the letter every bayt below it
    // starts with, until the next header. Styled like the title, one size smaller.
    final isHeader = line.kind == 'header';
    final parts = line.localTranscription;
    final text = line.hemistichs.join(' ');
    final style = arabicStyle(
      size: isTitle ? 26 : (isHeader ? 20 : 22),
      weight: isTitle || isHeader ? FontWeight.w700 : FontWeight.w400,
      color: (isTitle || isHeader) && acrostic ? DiwanColors.rubric : DiwanColors.ink,
      height: 2.0,
      script: SettingsScope.of(context).script,
    );
    return Padding(
      padding: EdgeInsets.only(top: isHeader ? 18 : 6, bottom: 6),
      child: Column(children: [
        // the acrostic name marked in bold inside an ordinary opening paragraph (rather than its
        // own line): only that exact span turns red, the rest of the sentence stays as written
        line.acrosticSpans.isEmpty
            ? Text(text, textDirection: TextDirection.rtl, textAlign: TextAlign.center, style: style)
            : Text.rich(_highlighted(text, line.acrosticSpans, style),
                textDirection: TextDirection.rtl, textAlign: TextAlign.center),
        if (showTranscription && parts.isNotEmpty)
          Text(parts.join(' '), textAlign: TextAlign.center, style: const TextStyle(fontSize: 15, color: Color(0xFF44524D), height: 1.45)),
      ]),
    );
  }

  /// Splits [text] around each of [spans], colouring only those parts red — the untouched
  /// prose around them keeps its normal style.
  TextSpan _highlighted(String text, List<String> spans, TextStyle style) {
    final children = <TextSpan>[];
    var rest = text;
    for (final span in spans) {
      final i = rest.indexOf(span);
      if (i == -1) continue; // not found in the remaining text (shouldn't happen): leave it plain
      if (i > 0) children.add(TextSpan(text: rest.substring(0, i)));
      children.add(TextSpan(text: span, style: const TextStyle(color: DiwanColors.rubric)));
      rest = rest.substring(i + span.length);
    }
    if (rest.isNotEmpty) children.add(TextSpan(text: rest));
    return TextSpan(style: style, children: children.isEmpty ? [TextSpan(text: text)] : children);
  }
}

class _Neighbours extends StatelessWidget {
  const _Neighbours({required this.poem, required this.onOpen});

  final PoemDetail poem;
  final void Function(PoemLink) onOpen;

  @override
  Widget build(BuildContext context) {
    if (poem.previous == null && poem.next == null) return const SizedBox(height: 8);
    return Padding(
      padding: const EdgeInsets.only(top: 20),
      child: Row(children: [
        Expanded(child: poem.previous == null ? const SizedBox.shrink() : _link(poem.previous!, 'Khassida précédente', CrossAxisAlignment.start)),
        const SizedBox(width: 12),
        Expanded(child: poem.next == null ? const SizedBox.shrink() : _link(poem.next!, 'Khassida suivante', CrossAxisAlignment.end)),
      ]),
    );
  }

  Widget _link(PoemLink link, String label, CrossAxisAlignment alignment) {
    return InkWell(
      onTap: () => onOpen(link),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: const BoxDecoration(border: Border(top: BorderSide(color: DiwanColors.gold))),
        child: Column(crossAxisAlignment: alignment, children: [
          Text(label, style: const TextStyle(fontSize: 13, color: DiwanColors.muted)),
          ArabicText(link.title, size: 18, color: DiwanColors.emerald, height: 1.6, maxLines: 2,
              align: alignment == CrossAxisAlignment.start ? TextAlign.left : TextAlign.right),
        ]),
      ),
    );
  }
}
