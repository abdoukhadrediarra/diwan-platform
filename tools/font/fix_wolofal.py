"""
tools/font/fix_wolofal.py

The Wolofal letters have long tails, so a tail sometimes runs into the letter that follows.
This tool finds those collisions automatically and repairs the ones that can be repaired
without touching the drawing: it adds spacing (an OpenType `kern` feature) between the two
letters, exactly as much as needed to clear the ink.

    python fix_wolofal.py wolofal-regular.ttf --text corpus.txt --out wolofal-spaced.ttf

Two letters that are joined by the cursive stroke are never moved apart (that would break the
word). Those cases are listed at the end: they need a shorter tail in the drawing itself.
"""
import argparse
import unicodedata
from collections import defaultdict

import uharfbuzz as hb
from fontTools.otlLib.builder import PairPosBuilder, buildValue
from fontTools.pens.recordingPen import RecordingPen
from fontTools.ttLib.tables import otTables
from fontTools.ttLib import TTFont
from shapely import affinity
from shapely.geometry import Polygon
from shapely.ops import unary_union

JOINING_FORMS = ('INITIAL FORM', 'MEDIAL FORM')   # a letter drawn joined to the next one


class FontShaper:
    def __init__(self, path):
        self.tt = TTFont(path)
        self.upm = self.tt['head'].unitsPerEm
        self.order = self.tt.getGlyphOrder()
        self.glyphset = self.tt.getGlyphSet()
        self.reverse_cmap = {g: c for c, g in self.tt.getBestCmap().items()}
        blob = hb.Blob.from_file_path(path)
        self.hb_font = hb.Font(hb.Face(blob))
        self._outlines = {}

    # ---------------------------------------------------------------- outlines
    def outline(self, name):
        if name in self._outlines:
            return self._outlines[name]
        pen = RecordingPen()
        self.glyphset[name].draw(pen)
        contours, cur = [], []
        for op, args in pen.value:
            if op == 'moveTo':
                if len(cur) > 2:
                    contours.append(cur)
                cur = [tuple(args[0])]
            elif op == 'lineTo':
                cur.append(tuple(args[0]))
            elif op == 'qCurveTo':
                prev = cur[-1] if cur else tuple(args[0])
                pts = [tuple(a) for a in args if a is not None]
                for i, c in enumerate(pts):
                    e = pts[i + 1] if i + 1 < len(pts) else pts[-1]
                    for k in range(1, 5):
                        t = k / 4
                        cur.append(((1 - t) ** 2 * prev[0] + 2 * (1 - t) * t * c[0] + t * t * e[0],
                                    (1 - t) ** 2 * prev[1] + 2 * (1 - t) * t * c[1] + t * t * e[1]))
                    prev = cur[-1]
            elif op == 'curveTo':
                prev = cur[-1] if cur else tuple(args[0])
                c1, c2, e = (tuple(a) for a in args)
                for k in range(1, 9):
                    t = k / 8
                    cur.append(((1 - t) ** 3 * prev[0] + 3 * (1 - t) ** 2 * t * c1[0] + 3 * (1 - t) * t * t * c2[0] + t ** 3 * e[0],
                                (1 - t) ** 3 * prev[1] + 3 * (1 - t) ** 2 * t * c1[1] + 3 * (1 - t) * t * t * c2[1] + t ** 3 * e[1]))
            elif op == 'closePath' and len(cur) > 2:
                contours.append(cur)
                cur = []
        if len(cur) > 2:
            contours.append(cur)
        polys = []
        for c in contours:
            p = Polygon(c)
            if not p.is_valid:
                p = p.buffer(0)
            if not p.is_empty:
                polys.append(p)
        shape = unary_union(polys) if polys else Polygon()
        self._outlines[name] = shape
        return shape

    def unicode_name(self, glyph):
        code = self.reverse_cmap.get(glyph)
        return unicodedata.name(chr(code), '') if code else ''

    def joins_forward(self, glyph):
        """True when this glyph is drawn attached to the letter that follows it."""
        return any(form in self.unicode_name(glyph) for form in JOINING_FORMS)

    def is_mark(self, glyph):
        """A haraka (including the shadda+vowel ligatures), read from the font's own GDEF classes."""
        classes = getattr(self, '_mark_classes', None)
        if classes is None:
            gdef = self.tt['GDEF'].table if 'GDEF' in self.tt else None
            classes = gdef.GlyphClassDef.classDefs if gdef and gdef.GlyphClassDef else {}
            self._mark_classes = classes
        if glyph in classes:
            return classes[glyph] == 3
        code = self.reverse_cmap.get(glyph)
        return bool(code) and unicodedata.category(chr(code)) == 'Mn'

    # ---------------------------------------------------------------- shaping
    def shape(self, text, kerning=None):
        """Glyphs of a line, in the order they appear on screen (left to right)."""
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        hb.shape(self.hb_font, buf)
        out, x = [], 0
        previous = None
        for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
            name = self.order[info.codepoint]
            advance = pos.x_advance
            if kerning and previous is not None:
                # in a right-to-left line, the glyph drawn later is the one written first
                x += kerning.get((name, previous), 0)
            out.append({'name': name, 'x': x + pos.x_offset, 'y': pos.y_offset})
            x += advance
            if not self.is_mark(name):
                previous = name
        return out

    def collisions(self, text, kerning=None, threshold_em=0.012):
        glyphs = self.shape(text, kerning)
        shapes = []
        for g in glyphs:
            s = self.outline(g['name'])
            shapes.append(affinity.translate(s, xoff=g['x'], yoff=g['y']) if not s.is_empty else s)
        min_area = (self.upm * threshold_em) ** 2
        hits = []
        for i, si in enumerate(shapes):
            if si.is_empty or self.is_mark(glyphs[i]['name']):
                continue
            for j in range(i + 1, min(i + 8, len(glyphs))):
                sj = shapes[j]
                if sj.is_empty or self.is_mark(glyphs[j]['name']):
                    continue
                inter = si.intersection(sj)
                if not inter.is_empty and inter.area > min_area:
                    hits.append((i, j, inter.area / self.upm ** 2))
        return glyphs, shapes, hits

    def needed_shift(self, left_shape, right_shape, margin):
        """How far the left glyph must move left to clear the right one (plus a margin)."""
        low, high = 0, self.upm
        for _ in range(14):
            mid = (low + high) / 2
            moved = affinity.translate(left_shape, xoff=-mid)
            if moved.distance(right_shape) >= margin or moved.intersection(right_shape).is_empty and moved.distance(right_shape) >= margin:
                high = mid
            else:
                low = mid
        return high


