import type { GlobalAirport } from "@dcs-flight-planner/core";

let cached: Promise<GlobalAirport[]> | null = null;

/** Fetches the bundled OurAirports reference dataset (large/medium airports worldwide), caching the result. */
export function loadGlobalAirports(): Promise<GlobalAirport[]> {
  if (!cached) {
    cached = fetch(`${import.meta.env.BASE_URL}data/ourairports.json`).then((res) => {
      if (!res.ok) throw new Error(`Failed to load OurAirports dataset: ${res.status}`);
      return res.json() as Promise<GlobalAirport[]>;
    });
  }
  return cached;
}
