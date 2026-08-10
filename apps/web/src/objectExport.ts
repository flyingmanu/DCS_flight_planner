import type { Bullseye, Flight, MissionObject, Package } from "@dcs-flight-planner/core";

/** A standalone, downloadable snapshot of a subset (or all) of a mission's objects. */
export interface MissionObjectSet {
  formatVersion: 1;
  exportedAt: string;
  theaterId: string;
  objects: MissionObject[];
  flights: Flight[];
  bullseyes: Bullseye[];
  packages: Package[];
}

function slug(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "objects"
  );
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Downloads a subset (or all) of a mission's objects/flights/bullseyes/packages as a standalone JSON file. */
export function exportObjectSet(
  theaterId: string,
  missionName: string,
  data: { objects: MissionObject[]; flights: Flight[]; bullseyes: Bullseye[]; packages: Package[] },
): void {
  const payload: MissionObjectSet = { formatVersion: 1, exportedAt: new Date().toISOString(), theaterId, ...data };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  downloadBlob(blob, `${slug(missionName)}-objects.json`);
}
