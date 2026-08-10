import {
  circlePoints,
  distanceKm,
  fromLocalMeters,
  orbitTrackPoints,
  rectangleCorners,
  toLocalMeters,
  type Hand,
  type LatLon,
  type OrbitVariant,
  type PointKind,
  type PolygonShape,
  type Side,
} from "@dcs-flight-planner/core";
import maplibregl from "maplibre-gl";

export type PolygonKind = "freeform" | "rectangle" | "circle" | "orbit";

export type CreationRequest =
  | { kind: "point"; pointKind: PointKind }
  | { kind: "polygon"; polygonKind: "freeform" }
  | { kind: "polygon"; polygonKind: "rectangle" }
  | { kind: "polygon"; polygonKind: "circle" }
  | { kind: "polygon"; polygonKind: "orbit"; hand: Hand; variant: OrbitVariant }
  | { kind: "waypoint" }
  | { kind: "bullseye"; side: Side }
  | { kind: "label" };

export type ObjectDraft =
  | { type: "point"; kind: PointKind; position: LatLon }
  | { type: "polygon"; shape: PolygonShape }
  | { type: "waypoint"; position: LatLon }
  | { type: "bullseye"; side: Side; position: LatLon }
  | { type: "label"; position: LatLon };

const DRAFT_SOURCE_ID = "draft-shape";

