"""
apps/corpus/management/commands/import_poems.py

    python manage.py import_poems json/                                   # JSON files from the web page
    python manage.py import_poems corpus-source/diwan-01/                 # or the .docx files directly
    python manage.py import_poems json/D01K08.json corpus-source/x.docx  # any mix of files and folders
    python manage.py import_poems json/ --dry-run                         # check only, write nothing
    python manage.py import_poems json/ --refresh-transcriptions          # after improving the transcription rules

You can also upload files in the admin: Poems > "Import poems".
Safe to run again and again: unchanged poems are skipped; hand-corrected transcriptions are kept.
Poems without red flags are published right away (see CORPUS_AUTO_PUBLISH in apps/corpus/importing.py).
"""
from collections import Counter

from django.core.management.base import BaseCommand, CommandError
from django.db import IntegrityError

from apps.corpus.importing import save_poem
from apps.corpus.parsing import find_poem_files, load_poem_json, name_summary, parse_poem_docx


class Command(BaseCommand):
    help = "Import poems (JSON from the web page, or .docx files named D01K08_...) into PostgreSQL."

    def add_arguments(self, parser):
        parser.add_argument("paths", nargs="+", help=".json / .docx files and/or folders")
        parser.add_argument("--dry-run", action="store_true", help="read and report without saving")
        parser.add_argument("--refresh-transcriptions", action="store_true",
                            help="regenerate automatic transcriptions, even for poems whose text did not change")

    def handle(self, *args, paths, dry_run, refresh_transcriptions, **options):
        try:
            files = find_poem_files(paths)
        except ValueError as exc:
            raise CommandError(str(exc))
        if not files:
            raise CommandError("No .json or .docx files found.")

        totals = {"created": 0, "updated": 0, "unchanged": 0, "failed": 0}
        for path in files:
            try:
                data = load_poem_json(path) if path.suffix.lower() == ".json" else parse_poem_docx(path)
            except ValueError as exc:
                totals["failed"] += 1
                self.stderr.write(self.style.ERROR(f"✗ {exc}"))
                continue

            sections = Counter(line["section"] for line in data["lines"])
            summary = (f"{data['code']}: {name_summary(data)} · {sections['muqaddima']} muqaddima · "
                       f"{data['bayt_count']} abyat · {sections['khatima']} khatima")
            if dry_run:
                self.stdout.write(f"  {summary}  (dry run)")
            else:
                try:
                    r = save_poem(data, refresh_transcriptions)
                except (IntegrityError, KeyError) as exc:
                    totals["failed"] += 1
                    self.stderr.write(self.style.ERROR(f"✗ {data['code']}: not saved ({exc})"))
                    continue
                totals[r.result] += 1
                self.stdout.write(f"  {summary}  → {r.result}, {r.status}" + (f" ({r.notes})" if r.notes else ""))
            for warning in data["warnings"]:
                self.stdout.write(self.style.WARNING(f"      ! {warning}"))

        self.stdout.write(self.style.SUCCESS(" · ".join(f"{k}: {v}" for k, v in totals.items())))
