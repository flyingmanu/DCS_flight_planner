import type { PointKind } from "@dcs-flight-planner/core";

const SIZE = 26;
const C = SIZE / 2;

function svg(inner: string): HTMLElement {
  const el = document.createElement("div");
  el.style.width = `${SIZE}px`;
  el.style.height = `${SIZE}px`;
  el.style.cursor = "pointer";
  el.innerHTML = `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">${inner}</svg>`;
  return el;
}

function labeledShape(shapeSvg: string, label: string, color: string): HTMLElement {
  return svg(`
    ${shapeSvg}
    <text x="${C}" y="${C + 3.5}" text-anchor="middle" font-size="8" font-weight="700"
      font-family="system-ui, sans-serif" fill="${color}">${label}</text>
  `);
}

const POINT_ICON_BUILDERS: Record<PointKind, () => HTMLElement> = {
  airNav: () =>
    svg(`<polygon points="${C},4 ${SIZE - 4},${SIZE - 5} 4,${SIZE - 5}"
      fill="#fff" stroke="#6d28d9" stroke-width="2" stroke-linejoin="round" />`),

  reference: () =>
    svg(`<polygon points="${C},4 ${SIZE - 4},${C} ${C},${SIZE - 4} 4,${C}"
      fill="#fff" stroke="#374151" stroke-width="2" stroke-linejoin="round" />`),

  push: () =>
    svg(`<circle cx="${C}" cy="${C}" r="10" fill="#fff" stroke="#15803d" stroke-width="2" />
      <polygon points="10,8 19,${C} 10,18" fill="#15803d" />`),

  exit: () =>
    svg(`<circle cx="${C}" cy="${C}" r="10" fill="#fff" stroke="#c2410c" stroke-width="2" />
      <polygon points="16,8 7,${C} 16,18" fill="#c2410c" />`),

  cp: () => labeledShape(`<rect x="4" y="4" width="${SIZE - 8}" height="${SIZE - 8}" fill="#fff" stroke="#1d4ed8" stroke-width="2" />`, "CP", "#1d4ed8"),

  ip: () =>
    labeledShape(
      `<polygon points="${C},3 ${SIZE - 3},10 ${SIZE - 6},${SIZE - 3} 6,${SIZE - 3} 3,10"
        fill="#fff" stroke="#0f766e" stroke-width="2" stroke-linejoin="round" />`,
      "IP",
      "#0f766e",
    ),

  target: () =>
    svg(`<circle cx="${C}" cy="${C}" r="10" fill="#fff" stroke="#c02020" stroke-width="2" />
      <circle cx="${C}" cy="${C}" r="6" fill="none" stroke="#c02020" stroke-width="2" />
      <circle cx="${C}" cy="${C}" r="1.5" fill="#c02020" />`),

  lz: () => labeledShape(`<rect x="4" y="4" width="${SIZE - 8}" height="${SIZE - 8}" rx="4" fill="#fff" stroke="#15803d" stroke-width="2" />`, "LZ", "#15803d"),
};

export function pointMarkerElement(kind: PointKind): HTMLElement {
  return POINT_ICON_BUILDERS[kind]();
}
