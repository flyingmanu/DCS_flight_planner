import type { LatLon } from "./geo.js";

export type PointKind = "airNav" | "reference" | "push" | "exit" | "cp" | "ip" | "target" | "lz";

export const POINT_KIND_LABEL: Record<PointKind, string> = {
  airNav: "Point aéronautique",
  reference: "Point référence",
  push: "Push point",
  exit: "Exit point",
  cp: "CP",
  ip: "IP",
  target: "Target",
  lz: "LZ",
};

export interface Dmpi {
  id: string;
  name: string;
  position: LatLon;
}

export interface PointObject {
  id: string;
  type: "point";
  name: string;
  kind: PointKind;
  position: LatLon;
  /** Only meaningful for kind "target": the target is itself a DMPI, and can carry more. */
  dmpis?: Dmpi[];
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
    };

export interface PolygonObject {
  id: string;
  type: "polygon";
  name: string;
  shape: PolygonShape;
}

export type MissionObject = PointObject | PolygonObject;
