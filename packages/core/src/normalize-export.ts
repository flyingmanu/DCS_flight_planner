import type { Airbase, AirbaseCategory, GeoPosition, Runway, Theater } from "./types.js";

/**
 * Shape of the raw JSON produced by tools/dcs-export/mission_export.lua.
 * Deliberately loose: the export script is a discovery probe against the DCS
 * scripting API, so fields can be missing depending on DCS version.
 */
export interface RawExport {
  theater: string;
  airbases: RawAirbase[];
}

interface RawAirbase {
  name?: string;
  callsign?: string;
  category?: number;
  coalition?: number;
  lat?: number;
  lon?: number;
  alt?: number;
  runways?: RawRunway[];
}

interface RawRunway {
  /** Runway designator for this end, e.g. 22 for a nominal heading of ~220°. */
  Name?: number;
  length?: number;
  width?: number;
}

const CATEGORY_BY_CODE: Record<number, AirbaseCategory> = {
  0: "airdrome",
  1: "helipad",
  2: "ship",
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// DCS's getRunways() only returns one entry per physical strip (one end's
// designator), not both. The reciprocal end is always 18 (i.e. 180°) away
// in the 1-36 designator scale.
function reciprocalDesignator(designator: number): number {
  const reciprocal = designator + 18;
  return reciprocal > 36 ? reciprocal - 36 : reciprocal;
}

function normalizeRunway(raw: RawRunway): Runway | null {
  if (raw.Name == null || raw.length == null || raw.width == null) {
    return null;
  }
  const a = raw.Name;
  const b = reciprocalDesignator(a);
  const [lo, hi] = a < b ? [a, b] : [b, a];
  return {
    id: `${String(lo).padStart(2, "0")}/${String(hi).padStart(2, "0")}`,
    designators: [lo, hi],
    lengthM: raw.length,
    widthM: raw.width,
    // The DCS export doesn't expose ILS data; left as "N/A" until a real source is found.
    ilsFrequencyMhz: "N/A",
  };
}

function normalizeAirbase(raw: RawAirbase): Airbase | null {
  if (!raw.name || raw.lat == null || raw.lon == null) {
    return null;
  }
  const position: GeoPosition = {
    lat: raw.lat,
    lon: raw.lon,
    altM: raw.alt ?? 0,
  };
  const runways = (raw.runways ?? [])
    .map(normalizeRunway)
    .filter((r): r is Runway => r !== null);

  return {
    id: slugify(raw.name),
    name: raw.name,
    callsign: raw.callsign ?? raw.name,
    category: CATEGORY_BY_CODE[raw.category ?? -1] ?? "unknown",
    initialCoalition: raw.coalition ?? -1,
    position,
    runways,
    // The DCS export doesn't expose tower/TACAN data; both are assigned
    // separately for the curated theater data files (see data/caucasus.json).
    radioFrequencyMhz: "N/A",
    tacanChannel: "N/A",
  };
}

export function normalizeTheaterExport(raw: RawExport): Theater {
  const airbases = raw.airbases
    .map(normalizeAirbase)
    .filter((a): a is Airbase => a !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    id: slugify(raw.theater),
    name: raw.theater,
    airbases,
  };
}
