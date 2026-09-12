# Diwan · application mobile (Flutter)

Application Android et iOS de la plateforme Diwan. Elle lit les diwans et les khassaïdes depuis **la même API Django**
que le site web : un poème importé dans la base apparaît en même temps sur le site et dans l'application.

## Écrans

| Écran | Contenu | API |
|---|---|---|
| Accueil | Cheikh Ahmadou Bamba, le corpus en chiffres, sa vie, le projet | `/api/v1/corpus/` |
| Les diwans | Les 7 diwans et le nombre de khassaïdes en ligne | `/api/v1/diwans/` |
| Un diwan | Ses khassaïdes, recherche par nom (sans harakat) | `/api/v1/diwans/diwan-01/` |
| Une khassida | Nom, texte vocalisé, lettres de l'acrostiche en rouge, transcription, poèmes voisins | `/api/v1/diwans/diwan-01/poems/008/` |
| Paramètres | Adresse du serveur, test de connexion | |

## Installation (une seule fois)

Ce dossier contient le code (`lib/`), les polices, la photo et la configuration (`pubspec.yaml`).
Les dossiers propres à chaque système (`android/`, `ios/`) sont générés par Flutter :

```bash
cd diwan-platform/mobile
flutter create --org sn.diwan --project-name diwan_app --platforms android,ios .
python tool/setup_platforms.py        # python3 sous macOS / Linux
flutter pub get
flutter test
flutter run
```

`flutter create .` ajoute seulement les fichiers manquants : il ne remplace ni `lib/`, ni `pubspec.yaml`, ni `test/widget_test.dart`.
`setup_platforms.py` autorise l'accès Internet et le HTTP vers l'ordinateur pendant le développement, et nomme l'application « Diwan ».

## Adresse de l'API

1. Lancer le backend : `python manage.py runserver` (ou `runserver 0.0.0.0:8000` pour un téléphone réel).
2. L'application choisit toute seule : `http://10.0.2.2:8000/api/v1` sur l'émulateur Android, `http://127.0.0.1:8000/api/v1` sur le simulateur iOS.
3. Téléphone réel : ouvrir **Paramètres** dans l'application et saisir `http://<adresse IP de l'ordinateur>:8000/api/v1`
   (l'adresse IP doit aussi figurer dans `DJANGO_ALLOWED_HOSTS`).
4. Version publiée : `flutter build apk --dart-define=API_URL=https://<domaine>/api/v1`.

## Style d'écriture : classique ou wolofal

Sur la page d'une khassida, le lecteur choisit entre les lettres arabes classiques (Amiri) et le **style wolofal**,
la police développée pour ce projet par Abdou Khadre Mbacké. Le choix est enregistré sur le téléphone et
s'applique à toutes les pages. Les réglages propres à chaque style (taille, interligne, espace entre les mots)
sont réunis dans l'enum `ArabicScript` de `lib/core/theme.dart`. Voir `docs/polices.md`.

## Organisation du code

```
lib/
├── main.dart, app.dart           démarrage, thème, langue française
├── core/
│   ├── config.dart               adresse de l'API par défaut
│   ├── settings.dart             paramètres enregistrés sur le téléphone
│   ├── api_client.dart           appels à l'API (décodage UTF-8 de l'arabe)
│   ├── arabic.dart               recherche sans harakat, lettres d'acrostiche
│   ├── format.dart               nombres à la française
│   └── theme.dart                couleurs et polices de la plateforme
├── data/
│   ├── corpus_static.dart        titres et chiffres des 7 diwans (disponibles hors connexion)
│   └── models/                   corpus.dart, diwan.dart, poem.dart (mêmes champs que l'API)
├── features/
│   ├── home/                     accueil
│   ├── diwans/                   liste des diwans, page d'un diwan
│   ├── poem/                     page d'une khassida
│   └── settings/                 adresse du serveur
└── shared/widgets/               bayt, texte arabe, messages, numéro
assets/
├── images/cheikh-ahmadou-bamba.jpg
└── fonts/                        Amiri, Source Sans 3 (licence OFL)
```
