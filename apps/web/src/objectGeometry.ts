import { circlePoints, orbitTrackPoints, rectangleCorners, type LatLon, type PolygonObject } from "@dcs-flight-planner/core";

const toLngLat = (p: LatLon): [number, number] => [p.lon, p.lat];

/** Closed-ring outline of a polygon object's shape, as GeoJSON [lon,lat] coordinates. */
export function polygonRing(object: PolygonObject): [number, number][] {
  const { shape } = object;

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
