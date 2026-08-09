import { DEFAULT_POINT_COLOR, type PointKind } from "@dcs-flight-planner/core";

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

const POINT_ICON_BUILDERS: Record<PointKind, (color: string) => HTMLElement> = {
  airNav: (color) =>
    svg(`<polygon points="${C},4 ${SIZE - 4},${SIZE - 5} 4,${SIZE - 5}"
      fill="#fff" stroke="${color}" stroke-width="2" stroke-linejoin="round" />`),

  reference: (color) =>
    svg(`<polygon points="${C},4 ${SIZE - 4},${C} ${C},${SIZE - 4} 4,${C}"
      fill="#fff" stroke="${color}" stroke-width="2" stroke-linejoin="round" />`),

  push: (color) =>
    svg(`<circle cx="${C}" cy="${C}" r="10" fill="#fff" stroke="${color}" stroke-width="2" />
      <polygon points="10,8 19,${C} 10,18" fill="${color}" />`),

  exit: (color) =>
    svg(`<circle cx="${C}" cy="${C}" r="10" fill="#fff" stroke="${color}" stroke-width="2" />
      <polygon points="16,8 7,${C} 16,18" fill="${color}" />`),

  cp: (color) =>
    labeledShape(`<rect x="4" y="4" width="${SIZE - 8}" height="${SIZE - 8}" fill="#fff" stroke="${color}" stroke-width="2" />`, "CP", color),

  ip: (color) =>
    labeledShape(
      `<polygon points="${C},3 ${SIZE - 3},10 ${SIZE - 6},${SIZE - 3} 6,${SIZE - 3} 3,10"
        fill="#fff" stroke="${color}" stroke-width="2" stroke-linejoin="round" />`,
      "IP",
      color,
    ),

  target: (color) =>
    svg(`<circle cx="${C}" cy="${C}" r="10" fill="#fff" stroke="${color}" stroke-width="2" />
      <circle cx="${C}" cy="${C}" r="6" fill="none" stroke="${color}" stroke-width="2" />
      <circle cx="${C}" cy="${C}" r="1.5" fill="${color}" />`),

  lz: (color) =>
    labeledShape(`<rect x="4" y="4" width="${SIZE - 8}" height="${SIZE - 8}" rx="4" fill="#fff" stroke="${color}" stroke-width="2" />`, "LZ", color),
};

export function pointMarkerElement(kind: PointKind, color?: string): HTMLElement {
  return POINT_ICON_BUILDERS[kind](color ?? DEFAULT_POINT_COLOR[kind]);
}
