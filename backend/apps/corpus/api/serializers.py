from django.urls import reverse
from rest_framework import serializers

from ..models import Diwan, Line, Poem


class DiwanSummarySerializer(serializers.ModelSerializer):
    poem_count = serializers.IntegerField(read_only=True)        # published poems (annotated in the view)
    published_abyat = serializers.IntegerField(read_only=True)

    class Meta:
        model = Diwan
        fields = ["number", "slug", "title", "poem_count", "published_abyat",
                  "corpus_abyat", "corpus_hemistichs", "corpus_words"]


class PoemSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Poem
        fields = ["code", "number", "slug", "title", "title_source", "is_acrostic", "bayt_count", "hemistichs_per_bayt"]


class DiwanDetailSerializer(DiwanSummarySerializer):
    poems = PoemSummarySerializer(many=True, read_only=True, source="published_poems")

    class Meta(DiwanSummarySerializer.Meta):
        fields = DiwanSummarySerializer.Meta.fields + ["poems"]


class LineSerializer(serializers.ModelSerializer):
    transcription = serializers.SerializerMethodField()

    class Meta:
        model = Line
        fields = ["position", "section", "kind", "bayt_number", "hemistichs", "transcription"]

    def get_transcription(self, line) -> dict:
        return {t.style: t.parts for t in line.transcriptions.all()}   # {"local": ["sadr", "ajz"]}


class DiwanRefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Diwan
        fields = ["number", "slug", "title"]


class PoemDetailSerializer(serializers.ModelSerializer):
    diwan = DiwanRefSerializer(read_only=True)
    lines = LineSerializer(many=True, read_only=True)
    previous = serializers.SerializerMethodField()
    next = serializers.SerializerMethodField()
    downloads = serializers.SerializerMethodField()

    class Meta:
        model = Poem
        fields = ["code", "number", "slug", "title", "title_source", "is_acrostic", "acrostic_match", "incipit",
                  "bayt_count", "hemistichs_per_bayt", "diwan", "lines", "previous", "next", "downloads"]

    def get_downloads(self, poem) -> dict:
        """Ready-made addresses of the PDF versions of this poem."""
        base = reverse("api-poem-pdf", kwargs={"diwan": poem.diwan.slug, "poem": poem.slug})
        request = self.context.get("request")
        full = request.build_absolute_uri(base) if request else base
        return {
            "pdf": full,
            "pdf_transcription": f"{full}?transcription=1",
            "pdf_wolofal": f"{full}?script=wolofal",
            "pdf_wolofal_transcription": f"{full}?script=wolofal&transcription=1",
        }

    def _neighbour(self, poem, before: bool):
        siblings = Poem.objects.filter(diwan=poem.diwan, status="published")
        siblings = siblings.filter(number__lt=poem.number).order_by("-number") if before \
            else siblings.filter(number__gt=poem.number).order_by("number")
        other = siblings.only("slug", "title", "number").first()
        return {"slug": other.slug, "title": other.title, "number": other.number} if other else None

    def get_previous(self, poem):
        return self._neighbour(poem, before=True)

    def get_next(self, poem):
        return self._neighbour(poem, before=False)
