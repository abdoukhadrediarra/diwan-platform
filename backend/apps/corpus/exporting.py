"""
apps/corpus/exporting.py

Writes one poem as a JSON file in corpus-json/, in exactly the format import_poems reads.

The file is written automatically every time a poem is imported or its status changes in the
admin, so the folder always matches the database and there is nothing to remember. It works the
same whether the poem was saved in the local database or in the online one.

Where the files go: CORPUS_JSON_DIR in the settings (by default <project>/corpus-json).
Set CORPUS_AUTO_EXPORT=0 to switch the automatic writing off.
"""
import json
from pathlib import Path

from django.conf import settings

from .models import LineTranscription, Poem


def auto_export_enabled() -> bool:
    return getattr(settings, "CORPUS_AUTO_EXPORT", True)


def json_dir() -> Path:
    return Path(getattr(settings, "CORPUS_JSON_DIR", settings.BASE_DIR.parent / "corpus-json"))


def poem_as_dict(poem: Poem) -> dict:
    manual = {t.line_id: (t.style, t.parts)
              for t in LineTranscription.objects.filter(line__poem=poem, is_manual=True)}
    lines = []
    for line in poem.lines.all():
        entry = {
            "position": line.position,
            "section": line.section,
            "kind": line.kind,
            "bayt_number": line.bayt_number,
            "hemistichs": line.hemistichs,
            "acrostic_spans": line.acrostic_spans,
        }
        if line.id in manual:
            style, parts = manual[line.id]
            entry["transcription_manual"] = {style: parts}
        lines.append(entry)

    return {
        "code": poem.code,
        "diwan": poem.diwan.number,
        "number": poem.number,
        "source_file": poem.source_file,
        "incipit": poem.incipit,
        "title": poem.title,
        "title_source": poem.title_source,
        "is_acrostic": poem.is_acrostic,
        "acrostic_match": poem.acrostic_match,
        "hemistichs_per_bayt": poem.hemistichs_per_bayt,
        "bayt_count": poem.bayt_count,
        "has_open_flags": poem.has_open_flags,
        "status": poem.status,
        "content_hash": poem.content_hash,
        "warnings": [],
        "lines": lines,
    }


def write_poem_json(poem: Poem, root: Path | None = None) -> Path:
    """Write (or rewrite) the poem's file. Returns the path written."""
    folder = (root or json_dir()) / f"diwan-{poem.diwan.number:02d}"
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / f"{poem.code}.json"
    text = json.dumps(poem_as_dict(poem), ensure_ascii=False, indent=2) + "\n"
    if not path.exists() or path.read_text(encoding="utf-8") != text:
        path.write_text(text, encoding="utf-8")
    return path


def write_poem_json_quietly(poem: Poem) -> Path | None:
    """Same, but a folder that cannot be written (a server with no disk) never breaks an import."""
    if not auto_export_enabled():
        return None
    try:
        return write_poem_json(poem)
    except OSError:
        return None
