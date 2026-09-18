# Harakat détachées

Pendant la vocalisation, une haraka se retrouve parfois **à côté** de sa lettre au lieu d'être
dessus : une kasra ou une shadda après une espace, souvent en fin de bayt. À l'écran elle flotte,
et il faut la supprimer puis la retaper.

`fix_marks.py` les retrouve et les recolle, sans ajouter ni enlever une seule haraka.

```bash
pip install python-docx
python fix_marks.py "D01K08.docx"                 # rapport seul, ne modifie rien
python fix_marks.py dossier/ --fix                # écrit les fichiers corrigés (…_fixed.docx)
python fix_marks.py dossier/ --fix --in-place     # remplace les fichiers (une copie …_avant est gardée)
```

## Ce que l'outil distingue

| Cas | Ce qu'il fait |
|---|---|
| **détachée** | la haraka suit une espace ou un `\|` : elle rejoint la lettre qui la précède — en fin de ligne l'espace disparaît (مَقَالَه ْ → مَقَالَهْ) |
| **ordre** | à la toute fin de l'ajz, la voyelle tapée avant la shadda : الْمَرْجُوُّ → الْمَرْجُوُّ. Ailleurs dans le vers, rien n'est touché |
| **à vérifier** | cette lettre porte déjà une haraka du même type : rien n'est déplacé, la ligne est signalée |
| **deux voyelles** | une lettre porte deux voyelles (خَطََا) : signalé, jamais touché |

Les deux derniers cas ne sont jamais corrigés tout seuls : seule une comparaison avec la source
permet de savoir laquelle des deux harakat garder.

Les deux règles ont été établies à partir d'un poème corrigé à la main (D01K16) : sur ce poème, la
sortie de l'outil est **identique caractère pour caractère** à la correction manuelle.

Le texte est modifié caractère par caractère à l'intérieur des *runs* Word : la police, la mise en
forme et les **mots en rouge** de la relecture sont conservés.
