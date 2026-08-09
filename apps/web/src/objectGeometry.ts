import {
  circlePoints,
  orbitDirectionArrow,
  orbitTrackPoints,
  rectangleCorners,
  type LatLon,
  type OrbitDirectionArrow,
  type PolygonObject,
  type PolygonShape,
} from "@dcs-flight-planner/core";

const toLngLat = (p: LatLon): [number, number] => [p.lon, p.lat];

function shapeRing(shape: PolygonShape): [number, number][] {
  if (shape.kind === "freeform") {
    const coords = shape.vertices.map(toLngLat);
    return [...coords, coords[0]!];
  }

  if (shape.kind === "rectangle") {
    const corners = rectangleCorners(shape.corner1, shape.corner2, shape.rotationDeg);
    const coords = corners.map(toLngLat);
    return [...coords, coords[0]!];
  }

  if (shape.kind === "circle") {
    return circlePoints(shape.center, shape.radiusM).map(toLngLat);
  }

  // orbit
  return orbitTrackPoints(shape).map(toLngLat);
}

/** Closed-ring outline of a polygon object's shape, as GeoJSON [lon,lat] coordinates. */
export function polygonRing(object: PolygonObject): [number, number][] {
  return shapeRing(object.shape);
}

/** Direction-of-travel arrow for an orbit shape, or null for other shape kinds. */
export function orbitArrow(shape: PolygonShape): OrbitDirectionArrow | null {
  return shape.kind === "orbit" ? orbitDirectionArrow(shape) : null;
}

function translatePoint(p: LatLon, dLat: number, dLon: number): LatLon {
  return { lat: p.lat + dLat, lon: p.lon + dLon };
}

/** Rigidly translates a polygon shape by a lat/lon offset (used for drag-to-move). */
export function translatePolygonShape(shape: PolygonShape, dLat: number, dLon: number): PolygonShape {
  if (shape.kind === "freeform") {
    return { ...shape, vertices: shape.vertices.map((v) => translatePoint(v, dLat, dLon)) };
  }
  if (shape.kind === "rectangle") {
    return { ...shape, corner1: translatePoint(shape.corner1, dLat, dLon), corner2: translatePoint(shape.corner2, dLat, dLon) };
  }
  // circle and orbit both move by translating their center
  return { ...shape, center: translatePoint(shape.center, dLat, dLon) };
}
