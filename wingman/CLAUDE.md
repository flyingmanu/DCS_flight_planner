# wingman — cerveau externe pour ailier IA DCS

## Principe (« méthode 2 »)
DCS exécute la mission. DCS-gRPC (https://github.com/DCS-gRPC/rust-server) expose le MSE Lua en gRPC.
Un cerveau Python observe → décide (machine à états déterministe) → commande **uniquement** au niveau
tâches / commandes / options du `Controller`. Le pilotage fin reste à l'IA DCS : on décide *quoi*, DCS décide *comment*.
On mesure cette limite, on ne la nie pas.

## Règles non négociables
1. Aucune API inventée : citer le `.proto` (fichier + rpc) ou la page doc MSE, et valider par une sonde avant usage.
2. Toute hypothèse non vérifiée → `docs/assumptions.md` (énoncé, test, statut, date).
3. Aucune modif de l'installation DCS sans accord explicite ; `MissionScripting.lua` : diff proposé + sauvegarde horodatée + approbation.
   Ne jamais désanitiser `io`/`os`/`lfs`.
4. gRPC sur `127.0.0.1` uniquement. `Eval` réservé aux appels `WM.*` du shim (liste blanche côté Python).
5. Petits incréments ; chaque étape finit par une démo exécutable + critère d'acceptation vérifié.

## Architecture
```
link/       client gRPC, stubs générés, reconnexion, horodatage
world/      modèle du monde, repères, conversions
geo/        repère piste, distances, AGL
brain/      machine à états admin flight, garde-fous
act/        décision → appels shim, anti-spam (réémission aux transitions seulement)
telemetry/  enregistrement 10 Hz, rejeu, métriques
lua/wm_shim.lua  fonctions WM.* minces ; toute la logique reste en Python
```
Tick décisionnel 2 Hz, télémétrie 10 Hz. Le brain doit tourner hors DCS sur télémétrie rejouée.

## Faits établis (sources lues, étape 0)
DCS-gRPC référence : tag `0.8.1` (2024-11-05) ; `main` = 0.8.1+13 commits non publiés (2026-06-09).
- **Aucun RPC natif pour `setTask`/`pushTask`/`setOption`** : `ControllerService` n'a que `SetAlarmState` et
  `GetDetectedTargets` (`protos/dcs/controller/v0/controller.proto`). ⇒ le shim passe obligatoirement par
  `CustomService.Eval` (`protos/dcs/custom/v0/custom.proto`), désactivé par défaut (`evalEnabled = false`).
- `MissionService.StreamUnits` : `poll_rate` en **secondes entières** (`uint32`, défaut 5) ⇒ 1 Hz max, insuffisant
  pour 10 Hz. Télémétrie 10 Hz = polling `UnitService.GetTransform` ou un `Eval` groupé `WM.status`.
- Repère vecteurs : +x nord, +z est, +y haut, main droite (`common.proto`, message `Vector`).
  `Position` = lat/lon/alt MSL (m) + `u` (est) / `v` (nord) en m. `Orientation` : heading/yaw/pitch/roll en degrés + vecteurs forward/right/up.
- F10 : `MissionService.AddGroupCommand` etc. ; l'activation remonte en `StreamEvents` → `MissionCommandEvent`/`GroupCommandEvent` avec un `Struct details`.
- Ni géométrie de piste ni `land.getHeight` exposés en natif ⇒ via shim (`Airbase.getRunways`, `land.getHeight` — à vérifier).
- Événements `RunwayTouch` / `RunwayTakeoff` disponibles (0.8.1) → critère `LANDED`.
- Installation : une ligne `dofile(lfs.writedir()..[[Scripts\DCS-gRPC\grpc-mission.lua]])` **avant** le bloc de sanitisation ;
  la DLL est chargée avant que `require` soit retiré ⇒ aucune désanitisation nécessaire.

## Commandes
- Reconnaissance (Windows, lecture seule) : `powershell -ExecutionPolicy Bypass -File tools\detect_env.ps1 > env_report.txt`

## État d'avancement
- [x] Étape 0 — reconnaissance côté sources (protos lus). Côté machine : en attente de `env_report.txt` + réponses §3.
- [ ] Étape 1 — liaison

## Pièges connus
- Session de dev Claude = conteneur Linux cloud, sans accès à la machine DCS : toute action DCS passe par des scripts que l'utilisateur exécute.
- `Eval` = exécution Lua arbitraire dans la mission : préférer `GRPC.evalEnabled = true; GRPC.load()` dans le script de la mission de test
  (activation limitée à cette mission) plutôt que `evalEnabled = true` global dans `Config/dcs-grpc.lua`.
