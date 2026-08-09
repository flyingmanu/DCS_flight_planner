# DCS data export

Tooling to extract static data from a DCS theater (airbases, runways,
frequencies...) in order to build the `packages/core` data model.

`mission_export.lua` is a **discovery** script: we don't yet know precisely
which DCS scripting API methods are available/useful, so it probes a list of
known methods on each `Airbase` and includes anything that responds. Fields
not supported by your DCS version will simply come back as `null` — that's
expected, and it's also useful info for later.

The script runs entirely in the standard sandboxed mission Lua environment
(no `MissionScripting.lua` modification needed).

## Steps

1. **Create a test mission** in the DCS Mission Editor, on the desired
   theater (start with Caucasus, included for free with DCS).

2. **Add a trigger**:
   - Type: `MISSION START` (ONCE)
   - Action: `DO SCRIPT FILE`
   - File: point it to `mission_export.lua` (copy it anywhere accessible
     from your machine, e.g. `Saved Games\DCS\Missions\mission_export.lua`)

3. **Launch the mission** (no need for a playable aircraft, just enough for
   the MISSION START trigger to fire — a few seconds in-game is enough
   before quitting).

4. **Retrieve `dcs.log`**, usually located at:
   - `%USERPROFILE%\Saved Games\DCS\Logs\dcs.log` (stable version)
   - `%USERPROFILE%\Saved Games\DCS.openbeta\Logs\dcs.log` (beta version)

5. **Send me `dcs.log` directly** (the file, or its pasted content) — no
   need to run `extract-log.mjs` yourself, I'll handle it from the raw log.

`extract-log.mjs` stays in the repo for internal use (it's what I run on my
end once you've given me the log); you don't need to touch it.

## Troubleshooting

- If no `DCS_EXPORT` marker appears in the log: the trigger probably didn't
  fire — check that there are `SCRIPTING:` lines in `dcs.log` around the
  time the mission was launched.
- If the Lua script raised an error, it appears in `dcs.log` prefixed with
  `DCS_EXPORT_ERROR|` — send me that line, it'll help me fix the script.
