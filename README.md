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
- [x] Aircraft catalog (`packages/core`): all playable DCS modules (fixed-wing + helicopters) plus a starter set of AI-only aircraft — name, category, and standard task types only, picked from a dropdown in the flight form, with category icons (fixed-wing / helicopter) shown on the map at each flight's departure airbase. Deliberately simple: no performance or armament data, for anyone who just wants to lay out flight plans quickly
- [x] Waypoint add/remove/edit for a flight's route, Combat-Flite style: click "Add waypoint on map" then click the map; route drawn live on the map — departure airbase → waypoints → arrival airbase — as a connected line with numbered, draggable markers whenever the flight is open (from its map marker or the Objects list); position editable via DDM fields or by dragging on the map, altitude/airspeed editable, remove from the list
- [x] Route leg calculations: each waypoint in the flight form shows distance, true track, and ETE from the previous leg, plus a running ETA once a takeoff time and every leg's airspeed are set; total route distance shown
- [x] Mission overview ("Overview" button): read-only summary of every flight (airbases, comms, loadout, full leg table) and every mission point/zone on one screen — a first step toward kneeboard export
- [x] Custom aircraft ("Aircraft" menu): build fully custom aircraft with detailed, user-entered performance (weights, speeds, ceiling, cruise fuel flow, a takeoff-distance reference point) and a detailed armament page — pylon count, per-pylon compatible weapons, per-weapon compatible launchers, and launcher weights — plus named loadout presets you can save from a flight and reapply. The flight form shows a live weight readout (gross weight + light/medium/heavy classification), estimated takeoff distance, and estimated endurance/range, also surfaced in Mission Overview — another edge over Combat Flite. F-16C is the first test case, built from real reference data in a JTFF Drive spreadsheet
- [x] Kneeboard export, first pass: "Export kneeboards (PNG)" in Mission Overview downloads one portrait card per flight (header, airbases/comms, armament + weight, full leg table) — page size is a legible guess, not yet checked against a real DCS kneeboard display
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
- **AI-only aircraft list** is a starter set, not exhaustive — additions
  welcome.
- **Kneeboard PNG export** (new): first pass only. Page size (1024×1400,
  portrait) is a legible guess since I don't have a way to check DCS's actual
  in-game kneeboard display size, which reportedly varies a bit by aircraft —
  worth comparing a generated PNG against a real DCS kneeboard page before
  relying on it. Content/layout is likewise unreviewed by a human.
- **Architecture change**: the built-in catalog's performance/armament data
  (and the shared weapon catalog + fixed pylon list it used) has been removed
  in favor of user-built **custom aircraft** (new "Aircraft" menu), each with
  its own performance fields, launchers, weapons, and pylons — see the
  Progress list above. The catalog is back to name/category/task only.
- **F-16C reference data**: 19,899 lb empty weight, 7,163 lb internal fuel,
  and the SCL-sheet pylon/rack/weapon layout (stations 1/2/8/9 = AIM-9/
  AIM-120 rail; 3/7 = flexible heavy rack; 4/6 = heavy store or fuel tank;
  5L/5/5R = HTS/ECM-fuel/targeting-pod) came from real F-16C mission-planning
  workbooks in the shared JTFF Drive folder, not memory. This data hasn't
  been entered into a custom aircraft yet — F-16C was named as the intended
  first test case but the actual "F-16C" custom aircraft still needs to be
  built by hand in the new editor using these figures.
- **Route line bugfix**: the flight-route line on the map could get stuck
  and never update (root cause: gating the redraw on `map.isStyleLoaded()`,
  which can transiently go false long after the map's one-time "load" event
  already fired, falling into a `once("load", ...)` callback that then never
  runs again). Fixed by gating on whether the line's GeoJSON source exists
  instead. Worth an extra look if route lines ever seem to freeze again.
- Everything above was verified with `tsc`, `oxlint`, the `packages/core`
  unit tests (60 passing), and a scripted Playwright pass against the built
  app — not by a human clicking around, so UI feel/spacing/interaction
  details haven't had a human pass since the theming work.

## DCS data license

This project extracts data from DCS World (Eagle Dynamics) for flight-planning purposes.
Compliance of this use with Eagle Dynamics' EULA/ToS, particularly in a commercial context,
is still being verified.
