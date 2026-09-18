# Espacement automatique de la police wolofal

Les lettres wolofales ont de longues queues : la queue d'un ق, d'un ن ou d'un ي passe parfois
sur la lettre qui suit. `fix_wolofal.py` détecte ces rencontres et ajoute l'espace nécessaire,
sans toucher au dessin.

```bash
pip install fonttools uharfbuzz shapely
python fix_wolofal.py ../../frontend/public/fonts/wolofal-regular.ttf \
       --text corpus.txt --out wolofal-spaced.ttf --margin 0.03 --passes 3
```

`--text` : un fichier texte (une ligne par bayt) ; répéter l'option pour plusieurs fichiers.
Plus le texte mesuré est large, plus la correction couvre de cas réels.

## Comment ça marche

1. Le texte est composé avec HarfBuzz, exactement comme le fera le navigateur ou le téléphone.
2. Le contour de chaque lettre est comparé à celui des lettres voisines (Shapely).
   Les lettres reliées par le trait cursif sont ignorées : leur encre est censée se toucher.
3. Pour chaque vraie rencontre, le programme cherche par dichotomie le décalage minimal qui dégage
   l'encre, plus une marge (`--margin`, 0,03 cadratin par défaut).
4. Ces décalages deviennent une table de crénage (`kern`) ajoutée au GPOS **existant** :
   les tables `curs`, `mark`, `mkmk` et le GDEF de la police sont conservés, donc la liaison
   cursive et les harakat continuent de fonctionner.
5. L'opération est répétée (`--passes`) jusqu'à ce qu'il ne reste plus de rencontre.

En écriture de droite à gauche, la lettre est reculée d'autant que sa case est élargie : l'encre
reste où elle était et l'espace s'ouvre du côté de la queue. Une espace, qui n'a pas d'encre,
est simplement élargie.

## Ce que l'outil ne peut pas faire

Deux lettres **soudées à l'intérieur d'un mot** ne peuvent pas être écartées : cela couperait le mot.
Le programme les liste à la fin de son exécution. Ces cas-là demandent une queue plus courte dans
le dessin, ou une variante contextuelle (`calt`) dessinée dans FontCreator.

# Version courte des lettres (méthode préférée)

La police contient déjà, pour dix-sept lettres, une **version courte** : en tapant la lettre trois
fois, on obtient la même lettre avec une fin courte au lieu de la longue queue. C'est le geste que
fait un écrivain wolofal quand une queue gêne.

`shorten_wolofal.py` fait ce choix automatiquement : il repère les rencontres, vérifie que la
version courte les évite, et inscrit dans la police une règle contextuelle (`calt`) qui n'utilise
la version courte **que dans cette situation**. Les mots gardent leur espacement normal.

```bash
python shorten_wolofal.py wolofal-regular.ttf --text corpus.txt --out wolofal-smart.ttf
```

Il ne reste ensuite que les cas où la lettre est une ligature (donc sans version courte) ; on peut
finir par un petit espacement, beaucoup plus discret qu'auparavant :

```bash
python fix_wolofal.py wolofal-smart.ttf --text corpus.txt --out wolofal-final.ttf
```

Les lettres qui n'ont pas encore de version courte (le و, et les ligatures) sont listées à la fin de
l'exécution : ce sont celles qu'il reste à dessiner pour se passer complètement de l'espacement.