def breakable(shaper, glyphs, index):
    """True when the gap between glyph `index` and the next one on its left can be widened
    (the two letters are not joined by the cursive stroke)."""
    right = glyphs[index]['name']          # written first, drawn on the right
    return not shaper.joins_forward(right)


def find_pairs(shaper, lines, margin_em=0.03, threshold_em=0.012, progress=0):
    """Spacing to add for each pair of glyphs, and the collisions that spacing cannot fix.

    In a right-to-left line, widening the gap is done in one of two ways:
      * when a space separates the two letters, the space itself is made wider (X advance);
      * otherwise the first letter is moved away and its cell widened (X placement + X advance).
    """
    needed = defaultdict(lambda: (0.0, False))
    unfixable = defaultdict(int)
    margin = shaper.upm * margin_em
    for number, text in enumerate(lines, 1):
        if progress and number % progress == 0:
            print(f'    {number:,} lines read, {len(needed)} pair(s) found', flush=True)
        glyphs, shapes, hits = shaper.collisions(text, threshold_em=threshold_em)
        letters = [k for k, g in enumerate(glyphs) if not shaper.is_mark(g['name'])]
        for i, j, _area in hits:
            if shaper.joins_forward(glyphs[j]['name']) and letters.index(i) == letters.index(j) - 1:
                continue                    # letters joined by the stroke: the ink is meant to meet
            shift = shaper.needed_shift(shapes[i], shapes[j], margin)
            if shift <= 0:
                continue
            # widen the gap right after the letter whose tail is too long: that way the extra space
            # only appears after this letter, not after every word
            spot = next((k for k in range(j, i, -1)
                         if not shaper.is_mark(glyphs[k]['name']) and breakable(shaper, glyphs, k)), None)
            if spot is None:
                unfixable[(glyphs[j]['name'], glyphs[i]['name'])] += 1
                continue
            nxt = next(k for k in range(spot - 1, i - 1, -1) if not shaper.is_mark(glyphs[k]['name']))
            # a space has no ink of its own: widening it is enough. A letter must also be moved back.
            move_ink = glyphs[spot]['name'] != 'space'
            key = (glyphs[spot]['name'], glyphs[nxt]['name'])
            current, _ = needed[key]
            needed[key] = (max(current, shift), move_ink)
    return needed, unfixable


