"""
apps/corpus/search_utils.py

Intelligent multi-lingual search utilities for Diwan Platform.
Handles:
  1. Arabic text normalization (tashkeel stripping, alif/hamza harmonization)
  2. Latin phonetic transcription normalization (diacritics, circumflexes, apostrophes)
  3. Phonetic transliteration variants (dh <-> z, th <-> s, sh <-> ch, x <-> kh, ou <-> u, bismillahi <-> bismi llahi)
  4. French, English & Wolof query understanding (diwans, themes, poem numbers, acrostics)
"""
import re
import unicodedata
from django.db import models
from django.db.models import F, Func, Value


def normalize_latin(text: str) -> str:
    """Strip accents, circumflexes, punctuation, and lowercase."""
    text = unicodedata.normalize('NFKD', text)
    text = ''.join(c for c in text if not unicodedata.combining(c))
    text = text.lower()
    text = re.sub(r"['’\"`\-_,;:!?/\\()\[\]{}*]", "", text)
    return re.sub(r"\s+", " ", text).strip()


def get_latin_search_variants(query: str) -> list[str]:
    """Generate common phonetic & orthographic variants for a Latin search term."""
    norm = normalize_latin(query)
    if not norm or len(norm) < 2:
        return []

    variants = {norm}

    # 1. dh <-> z (e.g. aoudhou <-> aouzou, dhikr <-> zikr)
    if 'dh' in norm:
        variants.add(norm.replace('dh', 'z'))
    if 'z' in norm:
        variants.add(norm.replace('z', 'dh'))

    # 2. th <-> s (e.g. thawabu <-> sawabu)
    if 'th' in norm:
        variants.add(norm.replace('th', 's'))

    # 3. sh <-> ch (e.g. shaitan <-> chaytan)
    if 'sh' in norm:
        variants.add(norm.replace('sh', 'ch'))
    if 'ch' in norm:
        variants.add(norm.replace('ch', 'sh'))

    # 4. x <-> kh (Wolof orthography often uses x for kh, e.g. xassida <-> khassida)
    if 'x' in norm:
        variants.add(norm.replace('x', 'kh'))
    if 'kh' in norm:
        variants.add(norm.replace('kh', 'x'))

    # 5. bismillahi / alhamdoulillah joined vs split
    if 'bismillahi' in norm:
        variants.add('bismi llahi')
        variants.add('bismillah')
        variants.add('bismi llah')
    elif 'bismillah' in norm:
        variants.add('bismi llahi')
        variants.add('bismillahi')
    elif 'bismi' in norm:
        variants.add('bismillahi')
        variants.add('bismillah')

    if 'alhamdoulillah' in norm:
        variants.add('alhamdou lillah')
    elif 'alhamdou' in norm and 'lillah' in norm:
        variants.add('alhamdoulillah')

    # 6. ou <-> u
    if 'ou' in norm:
        variants.add(norm.replace('ou', 'u'))
    if 'u' in norm and 'ou' not in norm:
        variants.add(norm.replace('u', 'ou'))

    # 7. double letters vs single letters for common words
    if 'llah' in norm:
        variants.add(norm.replace('llah', 'lah'))
    if 'lah' in norm and 'llah' not in norm:
        variants.add(norm.replace('lah', 'llah'))

    # Return valid variants with length >= 2
    return [v for v in variants if len(v) >= 2]


DIWAN_THEMES = {
    1: [
        'coran', 'coranique', 'coraniques', 'quran', 'quranic', 'alxuraan',
        'quraniyya', 'qouran', 'sourate', 'sourates', 'fatiha', 'ikhlas', 'baqara'
    ],
    2: [
        'eloge', 'eloges', 'louange', 'louanges', 'prophete', 'prophet', 'prophetes',
        'praise', 'praises', 'amdah', 'nabawi', 'nabawiyya', 'tagg', 'habib', 'moustapha'
    ],
    3: [
        'securite', 'felicite', 'paix', 'peace', 'bliss', 'bonheur', 'salut',
        'maraqi', 'amn', 'saada', 'jamm'
    ],
    4: [
        'annee', 'annees', 'mois', 'year', 'years', 'month', 'months',
        'temps', 'fuyudat', 'awam', 'chouhour', 'weer', 'at'
    ],
    5: [
        'acrostiche', 'acrostiches', 'acrostic', 'acrostics', 'mutarraza', 'motarraza'
    ],
    6: [
        'invocation', 'invocations', 'priere', 'prieres', 'dhikr', 'zikr',
        'gratitude', 'bienfaits', 'remerciement', 'remerciements', 'choukr', 'bounty', 'sant'
    ],
    7: [
        'vaisseau', 'arche', 'bateau', 'ship', 'ark', 'foulk', 'machhoun', 'gaal'
    ],
}

AUTHOR_KEYWORDS = [
    'cheikh', 'seex', 'bamba', 'ahmadou', 'ahmad', 'khadim', 'khadimou', 'rassoul',
    'touba', 'tuubaa', 'mouride', 'mouridisme', 'khassida', 'xassida', 'serigne'
]


def clean_transcription_expression():
    """
    Returns a Django DB Func that transforms LineTranscription.parts (text[])
    into a clean unaccented lowercase string with apostrophes stripped, suitable for
    fast, flexible cross-database case-insensitive pattern matching without requiring
    external postgres extensions like unaccent.
    """
    return Func(
        Func(
            Func(
                Func(
                    F('parts'),
                    Value(' '),
                    function='array_to_string',
                    output_field=models.TextField(),
                ),
                Value('âîûÂÎÛéèêëàùüôöïçñ'),
                Value('aiuAIUeeeeauuooicn'),
                function='translate',
                output_field=models.TextField(),
            ),
            Value("'"),
            Value(''),
            function='replace',
            output_field=models.TextField(),
        ),
        function='lower',
        output_field=models.TextField(),
    )

