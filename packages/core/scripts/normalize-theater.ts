// Turns a raw export produced by tools/dcs-export/mission_export.lua into a
// clean Theater dataset committed under src/data/<theater-id>.json.
//
// Usage: pnpm --filter @dcs-flight-planner/core normalize <path-to-raw.json>

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeTheaterExport, type RawExport } from "../src/normalize-export.js";

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Usage: pnpm --filter @dcs-flight-planner/core normalize <path-to-raw.json>");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(inputPath, "utf8")) as RawExport;
const theater = normalizeTheaterExport(raw);

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outPath = join(packageRoot, "src", "data", `${theater.id}.json`);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(theater, null, 2)}\n`, "utf8");

console.log(`Wrote ${outPath} (${theater.airbases.length} airbases)`);
