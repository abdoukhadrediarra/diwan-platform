"""
apps/corpus/management/commands/ensure_superuser.py

Creates the administrator account when the hosting service gives no shell (Render's free plan).

Set three environment variables on the host, then deploy once:

    DJANGO_SUPERUSER_USERNAME, DJANGO_SUPERUSER_EMAIL, DJANGO_SUPERUSER_PASSWORD

The command runs in build.sh. It does nothing when the account already exists or when the
variables are absent, so it is safe on every deploy. Remove the password variable once the
account exists, and change the password from the admin.
"""
import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Create the administrator from DJANGO_SUPERUSER_* variables, if it does not exist yet.'

    def handle(self, *args, **options):
        username = os.environ.get('DJANGO_SUPERUSER_USERNAME')
        password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')
        email = os.environ.get('DJANGO_SUPERUSER_EMAIL', '')
        if not username or not password:
            self.stdout.write('No DJANGO_SUPERUSER_USERNAME / _PASSWORD: nothing to do.')
            return

        User = get_user_model()
        if User.objects.filter(username=username).exists():
            self.stdout.write(f'The account "{username}" already exists.')
            return
        User.objects.create_superuser(username=username, email=email, password=password)
        self.stdout.write(self.style.SUCCESS(f'Administrator "{username}" created.'))
