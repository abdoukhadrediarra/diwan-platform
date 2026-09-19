"""
apps/corpus/importing.py

Saves one parsed poem (the dict/JSON made by parsing.py) into PostgreSQL.
Used by `python manage.py import_poems` and by the admin page "Import poems", so both behave the same.

Publishing: with CORPUS_AUTO_PUBLISH = True (the default), a poem without red flags is published as soon
as it is imported, so it appears on the website right away. A poem with red flags stays a draft.
Set CORPUS_AUTO_PUBLISH = False in the settings to publish poems by hand in the admin instead.
"""
from dataclasses import dataclass

from django.conf import settings
from django.db import transaction

from .arabic import normalize_for_search
from .exporting import write_poem_json_quietly
from .models import Diwan, Line, LineTranscription, Poem, Status
from .transcription import STYLES, transcribe_hemistichs


@dataclass
class ImportResult:
    code: str
    result: str        # "created", "updated" or "unchanged"
    status: str        # the poem's status after the import
    notes: str = ""


def auto_publish() -> bool:
    return getattr(settings, "CORPUS_AUTO_PUBLISH", True)


def save_poem(data: dict, refresh_transcriptions: bool = False, database: str = 'default') -> ImportResult:
    with transaction.atomic(using=database):
        return _save_poem(data, refresh_transcriptions, database)


def _save_poem(data: dict, refresh_transcriptions: bool, database: str) -> ImportResult:
    diwan, _ = Diwan.objects.using(database).get_or_create(
        number=data["diwan"],
        defaults={"slug": f"diwan-{data['diwan']:02d}", "title": f"Diwan {data['diwan']}"},  # run seed_diwans for real titles
    )

    poem = Poem.objects.using(database).select_for_update().filter(diwan=diwan, number=data["number"]).first()
    created = poem is None
    if created:
        poem = Poem(diwan=diwan, number=data["number"], slug=f"{data['number']:03d}")
    text_changed = created or poem.content_hash != data["content_hash"]

    # poem details are always brought up to date, so a new rule (e.g. how names are chosen)
    # applies even to poems whose text did not change
    details = {
        "code": data["code"],
        "incipit": data["incipit"],
        "title": data["title"],
        "title_source": data["title_source"],
        "title_plain": normalize_for_search(data["title"]),
        "hemistichs_per_bayt": data["hemistichs_per_bayt"],
        "bayt_count": data["bayt_count"],
        "is_acrostic": data["is_acrostic"],
        "acrostic_match": data.get("acrostic_match"),
        "has_open_flags": data["has_open_flags"],
        "source_file": data.get("source_file", "")[:255],
        "content_hash": data["content_hash"],
    }
    if data["has_open_flags"]:
        details["status"] = Status.DRAFT            # unreviewed text never stays public
    elif auto_publish():
        details["status"] = Status.PUBLISHED        # reviewed poem: straight to the website

    details_changed = created or any(getattr(poem, field) != value for field, value in details.items())
    for field, value in details.items():
        setattr(poem, field, value)

    if not text_changed:
        if details_changed:
            poem.save(using=database)
        notes = refresh_poem_transcriptions(poem) if refresh_transcriptions else ""
        write_poem_json_quietly(poem)       # keep corpus-json/ in step with the database
        return ImportResult(poem.code, "updated" if details_changed else "unchanged", poem.status, notes)

    poem.save(using=database)

    # keep the hand-corrected transcriptions before the old lines (and their transcriptions) are deleted
    kept = [(t.style, t.line.position, tuple(t.line.hemistichs), t.parts)
            for t in LineTranscription.objects.using(database).filter(line__poem=poem, is_manual=True).select_related("line")]

    poem.lines.all().delete()               # replace the old version of the text
    # transcriptions corrected by hand and carried in the file (written by export_poems)
    for line in data["lines"]:
        for style, parts in (line.get("transcription_manual") or {}).items():
            kept.append((style, line["position"], tuple(line["hemistichs"]), parts))
    lines = Line.objects.using(database).bulk_create(
        Line(
            poem=poem,
            position=line["position"],
            section=line["section"],
            kind=line["kind"],
            bayt_number=line["bayt_number"],
            hemistichs=line["hemistichs"],
            text_plain=normalize_for_search(" ".join(line["hemistichs"])),
        )
        for line in data["lines"]
    )
    notes = write_transcriptions(lines, kept, database)
    write_poem_json_quietly(poem)           # keep corpus-json/ in step with the database
    return ImportResult(poem.code, "created" if created else "updated", poem.status, notes)


def write_transcriptions(lines, kept, database: str = 'default') -> str:
    """A hand-corrected transcription is kept only when that bayt's Arabic is exactly
    unchanged (wherever it now sits in the poem — a bayt moving up or down still matches).
    The moment the underlying text changes at all, the transcription re-syncs automatically:
    it is regenerated fresh from the new wording, the same as a line that was never corrected.
    This is deliberate — a stale hand translation of text that no longer exists would otherwise
    sit there silently wrong until someone happens to revisit it."""
    unused = list(range(len(kept)))
    rows, kept_count = [], 0
    for line in lines:
        for style_name, style in STYLES.items():
            match = next((i for i in unused if kept[i][0] == style_name and kept[i][2] == tuple(line.hemistichs)), None)
            if match is not None:
                unused.remove(match)
                kept_count += 1
                rows.append(LineTranscription(line=line, style=style_name, parts=kept[match][3], is_manual=True))
            else:
                rows.append(LineTranscription(line=line, style=style_name,
                                              parts=transcribe_hemistichs(line.hemistichs, style)))
    LineTranscription.objects.using(database).bulk_create(rows)

    notes = []
    if kept_count:
        notes.append(f"{kept_count} hand-corrected transcription(s) kept (text unchanged)")
    if len(kept) - kept_count:
        notes.append(f"{len(kept) - kept_count} hand correction(s) re-synced automatically (text changed or line removed)")
    return "; ".join(notes)


def refresh_poem_transcriptions(poem) -> str:
    changed = 0
    for t in LineTranscription.objects.filter(line__poem=poem, is_manual=False).select_related("line"):
        parts = transcribe_hemistichs(t.line.hemistichs, STYLES[t.style])
        if parts != t.parts:
            t.parts = parts
            t.save(update_fields=["parts", "updated_at"])
            changed += 1
    missing = [LineTranscription(line=line, style=name, parts=transcribe_hemistichs(line.hemistichs, style))
               for line in poem.lines.all() for name, style in STYLES.items()
               if not line.transcriptions.filter(style=name).exists()]
    LineTranscription.objects.bulk_create(missing)
    return f"{changed} transcription(s) refreshed, {len(missing)} added"
