# DCS Flight Planner

Un équivalent moderne et maintenu de [Combat Flite](https://combatflite.com/) pour DCS World :
planification de route, cartes de théâtre, kneeboards. Combat Flite n'est plus maintenu ;
ce projet vise à le remplacer puis à l'améliorer.

Projet en cours de construction, développé par morceaux.

## Structure du repo

```
apps/            applications (web, desktop — à venir)
packages/
  core/          logique métier partagée (waypoints, coordonnées, données théâtre)
tools/
  dcs-export/    outillage pour extraire les données statiques des théâtres DCS
```

## État d'avancement

- [x] Scaffolding du monorepo
- [ ] Extraction des données de théâtre DCS (aérodromes, runways, fréquences) — en cours
- [ ] Modèle de données partagé (`packages/core`)
- [ ] Carte interactive
- [ ] Planification de route / waypoints
- [ ] Export kneeboard
- [ ] Application desktop (Tauri)
- [ ] Monétisation (licence, comptes)

## Licence des données DCS

Ce projet extrait des données depuis DCS World (Eagle Dynamics) pour les besoins de
planification de vol. La conformité de cet usage avec l'EULA/ToS d'Eagle Dynamics,
notamment dans un cadre commercial, est en cours de vérification.
