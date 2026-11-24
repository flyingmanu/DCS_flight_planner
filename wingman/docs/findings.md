# Constats

## Étape 0 — Reconnaissance des sources DCS-gRPC (2026-11-24)
Source : clone de `DCS-gRPC/rust-server`, tag `0.8.1` + `main` (`9bb12cf`, 2026-06-09). Protos sous `protos/dcs/*/v0/`.

### Services utiles au projet
| Besoin | RPC | Fichier |
|---|---|---|
| Santé/version | `MetadataService.GetHealth`, `GetVersion` | metadata.proto |
| Temps mission | `TimerService.GetTime`, `GetAbsoluteTime` | timer.proto |
| État cinématique | `UnitService.GetTransform` (time, Position, Orientation, Velocity) | unit.proto |
| Flux unités | `MissionService.StreamUnits` (≥ 1 s) | mission.proto |
| Événements | `MissionService.StreamEvents` (dont `RunwayTouch`, `Land`, `MissionCommand`, `GroupCommand`) | mission.proto |
| Unités joueur | `CoalitionService.GetPlayerUnits`, `GetGroups`; `GroupService.GetUnits` | coalition.proto, group.proto |
| Aérodromes | `WorldService.GetAirbases` (position, pas de pistes) | world.proto |
| Menus F10 | `MissionService.AddGroupCommand` / `AddGroupCommandSubMenu` / `RemoveGroupCommandItem` | mission.proto |
| Messages texte | `TriggerService.OutTextForGroup` | trigger.proto |
| Déclinaison | `CustomService.GetMagneticDeclination` (IGRF, « proche » de DCS) | custom.proto |
| Lua arbitraire | `CustomService.Eval` (`evalEnabled`) | custom.proto |

### Manques (⇒ shim via `Eval`)
- `Controller.setTask` / `pushTask` / `popTask` / `resetTask` / `setOption` (sauf ALARM_STATE) / `setCommand` : **absents**.
- Pistes (`getRunways`), altitude terrain (`land.getHeight`), IAS/AoA/G : absents.
- `StreamUnits` limité à 1 Hz (poll_rate entier en s).
- Les rpc DCT de `CustomService` (`RequestMissionAssignment`…) sont des stubs `errorUnimplemented`.

### Conséquence sécurité
`Eval` est indispensable. Mesures : écoute `127.0.0.1` (défaut), `evalEnabled` activé dans le seul script de la mission de test,
et côté Python un unique point d'appel qui n'émet que `return WM.<fonction>(<args JSON-sérialisés>)` (liste blanche).
Option supplémentaire : `auth.enabled` avec jeton (lu dans README) — à décider.
