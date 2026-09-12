"""
tools/poem_json_web/app.py

A small web page on your own computer: drop poem .docx files (or paste a poem)
and get the JSON for the database.

    pip install flask python-docx
    python tools/poem_json_web/app.py          # then open http://127.0.0.1:5000

It uses the same parsing code as the Django import (apps/corpus/parsing.py), so its
JSON is exactly what `python manage.py import_poems` expects.

"Save in project" writes the files to  <repository>/corpus-json/diwan-01/D01K08.json
(change the folder with the POEM_JSON_DIR environment variable).
"""
import io
import json
import os
import re
import sys
import zipfile
from pathlib import Path

from flask import Flask, jsonify, render_template, request, send_file

BACKEND_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BACKEND_DIR))
from apps.corpus.parsing import parse_poem_docx, parse_poem_text  # noqa: E402

JSON_DIR = Path(os.environ.get("POEM_JSON_DIR", BACKEND_DIR.parent / "corpus-json"))

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 25 * 1024 * 1024
app.json.ensure_ascii = False  # keep Arabic readable in the JSON
app.json.sort_keys = False     # keep the field order of parsing.py


def _safe_code(poem: dict) -> str:
    code = re.sub(r"[^A-Za-z0-9]", "", str(poem.get("code", "")))
    if not re.fullmatch(r"D\d{2}K\d{2,3}", code):
        raise ValueError(f"not a poem JSON: bad code {poem.get('code')!r}")
    return code


def _dump(poem: dict) -> str:
    return json.dumps(poem, ensure_ascii=False, indent=2)


@app.get("/")
def index():
    return render_template("index.html", json_dir=str(JSON_DIR))


@app.post("/api/parse")
def parse_file():
    upload = request.files.get("file")
    if upload is None or not upload.filename:
        return jsonify(error="No file received."), 400
    name = Path(upload.filename).name
    if not name.lower().endswith(".docx"):
        return jsonify(error=f"{name}: only Word files (.docx) can be read."), 400
    try:
        return jsonify(parse_poem_docx(io.BytesIO(upload.read()), filename=name))
    except ValueError as exc:
        return jsonify(error=str(exc)), 422
    except Exception as exc:  # damaged or non-Word file
        return jsonify(error=f"{name}: could not be opened as a Word document ({exc.__class__.__name__})."), 422


@app.post("/api/parse-text")
def parse_text():
    body = request.get_json(silent=True) or {}
    code, text = str(body.get("code", "")).strip(), str(body.get("text", ""))
    if not code:
        return jsonify(error="Enter the poem code, for example D01K08."), 400
    if not text.strip():
        return jsonify(error="Paste the poem first."), 400
    try:
        return jsonify(parse_poem_text(code, text))
    except ValueError as exc:
        return jsonify(error=str(exc)), 422


@app.post("/api/zip")
def download_zip():
    poems = (request.get_json(silent=True) or {}).get("poems") or []
    if not poems:
        return jsonify(error="No poems to download."), 400
    buffer = io.BytesIO()
    try:
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
            for poem in poems:
                archive.writestr(f"{_safe_code(poem)}.json", _dump(poem))
    except ValueError as exc:
        return jsonify(error=str(exc)), 422
    buffer.seek(0)
    return send_file(buffer, mimetype="application/zip", as_attachment=True, download_name="poems-json.zip")


@app.post("/api/save")
def save_in_project():
    poems = (request.get_json(silent=True) or {}).get("poems") or []
    if not poems:
        return jsonify(error="No poems to save."), 400
    saved = []
    try:
        for poem in poems:
            code = _safe_code(poem)
            folder = JSON_DIR / f"diwan-{int(poem['diwan']):02d}"
            folder.mkdir(parents=True, exist_ok=True)
            (folder / f"{code}.json").write_text(_dump(poem), encoding="utf-8")
            saved.append(str(folder / f"{code}.json"))
    except (ValueError, KeyError, OSError) as exc:
        return jsonify(error=f"Not saved: {exc}", saved=saved), 422
    return jsonify(saved=saved, folder=str(JSON_DIR))


if __name__ == "__main__":
    print("Poem to JSON is running: open http://127.0.0.1:5000  (Ctrl+C to stop)")
    app.run(host="127.0.0.1", port=5000, debug=False)
