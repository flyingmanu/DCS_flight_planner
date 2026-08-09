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
}

export type MissionObject = PointObject | PolygonObject;
