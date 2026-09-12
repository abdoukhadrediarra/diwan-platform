"""
apps/corpus/transcription.py

Latin transcription of fully vowelled (tashkeeled) Arabic, hemistich by hemistich,
written the way the text is PRONOUNCED when recited, not letter by letter:

    أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ   ->   a'oûzou billâhi minach chaytânir rajîmi

Spelling choices live in a Style table, so the local (Senegal, French-based) style and a
later English style are the same code with a different table:

    transcribe_hemistich(text)                 # local style
    transcribe_hemistich(text, style=ENGLISH)  # once an ENGLISH table is added

Rules applied (all read from the harakat):
  - long vowels: fatha+alif / fatha+alif maqsura -> â, kasra+ya -> î, damma+waw -> oû; dagger alif -> â
  - shadda doubles the consonant; tanwin -> an / in / oun (the alif after tanwin fath is silent)
  - hamzat al-wasl is dropped after a vowel; at the start of a hemistich it is pronounced
  - the article: its consonant is heard with the word before it
        moon letter  مِنَ الْكِتَابِ   -> minal kitâbi
        sun letter   مِنَ الشَّيْطَانِ -> minach chaytâni
  - the name Allah: billâhi, lillâhi, wallâhou, allâhoumma
  - ta marbuta: t + vowel inside the phrase, silent when it carries no vowel (pause)
  - silent alif after the plural waw (كَفَرُوا -> kafaroû)
  - a single s between two vowels is written ss, as in Rassoul, Moussa
Each hemistich is read on its own: its first word starts a new breath.
"""
from dataclasses import dataclass, field
import re

LETTERS = set(chr(c) for c in range(0x0621, 0x064B)) | {"\u0671"}
FATHA, DAMMA, KASRA = "\u064E", "\u064F", "\u0650"
FATHATAN, DAMMATAN, KASRATAN = "\u064B", "\u064C", "\u064D"
SHADDA, SUKUN, DAGGER_ALIF, MADDA = "\u0651", "\u0652", "\u0670", "\u0653"
SUN_LETTERS = set("تثدذرزسشصضطظلن")
HAMZAS = set("ءأإؤئ")
IGNORED = {"\u0640", "\u200E", "\u200F", "\u0654", "\u0655"}  # tatweel, direction marks, small hamzas


@dataclass(frozen=True)
class Style:
    name: str
    consonants: dict
    short: dict = field(default_factory=lambda: {"a": "a", "i": "i", "u": "ou"})
    long: dict = field(default_factory=lambda: {"a": "â", "i": "î", "u": "oû"})
    tanwin: dict = field(default_factory=lambda: {"a": "an", "i": "in", "u": "oun"})
    double_s_between_vowels: bool = True
    hamza_at_word_start: str = ""       # how a hamza is written when it opens a word
    vowels: str = "aeiouâîû"


LOCAL = Style(
    name="local",
    consonants={
        "ء": "'", "أ": "'", "إ": "'", "ؤ": "'", "ئ": "'", "آ": "'",
        "ب": "b", "ت": "t", "ث": "s", "ج": "j", "ح": "h", "خ": "kh", "د": "d", "ذ": "z",
        "ر": "r", "ز": "z", "س": "s", "ش": "ch", "ص": "s", "ض": "d", "ط": "t", "ظ": "z",
        "ع": "'", "غ": "gh", "ف": "f", "ق": "q", "ك": "k", "ل": "l", "م": "m", "ن": "n",
        "ه": "h", "و": "w", "ي": "y", "ة": "t", "ى": "y",
    },
)

STYLES = {"local": LOCAL}

# words whose long "â" is not written with an alif in ordinary spelling (stripped form -> letter index)
IMPLIED_LONG_A = {"هذا": 0, "هذه": 0, "هذان": 0, "هذين": 0, "ذلك": 0, "ذلكم": 0, "لكن": 0, "لكنه": 0,
                  "لكنما": 0, "هؤلاء": 0, "طه": 0, "رحمن": 2, "إله": 1, "إلها": 1, "إلهي": 1, "إلهنا": 1}
ALLAH_RE = re.compile(r"^[وفبلتك]{0,2}ا?لله(م|ما)?$")


