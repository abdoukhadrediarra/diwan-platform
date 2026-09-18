"""
tools/corpus/fix_marks.py

Finds the harakat that are not sitting on a letter and puts them back where they belong,
without adding or removing a single mark.

    python fix_marks.py "D01K08.docx"                 # report only, changes nothing
    python fix_marks.py dossier/ --fix                # write the corrected files (…_fixed.docx)
    python fix_marks.py dossier/ --fix --in-place     # overwrite the files themselves

What it repairs (both seen in the poems reviewed by hand)
    detached   a haraka separated from its letter by a space, usually at the end of the ajz:
               مَقَالَه ْ  ->  مَقَالَهْ
    order      at the very end of the ajz, the vowel typed before the shadda: الْمَرْجُوُّ -> الْمَرْجُوُّ
               (waw + damma + shadda becomes waw + shadda + damma). Nothing is added or removed,
               and inside a word nothing is touched
    doubtful   a detached haraka whose letter already carries one of the same kind: reported,
               never moved — only you can say which of the two the source has
    doubled    two vowels on one letter (فَتْحَة + كَسْرَة): reported, never touched — only you
               can say which one the source has

The text is rewritten inside the Word runs, so the font, the colours and the red words are kept.
"""
import argparse
import re
import shutil
from pathlib import Path

import docx

MARKS = "\u064B-\u0652\u0670\u0653-\u0655"
LETTERS = "\u0621-\u064A\u0671"
INVISIBLE = "\u200E\u200F"

DETACHED = re.compile(f"([{LETTERS}][{MARKS}]*)([\\s|{INVISIBLE}]+)([{MARKS}]+)")
STRANDED = re.compile(f"(?:^|[^{LETTERS}{MARKS}])([{MARKS}]+)")
DOUBLED = re.compile("[\u064B-\u0650\u0652]\u0651?[\u064B-\u0650\u0652]")
# only at the very end of the line — the end of the ajz, where the vowel typed before the
# shadda floats away from its letter. Everywhere else the two marks stack correctly, so the
# corpus is left exactly as it is.
ORDER = re.compile(f"([\u064B-\u0650\u0652\u0670])(\u0651)(?=[\\s{INVISIBLE}]*$)")


def paragraph_text(paragraph) -> str:
    return "".join(run.text for run in paragraph.runs)


def rewrite(paragraph, new_text: str) -> None:
    """Write the repaired text back into the paragraph, keeping every run's own formatting
    (the red words of the review in particular). Marks only move by one or two places, so each
    run keeps its own share of the text."""
    runs = paragraph.runs
    if not runs:
        return
    position = 0
    for index, run in enumerate(runs):
        if index == len(runs) - 1:
            run.text = new_text[position:]
            return
        length = len(run.text)
        # a run ends on a letter: pull in the marks that now follow it
        while position + length < len(new_text) and re.match(f"[{MARKS}]", new_text[position + length]):
            length += 1
        # …or loses the marks that moved backwards into the previous run
        while length > 0 and position + length <= len(new_text) and re.match(f"[{MARKS}]", new_text[position + length - 1]) \
                and not re.search(f"[{MARKS}]$", run.text):
            length -= 1
        run.text = new_text[position:position + length]
        position += length


def repair_text(text: str, fix_order: bool = True) -> tuple[str, list[str], list[str]]:
    """Return the repaired text, what was repaired, and what needs a human eye."""
    notes, doubtful = [], []

    def detached(match):
        letter, gap, marks = match.group(1), match.group(2), match.group(3)
        after = text[match.end():match.end() + 1]
        if same_kind(letter, marks[0]):
            doubtful.append(context(text, match))
            return match.group(0)
        notes.append(f"{letter}{gap}{marks} → {letter}{marks}")
        if after == "" or after.isspace():
            return f"{letter}{marks}{gap if after else ''}"   # end of the line: the space disappears
        return f"{letter}{marks}{gap}"                        # inside the line: the words stay apart

    repaired = DETACHED.sub(detached, text)

    if fix_order:
        def swap(match):
            vowel, shadda = match.group(1), match.group(2)
            notes.append(f"{vowel}{shadda} → {shadda}{vowel}")
            return f"{shadda}{vowel}"

        repaired = ORDER.sub(swap, repaired)
    return repaired, notes, doubtful


