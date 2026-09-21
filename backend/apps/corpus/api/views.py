"""
Read-only API for the website and the mobile app. Only published poems are visible.

    GET /api/v1/corpus/                                   totals + the 7 diwans
    GET /api/v1/diwans/                                   the 7 diwans
    GET /api/v1/diwans/diwan-01/                          one diwan and its published poems
    GET /api/v1/diwans/diwan-01/poems/008/                one poem with all its lines and transcriptions
"""
import logging
from django.db.models import Count, IntegerField, Prefetch, Q, Sum, Value
from django.http import HttpResponse
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)

from ..arabic import normalize_for_search
from ..models import Diwan, Line, LineTranscription, Poem, Status
from ..search_utils import (
    AUTHOR_KEYWORDS,
    DIWAN_THEMES,
    clean_transcription_expression,
    get_latin_search_variants,
    normalize_latin,
)
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
                "search": base + "search/?q=",
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


class SearchView(APIView):
    """
    Search across published poems and verses in the corpus.
    Supports:
        - Arabic with or without tashkeel / hamzas (طوبى, الله, محمد...)
        - Phonetic Latin transcription (bismillahi, a'oûzou, aoudhou, chaytan, rahman...)
        - Diwan names / numbers in French, English, Wolof (diwan 1, coranique, éloges...)
        - Poem codes (D01K08, K08) and poem numbers (poème 8, poem 8)
        - Acrostic filter (acrostiche, acrostic)
        - Author & spiritual terms (bamba, cheikh, touba, khadim...)
    """

    def get(self, request):
        import re
        raw_query = request.query_params.get("q", "").strip()
        if not raw_query or len(raw_query) < 2:
            return Response({
                "error": "La requête de recherche doit comporter au moins 2 caractères.",
                "results": [],
                "total": 0,
            }, status=400)
        if len(raw_query) > 100:
            return Response({
                "error": "La requête est trop longue (maximum 100 caractères).",
                "results": [],
                "total": 0,
            }, status=400)

        scope = request.query_params.get("scope", "all")
        diwan_filter = request.query_params.get("diwan", "").strip()
        try:
            limit = min(max(int(request.query_params.get("limit", 30)), 1), 60)
        except ValueError:
            limit = 30

        # Normalizations
        norm_ar = normalize_for_search(raw_query)
        norm_lat = normalize_latin(raw_query)
        latin_variants = get_latin_search_variants(raw_query)
        has_latin = bool(re.search(r'[a-zA-Z]', raw_query))
        has_arabic = bool(re.search(r'[\u0600-\u06FF]', raw_query))

        # Check structured references
        diwan_match = re.search(r'\b(?:diwan|d)\s*[-_]?\s*0?([1-7])\b', norm_lat)
        poem_match = re.search(r'\b(?:poeme|poem|khassida|xassida|k)\s*[-_]?\s*0?(\d+)\b', norm_lat)
        code_match = re.search(r'\b(d\d{2}k\d{2})\b', norm_lat)

        # Diwan thematic keywords
        matched_diwan_themes = []
        for dnum, keywords in DIWAN_THEMES.items():
            if any(kw in norm_lat for kw in keywords):
                matched_diwan_themes.append(dnum)

        is_acrostic_search = bool('acrosti' in norm_lat)

        # Base poem filter
        base_poem_q = Q(status=Status.PUBLISHED)
        if diwan_filter:
            base_poem_q &= Q(diwan__slug=diwan_filter)

        results = []
        seen_poem_ids = set()

        # Expression to search transcriptions cleanly
        clean_parts_expr = clean_transcription_expression()

        # -------------------------------------------------------------
        # 1. Search in titles / codes / diwan metadata / acrostics
        # -------------------------------------------------------------
        if scope in ("all", "titles"):
            poem_q = Q()

            # Exact or partial code
            if code_match:
                poem_q |= Q(code__iexact=code_match.group(1).upper())
            else:
                poem_q |= Q(code__iexact=raw_query) | Q(code__icontains=raw_query)

            # Poem number
            if poem_match:
                poem_q |= Q(number=int(poem_match.group(1)))
            elif raw_query.isdigit():
                poem_q |= Q(number=int(raw_query))

            # Diwan reference (e.g. "diwan 1")
            if diwan_match:
                poem_q |= Q(diwan__number=int(diwan_match.group(1)))

            # Diwan themes (e.g. "coranique", "éloge")
            if matched_diwan_themes:
                poem_q |= Q(diwan__number__in=matched_diwan_themes)

            # Acrostic filter
            if is_acrostic_search:
                poem_q |= Q(is_acrostic=True)

            # Arabic title
            if has_arabic:
                poem_q |= Q(title_plain__icontains=norm_ar) | Q(title__icontains=raw_query)

            # Latin title search via LineTranscription (kind='title' or kind='prose' opening)
            if has_latin and latin_variants and not (diwan_match or poem_match):
                try:
                    trans_title_q = Q(line__kind__in=['title', 'prose'])
                    var_q = Q()
                    for v in latin_variants:
                        var_q |= Q(clean_text__icontains=v.replace("'", ""))
                    trans_title_q &= var_q

                    matching_title_lines = (
                        LineTranscription.objects.annotate(clean_text=clean_parts_expr)
                        .filter(trans_title_q, line__poem__status=Status.PUBLISHED)
                        .values_list('line__poem_id', flat=True)[:limit]
                    )
                    latin_title_poem_ids = list(matching_title_lines)
                    if latin_title_poem_ids:
                        poem_q |= Q(id__in=latin_title_poem_ids)
                except Exception as exc:
                    logger.warning("Erreur lors de la recherche des titres latins: %s", exc)

            if poem_q:
                matching_poems = (
                    Poem.objects.filter(base_poem_q & poem_q)
                    .select_related("diwan")
                    .order_by("diwan__number", "number")[:limit]
                )

                for p in matching_poems:
                    seen_poem_ids.add(p.id)
                    results.append({
                        "diwan_number": p.diwan.number,
                        "diwan_slug": p.diwan.slug,
                        "diwan_title": p.diwan.title,
                        "poem_number": p.number,
                        "poem_slug": p.slug,
                        "poem_code": p.code,
                        "poem_title": p.title,
                        "bayt_count": p.bayt_count,
                        "is_acrostic": p.is_acrostic,
                        "match_type": "title",
                        "matched_lines": [],
                    })

        # -------------------------------------------------------------
        # 2. Search in verses (Arabic Line.text_plain + Latin LineTranscription)
        # -------------------------------------------------------------
        if scope in ("all", "verses") and len(results) < limit:
            remaining_slots = limit - len(results)
            lines_by_poem = {}

            # 2a. Arabic verse search
            if has_arabic:
                line_filter = Q(poem__status=Status.PUBLISHED) & Q(text_plain__icontains=norm_ar)
                if diwan_filter:
                    line_filter &= Q(poem__diwan__slug=diwan_filter)

                matching_lines = (
                    Line.objects.filter(line_filter)
                    .select_related("poem", "poem__diwan")
                    .prefetch_related(Prefetch("transcriptions", queryset=LineTranscription.objects.all()))
                    .order_by("poem__diwan__number", "poem__number", "position")[:remaining_slots * 5]
                )

                for line in matching_lines:
                    pid = line.poem_id
                    if pid not in lines_by_poem:
                        lines_by_poem[pid] = {"poem": line.poem, "lines": []}
                    if len(lines_by_poem[pid]["lines"]) < 3:
                        trans_text = ""
                        trans_obj = line.transcriptions.first()
                        if trans_obj and trans_obj.parts:
                            trans_text = " | ".join(trans_obj.parts)
                        lines_by_poem[pid]["lines"].append({
                            "bayt_number": line.bayt_number,
                            "position": line.position,
                            "kind": line.kind,
                            "hemistichs": line.hemistichs,
                            "transcription": trans_text,
                        })

            # 2b. Latin verse search (LineTranscription)
            if has_latin and latin_variants and not (diwan_match or poem_match) and len(lines_by_poem) < remaining_slots:
                try:
                    trans_verse_q = Q(line__kind__in=['bayt', 'prose'])
                    var_q = Q()
                    for v in latin_variants:
                        var_q |= Q(clean_text__icontains=v.replace("'", ""))
                    trans_verse_q &= var_q

                    line_trans_filter = Q(line__poem__status=Status.PUBLISHED) & trans_verse_q
                    if diwan_filter:
                        line_trans_filter &= Q(line__poem__diwan__slug=diwan_filter)

                    matching_trans_lines = (
                        LineTranscription.objects.annotate(clean_text=clean_parts_expr)
                        .filter(line_trans_filter)
                        .select_related("line", "line__poem", "line__poem__diwan")
                        .order_by("line__poem__diwan__number", "line__poem__number", "line__position")[:remaining_slots * 5]
                    )

                    for lt in matching_trans_lines:
                        line = lt.line
                        pid = line.poem_id
                        if pid not in lines_by_poem:
                            lines_by_poem[pid] = {"poem": line.poem, "lines": []}
                        if len(lines_by_poem[pid]["lines"]) < 3:
                            lines_by_poem[pid]["lines"].append({
                                "bayt_number": line.bayt_number,
                                "position": line.position,
                                "kind": line.kind,
                                "hemistichs": line.hemistichs,
                                "transcription": " | ".join(lt.parts) if lt.parts else "",
                            })
                except Exception as exc:
                    logger.warning("Erreur lors de la recherche des versets latins: %s", exc)

            # Merge matched lines into results
            for pid, data in lines_by_poem.items():
                if pid in seen_poem_ids:
                    for r in results:
                        if r["poem_code"] == data["poem"].code and not r["matched_lines"]:
                            r["matched_lines"] = data["lines"]
                            break
                    continue

                p = data["poem"]
                seen_poem_ids.add(p.id)
                results.append({
                    "diwan_number": p.diwan.number,
                    "diwan_slug": p.diwan.slug,
                    "diwan_title": p.diwan.title,
                    "poem_number": p.number,
                    "poem_slug": p.slug,
                    "poem_code": p.code,
                    "poem_title": p.title,
                    "bayt_count": p.bayt_count,
                    "is_acrostic": p.is_acrostic,
                    "match_type": "verse",
                    "matched_lines": data["lines"],
                })

                if len(results) >= limit:
                    break

        return Response({
            "query": raw_query,
            "normalized_query": norm_ar if has_arabic else norm_lat,
            "scope": scope,
            "total": len(results),
            "results": results,
        })


