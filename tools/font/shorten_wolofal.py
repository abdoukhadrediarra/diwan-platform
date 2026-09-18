"""
tools/font/shorten_wolofal.py

The Wolofal letters have long tails. When a tail runs into the next word, the fix a Wolofal
writer makes by hand is to use the SHORT version of that letter — the one you get in this font
by typing the letter three times.

This tool does the same thing automatically: it finds where a tail collides, checks that the
short version clears it, and adds a rule to the font so the short version is used **only in that
situation**. Nothing is moved apart, so the words keep their normal spacing.

    pip install fonttools uharfbuzz shapely
    python shorten_wolofal.py wolofal-regular.ttf --text corpus.txt --out wolofal-smart.ttf
"""
import argparse
import re
import unicodedata
from collections import defaultdict

from fontTools.otlLib.builder import buildCoverage, buildLookup, buildSingleSubstSubtable
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables import otTables
from shapely import affinity

from fix_wolofal import FontShaper

FORM_RE = re.compile(r'ARABIC LETTER ([A-Z ]+?)(?: (ISOLATED|FINAL|INITIAL|MEDIAL) FORM)?$')


def letter_and_form(shaper, glyph):
    code = shaper.reverse_cmap.get(glyph)
    if not code:
        return None, None
    m = FORM_RE.match(unicodedata.name(chr(code), ''))
    return (m.group(1).strip(), m.group(2) or 'ISOLATED') if m else (None, None)


def find_short_variants(shaper):
    """{long glyph: short glyph}, read from the font's own "type the letter three times" ligatures."""
    gsub = shaper.tt['GSUB'].table
    by_letter = defaultdict(dict)          # letter -> {'ISOLATED': glyph, 'FINAL': glyph}
    for lookup in gsub.LookupList.Lookup:
        if lookup.LookupType != 4:
            continue
        for sub in lookup.SubTable:
            for first, ligatures in sub.ligatures.items():
                for lig in ligatures:
                    parts = [first] + list(lig.Component)
                    if len(parts) < 3:
                        continue
                    letters = {letter_and_form(shaper, p)[0] for p in parts}
                    if len(letters) != 1 or None in letters:
                        continue
                    letter = letters.pop()
                    start = letter_and_form(shaper, parts[0])[1]
                    # typed on its own it stands alone; typed after another letter it is a final form
                    by_letter[letter]['ISOLATED' if start == 'INITIAL' else 'FINAL'] = lig.LigGlyph

    shorts = {}
    for glyph in shaper.tt.getGlyphOrder():
        letter, form = letter_and_form(shaper, glyph)
        if letter and form in ('ISOLATED', 'FINAL') and form in by_letter.get(letter, {}):
            shorts[glyph] = by_letter[letter][form]
    return shorts


def collect_rules(shaper, lines, shorts, threshold_em=0.012, progress=0):
    """Where the short version is needed: {long glyph: set of glyphs that follow it}."""
    rules = defaultdict(set)
    leftover = defaultdict(int)
    for number, text in enumerate(lines, 1):
        if progress and number % progress == 0:
            print(f'    {number:,} lines read, {sum(len(v) for v in rules.values())} context(s) found', flush=True)
        glyphs, shapes, hits = shaper.collisions(text, threshold_em=threshold_em)
        letters = [k for k, g in enumerate(glyphs) if not shaper.is_mark(g['name'])]
        for i, j, _area in hits:
            tail = glyphs[j]['name']
            if shaper.joins_forward(tail) and letters.index(i) == letters.index(j) - 1:
                continue                                    # joined letters: their ink is meant to meet
            short = shorts.get(tail)
            if short is None:
                leftover[(tail, glyphs[i]['name'])] += 1
                continue
            placed = affinity.translate(shaper.outline(short), xoff=glyphs[j]['x'], yoff=glyphs[j]['y'])
            if placed.intersection(shapes[i]).area > (shaper.upm * threshold_em) ** 2:
                leftover[(tail, glyphs[i]['name'])] += 1     # even the short version still touches
                continue
            following = next((k for k in range(j - 1, -1, -1) if not shaper.is_mark(glyphs[k]['name'])), None)
            if following is not None:
                rules[tail].add(glyphs[following]['name'])
    return rules, leftover


