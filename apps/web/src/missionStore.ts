import type { Mission } from "@dcs-flight-planner/core";

const STORAGE_KEY = "dcs-flight-planner:missions";

function readAll(): Mission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Mission[]) : [];
  } catch {
    return [];
  }
}

function writeAll(missions: Mission[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(missions));
}

export function listMissions(): Mission[] {
  return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function saveMission(mission: Mission): void {
  const missions = readAll();
  const index = missions.findIndex((m) => m.id === mission.id);
  if (index === -1) {
    missions.push(mission);
  } else {
    missions[index] = mission;
  }
  writeAll(missions);
}

export function deleteMission(id: string): void {
  writeAll(readAll().filter((m) => m.id !== id));
}
