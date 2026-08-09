# @dcs-flight-planner/core

Logique métier partagée entre les futures applications web et desktop : modèles de
données (théâtres, aérodromes, waypoints), calculs de navigation, conversions de
coordonnées.

## Contenu actuel

- `src/types.ts` — modèle de données (`Theater`, `Airbase`, `Runway`, ...)
- `src/normalize-export.ts` — transforme le JSON brut produit par
  `tools/dcs-export/mission_export.lua` en dataset propre
- `src/data/*.json` — datasets normalisés par théâtre (Caucasus pour l'instant)
- `scripts/normalize-theater.ts` — CLI pour générer/régénérer un dataset

## Régénérer un dataset

```
pnpm --filter @dcs-flight-planner/core normalize <chemin-vers-raw.json>
```

## Limites connues

- Les fréquences radio ne sont pas exposées par l'API scripting DCS pour les
  aérodromes statiques ; il faudra une autre source (charts officielles,
  extraction manuelle) pour les ajouter.
- Le champ `course` brut renvoyé par `getRunways()` ne correspond pas
  directement à un cap standard ; le désignateur de piste (`Name`, ex. `22`)
  est utilisé comme source du cap nominal (`désignateur × 10°`) à la place.
- Un seul théâtre (Caucasus) est normalisé pour l'instant.

## Tests

```
pnpm --filter @dcs-flight-planner/core test
```
