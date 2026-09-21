# Generated manually to enable unaccent extension in PostgreSQL
from django.contrib.postgres.operations import UnaccentExtension
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('corpus', '0001_initial'),
    ]

    operations = [
        UnaccentExtension(),
    ]
