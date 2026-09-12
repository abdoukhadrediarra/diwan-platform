"""
apps/exports/models.py

Every downloadable file (PDF now, DOCX for print later) is one row here.
Files are generated AHEAD of time (when a poem/diwan is published or changes),
never on each download request — the corpus PDF alone is well over 1,000 pages.

When rebuilding a file, delete the old one first:
    export.file.delete(save=False)
otherwise Django's storage appends a random suffix instead of overwriting.
Expose URLs as  file.url + "?v=" + source_hash[:8]  so browsers/apps never serve a stale cached PDF.
"""
from django.db import models
from django.db.models import Q

from apps.corpus.models import Diwan, Poem


def export_upload_to(instance, filename):
    ext = instance.format
    if instance.scope == Export.Scope.CORPUS:
        return f"exports/corpus/khassaides-corpus.{ext}"
    if instance.scope == Export.Scope.DIWAN:
        return f"exports/diwans/diwan-{instance.diwan.number:02d}.{ext}"
    poem = instance.poem
    return f"exports/poems/diwan-{poem.diwan.number:02d}/poem-{poem.number:03d}.{ext}"


class Export(models.Model):
    class Scope(models.TextChoices):
        POEM = "poem"
        DIWAN = "diwan"
        CORPUS = "corpus"

    class Format(models.TextChoices):
        PDF = "pdf"
        DOCX = "docx"

    scope = models.CharField(max_length=10, choices=Scope.choices)
    diwan = models.ForeignKey(Diwan, null=True, blank=True, on_delete=models.CASCADE, related_name="exports")
    poem = models.ForeignKey(Poem, null=True, blank=True, on_delete=models.CASCADE, related_name="exports")
    format = models.CharField(max_length=5, choices=Format.choices, default=Format.PDF)
    file = models.FileField(upload_to=export_upload_to, max_length=255)
    source_hash = models.CharField(max_length=64)          # content hash the file was built from
    size_bytes = models.PositiveBigIntegerField(default=0)  # shown next to the download button
    generated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            # the right foreign key must be filled for each scope  (Django >= 5.1 uses condition=)
            models.CheckConstraint(
                name="export_scope_matches_target",
                condition=(
                    Q(scope="poem", poem__isnull=False, diwan__isnull=True)
                    | Q(scope="diwan", diwan__isnull=False, poem__isnull=True)
                    | Q(scope="corpus", diwan__isnull=True, poem__isnull=True)
                ),
            ),
            # exactly one file per target per format
            models.UniqueConstraint(fields=["poem", "format"], condition=Q(scope="poem"),
                                    name="one_export_per_poem_format"),
            models.UniqueConstraint(fields=["diwan", "format"], condition=Q(scope="diwan"),
                                    name="one_export_per_diwan_format"),
            models.UniqueConstraint(fields=["format"], condition=Q(scope="corpus"),
                                    name="one_export_per_corpus_format"),
        ]

    def __str__(self):
        return f"{self.scope}:{self.poem_id or self.diwan_id or 'all'}.{self.format}"
