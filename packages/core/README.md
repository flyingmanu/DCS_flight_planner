# @dcs-flight-planner/core

Business logic shared between the future web and desktop apps: data models
(theaters, airbases, waypoints), navigation calculations, coordinate
conversions.

## Current contents

- `src/types.ts` — data model (`Theater`, `Airbase`, `Runway`, ...)
- `src/normalize-export.ts` — turns the raw JSON produced by
  `tools/dcs-export/mission_export.lua` into a clean dataset
- `src/data/*.json` — normalized datasets per theater (Caucasus for now)
- `scripts/normalize-theater.ts` — CLI to generate/regenerate a dataset

## Regenerate a dataset

```
pnpm --filter @dcs-flight-planner/core normalize <path-to-raw.json>
```

## Known limitations

- Radio frequencies are not exposed by DCS's scripting API for static
  airbases; another source (official charts, manual extraction) will be
  needed to add them.
- The raw `course` field returned by `getRunways()` doesn't map directly to
  a standard heading; the runway designator (`Name`, e.g. `22`) is used as
  the source of the nominal heading (`designator × 10°`) instead.
- Only one theater (Caucasus) is normalized so far.

## Tests

```
pnpm --filter @dcs-flight-planner/core test
```
