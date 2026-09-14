# Diwan · backend (Django + PostgreSQL)

## First start

```bash
pip install -r requirements.txt
# PostgreSQL: a database "diwan" owned by user "diwan" (or set DB_NAME, DB_USER, DB_PASSWORD, DB_HOST)
python manage.py migrate
python manage.py seed_diwans         # the 7 diwans with their titles and figures
python manage.py createsuperuser
python manage.py runserver           # admin: http://127.0.0.1:8000/admin/   API: http://127.0.0.1:8000/api/v1/
```

## Putting a reviewed khassida online

Either upload it in the admin: **Poems > Import poems** (the .docx named D01K08_… or its JSON),
or from the command line: `python manage.py import_poems ../corpus-json/diwan-01/`.

A poem without red flags is published immediately and appears on the website (its diwan page and its own page).
A poem with red flags is saved as a draft. To review every poem before it goes online, set `CORPUS_AUTO_PUBLISH=0`
and publish from the Poems list (the status column is editable there).

## Reaching the API from a phone or an emulator

Django answers **400 Bad Request** to an address that is not in `ALLOWED_HOSTS`. With `DEBUG=1` (the default),
every address is accepted, so the Android emulator (`10.0.2.2`) and a phone on the same Wi-Fi work straight away.
For a real phone, also start the server on the network: `python manage.py runserver 0.0.0.0:8000`.
In production, set `DJANGO_ALLOWED_HOSTS=votre-domaine.sn` and keep `DJANGO_DEBUG=0`.

## corpus-json/ keeps itself up to date

Every poem you import, publish or correct is written to `corpus-json/diwan-XX/CODE.json` straight
away — from the command line or from the admin, on your PC or on the online database. There is
nothing to remember; you only commit the folder:

```bash
git add corpus-json && git commit -m "Corpus : …" && git push
```

`python manage.py export_poems` still exists, to rewrite the whole folder at once.
Set `CORPUS_AUTO_EXPORT=0` to switch the automatic writing off (it is off on the server, which has
no repository to write into).

## The daily round trip between the two databases

Put the online address in `NEON_DATABASE_URL` once (a `.env` line or a Windows user variable), then:

```bash
python manage.py sync_corpus --from-online            # online → corpus-json/ → local database
python manage.py sync_corpus --to-online              # local → corpus-json/ → online database
python manage.py sync_corpus --to-online --commit     # and commit + push corpus-json/
```

No `DATABASE_URL` to set by hand, so no risk of leaving it set and working on the wrong database.

## Sharing the poems with the team (the database is not in Git)

Git carries code, not the contents of PostgreSQL. The poems travel as JSON files instead:

```bash
# you, after importing or correcting poems
python manage.py export_poems              # writes ../corpus-json/diwan-01/D01K08.json …
git add ../corpus-json && git commit -m "Corpus: poems of diwan 1" && git push

# your collaborator, after git pull
python manage.py migrate
python manage.py seed_diwans
python manage.py import_poems ../corpus-json/
```

He then has exactly the same poems as you, in his own local database, without typing or reviewing
anything. You stay the only person who imports and reviews; the files in `corpus-json/` are the
shared copy. Hand-corrected transcriptions are included in the export and restored on import.

## API (read-only, published poems only)

| GET                                   | Returns                                   |
|---------------------------------------|-------------------------------------------|
| `/api/v1/corpus/`                     | totals and the 7 diwans                   |
| `/api/v1/diwans/`                     | the 7 diwans with their counts            |
| `/api/v1/diwans/diwan-01/`            | a diwan and its published khassaïdes      |
| `/api/v1/diwans/diwan-01/poems/008/`  | a khassida: lines, transcriptions, previous/next |

## Putting the API online (free hosting)

The whole point: once the API is online, the front-end and mobile developers work against **your**
database without installing PostgreSQL or importing anything.

```bash
# what the host runs for you (see build.sh and render.yaml)
./build.sh                              # install, collectstatic, migrate, seed_diwans
gunicorn config.wsgi:application
```

Environment variables to set on the host:

| Variable | Value |
|---|---|
| `DJANGO_DEBUG` | `0` |
| `DJANGO_SECRET_KEY` | a long random string |
| `DJANGO_ALLOWED_HOSTS` | `diwan-api.onrender.com` (your address) |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | `https://diwan-api.onrender.com` |
| `DATABASE_URL` | given by the database service (Neon, Supabase, Render) |
| `CORPUS_AUTO_PUBLISH` | `0` while you are still reviewing, `1` later |

The API is read-only, so it answers any website (CORS). The admin stays behind its login: you are
the only one who imports and publishes. Set `CORS_ALLOWED_ORIGINS` to restrict it if you prefer.

## Other tools

- `python tools/poem_json_web/app.py`: the "Poem to JSON" page (drop .docx files, check, get JSON)
- `python manage.py import_poems … --refresh-transcriptions`: after improving the transcription rules

"Font fix"