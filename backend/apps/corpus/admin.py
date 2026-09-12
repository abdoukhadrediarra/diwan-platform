"""
apps/corpus/admin.py

Correcting a transcription: Admin > Line transcriptions, filter by poem or by "needs review",
edit the text (hemistichs separated by |) and save. Saving a change marks it as corrected
by hand, so imports will never overwrite it.
"""
import io
import json

from django import forms
from django.contrib import admin, messages
from django.contrib.postgres.forms import SimpleArrayField
from django.db import IntegrityError
from django.template.response import TemplateResponse
from django.urls import path

from .importing import save_poem
from .models import Diwan, LineTranscription, Poem
from .parsing import check_poem_json, parse_poem_docx


class MultipleFileInput(forms.ClearableFileInput):
    allow_multiple_selected = True


class MultipleFileField(forms.FileField):
    def __init__(self, *args, **kwargs):
        kwargs.setdefault("widget", MultipleFileInput(attrs={"accept": ".docx,.json"}))
        super().__init__(*args, **kwargs)

    def clean(self, data, initial=None):
        single = super().clean
        return [single(item, initial) for item in data] if isinstance(data, (list, tuple)) else [single(data, initial)]


class PoemImportForm(forms.Form):
    files = MultipleFileField(label="Poem files",
                              help_text="One poem per file: the reviewed .docx (named D01K08_…) or its JSON from the web page.")


@admin.register(Diwan)
class DiwanAdmin(admin.ModelAdmin):
    list_display = ["number", "title", "corpus_abyat", "status"]


@admin.register(Poem)
class PoemAdmin(admin.ModelAdmin):
    list_display = ["code", "title", "title_source", "bayt_count", "is_acrostic", "has_open_flags", "status"]
    list_filter = ["diwan", "status", "title_source", "is_acrostic", "has_open_flags"]
    list_editable = ["status"]
    search_fields = ["code", "title_plain"]
    change_list_template = "admin/corpus/poem/change_list.html"

    def get_urls(self):
        extra = [path("import/", self.admin_site.admin_view(self.import_view), name="corpus_poem_import")]
        return extra + super().get_urls()

    def import_view(self, request):
        """Upload reviewed poems: they are saved exactly like `manage.py import_poems` saves them."""
        results = []
        form = PoemImportForm(request.POST or None, request.FILES or None)
        if request.method == "POST" and form.is_valid():
            for upload in form.cleaned_data["files"]:
                row = {"file": upload.name, "warnings": []}
                try:
                    if upload.name.lower().endswith(".json"):
                        data = check_poem_json(json.load(upload), upload.name)
                    elif upload.name.lower().endswith(".docx"):
                        data = parse_poem_docx(io.BytesIO(upload.read()), filename=upload.name)
                    else:
                        raise ValueError(f"{upload.name}: only .docx and .json files can be imported")
                    r = save_poem(data)
                    row.update(code=r.code, title=data["title"], result=r.result, status=r.status,
                               notes=r.notes, warnings=data["warnings"], ok=True)
                except (ValueError, KeyError, IntegrityError, json.JSONDecodeError) as exc:
                    row.update(error=str(exc), ok=False)
                except Exception as exc:  # damaged file
                    row.update(error=f"{upload.name}: could not be read ({exc.__class__.__name__})", ok=False)
                results.append(row)
            done = sum(r["ok"] for r in results)
            messages.info(request, f"{done} of {len(results)} poem(s) imported.")
            form = PoemImportForm()
        context = {**self.admin_site.each_context(request), "title": "Import poems", "form": form,
                   "results": results, "opts": self.model._meta}
        return TemplateResponse(request, "admin/corpus/poem/import.html", context)


class LineTranscriptionForm(forms.ModelForm):
    parts = SimpleArrayField(forms.CharField(), delimiter="|",
                             help_text="One part per hemistich, separated by | (sadr | ajz).")

    class Meta:
        model = LineTranscription
        fields = ["parts", "is_manual", "needs_review"]


@admin.register(LineTranscription)
class LineTranscriptionAdmin(admin.ModelAdmin):
    form = LineTranscriptionForm
    list_display = ["poem_code", "line_label", "arabic", "latin", "is_manual", "needs_review"]
    list_filter = ["needs_review", "is_manual", "style", "line__poem__diwan"]
    search_fields = ["line__poem__code", "line__text_plain"]
    readonly_fields = ["arabic"]
    list_select_related = ["line__poem"]

    @admin.display(description="Poem", ordering="line__poem__code")
    def poem_code(self, obj):
        return obj.line.poem.code

    @admin.display(description="Line")
    def line_label(self, obj):
        return f"bayt {obj.line.bayt_number}" if obj.line.bayt_number else obj.line.section

    @admin.display(description="Arabic")
    def arabic(self, obj):
        return " | ".join(obj.line.hemistichs)

    @admin.display(description="Transcription")
    def latin(self, obj):
        return " | ".join(obj.parts)

    def save_model(self, request, obj, form, change):
        if change and "parts" in form.changed_data:
            obj.is_manual = True          # a hand correction is never regenerated
            obj.needs_review = False      # and it is now up to date with the Arabic
        super().save_model(request, obj, form, change)