export function ensureDraftLayer(map: maplibregl.Map): void {
  if (map.getSource(DRAFT_SOURCE_ID)) return;
  map.addSource(DRAFT_SOURCE_ID, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  map.addLayer({
    id: "draft-shape-fill",
    type: "fill",
    source: DRAFT_SOURCE_ID,
    filter: ["==", ["geometry-type"], "Polygon"],
    paint: { "fill-color": "#2563eb", "fill-opacity": 0.15 },
  });
  map.addLayer({
    id: "draft-shape-line",
    type: "line",
    source: DRAFT_SOURCE_ID,
    paint: { "line-color": "#2563eb", "line-width": 2, "line-dasharray": [2, 1] },
  });
}

function setDraft(map: maplibregl.Map, geometry: GeoJSON.Geometry | null): void {
  const source = map.getSource(DRAFT_SOURCE_ID) as maplibregl.GeoJSONSource;
  source.setData({
    type: "FeatureCollection",
    features: geometry ? [{ type: "Feature", properties: {}, geometry }] : [],
  });
}

const toLngLat = (p: LatLon): [number, number] => [p.lon, p.lat];
const toLatLon = (l: maplibregl.LngLat): LatLon => ({ lat: l.lat, lon: l.lng });

function bearingDeg(from: LatLon, to: LatLon): number {
  const { x, y } = toLocalMeters(from, to);
  return (((Math.atan2(x, y) * 180) / Math.PI) + 360) % 360;
}

function midpoint(a: LatLon, b: LatLon): LatLon {
  const { x, y } = toLocalMeters(a, b);
  return fromLocalMeters(a, { x: x / 2, y: y / 2 });
}

function tempMarker(map: maplibregl.Map, lngLat: maplibregl.LngLatLike): maplibregl.Marker {
  const el = document.createElement("div");
  el.style.width = "8px";
  el.style.height = "8px";
  el.style.borderRadius = "50%";
  el.style.background = "#2563eb";
  el.style.border = "2px solid #fff";
  return new maplibregl.Marker({ element: el }).setLngLat(lngLat).addTo(map);
}

export interface PlacementHandlers {
  onComplete: (draft: ObjectDraft) => void;
  onCancel: () => void;
}

/**
 * Drives the click-sequence for placing one object on the map, per
 * CreationRequest kind. Returns a cleanup function that cancels the
 * in-progress placement (removes listeners/preview/temp markers) without
 * firing onCancel - call it on unmount/request-change; call the returned
 * teardown implicitly happens inside onComplete/onCancel already.
 */
export function setupPlacement(map: maplibregl.Map, request: CreationRequest, handlers: PlacementHandlers): () => void {
  ensureDraftLayer(map);
  map.getCanvas().style.cursor = "crosshair";

  const markers: maplibregl.Marker[] = [];
  const listeners: Array<() => void> = [];
  let torndown = false;

  function on<E extends maplibregl.MapMouseEvent | maplibregl.MapTouchEvent>(
    type: "click" | "dblclick" | "mousemove" | "contextmenu",
    fn: (e: E) => void,
  ) {
    map.on(type, fn as (e: maplibregl.MapMouseEvent) => void);
    listeners.push(() => map.off(type, fn as (e: maplibregl.MapMouseEvent) => void));
  }

  function teardown() {
    if (torndown) return;
    torndown = true;
    map.getCanvas().style.cursor = "";
    setDraft(map, null);
    for (const marker of markers) marker.remove();
    for (const off of listeners) off();
    window.removeEventListener("keydown", onKeyDown);
  }

  function finish(draft: ObjectDraft) {
    teardown();
    handlers.onComplete(draft);
  }

  function cancel() {
    teardown();
    handlers.onCancel();
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") cancel();
  }
  window.addEventListener("keydown", onKeyDown);

  if (request.kind === "point") {
    on("click", (e: maplibregl.MapMouseEvent) => {
      finish({ type: "point", kind: request.pointKind, position: toLatLon(e.lngLat) });
    });
    return teardown;
  }

  if (request.kind === "waypoint") {
    on("click", (e: maplibregl.MapMouseEvent) => {
      finish({ type: "waypoint", position: toLatLon(e.lngLat) });
    });
    return teardown;
  }

  if (request.kind === "bullseye") {
    on("click", (e: maplibregl.MapMouseEvent) => {
      finish({ type: "bullseye", side: request.side, position: toLatLon(e.lngLat) });
    });
    return teardown;
  }

  if (request.kind === "label") {
    on("click", (e: maplibregl.MapMouseEvent) => {
      finish({ type: "label", position: toLatLon(e.lngLat) });
    });
    return teardown;
  }

  if (request.polygonKind === "freeform") {
    const vertices: LatLon[] = [];
    on("click", (e: maplibregl.MapMouseEvent) => {
      vertices.push(toLatLon(e.lngLat));
      markers.push(tempMarker(map, e.lngLat));
      if (vertices.length >= 2) {
        setDraft(map, { type: "LineString", coordinates: vertices.map(toLngLat) });
      }
    });
    on("dblclick", (e: maplibregl.MapMouseEvent) => {
      e.preventDefault();
      if (vertices.length < 3) return;
      finish({ type: "polygon", shape: { kind: "freeform", vertices } });
    });
    on("contextmenu", (e: maplibregl.MapMouseEvent) => {
      e.preventDefault();
      if (vertices.length < 3) return;
      finish({ type: "polygon", shape: { kind: "freeform", vertices } });
    });
    on("mousemove", (e: maplibregl.MapMouseEvent) => {
      if (vertices.length === 0) return;
      setDraft(map, { type: "LineString", coordinates: [...vertices, toLatLon(e.lngLat)].map(toLngLat) });
    });
    return teardown;
  }

  if (request.polygonKind === "rectangle") {
    let corner1: LatLon | null = null;
    let corner2: LatLon | null = null;

    function rotationFor(mouse: LatLon): number {
      if (!corner1 || !corner2) return 0;
      const center = midpoint(corner1, corner2);
      return bearingDeg(center, mouse) - bearingDeg(center, corner2);
    }

    on("click", (e: maplibregl.MapMouseEvent) => {
      const point = toLatLon(e.lngLat);
      if (!corner1) {
        corner1 = point;
        markers.push(tempMarker(map, e.lngLat));
        return;
      }
      if (!corner2) {
        corner2 = point;
        return;
      }
      finish({ type: "polygon", shape: { kind: "rectangle", corner1, corner2, rotationDeg: rotationFor(point) } });
    });

    on("mousemove", (e: maplibregl.MapMouseEvent) => {
      if (!corner1) return;
      const mouse = toLatLon(e.lngLat);
      const corners = corner2
        ? rectangleCorners(corner1, corner2, rotationFor(mouse))
        : rectangleCorners(corner1, mouse, 0);
      setDraft(map, { type: "Polygon", coordinates: [[...corners, corners[0]].map(toLngLat)] });
    });

    return teardown;
  }

  if (request.polygonKind === "circle") {
    let center: LatLon | null = null;

    on("click", (e: maplibregl.MapMouseEvent) => {
      const point = toLatLon(e.lngLat);
      if (!center) {
        center = point;
        markers.push(tempMarker(map, e.lngLat));
        return;
      }
      finish({ type: "polygon", shape: { kind: "circle", center, radiusM: distanceKm(center, point) * 1000 } });
    });

    on("mousemove", (e: maplibregl.MapMouseEvent) => {
      if (!center) return;
      const radiusM = distanceKm(center, toLatLon(e.lngLat)) * 1000;
      setDraft(map, { type: "Polygon", coordinates: [circlePoints(center, radiusM).map(toLngLat)] });
    });

    return teardown;
  }

  // orbit
  const legLengthNm = request.variant === "aar" ? 10 : 5;
  const defaultCourseDeg = 0;

  on("click", (e: maplibregl.MapMouseEvent) => {
    const center = toLatLon(e.lngLat);
    finish({
      type: "polygon",
      shape: {
        kind: "orbit",
        center,
        hand: request.hand,
        variant: request.variant,
        courseDeg: defaultCourseDeg,
        legLengthNm,
      },
    });
  });

  on("mousemove", (e: maplibregl.MapMouseEvent) => {
    const center = toLatLon(e.lngLat);
    const pts = orbitTrackPoints({ center, hand: request.hand, courseDeg: defaultCourseDeg, legLengthNm });
    setDraft(map, { type: "Polygon", coordinates: [pts.map(toLngLat)] });
  });

  return teardown;
}
