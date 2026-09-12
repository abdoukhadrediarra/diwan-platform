"""
apps/corpus/management/commands/seed_diwans.py

    python manage.py seed_diwans

Creates (or updates) the 7 diwans with their titles and the figures of their complete text,
so the website can show every diwan even before its poems are imported. Safe to run again.
"""
from django.core.management.base import BaseCommand

from apps.corpus.arabic import normalize_for_search
from apps.corpus.models import Diwan, Status

# number, title, abyat, hemistichs, words (counted on diwan_corpus_complet.docx)
DIWANS = [
    (1, "ديوان القرآنية", 5588, 11203, 65700),
    (2, "ديوان الأمداح النبوية", 6059, 13156, 71121),
    (3, "مراقي الأمن والسعادة", 3840, 7680, 44631),
    (4, "الفيوضات الربانية بالأعوام والشهور", 5523, 11046, 67682),
    (5, "القصائد المطرزة بغير الآيات القرآنية", 5387, 10774, 69448),
    (6, "الفيوضات الربانية في الذكر والشكر والتحدث بالنعم الإلهية", 4857, 9714, 57324),
    (7, "الفلك المشحون", 8994, 17988, 85164),
]


class Command(BaseCommand):
    help = "Create or update the 7 diwans (titles and figures of their complete text)."

    def handle(self, *args, **options):
        for number, title, abyat, hemistichs, words in DIWANS:
            _, created = Diwan.objects.update_or_create(
                number=number,
                defaults={
                    "slug": f"diwan-{number:02d}",
                    "title": title,
                    "title_plain": normalize_for_search(title),
                    "corpus_abyat": abyat,
                    "corpus_hemistichs": hemistichs,
                    "corpus_words": words,
                    "status": Status.PUBLISHED,
                },
            )
            self.stdout.write(f"  {'created' if created else 'updated'}  diwan {number}: {title}")
