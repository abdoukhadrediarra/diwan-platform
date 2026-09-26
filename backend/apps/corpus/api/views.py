"""
Read-only API for the website and the mobile app. Only published poems are visible.

    GET /api/v1/corpus/                                   totals + the 7 diwans
    GET /api/v1/diwans/                                   the 7 diwans
    GET /api/v1/diwans/diwan-01/                          one diwan and its published poems
    GET /api/v1/diwans/diwan-01/poems/008/                one poem with all its lines and transcriptions
"""
from django.db.models import Count, IntegerField, Prefetch, Q, Sum, Value
from django.http import HttpResponse
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Diwan, Line, LineTranscription, Poem, Status
from .serializers import DiwanDetailSerializer, DiwanSummarySerializer, PoemDetailSerializer

PUBLISHED = Q(poems__status=Status.PUBLISHED)


def diwans_with_counts():
    return Diwan.objects.annotate(
        poem_count=Count("poems", filter=PUBLISHED),
        published_abyat=Coalesce(Sum("poems__bayt_count", filter=PUBLISHED), Value(0), output_field=IntegerField()),
    ).order_by("number")


def robots_txt(request):
    """Ask search engines to stay away while the platform is not launched."""
    return HttpResponse("User-agent: *\nDisallow: /\n", content_type="text/plain")


class ApiRootView(APIView):
    """What lives at the root of the server: a short index, so the address is never a dead end."""

    def get(self, request):
        base = request.build_absolute_uri('/api/v1/')
        return Response({
            "name": "Diwan API",
            "description": "Les sept diwans de Cheikh Ahmadou Bamba (lecture seule).",
            "endpoints": {
                "corpus": base + "corpus/",
                "diwans": base + "diwans/",
                "one_diwan": base + "diwans/diwan-01/",
                "one_poem": base + "diwans/diwan-01/poems/008/",
            },
            "admin": request.build_absolute_uri('/admin/'),
        })


class CorpusView(APIView):
    def get(self, request):
        diwans = list(diwans_with_counts())
        return Response({
            "diwan_count": len(diwans),
            "poem_count": sum(d.poem_count for d in diwans),
            "published_abyat": sum(d.published_abyat for d in diwans),
            "corpus_abyat": sum(d.corpus_abyat for d in diwans),
            "corpus_hemistichs": sum(d.corpus_hemistichs for d in diwans),
            "corpus_words": sum(d.corpus_words for d in diwans),
            "diwans": DiwanSummarySerializer(diwans, many=True).data,
        })


class DiwanListView(ListAPIView):
    serializer_class = DiwanSummarySerializer
    pagination_class = None

    def get_queryset(self):
        return diwans_with_counts()


class DiwanDetailView(RetrieveAPIView):
    serializer_class = DiwanDetailSerializer

    def get_object(self):
        published = Poem.objects.filter(status=Status.PUBLISHED).order_by("number")
        queryset = diwans_with_counts().prefetch_related(Prefetch("poems", queryset=published, to_attr="published_poems"))
        return get_object_or_404(queryset, slug=self.kwargs["diwan"])


class PoemDetailView(RetrieveAPIView):
    serializer_class = PoemDetailSerializer

    def get_object(self):
        lines = Line.objects.order_by("position").prefetch_related(
            Prefetch("transcriptions", queryset=LineTranscription.objects.all()))
        queryset = Poem.objects.select_related("diwan").prefetch_related(Prefetch("lines", queryset=lines))
        return get_object_or_404(queryset, diwan__slug=self.kwargs["diwan"], slug=self.kwargs["poem"],
                                 status=Status.PUBLISHED)
