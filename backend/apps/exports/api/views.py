"""
apps/exports/api.py

Downloading a poem as PDF:

    GET /api/v1/diwans/diwan-01/poems/008/pdf/
    GET /api/v1/diwans/diwan-01/poems/008/pdf/?script=wolofal&transcription=1

The file is produced when it is asked for and sent as an attachment, so the browser and the
mobile app save it with a readable name (D01K08.pdf). Nothing is stored on the server, which
suits a host with no permanent disk.
"""
from django.http import Http404, HttpResponse
from django.shortcuts import get_object_or_404
from django.utils.cache import patch_cache_control
from django.views.decorators.http import require_GET
from django.db.models import Prefetch

from apps.corpus.models import Line, LineTranscription, Poem, Status
from ..builders.pdf import SCRIPTS, build_poem_pdf, poem_filename


@require_GET
def poem_pdf(request, diwan, poem):
    lines = Line.objects.order_by("position").prefetch_related(
        Prefetch("transcriptions", queryset=LineTranscription.objects.all()))
    published = Poem.objects.select_related("diwan").prefetch_related(Prefetch("lines", queryset=lines))
    poem_object = get_object_or_404(published, diwan__slug=diwan, slug=poem, status=Status.PUBLISHED)

    script = request.GET.get("script", "classic")
    if script not in SCRIPTS:
        raise Http404(f"Unknown script: {script}")
    transcription = request.GET.get("transcription") in ("1", "true", "yes")

    try:
        pdf = build_poem_pdf(poem_object, script, transcription)
    except ImportError:
        return HttpResponse("WeasyPrint is not installed on this server.", status=503, content_type="text/plain")

    name = poem_filename(poem_object, script, transcription)
    response = HttpResponse(pdf, content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="{name}"'
    response["Content-Length"] = len(pdf)
    patch_cache_control(response, public=True, max_age=3600)   # the text rarely changes
    return response
