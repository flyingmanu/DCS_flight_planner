import { DEFAULT_FLIGHT_COLOR, type AircraftCategory } from "@dcs-flight-planner/core";

const SIZE = 24;
const C = SIZE / 2;

function svg(inner: string): HTMLElement {
  const el = document.createElement("div");
  el.style.width = `${SIZE}px`;
  el.style.height = `${SIZE}px`;
  el.style.cursor = "pointer";
  el.innerHTML = `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">${inner}</svg>`;
  return el;
}

// Simple top-down silhouettes, distinguishing fixed-wing (swept-wing jet)
// from helicopter (fuselage + main/tail rotor disc), tinted with the
// flight's color and outlined in white for contrast against any basemap.
function fixedWingIcon(color: string): HTMLElement {
  return svg(`
    <path d="M${C},2 L${C + 4},11 L${SIZE - 2},17 L${C + 3},15.5 L${C + 3.5},20 L${SIZE - 6},${SIZE - 2}
      L${C},${SIZE - 6} L6,${SIZE - 2} L${C - 3.5},20 L${C - 3},15.5 L2,17 L${C - 4},11 Z"
      fill="${color}" stroke="#fff" stroke-width="1.3" stroke-linejoin="round" />
  `);
}

function helicopterIcon(color: string): HTMLElement {
  return svg(`
    <circle cx="${C}" cy="${C}" r="10" fill="none" stroke="${color}" stroke-width="1.3" stroke-dasharray="2,1.5" />
    <rect x="${C - 2.5}" y="6" width="5" height="13" rx="2" fill="${color}" stroke="#fff" stroke-width="1.2" />
    <rect x="${C - 1}" y="17" width="2" height="6" fill="${color}" stroke="#fff" stroke-width="0.8" />
  `);
}

export function flightMarkerElement(category: AircraftCategory, color = DEFAULT_FLIGHT_COLOR): HTMLElement {
  return category === "helicopter" ? helicopterIcon(color) : fixedWingIcon(color);
}