def add_kern_lookup(tt, pairs):
    """Add the pairs to the font's existing GPOS table.

    The lookup is appended: the font's own features (curs, mark, mkmk) and its GDEF table are
    left exactly as they are, so cursive joining and the harakat keep working.
    """
    gpos = tt['GPOS'].table
    builder = PairPosBuilder(tt, None)
    for (first, second), (shift, move_ink) in sorted(pairs.items()):
        value = int(round(shift))
        # right-to-left: the glyph is moved back by the same amount as its cell is widened,
        # so the ink stays where it was and the new space opens on the side of the tail
        record = buildValue({'XPlacement': value, 'XAdvance': value} if move_ink else {'XAdvance': value})
        builder.addGlyphPair(None, first, record, second, None)
    lookup = builder.build()
    lookup.LookupFlag |= 0x0008          # IgnoreMarks: the harakat do not break a pair
    gpos.LookupList.Lookup.append(lookup)
    gpos.LookupList.LookupCount = len(gpos.LookupList.Lookup)
    lookup_index = len(gpos.LookupList.Lookup) - 1

    feature = otTables.Feature()
    feature.FeatureParams = None
    feature.LookupListIndex = [lookup_index]
    feature.LookupCount = 1
    record = otTables.FeatureRecord()
    record.FeatureTag = 'kern'
    record.Feature = feature
    gpos.FeatureList.FeatureRecord.append(record)
    gpos.FeatureList.FeatureCount = len(gpos.FeatureList.FeatureRecord)
    feature_index = len(gpos.FeatureList.FeatureRecord) - 1

    for script in gpos.ScriptList.ScriptRecord:      # every script and language of the font
        systems = [script.Script.DefaultLangSys] + [r.LangSys for r in script.Script.LangSysRecord]
        for system in systems:
            if system is None:
                continue
            system.FeatureIndex.append(feature_index)
            system.FeatureCount = len(system.FeatureIndex)
    return len(pairs)


def describe(pairs, upm):
    return '\n'.join(f'  {first} + {second}: {shift / upm:.3f} em' + ('' if move_ink else '  (space widened)')
                      for (first, second), (shift, move_ink) in sorted(pairs.items()))


def main():
    ap = argparse.ArgumentParser(description='Add the spacing needed to stop Wolofal tails colliding.')
    ap.add_argument('font')
    ap.add_argument('--text', action='append', default=[], help='a text file to measure (may be repeated)')
    ap.add_argument('--out', default='wolofal-spaced.ttf')
    ap.add_argument('--margin', type=float, default=0.03, help='clearance to leave, in em (default 0.03)')
    ap.add_argument('--passes', type=int, default=3, help='how many times to measure and adjust (default 3)')
    ap.add_argument('--progress', type=int, default=2000, help='print a line every N lines read (0 to keep quiet)')
    args = ap.parse_args()

    lines = []
    for path in args.text:
        with open(path, encoding='utf-8') as f:
            lines += [l.strip() for l in f if l.strip()]
    if not lines:
        lines = ['أَسْأَلُهُ الصِّدْقَ مَعَ الْوَفَاءِ']
    print(f'{len(lines)} line(s) to measure…')

    total = defaultdict(lambda: (0.0, False))
    source, unfixable = args.font, {}
    for attempt in range(1, args.passes + 1):
        shaper = FontShaper(source)
        pairs, unfixable = find_pairs(shaper, lines, margin_em=args.margin, progress=args.progress)
        if not pairs:
            print(f'pass {attempt}: nothing left to space out.')
            break
        for key, (shift, move_ink) in pairs.items():        # spacing adds up between passes
            current, _ = total[key]
            total[key] = (current + shift, move_ink)
        fresh = FontShaper(args.font)                        # always rebuild from the original font
        add_kern_lookup(fresh.tt, total)
        fresh.tt.save(args.out)
        source = args.out
        print(f'pass {attempt}: {len(pairs)} pair(s) adjusted, {len(total)} in total.')

    print(f'\n{len(total)} pair(s) of letters given more space:')
    print(describe(total, FontShaper(args.font).upm))

    after = FontShaper(args.out)
    remaining = []
    for text in lines:
        glyphs, _shapes, hits = after.collisions(text)
        letters = [k for k, g in enumerate(glyphs) if not after.is_mark(g['name'])]
        for i, j, _a in hits:
            if after.joins_forward(glyphs[j]['name']) and letters.index(i) == letters.index(j) - 1:
                continue
            remaining.append((glyphs[j]['name'], glyphs[i]['name']))
    print(f'\nwritten: {args.out}')
    print(f'collisions left: {len(remaining)}')
    if remaining:
        counts = defaultdict(int)
        for pair in remaining:
            counts[pair] += 1
        print('  they need a shorter tail in the drawing:')
        for (a, b), n in sorted(counts.items(), key=lambda kv: -kv[1])[:15]:
            print(f'    {a} → {b}   ({n})')
    if unfixable:
        print('\nCollisions inside a word (the letters are joined, so they cannot be moved apart);')
        print('these need a shorter tail in the drawing:')
        for (a, b), count in sorted(unfixable.items(), key=lambda kv: -kv[1])[:15]:
            print(f'  {a} → {b}   ({count} time(s))')


if __name__ == '__main__':
    main()
