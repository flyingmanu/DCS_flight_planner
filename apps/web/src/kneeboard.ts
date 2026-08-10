import {
  computeGrossWeightLb,
  computeLoadoutWeightLb,
  computeRouteLegs,
  computeWaypointEtas,
  DEFAULT_FLIGHT_COLOR,
  formatEte,
  formatLatLonDdm,
  TASK_TYPE_LABEL,
  totalRouteDistanceNm,
  type Airbase,
  type CustomAircraft,
  type Flight,
} from "@dcs-flight-planner/core";
import { loadoutSummary } from "./armamentSummary";

// Portrait, roughly matching a real kneeboard card's proportions. DCS's in-game kneeboard
// page size varies a bit by aircraft, so treat this as a legible starting point rather than
// a verified per-airframe fit.
const WIDTH = 1024;
const HEIGHT = 1400;
const MARGIN = 48;

function airbaseName(airbases: Airbase[], id: string | undefined): string {
  return id ? (airbases.find((a) => a.id === id)?.name ?? id) : "—";
}

/** Draws a single flight's kneeboard page onto a fresh off-screen canvas. */
export function drawFlightKneeboard(flight: Flight, airbases: Airbase[], customAircraft: CustomAircraft[], missionName: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const color = flight.color ?? DEFAULT_FLIGHT_COLOR;
  const aircraft = customAircraft.find((a) => a.id === flight.customAircraftId);
  const route = flight.route ?? [];
  const legs = computeRouteLegs(route);
  const etas = computeWaypointEtas(route, legs, flight.takeoffTime);

  // Background
  ctx.fillStyle = "#f5f2ea";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.strokeStyle = "#1a2733";
  ctx.lineWidth = 3;
  ctx.strokeRect(6, 6, WIDTH - 12, HEIGHT - 12);

  let y = MARGIN;
  const left = MARGIN;
  const right = WIDTH - MARGIN;

  // Header band
  ctx.fillStyle = color;
  ctx.fillRect(left, y, right - left, 6);
  y += 26;

  ctx.fillStyle = "#1a2733";
  ctx.font = "bold 40px system-ui, sans-serif";
  ctx.fillText(flight.name || "(unnamed flight)", left, y + 34);
  y += 62;

  ctx.font = "20px system-ui, sans-serif";
  ctx.fillStyle = "#3a4552";
  ctx.fillText(
    [flight.aircraftType, TASK_TYPE_LABEL[flight.taskType], `${flight.size} ship`].filter(Boolean).join("   ·   "),
    left,
    y,
  );
  y += 26;
  ctx.font = "14px system-ui, sans-serif";
  ctx.fillStyle = "#6b7684";
  ctx.fillText(missionName, left, y);
  y += 30;

  ctx.strokeStyle = "#c7c0ae";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, y);
  ctx.lineTo(right, y);
  ctx.stroke();
  y += 28;

  function labelValue(label: string, value: string, x: number, rowY: number) {
    ctx!.font = "11px system-ui, sans-serif";
    ctx!.fillStyle = "#8a93a0";
    ctx!.fillText(label.toUpperCase(), x, rowY);
    ctx!.font = "bold 18px system-ui, sans-serif";
    ctx!.fillStyle = "#1a2733";
    ctx!.fillText(value, x, rowY + 22);
  }

  const colWidth = (right - left) / 3;
  labelValue("Departure", airbaseName(airbases, flight.departureAirbaseId), left, y);
  labelValue("Arrival", airbaseName(airbases, flight.arrivalAirbaseId), left + colWidth, y);
  labelValue("Alternate", airbaseName(airbases, flight.alternateAirbaseId), left + colWidth * 2, y);
  y += 50;
  labelValue("Takeoff", flight.takeoffTime ?? "—", left, y);
  labelValue("TACAN", flight.tacanChannel ?? "—", left + colWidth, y);
  labelValue("Radio", flight.radioFrequencyMhz ? `${flight.radioFrequencyMhz} MHz` : "—", left + colWidth * 2, y);
  y += 50;
  labelValue("IFF 1 / 3", `${flight.iffMode1 ?? "—"} / ${flight.iffMode3 ?? "—"}`, left, y);
  if (aircraft?.performance.maxSpeedKt) {
    labelValue("Max speed", `${aircraft.performance.maxSpeedKt} kt`, left + colWidth, y);
  }
  y += 40;

  const armament = loadoutSummary(flight, aircraft);
  if (armament && aircraft) {
    const gross = computeGrossWeightLb(aircraft, flight.pylonLoadout);
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillStyle = "#8a93a0";
    ctx.fillText("ARMAMENT", left, y);
    ctx.font = "14px system-ui, sans-serif";
    ctx.fillStyle = "#1a2733";
    ctx.fillText(armament, left, y + 20);
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillStyle = "#6b7684";
    const weightLine =
      `Ordnance ${computeLoadoutWeightLb(aircraft, flight.pylonLoadout).toLocaleString()} lb` +
      (gross !== undefined ? `  ·  Est. gross weight ${gross.toLocaleString()} lb` : "");
    ctx.fillText(weightLine, left, y + 40);
    y += 60;
  }

  if (flight.loadout) {
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillStyle = "#6b7684";
    ctx.fillText(`Notes: ${flight.loadout}`, left, y);
    y += 24;
  }

  y += 10;
  ctx.strokeStyle = "#c7c0ae";
  ctx.beginPath();
  ctx.moveTo(left, y);
  ctx.lineTo(right, y);
  ctx.stroke();
  y += 30;

  // Route table
  ctx.font = "bold 16px system-ui, sans-serif";
  ctx.fillStyle = "#1a2733";
  ctx.fillText(`ROUTE (${route.length})`, left, y);
  y += 26;

  const cols = [
    { label: "WP", w: 60 },
    { label: "COORDINATES", w: 280 },
    { label: "ALT", w: 90 },
    { label: "SPD", w: 80 },
    { label: "DIST", w: 90 },
    { label: "TRK", w: 70 },
    { label: "ETE", w: 90 },
    { label: "ETA", w: 90 },
  ];
  let x = left;
  ctx.font = "11px system-ui, sans-serif";
  ctx.fillStyle = "#8a93a0";
  for (const col of cols) {
    ctx.fillText(col.label, x, y);
    x += col.w;
  }
  y += 8;
  ctx.strokeStyle = "#c7c0ae";
  ctx.beginPath();
  ctx.moveTo(left, y);
  ctx.lineTo(right, y);
  ctx.stroke();
  y += 22;

  ctx.font = "13px ui-monospace, monospace";
  route.forEach((wp, i) => {
    const leg = i > 0 ? legs[i - 1] : undefined;
    x = left;
    ctx.fillStyle = "#1a2733";
    const cells = [
      wp.name ?? `WP${i + 1}`,
      formatLatLonDdm(wp.position),
      wp.altitudeFt ? `${wp.altitudeFt.toLocaleString()}` : "—",
      wp.airspeedKt ? `${wp.airspeedKt}` : "—",
      leg ? `${leg.distanceNm.toFixed(1)} NM` : "—",
      leg ? `${Math.round(leg.trackDeg).toString().padStart(3, "0")}°` : "—",
      leg?.eteMin !== undefined ? formatEte(leg.eteMin) : "—",
      etas[i] ?? "—",
    ];
    cells.forEach((text, colIndex) => {
      ctx!.fillText(text, x, y);
      x += cols[colIndex]!.w;
    });
    y += 24;
  });

  if (route.length > 0) {
    y += 10;
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillStyle = "#6b7684";
    ctx.fillText(`Total distance ${totalRouteDistanceNm(route).toFixed(1)} NM`, left, y);
  } else {
    ctx.font = "13px system-ui, sans-serif";
    ctx.fillStyle = "#8a93a0";
    ctx.fillText("No waypoints planned.", left, y);
  }

  // Footer
  ctx.font = "11px system-ui, sans-serif";
  ctx.fillStyle = "#a3abb6";
  ctx.fillText("Generated by DCS Flight Planner — verify against the real mission before flying.", left, HEIGHT - 24);

  return canvas;
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function slug(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "flight"
  );
}

/** Generates and downloads one kneeboard PNG per flight, staggered so browsers don't block multi-file downloads. */
export async function exportKneeboards(flights: Flight[], airbases: Airbase[], customAircraft: CustomAircraft[], missionName: string): Promise<void> {
  for (let i = 0; i < flights.length; i++) {
    const flight = flights[i]!;
    const canvas = drawFlightKneeboard(flight, airbases, customAircraft, missionName);
    const blob = await canvasToPngBlob(canvas);
    if (blob) downloadBlob(blob, `${slug(missionName)}-${slug(flight.name)}-kneeboard.png`);
    if (i < flights.length - 1) await new Promise((resolve) => setTimeout(resolve, 200));
  }
}