def add_contextual_shortening(tt, rules, shorts):
    """Add: "use the short version of this letter when this glyph follows" to the font's calt feature."""
    gsub = tt['GSUB'].table
    mapping = {long: shorts[long] for long in rules}
    single = buildLookup([buildSingleSubstSubtable(mapping)], flags=0x0008)   # IgnoreMarks
    gsub.LookupList.Lookup.append(single)
    single_index = len(gsub.LookupList.Lookup) - 1

    subtables = []
    for long, followers in sorted(rules.items()):
        sub = otTables.ChainContextSubst()
        sub.Format = 3
        sub.BacktrackGlyphCount = 0
        sub.BacktrackCoverage = []
        sub.InputGlyphCount = 1
        sub.InputCoverage = [buildCoverage([long], tt.getReverseGlyphMap())]
        sub.LookAheadGlyphCount = 1
        sub.LookAheadCoverage = [buildCoverage(followers, tt.getReverseGlyphMap())]
        record = otTables.SubstLookupRecord()
        record.SequenceIndex = 0
        record.LookupListIndex = single_index
        sub.SubstCount = 1
        sub.SubstLookupRecord = [record]
        subtables.append(sub)

    chain = buildLookup(subtables, flags=0x0008)
    gsub.LookupList.Lookup.append(chain)
    gsub.LookupList.LookupCount = len(gsub.LookupList.Lookup)
    chain_index = len(gsub.LookupList.Lookup) - 1

    # run it inside "calt", which the Arabic shaper applies after the joining forms are chosen
    tags = [r.FeatureTag for r in gsub.FeatureList.FeatureRecord]
    if 'calt' in tags:
        for record in gsub.FeatureList.FeatureRecord:
            if record.FeatureTag == 'calt':
                record.Feature.LookupListIndex.append(chain_index)
                record.Feature.LookupCount = len(record.Feature.LookupListIndex)
    else:
        feature = otTables.Feature()
        feature.FeatureParams = None
        feature.LookupListIndex = [chain_index]
        feature.LookupCount = 1
        record = otTables.FeatureRecord()
        record.FeatureTag = 'calt'
        record.Feature = feature
        gsub.FeatureList.FeatureRecord.append(record)
        gsub.FeatureList.FeatureCount = len(gsub.FeatureList.FeatureRecord)
        index = len(gsub.FeatureList.FeatureRecord) - 1
        for script in gsub.ScriptList.ScriptRecord:
            systems = [script.Script.DefaultLangSys] + [r.LangSys for r in script.Script.LangSysRecord]
            for system in systems:
                if system is not None:
                    system.FeatureIndex.append(index)
                    system.FeatureCount = len(system.FeatureIndex)


def main():
    ap = argparse.ArgumentParser(description='Use the short Wolofal letters where the long tails collide.')
    ap.add_argument('font')
    ap.add_argument('--text', action='append', default=[])
    ap.add_argument('--out', default='wolofal-smart.ttf')
    ap.add_argument('--passes', type=int, default=3)
    ap.add_argument('--progress', type=int, default=2000, help='print a line every N lines read (0 to keep quiet)')
    args = ap.parse_args()

    lines = []
    for path in args.text:
        with open(path, encoding='utf-8') as fh:
            lines += [l.strip() for l in fh if l.strip()]
    if not lines:
        lines = ['أَسْأَلُهُ الصِّدْقَ مَعَ الْوَفَاءِ']

    shorts = find_short_variants(FontShaper(args.font))
    print(f'{len(shorts)} letters have a short version in the font.')

    all_rules, leftover, source = defaultdict(set), {}, args.font
    for attempt in range(1, args.passes + 1):
        shaper = FontShaper(source)
        rules, leftover = collect_rules(shaper, lines, shorts, progress=args.progress)
        added = sum(len(v - all_rules[k]) for k, v in rules.items())
        if not added:
            print(f'pass {attempt}: nothing more to shorten.')
            break
        for long, followers in rules.items():
            all_rules[long] |= followers
        fresh = TTFont(args.font)
        add_contextual_shortening(fresh, all_rules, shorts)
        fresh.save(args.out)
        source = args.out
        print(f'pass {attempt}: {added} new context(s); {sum(len(v) for v in all_rules.values())} in total.')

    print('\nshortened letters:')
    for long, followers in sorted(all_rules.items()):
        print(f'  {long} → {shorts[long]}   before {len(followers)} different glyph(s)')

    after = FontShaper(args.out)
    remaining = defaultdict(int)
    for text in lines:
        glyphs, _shapes, hits = after.collisions(text)
        letters = [k for k, g in enumerate(glyphs) if not after.is_mark(g['name'])]
        for i, j, _a in hits:
            if after.joins_forward(glyphs[j]['name']) and letters.index(i) == letters.index(j) - 1:
                continue
            remaining[(glyphs[j]['name'], glyphs[i]['name'])] += 1
    print(f'\nwritten: {args.out}')
    print(f'collisions left: {sum(remaining.values())}')
    for (a, b), n in sorted(remaining.items(), key=lambda kv: -kv[1])[:12]:
        print(f'  {a} → {b}   ({n})')
    if leftover:
        print('\nNo short version available (or the short one still touches):')
        for (a, b), n in sorted(leftover.items(), key=lambda kv: -kv[1])[:12]:
            print(f'  {a} → {b}   ({n})')


if __name__ == '__main__':
    main()