@dataclass
class Token:
    letter: str
    marks: str = ""
    cons: str = ""      # written consonant
    vowel: str = ""     # "a" "i" "u" short, "A" "I" "U" long, "an" "in" "un" tanwin, "" none

    def has(self, mark):
        return mark in self.marks


def _tokens(word: str) -> list[Token]:
    tokens = []
    for ch in word:
        if ch in IGNORED:
            continue
        if ch in LETTERS:
            tokens.append(Token(ch))
        elif tokens and "\u064B" <= ch <= "\u0653" or ch == DAGGER_ALIF:
            if tokens:
                tokens[-1].marks += ch
    return tokens


def _short_vowel(t: Token) -> str:
    if t.has(FATHA): return "a"
    if t.has(KASRA): return "i"
    if t.has(DAMMA): return "u"
    if t.has(FATHATAN): return "an"
    if t.has(KASRATAN): return "in"
    if t.has(DAMMATAN): return "un"
    return ""


def _lengthen(prev: Token | None, vowel: str) -> bool:
    if prev is not None and prev.vowel == vowel:
        prev.vowel = vowel.upper()
        return True
    return False


def _read_word(word: str, style: Style):
    """Return (prefix, article_consonant, rest, starts_with_wasl) for one written word.

    prefix  = what is pronounced before an article inside the word (bi, wa, li...)
    article = the consonant of the article as heard ("l" or the doubled sun letter), or None
    """
    tokens = _tokens(word)
    if not tokens:
        return word, None, "", False
    stripped = "".join(t.letter for t in tokens)
    s = style.consonants

    # --- the name Allah ---------------------------------------------------------
    if ALLAH_RE.match(stripped):
        i = next((k for k in range(len(tokens) - 1) if tokens[k].letter == "ل" and tokens[k].has(SHADDA)
                  and tokens[k + 1].letter == "ه"), None)
        if i is not None:
            prefix = ""
            for t in tokens[:i]:
                v = _short_vowel(t)
                if v:
                    prefix += s[t.letter] + style.short[v[0]]
            tail = _render(tokens[i + 1:], style, word_start=False)
            core = "llâ" + tail if prefix else "allâ" + tail
            return (prefix + core, None, "", not prefix)

    # --- article at the start of the word (after optional one-letter prefixes) ---
    article_at = None
    k = 0
    while k < len(tokens) - 1 and tokens[k].letter in "وفبكل" and _short_vowel(tokens[k]) in ("a", "i") \
            and not (tokens[k].letter == "ل" and tokens[k + 1].letter != "ل" and tokens[k + 1].letter != "ا"):
        k += 1
        if k >= 2:
            break
    # li + article written without its alif: لِلْ...
    if k >= 1 and tokens[k - 1].letter == "ل" and tokens[k - 1].has(KASRA) and tokens[k].letter == "ل" \
            and _short_vowel(tokens[k]) == "" and k + 1 < len(tokens):
        article_at = k
    elif k < len(tokens) - 1 and tokens[k].letter in ("ا", "ٱ") and not _short_vowel(tokens[k]) \
            and tokens[k + 1].letter == "ل" and _short_vowel(tokens[k + 1]) == "" and k + 2 < len(tokens):
        article_at = k + 1

    starts_with_wasl = tokens[0].letter in ("ا", "ٱ") and not _short_vowel(tokens[0]) and not tokens[0].has(MADDA)

    if article_at is not None:
        nxt = tokens[article_at + 1]
        sun = nxt.letter in SUN_LETTERS and nxt.has(SHADDA)
        article = s[nxt.letter] if sun else "l"
        if sun:
            nxt.marks = nxt.marks.replace(SHADDA, "")
        prefix_tokens = [t for t in tokens[:article_at] if t.letter not in ("ا", "ٱ")]
        prefix = _render(prefix_tokens, style, word_start=True)
        rest = _render(tokens[article_at + 1:], style, word_start=True, stripped=stripped[article_at + 1:])
        return prefix, article, rest, article_at == 1 and not prefix

    # --- other words ------------------------------------------------------------------
    if starts_with_wasl:
        # pronounced only at the start of a hemistich: i-, or u- when the 3rd letter has a damma
        third = tokens[2] if len(tokens) > 2 else None
        helper = "u" if third is not None and third.has(DAMMA) else "i"
        return "", None, _render(tokens[1:], style, word_start=False), helper
    return _render(tokens, style, word_start=True, stripped=stripped), None, "", False


