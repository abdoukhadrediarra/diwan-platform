"""
apps/corpus/management/commands/export_poems.py

    python manage.py export_poems                       # writes ../corpus-json/diwan-01/D01K08.json …
    python manage.py export_poems --diwan 1             # only one diwan
    python manage.py export_poems --out ../corpus-json  # somewhere else

Writes every poem of the database as a JSON file, in exactly the format `import_poems` reads.
Commit that folder to Git: anyone who clones the project rebuilds the same database with

    python manage.py migrate && python manage.py seed_diwans && python manage.py import_poems ../corpus-json/

Hand-corrected transcriptions are included and are restored on import.
"""
import json
from pathlib import Path

from django.core.management.base import BaseCommand

from apps.corpus.models import LineTranscription, Poem


class Command(BaseCommand):
    help = 'Write the poems of the database as JSON files (the format import_poems reads).'

    def add_arguments(self, parser):
        parser.add_argument('--out', default='../corpus-json', help='folder to write into (default ../corpus-json)')
        parser.add_argument('--diwan', type=int, help='only this diwan number')

    def handle(self, *args, out, diwan, **options):
        poems = Poem.objects.select_related('diwan').prefetch_related('lines')
        if diwan:
            poems = poems.filter(diwan__number=diwan)
        root = Path(out)
        written = 0
        for poem in poems.order_by('diwan__number', 'number'):
            manual = {t.line_id: (t.style, t.parts)
                      for t in LineTranscription.objects.filter(line__poem=poem, is_manual=True)}
            lines = []
            for line in poem.lines.all():
                entry = {
                    'position': line.position,
                    'section': line.section,
                    'kind': line.kind,
                    'bayt_number': line.bayt_number,
                    'hemistichs': line.hemistichs,
                }
                if line.id in manual:
                    style, parts = manual[line.id]
                    entry['transcription_manual'] = {style: parts}
                lines.append(entry)

            data = {
                'code': poem.code,
                'diwan': poem.diwan.number,
                'number': poem.number,
                'source_file': poem.source_file,
                'incipit': poem.incipit,
                'title': poem.title,
                'title_source': poem.title_source,
                'is_acrostic': poem.is_acrostic,
                'acrostic_match': poem.acrostic_match,
                'hemistichs_per_bayt': poem.hemistichs_per_bayt,
                'bayt_count': poem.bayt_count,
                'has_open_flags': poem.has_open_flags,
                'content_hash': poem.content_hash,
                'warnings': [],
                'lines': lines,
            }
            folder = root / f'diwan-{poem.diwan.number:02d}'
            folder.mkdir(parents=True, exist_ok=True)
            (folder / f'{poem.code}.json').write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
            written += 1
            self.stdout.write(f'  {poem.code}  {poem.title[:40]}')
        self.stdout.write(self.style.SUCCESS(f'{written} poem(s) written to {root.resolve()}'))
