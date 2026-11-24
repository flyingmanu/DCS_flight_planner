# Hypothèses

Statuts : non testée / confirmée / infirmée. Sources citées = lues, pas testées dans DCS.

| # | Énoncé | Test | Statut | Date |
|---|---|---|---|---|
| A1 | DCS-gRPC 0.8.1 (nov. 2024) fonctionne sur la stable DCS courante (nov. 2026) ; sinon builder `main`. | Installer, lancer mission, `MetadataService.GetVersion` + `GetHealth`, lignes `GRPC` dans `dcs.log`. | non testée | 2026-11-24 |
| A2 | Un ailier IA **dans le groupe du joueur** ne répond pas de façon fiable aux tâches scriptées ⇒ groupe séparé `WINGMAN-1` + tâche `Follow`. | Sonde n°3 `probe_player_group.py`. | non testée | 2026-11-24 |
| A3 | Tâche `Follow` : `params.pos` = {x avant, y haut, z droite} en m, repère du leader ; `lastWptIndexFlag/lastWptIndex` optionnels. | Doc Hoggit `DCS_task_follow` puis `probe_follow.py` (3 offsets, mesure dans le repère leader). | non testée | 2026-11-24 |
| A4 | `Controller.setTask` remplace la tâche courante ; `pushTask` l'empile ; réémettre en continu dégrade le comportement IA. | Doc Hoggit `DCS_func_setTask`/`pushTask` + sonde : réémission 2 Hz vs une fois, comparer dispersion. | non testée | 2026-11-24 |
| A5 | Sur un waypoint `Landing`, l'IA impose son propre circuit / appel ATC et ignore nos points de vent arrière. | `probe_landing.py`, 2 stratégies (route complète → `Landing` en courte finale, vs `Landing` directe). | non testée | 2026-11-24 |
| A6 | L'IA ne reproduit pas un virage de break à 60–70° / 3–5 G sur une simple route ; taux de virage limité. | `probe_route.py` : route avec virage 180° serré, mesurer roll max et G estimé (dérivée de `velocity`). | non testée | 2026-11-24 |
| A7 | `Eval` est la seule voie pour `setTask/pushTask/setOption` en 0.8.1. | Lu dans `controller.proto` (2 rpc seulement) et `custom.proto` (`Eval`). Reste à confirmer en exécution. | confirmée (sources) | 2026-11-24 |
| A8 | `GRPC.evalEnabled = true` posé dans le script de mission avant `GRPC.load()` suffit, sans `Config/dcs-grpc.lua`. | README §« Running only if the mission scripting enables it » ; à tester : `Eval("return 1")`. | non testée | 2026-11-24 |
| A9 | `UnitService.GetTransform` interrogé à 10 Hz pour 2 unités tient dans `throughputLimit=600` appels/s et donne un `time` monotone exploitable. | `probe_link.py` : mesurer jitter de `time`, latence aller-retour. | non testée | 2026-11-24 |
| A10 | Repère DCS : +x nord, +z est, +y haut (m). `Position.u` = est, `v` = nord. | Lu `common.proto` ; vérifier `u==z`, `v==x` sur une unité via `Eval` `getPoint()` vs `GetTransform`. | non testée | 2026-11-24 |
| A11 | Le shim peut obtenir la géométrie piste via `Airbase.getByName(...):getRunways()` et l'altitude sol via `land.getHeight({x=,y=})`. | Doc Hoggit + sonde `Eval`. | non testée | 2026-11-24 |
| A12 | Un menu F10 créé par `AddGroupCommand` sur le groupe joueur remonte un `GroupCommandEvent` avec nos `details`. | `probe_link.py` : créer « WM/Ping », cliquer, lire l'événement. | non testée | 2026-11-24 |
| A13 | Le dossier Saved Games est `DCS` (stable) — `DCS.openbeta` possible. Non supposé : à lire dans `env_report.txt`. | `tools/detect_env.ps1`. | non testée | 2026-11-24 |
