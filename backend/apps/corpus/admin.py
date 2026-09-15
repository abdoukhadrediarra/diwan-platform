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
from django.utils.html import format_html
from django.urls import path

from .exporting import write_poem_json_quietly
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


class RedWordsFilter(admin.FieldListFilter):
    """Reads "Mots en rouge : Aucun / À corriger" instead of "has open flags: Oui / Non"."""

    title = "Mots en rouge"
    labels = {"1": "À corriger", "0": "Aucun"}

    def __init__(self, field, request, params, model, model_admin, field_path):
        self.lookup_kwarg = f"{field_path}__exact"
        self.lookup_val = params.get(self.lookup_kwarg)
        super().__init__(field, request, params, model, model_admin, field_path)

    def expected_parameters(self):
        return [self.lookup_kwarg]

    def choices(self, changelist):
        yield {"selected": self.lookup_val is None,
               "query_string": changelist.get_query_string(remove=[self.lookup_kwarg]), "display": "Tout"}
        for value, label in self.labels.items():
            yield {"selected": self.lookup_val == value,
                   "query_string": changelist.get_query_string({self.lookup_kwarg: value}), "display": label}


class AcrosticFilter(RedWordsFilter):
    title = "Acrostiche"
    labels = {"1": "Oui", "0": "Non"}


class PoemImportForm(forms.Form):
    files = MultipleFileField(label="Poem files",
                              help_text="One poem per file: the reviewed .docx (named D01K08_…) or its JSON from the web page.")


@admin.register(Diwan)
class DiwanAdmin(admin.ModelAdmin):
    list_display = ["number", "title", "corpus_abyat", "status"]


@admin.register(Poem)
class PoemAdmin(admin.ModelAdmin):
    list_display = ["code", "title", "title_source", "bayt_count", "acrostic", "red_words", "status"]
    list_filter = ["diwan", "status", "title_source", ("is_acrostic", AcrosticFilter), ("has_open_flags", RedWordsFilter)]
    list_editable = ["status"]
    search_fields = ["code", "title_plain"]
    change_list_template = "admin/corpus/poem/change_list.html"

    @admin.display(description="Mots en rouge", ordering="has_open_flags")
    def red_words(self, poem):
        """Green when the poem is clean, red when words still have to be reviewed."""
        return self._badge(not poem.has_open_flags, "Aucun", "À corriger")

    @admin.display(description="Acrostiche", ordering="is_acrostic")
    def acrostic(self, poem):
        if not poem.is_acrostic:
            return format_html('<span style="color:{}">{}</span>', "#5a6862", "Non")
        return format_html('<span style="color:#0f5a44; font-weight:600">Oui, {}%</span>', poem.acrostic_match or 0)

    @staticmethod
    def _badge(good: bool, yes: str, no: str):
        colour, label = ("#0f5a44", yes) if good else ("#9b2c2c", no)
        return format_html('<span style="color:{}; font-weight:600">{}</span>', colour, label)

    def get_urls(self):
        extra = [path("import/", self.admin_site.admin_view(self.import_view), name="corpus_poem_import")]
        return extra + super().get_urls()

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        write_poem_json_quietly(obj)          # publishing a poem updates its file in corpus-json/

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        write_poem_json_quietly(form.instance)

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
        write_poem_json_quietly(obj.line.poem)   # the correction goes into corpus-json/ too
