import type { LatLon } from "./geo.js";

export type PointKind = "airNav" | "reference" | "push" | "exit" | "cp" | "ip" | "target" | "lz";

export const POINT_KIND_LABEL: Record<PointKind, string> = {
  airNav: "Aeronautical point",
  reference: "Reference point",
  push: "Push point",
  exit: "Exit point",
  cp: "CP",
  ip: "IP",
  target: "Target",
  lz: "LZ",
};

export const DEFAULT_POINT_COLOR: Record<PointKind, string> = {
  airNav: "#6d28d9",
  reference: "#374151",
  push: "#15803d",
  exit: "#c2410c",
  cp: "#1d4ed8",
  ip: "#0f766e",
  target: "#c02020",
  lz: "#15803d",
};

export const DEFAULT_POLYGON_COLOR = "#0f766e";

export interface Dmpi {
  id: string;
  name: string;
  position: LatLon;
  elevationFt?: number;
  /** True once the user has typed an altitude by hand; otherwise elevationFt tracks ground level. */
  elevationManual?: boolean;
}

export interface PointObject {
  id: string;
  type: "point";
  name: string;
  kind: PointKind;
  position: LatLon;
  /** Only meaningful for kind "target": the target is itself a DMPI, and can carry more. */
  dmpis?: Dmpi[];
  /** Overrides the kind's default marker color when set. */
  color?: string;
  /** Whether this object is rendered on the map. Defaults to true (visible) when absent. */
  visible?: boolean;
  /** Free-text notes/comment for briefing purposes. */
  notes?: string;
  /** When true, this object's marker can't be dragged on the map. */
  locked?: boolean;
}

export type Hand = "left" | "right";
export type OrbitVariant = "hold" | "aar";

export type PolygonShape =
  | { kind: "freeform"; vertices: LatLon[] }
  | { kind: "rectangle"; corner1: LatLon; corner2: LatLon; rotationDeg: number }
  | { kind: "circle"; center: LatLon; radiusM: number }
  | {
      kind: "orbit";
      center: LatLon;
      hand: Hand;
      variant: OrbitVariant;
      courseDeg: number;
      legLengthNm: number;
      turnRadiusNm?: number;
    };

export const DEFAULT_ORBIT_TURN_RADIUS_NM = 1;

export interface PolygonObject {
  id: string;
  type: "polygon";
  name: string;
  shape: PolygonShape;
  /** Overrides the default fill/line color when set. */
  color?: string;
  /** Whether this object is rendered on the map. Defaults to true (visible) when absent. */
  visible?: boolean;
  /** Free-text notes/comment for briefing purposes. */
  notes?: string;
  /** Lower bound of the zone/orbit's altitude band, in feet. */
  minAltFt?: number;
  /** Upper bound of the zone/orbit's altitude band, in feet. */
  maxAltFt?: number;
  /** Associated radio frequency, in MHz. */
  frequencyMhz?: number;
  /** When true, this object can't be dragged on the map. */
  locked?: boolean;
  /** For a circle shape sized from a threatSystems.ts entry: which system, so the ring stays labeled even after manual radius/altitude tweaks. */
  threatSystemId?: string;
}

export const DEFAULT_LINE_COLOR = "#7c3aed";

/** An open polyline (not a closed zone) - e.g. a border, a low-level route, a coordination line. */
export interface LineObject {
  id: string;
  type: "line";
  name: string;
  vertices: LatLon[];
  /** Overrides the default line color when set. */
  color?: string;
  /** Whether this object is rendered on the map. Defaults to true (visible) when absent. */
  visible?: boolean;
  /** Free-text notes/comment for briefing purposes. */
  notes?: string;
  /** When true, this object can't be dragged on the map. */
  locked?: boolean;
}

export const DEFAULT_LABEL_COLOR = "#111827";
export const DEFAULT_LABEL_FILL_COLOR = "#ffffff";
export const DEFAULT_LABEL_BORDER_COLOR = "#111827";
export const DEFAULT_LABEL_FONT_SIZE_PX = 13;

/** A free-positioned text label on the map, equivalent to Combat Flite's ITB. */
export interface LabelObject {
  id: string;
  type: "label";
  /** The label's displayed text. */
  name: string;
  position: LatLon;
  /** Text color. Defaults to DEFAULT_LABEL_COLOR when absent. */
  color?: string;
  bold?: boolean;
  /** Background fill color. Defaults to DEFAULT_LABEL_FILL_COLOR when absent. */
  fillColor?: string;
  /** Border color. Defaults to DEFAULT_LABEL_BORDER_COLOR when absent. */
  borderColor?: string;
  /** Font size in pixels. Defaults to DEFAULT_LABEL_FONT_SIZE_PX when absent. */
  fontSizePx?: number;
  /** Whether this object is rendered on the map. Defaults to true (visible) when absent. */
  visible?: boolean;
  /** Free-text notes/comment for briefing purposes. */
  notes?: string;
  /** When true, this label can't be dragged on the map. */
  locked?: boolean;
}

export type MissionObject = PointObject | PolygonObject | LabelObject | LineObject;