VOWELS = "\u064B\u064C\u064D\u064E\u064F\u0650\u0652"


def same_kind(letter_with_marks: str, mark: str) -> bool:
    """True when the letter already has a mark of the same family (a vowel, or a shadda)."""
    family = VOWELS if mark in VOWELS else "\u0651"
    return any(c in family for c in letter_with_marks[1:])


def scan(path: Path, fix: bool, in_place: bool, skip_order: bool = False) -> dict:
    document = docx.Document(path)
    report = {"detached": [], "doubtful": [], "doubled": []}
    changed = False

    for number, paragraph in enumerate(document.paragraphs, 1):
        text = paragraph_text(paragraph)
        if not text.strip():
            continue
        clean = re.sub(f"[{INVISIBLE}]", "", text)

        for match in DOUBLED.finditer(clean):
            report["doubled"].append((number, context(clean, match)))

        repaired, notes, doubtful = repair_text(text, fix_order=not skip_order)
        for note in notes:
            report["detached"].append((number, note))
        for note in doubtful:
            report["doubtful"].append((number, note))
        if repaired != text and fix:
            rewrite(paragraph, repaired)
            changed = True

    if fix and changed:
        target = path if in_place else path.with_name(path.stem + "_fixed" + path.suffix)
        if in_place:
            shutil.copy(path, path.with_name(path.stem + "_avant" + path.suffix))   # keep the original
        document.save(target)
        report["written"] = target
    return report


def context(text: str, match, span: int = 12) -> str:
    return text[max(0, match.start() - span): match.end() + span].strip()


def context_at(text: str, index: int, span: int = 12) -> str:
    return text[max(0, index - span): index + span].strip()


def main():
    ap = argparse.ArgumentParser(description="Put detached harakat back on their letter.")
    ap.add_argument("paths", nargs="+", help=".docx files and/or folders")
    ap.add_argument("--fix", action="store_true", help="write the corrected files")
    ap.add_argument("--in-place", action="store_true", help="overwrite the files (a copy _avant is kept)")
    ap.add_argument("--no-order", action="store_true", help="do not put the shadda back before its vowel")
    args = ap.parse_args()

    files = []
    for p in map(Path, args.paths):
        files += sorted(f for f in p.rglob("*.docx") if not f.name.startswith("~$")) if p.is_dir() else [p]

    totals = {"detached": 0, "doubtful": 0, "doubled": 0}
    for path in files:
        report = scan(path, args.fix, args.in_place, args.no_order)
        counts = {k: len(v) for k, v in report.items() if isinstance(v, list)}
        if not any(counts.values()):
            print(f"{path.name}: rien à corriger")
            continue
        print(f"\n{path.name}: {counts['detached']} haraka(s) détachée(s), "
              f"{counts['doubtful']} à vérifier, {counts['doubled']} lettre(s) à deux voyelles")
        for kind, label in (("detached", "détachée"), ("doubtful", "à vérifier"), ("doubled", "deux voyelles")):
            for line, note in report[kind][:12]:
                print(f"   ligne {line} ({label}) : {note}")
            if len(report[kind]) > 12:
                print(f"   … et {len(report[kind]) - 12} autre(s)")
        for k in totals:
            totals[k] += counts[k]
        if "written" in report:
            print(f"   écrit : {report['written'].name}")

    print(f"\nTotal : {totals['detached']} détachée(s) recollée(s) si --fix ; "
          f"{totals['doubtful']} à vérifier à la main (la lettre porte déjà une haraka du même type) ; "
          f"{totals['doubled']} lettre(s) à deux voyelles.")


if __name__ == "__main__":
    main()
