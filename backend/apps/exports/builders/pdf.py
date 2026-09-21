"""
apps/exports/builders/pdf.py

Builds the PDF of one poem with WeasyPrint (HTML + CSS -> PDF). WeasyPrint uses HarfBuzz, so the
Arabic letters join and the harakat stack correctly — unlike a conversion through LibreOffice.

Two versions of a poem can be produced:
    script "classic"   Amiri letterforms (the default)
    script "wolofal"   the Wolofal font, for readers of the Wolof writing style
and the Latin transcription can be printed under each line.
"""
import re
from pathlib import Path

from django.conf import settings
from django.template.loader import render_to_string

NON_JOINING = "\u0627\u0623\u0625\u0622\u0671\u062F\u0630\u0631\u0632\u0648\u0624\u0629\u0621"
INITIAL = re.compile("^([\u0621-\u064A][\u064B-\u065F\u0670]*)([\\s\\S]*)$")

SCRIPTS = {
    "classic": {"family": "Amiri", "text_size": 15, "title_size": 17},
    "wolofal": {"family": "Wolofal", "text_size": 19, "title_size": 21},
}


def split_initial(sadr: str):
    """First letter of a sadr, kept joined to its word by a zero-width joiner when it connects."""
    match = INITIAL.match(sadr)
    if not match:
        return "", sadr
    letter, rest = match.group(1), match.group(2)
    joins = letter[0] not in NON_JOINING and re.match("^[\u0621-\u064A]", rest)
    joiner = "\u200D" if joins else ""
    return letter + joiner, joiner + rest


def fonts_url() -> str:
    return (Path(settings.BASE_DIR) / "apps" / "exports" / "static" / "exports" / "fonts").as_uri()


def poem_context(poem, script: str = "classic", transcription: bool = False) -> dict:
    style = SCRIPTS.get(script, SCRIPTS["classic"])
    sections, current = [], None
    for line in poem.lines.all():
        if current is None or current["section"] != line.section:
            current = {"section": line.section, "lines": []}
            sections.append(current)

        latin = ""
        if transcription:
            parts = next((t.parts for t in line.transcriptions.all() if t.style == "local"), [])
            latin = "   |   ".join(parts)

        if line.kind == "bayt":
            parts = []
            for index, hemistich in enumerate(line.hemistichs):
                if index == 0 and poem.is_acrostic:
                    initial, rest = split_initial(hemistich)
                    parts.append({"initial": initial, "rest": rest, "text": hemistich})
                else:
                    parts.append({"initial": "", "rest": "", "text": hemistich})
            current["lines"].append({"is_bayt": True, "bayt_number": line.bayt_number,
                                     "parts": parts, "transcription": latin})
        else:
            current["lines"].append({"is_bayt": False, "kind": line.kind,
                                     "text": " ".join(line.hemistichs), "transcription": latin})

    return {
        "poem": poem,
        "sections": sections,
        "fonts": fonts_url(),
        "font_family": style["family"],
        "text_size": style["text_size"],
        "title_size": style["title_size"],
        "footer": getattr(settings, "EXPORT_FOOTER",
                          "Diwan — les khassaïdes de Cheikh Ahmadou Bamba"),
    }


def build_poem_pdf(poem, script: str = "classic", transcription: bool = False) -> bytes:
    """The poem as PDF bytes."""
    from weasyprint import HTML          # imported here: the API works even without WeasyPrint

    html = render_to_string("exports/poem.html", poem_context(poem, script, transcription))
    return HTML(string=html, base_url=str(settings.BASE_DIR)).write_pdf()


def poem_filename(poem, script: str = "classic", transcription: bool = False) -> str:
    suffix = "" if script == "classic" else f"-{script}"
    suffix += "-transcription" if transcription else ""
    return f"{poem.code}{suffix}.pdf"
