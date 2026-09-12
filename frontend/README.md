# Diwan · front-end (Angular)

Website of the Diwan platform: the seven diwans of Cheikh Ahmadou Bamba.
Angular 21 (standalone components, server-side rendering), Bootstrap 5 (Sass, only the modules used),
self-hosted Amiri and Source Sans 3 fonts.

## Pages

| Address                     | Page                                                        | Data                         |
|-----------------------------|-------------------------------------------------------------|------------------------------|
| `/`                         | Cheikh Ahmadou Bamba, the project, the corpus in figures    | static figures + live counts |
| `/diwans`                   | the 7 diwans and how many khassaïdes of each are online      | GET /api/v1/diwans/          |
| `/diwans/diwan-01`          | one diwan: its khassaïdes, search by name                   | GET /api/v1/diwans/diwan-01/ |
| `/diwans/diwan-01/008`      | one khassida: text, acrostic letters, transcription, previous/next | GET /api/v1/diwans/diwan-01/poems/008/ |

Pages are rendered on the server at each request: a khassida imported into the database (admin page
"Import poems" or `manage.py import_poems`) is on the website at once, with no rebuild.

## Run it on your computer

1. Start the backend (see the backend README): `python manage.py runserver` → http://127.0.0.1:8000
2. In this folder:

```bash
npm install
npm start            # http://localhost:4200  (/api is forwarded to Django, see proxy.conf.json)
```

Requires Node.js 22.12 or newer.

## Production

```bash
npm run build
API_URL=http://127.0.0.1:8000/api/v1 PORT=4000 node dist/diwan-web/server/server.mjs
```

Put nginx in front: `/api/`, `/admin/`, `/static/`, `/media/` go to Django; everything else goes to port 4000.

## Where things are

```
src/app/
├── app.routes.ts                 the four pages above + "page not found"
├── app.routes.server.ts          every page rendered on the server (always up to date)
├── app.config.server.ts          API_URL used while rendering on the server
├── core/
│   ├── api.ts                    API_BASE_URL and the loading / ready / error helper
│   ├── arabic.ts                 search without tashkeel, acrostic first letters
│   ├── models/api.model.ts       shapes returned by the Django API
│   ├── services/diwan-api.service.ts
│   ├── data/corpus-stats.ts      titles and figures of the 7 diwans (home page, menu)
│   └── services/corpus.service.ts
├── shared/                       header (with the diwans menu), footer, breadcrumb, bayt, not-found
└── features/
    ├── home/                     hero, author, project, corpus
    ├── diwans/diwan-list/        /diwans
    ├── diwans/diwan-detail/      /diwans/:diwan
    └── poem/poem-page/           /diwans/:diwan/:poem
```
