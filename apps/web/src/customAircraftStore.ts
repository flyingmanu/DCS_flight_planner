import type { CustomAircraft } from "@dcs-flight-planner/core";

const STORAGE_KEY = "dcs-flight-planner:custom-aircraft";

function readAll(): CustomAircraft[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CustomAircraft[]) : [];
  } catch {
    return [];
  }
}

function writeAll(aircraft: CustomAircraft[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(aircraft));
}

export function listCustomAircraft(): CustomAircraft[] {
  return readAll().sort((a, b) => a.name.localeCompare(b.name));
}

export function saveCustomAircraft(aircraft: CustomAircraft): void {
  const all = readAll();
  const index = all.findIndex((a) => a.id === aircraft.id);
  if (index === -1) {
    all.push(aircraft);
  } else {
    all[index] = aircraft;
  }
  writeAll(all);
}

export function deleteCustomAircraft(id: string): void {
  writeAll(readAll().filter((a) => a.id !== id));
}
