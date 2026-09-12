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
