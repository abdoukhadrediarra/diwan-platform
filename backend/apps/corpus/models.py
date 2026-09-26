"""
apps/corpus/models.py

The corpus is stored as  Diwan -> Poem -> Line.
Every paragraph of a poem file becomes one Line row, in reading order:

    section "muqaddima"  the opening text(s) before the abyat     (kind "prose")
    section "title"      the poem's name given by the author:     (kind "title")
                         the second text, on one line, right before the abyat
    section "matn"       the abyat, lines with "|"                (kind "bayt")
    section "khatima"    the prose texts after the last bayt      (kind "prose")

Keeping everything in ONE ordered table means a poem page, the mobile app and the
PDF template all render a poem with a single query:  poem.lines.all()  (ordered by position).

Requires the pg_trgm PostgreSQL extension: put
    from django.contrib.postgres.operations import TrigramExtension
    TrigramExtension()
as the first operation of this app's initial migration.
"""
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.indexes import GinIndex
from django.db import models
from django.db.models import Q


class Status(models.TextChoices):
    DRAFT = "draft", "Draft (red flags not resolved yet)"
    REVIEW = "review", "In review"
    PUBLISHED = "published", "Published"


class Diwan(models.Model):
    number = models.PositiveSmallIntegerField(unique=True)          # 1, 2, 3 ...
    slug = models.SlugField(unique=True)                            # "diwan-01"
    title = models.CharField(max_length=300)                        # with tashkeel, for display
    title_plain = models.CharField(max_length=300, blank=True)      # normalized, for search
    description = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    # figures of the diwan's complete text (set by `manage.py seed_diwans`), shown even before all poems are online
    corpus_abyat = models.PositiveIntegerField(default=0)
    corpus_hemistichs = models.PositiveIntegerField(default=0)
    corpus_words = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["number"]

    def __str__(self):
        return f"{self.number:02d} - {self.title}"


class TitleSource(models.TextChoices):
    NAME_LINE = "name_line", "Own name (line before the abyat)"
    BOLD = "bold", "Own name (marked in bold, inside the opening text)"
    FIRST_SADR = "first_sadr", "First sadr (no own name)"


class Poem(models.Model):
    diwan = models.ForeignKey(Diwan, on_delete=models.PROTECT, related_name="poems")
    number = models.PositiveIntegerField()                          # 8 in D01K08: order inside its diwan
    code = models.CharField(max_length=12, unique=True)             # "D01K08", same code as the .docx file name
    slug = models.SlugField()                                       # "008" -> /diwans/diwan-01/008
    title = models.CharField(max_length=500)                        # the poem's name: its own name line, else its first sadr
    title_source = models.CharField(max_length=10, choices=TitleSource.choices, default=TitleSource.FIRST_SADR)
    incipit = models.CharField(max_length=500)                      # first sadr
    title_plain = models.CharField(max_length=500, blank=True)      # normalized name, for search
    hemistichs_per_bayt = models.PositiveSmallIntegerField(default=2)  # 2, or 4 (Diwan 2 style)
    rhyme_letter = models.CharField(max_length=4, blank=True)
    meter = models.CharField(max_length=50, blank=True)
    bayt_count = models.PositiveIntegerField(default=0)
    is_acrostic = models.BooleanField(default=False)                # the own name is also spelled by the first letters of the abyat
    acrostic_match = models.PositiveSmallIntegerField(null=True, blank=True)  # % of the own name's letters found (None if no own name)
    has_open_flags = models.BooleanField(default=False)             # red words still present in source
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    source_file = models.CharField(max_length=255, blank=True)      # last imported .docx
    content_hash = models.CharField(max_length=64, blank=True)      # sha256 of the lines; changes -> re-import, rebuild PDF
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["diwan__number", "number"]
        constraints = [
            models.UniqueConstraint(fields=["diwan", "number"], name="poem_number_unique_in_diwan"),
            models.UniqueConstraint(fields=["diwan", "slug"], name="poem_slug_unique_in_diwan"),
        ]
        indexes = [
            GinIndex(name="poem_title_plain_trgm", fields=["title_plain"], opclasses=["gin_trgm_ops"]),
        ]

    def __str__(self):
        return f"{self.code} {self.title[:40]}"


