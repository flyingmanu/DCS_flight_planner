# DCS Flight Planner

Un équivalent moderne et maintenu de [Combat Flite](https://combatflite.com/) pour DCS World :
planification de route, cartes de théâtre, kneeboards. Combat Flite n'est plus maintenu ;
ce projet vise à le remplacer puis à l'améliorer.

Projet en cours de construction, développé par morceaux.

## Structure du repo

```
apps/
  web/           application web (Vite + React + MapLibre)
packages/
  core/          logique métier partagée (waypoints, coordonnées, données théâtre)
tools/
  dcs-export/    outillage pour extraire les données statiques des théâtres DCS
```

## Développement

```
pnpm install
pnpm --filter @dcs-flight-planner/web dev
```

## État d'avancement

- [x] Scaffolding du monorepo
- [x] Extraction des données de théâtre DCS (aérodromes, runways) — Caucasus fait, fréquences pas encore disponibles via l'API DCS (à sourcer autrement)
- [x] Modèle de données partagé (`packages/core`) — premier théâtre (Caucasus, 21 aérodromes) normalisé
- [x] Carte interactive — marqueurs + popups sur fond OpenFreeMap (fond de carte "monde réel" provisoire, pas encore les cartes DCS elles-mêmes), relief (hillshade), outil de mesure de distance multi-points (km/NM, clic droit pour réinitialiser)
- [x] Sauvegarde/chargement de "missions" (nom + vue carte, stocké en local dans le navigateur) — base pour y accrocher des infos propres à une mission plus tard (waypoints, notes...)
- [x] Bandeau de statut au survol de la carte : Lat/Long (DDM, style F-16), MGRS, altitude terrain (ft/m)
- [x] Création d'objets de mission (menu Objet) : points (aéronautique, référence, push/exit, CP, IP, target/DMPI, LZ) et polygones (libre, rectangle orienté, cercle, orbite aéronautique hold/AAR main gauche-droite), sauvegardés avec la mission
- [x] Édition des objets (clic sur l'objet → panneau à droite) : nom, couleur, coordonnées, altitude DMPI, orientation et taille selon le type ; suppression
- [ ] Planification de route / waypoints
- [ ] Export kneeboard
- [ ] Application desktop (Tauri)
- [ ] Monétisation (licence, comptes)

## Licence des données DCS

Ce projet extrait des données depuis DCS World (Eagle Dynamics) pour les besoins de
planification de vol. La conformité de cet usage avec l'EULA/ToS d'Eagle Dynamics,
notamment dans un cadre commercial, est en cours de vérification.
