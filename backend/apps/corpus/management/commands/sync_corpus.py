"""
apps/corpus/management/commands/sync_corpus.py

One command for the daily round trip between the two databases and the folder committed to Git.

    python manage.py sync_corpus --from-online       # bring the online poems down to this PC
    python manage.py sync_corpus --to-online         # send the local poems up to the online database
    python manage.py sync_corpus --commit            # also: git add corpus-json && git commit && git push

Give the online address once, in the NEON_DATABASE_URL variable (or with --online-url), and the
command opens the right connection itself: no need to set DATABASE_URL by hand, and no risk of
forgetting to clear it afterwards.
"""
import os
import subprocess
from pathlib import Path

from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.db import connections

from apps.corpus.exporting import json_dir


class Command(BaseCommand):
    help = 'Copy the poems between the local and the online database, through corpus-json/.'

    def add_arguments(self, parser):
        direction = parser.add_mutually_exclusive_group(required=True)
        direction.add_argument('--from-online', action='store_true', help='online → corpus-json/ → local database')
        direction.add_argument('--to-online', action='store_true', help='local → corpus-json/ → online database')
        parser.add_argument('--online-url', help='the online address (else the NEON_DATABASE_URL variable)')
        parser.add_argument('--commit', action='store_true', help='commit and push corpus-json/ afterwards')

    def handle(self, *args, from_online, to_online, online_url, commit, **options):
        url = online_url or os.environ.get('NEON_DATABASE_URL')
        if not url:
            raise CommandError('Give the online address: --online-url "postgres://…" '
                               'or set NEON_DATABASE_URL once and for all.')

        import dj_database_url
        config = dj_database_url.parse(url, conn_max_age=600, ssl_require=True)
        default = connections.databases['default']
        for key in ('ATOMIC_REQUESTS', 'AUTOCOMMIT', 'TIME_ZONE', 'CONN_HEALTH_CHECKS', 'OPTIONS', 'TEST'):
            config.setdefault(key, default.get(key))
        connections.databases['online'] = config

        folder = json_dir()
        if from_online:
            self.stdout.write('Online → corpus-json/ …')
            call_command('export_poems', out=str(folder), database='online')
            self.stdout.write('corpus-json/ → local database …')
            call_command('import_poems', str(folder))
        else:
            self.stdout.write('Local database → corpus-json/ …')
            call_command('export_poems', out=str(folder))
            self.stdout.write('corpus-json/ → online …')
            call_command('import_poems', str(folder), database='online')

        if commit:
            self.git_commit(folder)

    def git_commit(self, folder: Path):
        root = Path(folder).resolve().parent
        try:
            subprocess.run(['git', 'add', str(folder)], cwd=root, check=True)
            status = subprocess.run(['git', 'status', '--porcelain', str(folder)], cwd=root,
                                    check=True, capture_output=True, text=True).stdout.strip()
            if not status:
                self.stdout.write('corpus-json/: nothing new to commit.')
                return
            subprocess.run(['git', 'commit', '-m', 'Corpus : mise à jour des poèmes'], cwd=root, check=True)
            subprocess.run(['git', 'push'], cwd=root, check=True)
            self.stdout.write(self.style.SUCCESS('corpus-json/ committed and pushed.'))
        except (subprocess.CalledProcessError, FileNotFoundError) as exc:
            self.stderr.write(self.style.WARNING(f'Git: {exc}. Commit corpus-json/ by hand.'))
