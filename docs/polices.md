# Polices du projet

| Police | Usage | Origine |
|---|---|---|
| **Wolofal** (`wolofal-regular.ttf`) | Style wolof, au choix du lecteur | Développée par Abdou Khadre Mbacké pour ce projet |
| Amiri | Style arabe classique (par défaut) | Open Font License |
| Source Sans 3 | Textes en français | Open Font License |

## La police wolofal

Le fichier livré (`wolof-font.ttf`, « SN V8 1ST ») déclarait un cadratin (unitsPerEm) de 2048 alors que
les lettres sont dessinées environ huit fois plus grand : à taille égale, le texte s'affichait démesuré.

Le fichier utilisé dans le projet est le **même dessin**, avec une seule valeur corrigée :

```python
from fontTools.ttLib import TTFont
f = TTFont('wolof-font.ttf')
f['head'].unitsPerEm = 16384      # aucun contour n'est modifié
f.save('wolofal-regular.ttf')
```

Aucun glyphe, aucune table de liaison (GSUB/GPOS) n'a été touché : seule la taille de référence change.
Les lettres occupent alors une hauteur normale, et l'ascendante vaut 0,99 cadratin.

Comme ce dessin reste un peu plus petit qu'Amiri et que son espace est étroit, le site et l'application
appliquent, uniquement pour cette police : taille × 1,28, interligne × 0,9 et un espace entre les mots de 0,18 em.
Ces valeurs sont écrites à un seul endroit — `src/styles/_base.scss` pour le site, `lib/core/theme.dart` (enum `ArabicScript`) pour l'application.

Le fichier d'origine est conservé tel quel dans `docs/fonts-source/wolof-font.ttf`.