class Line(models.Model):
    class Section(models.TextChoices):
        MUQADDIMA = "muqaddima", "Muqaddima (opening text)"
        TITLE = "title", "Name of the poem (right before the abyat)"
        MATN = "matn", "Matn (the abyat)"
        KHATIMA = "khatima", "Khatima (after the abyat)"

    class Kind(models.TextChoices):
        BAYT = "bayt", "Bayt"
        PROSE = "prose", "Prose (basmala, salawat, dedication, closing formula...)"
        TITLE = "title", "Name of the poem"
        HEADER = "header", "Section header"          # e.g. letter headings in alphabet poems
        QURAN = "quran", "Qur'anic passage"

    poem = models.ForeignKey(Poem, on_delete=models.CASCADE, related_name="lines")
    position = models.PositiveIntegerField()                        # 1, 2, 3 ... every line of the poem, in order
    section = models.CharField(max_length=10, choices=Section.choices)
    kind = models.CharField(max_length=10, choices=Kind.choices)
    bayt_number = models.PositiveIntegerField(null=True, blank=True)  # 1..n for abyat only (#bayt-12 links)
    hemistichs = ArrayField(models.TextField())                     # bayt: ["sadr", "ajz"] or 4 items; prose: 1 item
    acrostic_spans = ArrayField(models.TextField(), default=list, blank=True)  # bolded substring(s) of
                                                                     # this line, to highlight in red (see parsing.py)
    text_plain = models.TextField()                                 # joined, tashkeel stripped, normalized (search)

    class Meta:
        ordering = ["position"]
        constraints = [
            models.UniqueConstraint(fields=["poem", "position"], name="line_position_unique_in_poem"),
            models.UniqueConstraint(fields=["poem", "bayt_number"], name="line_bayt_number_unique_in_poem"),
            models.UniqueConstraint(fields=["poem"], condition=Q(kind="title"), name="one_title_line_per_poem"),
            # the title section holds exactly the name line, nothing else
            models.CheckConstraint(name="title_kind_matches_section",
                                   condition=Q(kind="title", section="title")
                                   | (~Q(kind="title") & ~Q(section="title"))),
            # a bayt lives in the matn, has a number and 2 or 4 hemistichs;
            # any other line has no bayt number and at least one text item   (Django >= 5.1: condition=)
            models.CheckConstraint(
                name="line_bayt_fields_consistent",
                condition=(
                    Q(kind="bayt", section="matn", bayt_number__isnull=False, hemistichs__len__in=[2, 4])
                    | (~Q(kind="bayt") & Q(bayt_number__isnull=True, hemistichs__len__gte=1))
                ),
            ),
        ]
        indexes = [
            GinIndex(name="line_text_plain_trgm", fields=["text_plain"], opclasses=["gin_trgm_ops"]),
        ]

    def __str__(self):
        label = f"bayt {self.bayt_number}" if self.bayt_number else self.section
        return f"{self.poem.code} · {label}"


class LineTranscription(models.Model):
    """Latin transcription of one line, one item per hemistich (same shape as Line.hemistichs).

    Generated from the tashkeel by apps/corpus/transcription.py. Once you correct it by hand
    (is_manual), the importer never overwrites it: it is kept when the poem is re-imported,
    and flagged needs_review if the Arabic of that line has changed since.
    """

    class Style(models.TextChoices):
        LOCAL = "local", "Local (as written in Senegal)"
        # ENGLISH = "english", "English-based"      # second style, later

    line = models.ForeignKey(Line, on_delete=models.CASCADE, related_name="transcriptions")
    style = models.CharField(max_length=10, choices=Style.choices, default=Style.LOCAL)
    parts = ArrayField(models.TextField())
    is_manual = models.BooleanField(default=False)       # corrected by hand: never regenerated
    needs_review = models.BooleanField(default=False)    # hand correction kept, but the Arabic changed since
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["line__poem__diwan__number", "line__poem__number", "line__position"]
        constraints = [
            models.UniqueConstraint(fields=["line", "style"], name="one_transcription_per_line_and_style"),
        ]

    def __str__(self):
        return f"{self.line} [{self.style}]"

