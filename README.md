# DCS Flight Planner

A modern, maintained equivalent of [Combat Flite](https://combatflite.com/) for DCS World:
route planning, theater maps, kneeboards. Combat Flite is no longer maintained;
this project aims to replace it and then improve on it.

Work in progress, built one piece at a time.

## Repo structure

```
apps/
  web/           web app (Vite + React + MapLibre)
packages/
  core/          shared business logic (waypoints, coordinates, theater data)
tools/
  dcs-export/    tooling to extract static data from DCS theaters
```

## Development

```
pnpm install
pnpm --filter @dcs-flight-planner/web dev
```

## Progress

- [x] Monorepo scaffolding
- [x] DCS theater data extraction (airbases, runways) — Caucasus done, frequencies not yet available via the DCS API (need another source)
- [x] Shared data model (`packages/core`) — first theater (Caucasus, 21 airbases) normalized
- [x] Interactive map — markers + popups on an OpenFreeMap basemap (a "real world" basemap for now, not the actual DCS theater art yet), relief (hillshade), multi-point distance measuring tool (km/NM, right-click to reset)
- [x] Save/load "missions" (name + map view, stored locally in the browser) — foundation for attaching mission-specific info later (waypoints, notes...)
- [x] Status bar on map hover: lat/long (DDM, F-16 style), MGRS, terrain altitude (ft/m)
- [x] Mission object creation (Object menu): points (aeronautical, reference, push/exit, CP, IP, target/DMPI, LZ) and polygons (freeform, oriented rectangle, circle, aeronautical orbit hold/AAR left/right-hand), saved with the mission
- [x] Object editing (click an object → right-side panel): name, color, coordinates, DMPI altitude, orientation and size depending on type; delete
- [x] Object list (top-right "Objects" button): overview of points/zones, click to edit, direct delete
- [x] Flight object (Flight menu: create, edit, delete; also listed alongside points/zones in the Objects popup): Combat Flite-inspired attributes (callsign, aircraft, size, task, departure/arrival/alternate airbases, takeoff time, TACAN, radio, IFF modes, notes, color), saved with the mission
- [x] Aircraft catalog (`packages/core`): all playable DCS modules (fixed-wing + helicopters) with standard DCS task types and approximate performance figures (max speed, ceiling, combat radius, internal fuel) — the performance-management foundation for a key advantage over Combat Flite — plus a starter set of AI-only aircraft; picked from a dropdown in the flight form, with category icons (fixed-wing / helicopter) shown on the map at each flight's departure airbase
- [x] Waypoint add/remove for a flight's route, Combat-Flite style: click "Add waypoint on map" then click the map; route previewed live on the map; remove from the list; per-waypoint altitude/airspeed
- [ ] Full route planning (leg distances, ETAs/TOT, editing waypoint position)
- [ ] Kneeboard export
- [ ] Desktop application (Tauri)
- [ ] Monetization (license, accounts)

## DCS data license

This project extracts data from DCS World (Eagle Dynamics) for flight-planning purposes.
Compliance of this use with Eagle Dynamics' EULA/ToS, particularly in a commercial context,
is still being verified.
