"""
apps/corpus/arabic.py

ONE normalization function, used both when importing and when searching,
so that "القرءان", "القرآن" and "القُرْآنِ" all match each other.
"""
import re

# tashkeel, Qur'anic annotation marks, superscript alef, tatweel,
# and the invisible RLM/LRM marks (your .docx files wrap every "|" in RLM)
_STRIP = re.compile(r"[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640\u200E\u200F]")


def strip_tashkeel(text: str) -> str:
    return _STRIP.sub("", text)


def clean_display_text(text: str) -> str:
    """For the text you STORE and SHOW: keep tashkeel, remove only invisible marks."""
    return re.sub(r"[\u200E\u200F]", "", text).strip()


def split_hemistichs(line: str) -> list[str]:
    """'sadr | ajz' -> ['sadr', 'ajz']  (also works for 4-hemistich lines with 3 pipes)."""
    return [clean_display_text(part) for part in clean_display_text(line).split("|")]


def normalize_for_search(text: str) -> str:
    t = strip_tashkeel(text)
    t = t.replace("ءا", "ا").replace("ئا", "ا")      # this corpus types آ as ء + ا
    t = re.sub("[أإآٱ]", "ا", t)
    t = t.replace("ؤ", "و").replace("ئ", "ي").replace("ء", "")
    t = t.replace("ى", "ي").replace("ة", "ه")
    t = t.replace("|", " ")
    return re.sub(r"\s+", " ", t).strip()


# ---------------------------------------------------------------- acrostics
# Letters that count as the same letter when comparing an acrostic phrase with the first letters of the abyat.
_ACROSTIC_MARKS = re.compile(r"[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED\u0640\u200E\u200F]")  # keeps U+0670
_ACROSTIC_EQUIV = str.maketrans({"أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا", "ء": "ا",
                                 "ؤ": "و", "ئ": "ي", "ى": "ي", "ة": "ه"})


def acrostic_letters(text: str) -> str:
    """Letters of a text as an acrostic counts them: one letter = one bayt.
    A superscript alif counts as a letter, and الله is counted with its long alif (اللاه)."""
    t = text.replace("\u0670", "ا")
    t = _ACROSTIC_MARKS.sub("", t)
    t = t.replace("لله", "للاه")
    t = t.translate(_ACROSTIC_EQUIV)
    return "".join(ch for ch in t if "\u0621" <= ch <= "\u064A")


def bayt_initial(sadr: str) -> str:
    """First letter of a bayt, normalized the same way as the acrostic phrase."""
    return acrostic_letters(sadr)[:1]
# ---------------------------------------------------------------- grouped acrostics
# Some khassaïdes spell their acrostic not bayt by bayt, but group by group: a short header
# names a letter ("اللام"), and every bayt that follows, until the next header, starts with it.
# A shadda in the acrostic phrase means that letter opens two groups in a row.
LETTER_NAMES = {
    "الألف": "ا", "الباء": "ب", "التاء": "ت", "الثاء": "ث", "الجيم": "ج", "الحاء": "ح",
    "الخاء": "خ", "الدال": "د", "الذال": "ذ", "الراء": "ر", "الزاي": "ز", "الزاء": "ز",
    "السين": "س", "الشين": "ش", "الصاد": "ص", "الضاد": "ض", "الطاء": "ط", "الظاء": "ظ",
    "العين": "ع", "الغين": "غ", "الفاء": "ف", "القاف": "ق", "الكاف": "ك", "اللام": "ل",
    "الميم": "م", "النون": "ن", "الهاء": "ه", "الواو": "و", "الياء": "ي",
    "الهمزة": "ا",  # hamza is counted as alif everywhere else in this corpus; kept consistent here
}
# looked up after the same cleanup as the rest of the module, so "الحاء" and "الحاء" written
# with any hamza form all reach the same key (translate() turns the final ء into ا, for instance)
_LETTER_NAMES_NORMALIZED = {name.translate(_ACROSTIC_EQUIV): letter for name, letter in LETTER_NAMES.items()}


def header_letter(text: str) -> str | None:
    """The letter a section header names ("اللام" -> "ل"), or None if the text isn't one.
    Only the first word is read, so "الشين المعجمة" is still recognized as ش."""
    normalized = strip_tashkeel(text).translate(_ACROSTIC_EQUIV).strip()
    if not normalized:
        return None
    first_word = normalized.split(" ", 1)[0]
    return _LETTER_NAMES_NORMALIZED.get(first_word)


# marks to drop when expanding a phrase letter by letter, but the shadda (U+0651) is kept:
# it is the signal that a letter opens two groups instead of one.
_MARKS_KEEP_SHADDA = re.compile(r"[\u0610-\u061A\u064B-\u0650\u0652-\u065F\u06D6-\u06ED\u0640\u200E\u200F]")


def acrostic_letters_by_group(text: str) -> str:
    """Expand a phrase letter by letter for the grouped scheme: a shadda means the letter
    counts twice (once per group it opens). الله keeps its usual convention — the geminated
    lam is already written twice, so only the long alif this corpus always counts is added,
    the shadda itself is not doubled again."""
    cleaned = _MARKS_KEEP_SHADDA.sub("", text)
    letters, i = [], 0
    while i < len(cleaned):
        ch = cleaned[i]
        is_letter = "\u0621" <= ch <= "\u064A" or ch in ("\u0671", "\u0670")
        if not is_letter:
            i += 1
            continue
        has_shadda = i + 1 < len(cleaned) and cleaned[i + 1] == "\u0651"
        if ch == "\u0644" and has_shadda and cleaned[i + 2:i + 3] == "\u0647" and letters and letters[-1] == "ل":
            letters += ["ل", "ا", "ه"]      # الله / لله: don't double the shadda, add its long alif instead
            i += 3
            continue
        letter = "ا" if ch == "\u0670" else ch.translate(_ACROSTIC_EQUIV)
        letters.append(letter)
        if has_shadda:
            letters.append(letter)
        i += 2 if has_shadda else 1
    return "".join(letters)
