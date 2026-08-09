#!/usr/bin/env node
// Reassembles the DCS_EXPORT-tagged lines written by Export.lua into dcs.log
// back into a single JSON file.
//
// Usage: node extract-log.mjs <path-to-dcs.log> [output.json]

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const [, , logPathArg, outPathArg] = process.argv;

if (!logPathArg) {
  console.error("Usage: node extract-log.mjs <path-to-dcs.log> [output.json]");
  process.exit(1);
}

const BEGIN_MARKER = "===DCS_EXPORT_BEGIN===";
const END_MARKER = "===DCS_EXPORT_END===";
const PREFIX_MARKER = "DCS_EXPORT|";
const ERROR_MARKER = "DCS_EXPORT_ERROR|";

const log = readFileSync(logPathArg, "utf8");
const lines = log.split(/\r?\n/);

let capturing = false;
let chunks = [];
let errorMsg = null;

for (const line of lines) {
  if (line.includes(BEGIN_MARKER)) {
    capturing = true;
    chunks = [];
    continue;
  }
  if (line.includes(END_MARKER)) {
    capturing = false;
    continue;
  }
  if (line.includes(ERROR_MARKER)) {
    errorMsg = line.slice(line.indexOf(ERROR_MARKER) + ERROR_MARKER.length);
    continue;
  }
  if (capturing) {
    const idx = line.indexOf(PREFIX_MARKER);
    if (idx !== -1) {
      chunks.push(line.slice(idx + PREFIX_MARKER.length));
    }
  }
}

if (errorMsg) {
  console.error("The DCS export script reported an error:", errorMsg);
  process.exit(1);
}

if (chunks.length === 0) {
  console.error(
    "No DCS_EXPORT markers found in the log file. Did the mission actually run the export trigger?"
  );
  process.exit(1);
}

const json = chunks.join("");

let parsed;
try {
  parsed = JSON.parse(json);
} catch (e) {
  const outRaw = (outPathArg || "output/export.json").replace(/\.json$/, ".invalid.txt");
  mkdirSync(dirname(outRaw), { recursive: true });
  writeFileSync(outRaw, json, "utf8");
  console.error(`Reassembled text is not valid JSON (${e.message}).`);
  console.error(`Raw text written to ${outRaw} for inspection.`);
  process.exit(1);
}

const outPath = outPathArg || join("output", `${String(parsed.theater || "export").toLowerCase()}-raw.json`);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(parsed, null, 2), "utf8");
console.log(`Wrote ${outPath} (${parsed.airbases?.length ?? 0} airbases)`);
