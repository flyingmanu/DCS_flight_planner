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
- [x] Aircraft catalog (`packages/core`): all playable DCS modules (fixed-wing + helicopters) with standard DCS task types, approximate performance figures (max speed, ceiling, combat radius, internal fuel), and a typical-weapons reference — the performance/armament-management foundation for a key advantage over Combat Flite — plus a starter set of AI-only aircraft; picked from a dropdown in the flight form, with category icons (fixed-wing / helicopter) shown on the map at each flight's departure airbase; free-text loadout field with a "typical weapons" hint
- [x] Waypoint add/remove/edit for a flight's route, Combat-Flite style: click "Add waypoint on map" then click the map; route drawn live on the map as numbered, draggable markers whenever the flight is open (from its map marker or the Objects list); position editable via DDM fields or by dragging on the map, altitude/airspeed editable, remove from the list
- [x] Route leg calculations: each waypoint in the flight form shows distance, true track, and ETE from the previous leg, plus a running ETA once a takeoff time and every leg's airspeed are set; total route distance shown
- [x] Mission overview ("Overview" button): read-only summary of every flight (airbases, comms, loadout, full leg table) and every mission point/zone on one screen — a first step toward kneeboard export
- [x] Per-pylon armament: every playable aircraft/helicopter defines its weapon stations against a shared weapon catalog (with approximate per-round weights); the flight form shows one dropdown per pylon (options limited to that station's known-compatible weapons) plus a live weight readout (empty + fuel + ordnance = estimated gross weight), also surfaced in Mission Overview — another edge over Combat Flite
- [ ] Kneeboard export (printable/image, DCS-kneeboard-ready)
- [ ] TOT (time-on-target) planning/back-timing across a package
- [ ] Desktop application (Tauri)
- [ ] Monetization (license, accounts)

## Audit notes (overnight session, for review)

I don't have a way to see or drive the real Combat Flite application — I have
no remote/screen access to any machine outside this repo's build sandbox. So
this session (2026-08-09 night) I ran a self-directed regression audit
(scripted browser pass over every feature built so far — all clear, three
apparent failures traced to bugs in the *test script*, not the app, see the
`git log` messages if curious) and then added the two features below from
memory of how Combat Flite works, not from looking at it. Please sanity-check
these against the real thing when you're back:

- **Route leg table** (distance/track/ETE/ETA per waypoint) — the layout,
  units, and which fields Combat Flite shows per leg are from memory; worth
  comparing against an actual Combat Flite flight plan screen.
- **Mission overview / "Overview" button** — brand new, no Combat Flite
  reference used at all beyond "kneeboard-style summary." Layout, what's
  included, and what a first kneeboard-export pass should actually contain
  are all open.
- **Aircraft catalog performance figures** (max speed, ceiling, combat
  radius, internal fuel) and the **weapons/loadout reference lists** are
  approximate, publicly-known reference figures I already flagged in the
  data model's doc comments — not derived from DCS's flight model or a
  DCS-side loadout table. Treat every number as a placeholder to verify.
- **AI-only aircraft list** is a starter set, not exhaustive — additions
  welcome.
- **Pylon layouts and weapon weights** (added later, same session): every
  playable aircraft's pylon count and per-station compatible-weapons list is
  an approximation — all pylons on an airframe currently share one
  compatible-weapons list rather than modeling exact per-station DCS
  restrictions, and munition weights are representative public figures, not
  DCS store data. Good enough for rough weight/range planning; needs a pass
  against real DCS loadouts before treating gross-weight numbers as precise.
- Everything above was verified with `tsc`, `oxlint`, the `packages/core`
  unit tests (61 passing), and a scripted Playwright pass against the built
  app — not by a human clicking around, so UI feel/spacing/interaction
  details haven't had a human pass since the theming work.

## DCS data license

This project extracts data from DCS World (Eagle Dynamics) for flight-planning purposes.
Compliance of this use with Eagle Dynamics' EULA/ToS, particularly in a commercial context,
is still being verified.