def _render(tokens: list[Token], style: Style, word_start: bool, stripped: str | None = None) -> str:
    s = style.consonants
    implied = IMPLIED_LONG_A.get(stripped) if stripped else None
    out: list[Token] = []
    for k, t in enumerate(tokens):
        prev = out[-1] if out else None
        nxt = tokens[k + 1] if k + 1 < len(tokens) else None
        vowel = _short_vowel(t)

        if t.letter in ("ا", "ٱ") and not vowel:
            if t.has(MADDA):
                t.cons, t.vowel = "'", "A"
                out.append(t)
            elif prev is not None and prev.vowel in ("an",):
                pass                                   # alif after tanwin fath
            elif prev is not None and prev.letter == "و" and nxt is None:
                pass                                   # silent alif after plural waw
            elif k == 1 and prev is not None and prev.letter in "وفبلك" and nxt is not None \
                    and nxt.has(SUKUN) and k + 2 < len(tokens):
                pass                                   # wasl after a prefix: فَانْصَرَفْ -> fansaraf
            else:
                _lengthen(prev, "a")
            continue
        if t.letter == "آ":
            t.cons, t.vowel = "'", "A"
            out.append(t)
            continue
        if t.letter == "ى" and not vowel:
            _lengthen(prev, "a")
            continue
        if t.letter == "و" and not vowel and not t.has(SHADDA) and prev is not None and prev.vowel == "u":
            prev.vowel = "U"
            continue
        if t.letter == "ي" and not vowel and not t.has(SHADDA) and prev is not None and prev.vowel == "i":
            prev.vowel = "I"
            continue
        if t.letter == "ة" and not vowel:
            continue                                   # pause: rahma
        t.cons = s.get(t.letter, "")
        if t.has(SHADDA):
            t.cons = t.cons * 2
        t.vowel = vowel
        if t.has(DAGGER_ALIF):
            t.vowel = "A"
        out.append(t)

    if implied is not None and implied < len(out) and out[implied].vowel == "a":
        out[implied].vowel = "A"

    text = ""
    for k, t in enumerate(out):
        cons = t.cons
        if k == 0 and word_start and cons == "'" and t.letter in HAMZAS | {"آ"}:
            cons = style.hamza_at_word_start
        v = t.vowel
        if v in ("a", "i", "u"):
            v = style.short[v]
        elif v in ("A", "I", "U"):
            v = style.long[v.lower()]
        elif v in ("an", "in", "un"):
            v = style.tanwin[v[0]]
        text += cons + v
    return text


def _ends_with_vowel(text: str, style: Style) -> bool:
    return bool(text) and text[-1] in style.vowels


def transcribe_hemistich(text: str, style: Style = LOCAL) -> str:
    words = [w for w in re.split(r"\s+", text.strip()) if w]
    out: list[str] = []
    for word in words:
        prefix, article, rest, wasl = _read_word(word, style)
        if article is not None:
            if prefix:                                         # bil kitâbi, war rassouli
                out.append(prefix + article)
                out.append(rest)
            elif out and _ends_with_vowel(out[-1], style):     # minal kitâbi, minach chaytâni
                out[-1] += article
                out.append(rest)
            elif out:                                          # after a silent consonant: helping vowel
                out[-1] += style.short["i"] + article
                out.append(rest)
            else:                                              # start of the hemistich
                out.append(style.short["a"] + article)
                out.append(rest)
        elif wasl in ("i", "u"):                               # ikhtâra / liya khtâra
            if out and _ends_with_vowel(out[-1], style):
                out.append(prefix + rest)
            else:
                out.append(style.short[wasl] + prefix + rest)
        elif wasl is True and out and _ends_with_vowel(out[-1], style) and prefix.startswith("a"):
            out.append(prefix[1:])                             # fadlou llâhi
        else:
            out.append(prefix + rest if rest else prefix)

    line = " ".join(w for w in out if w)
    if style.double_s_between_vowels:
        v = re.escape(style.vowels)
        line = re.sub(rf"(?<=[{v}])s(?=[{v}])", "ss", line)
    return line


def transcribe_hemistichs(hemistichs: list[str], style: Style = LOCAL) -> list[str]:
    return [transcribe_hemistich(h, style) for h in hemistichs]
