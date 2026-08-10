import type { Bullseye, Flight, LabelObject, LatLon, LineObject, MapView, MissionObject, PolygonObject, Side, Theater } from "@dcs-flight-planner/core";
import {
  bullseyeRingRadiiNm,
  bullseyeSpokeEndpoints,
  circlePoints,
  DEFAULT_BULLSEYE_COLOR,
  DEFAULT_FLIGHT_COLOR,
  DEFAULT_LABEL_BORDER_COLOR,
  DEFAULT_LABEL_COLOR,
  DEFAULT_LABEL_FILL_COLOR,
  DEFAULT_LABEL_FONT_SIZE_PX,
  DEFAULT_LINE_COLOR,
  DEFAULT_POINT_COLOR,
  DEFAULT_POLYGON_COLOR,
  findAircraft,
} from "@dcs-flight-planner/core";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { flightMarkerElement } from "./aircraftIcons";
import { getElevationAt } from "./elevation";
import { addHillshadeLayer, ensureOrbitArrowImage, MeasureControl, ORBIT_ARROW_IMAGE_ID, ReliefControl } from "./mapControls";
import { lineMidpoint, orbitArrow, polygonCentroid, polygonRing, translateLineVertices, translatePolygonShape } from "./objectGeometry";
import { pointMarkerElement } from "./objectIcons";
import { setupPlacement, snapToNearestCandidate, type CreationRequest, type ObjectDraft, type SnapOptions } from "./placement";

// Free, no-API-key vector basemap (openfreemap.org) - usable commercially.
// It's a real-world basemap, so it only approximates DCS terrain art; good
// enough to get our bearings until theater-specific map tiles are added.
const BASEMAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

const OBJECTS_POLYGON_SOURCE_ID = "mission-objects-polygons";
const OBJECTS_POLYGON_FILL_ID = "mission-objects-polygons-fill";
const OBJECTS_POLYGON_LINE_ID = "mission-objects-polygons-line";
const OBJECTS_LINE_SOURCE_ID = "mission-objects-lines";
const OBJECTS_LINE_LAYER_ID = "mission-objects-lines-layer";
const OBJECTS_ORBIT_ARROW_SOURCE_ID = "mission-objects-orbit-arrows";
const OBJECTS_ORBIT_ARROW_LAYER_ID = "mission-objects-orbit-arrows-layer";
const OBJECTS_ORBIT_ANCHOR_SOURCE_ID = "mission-objects-orbit-anchors";
const OBJECTS_ORBIT_ANCHOR_LAYER_ID = "mission-objects-orbit-anchors-layer";
const EDITING_ROUTE_LINE_SOURCE_ID = "editing-route-line";
const EDITING_ROUTE_LINE_LAYER_ID = "editing-route-line-layer";
const BULLSEYE_LINES_SOURCE_ID = "bullseye-lines";
const BULLSEYE_LINES_LAYER_ID = "bullseye-lines-layer";

const CATEGORY_LABEL: Record<Theater["airbases"][number]["category"], string> = {
  airdrome: "Airdrome",
  helipad: "Helipad",
  ship: "Ship",
  unknown: "Unknown",
};

// Sectional-chart-style airport symbol: a circle with a bar for the primary
// runway, rotated to its actual compass heading (SVG's rotate() is clockwise
// for positive angles, same direction as a compass bearing, so the heading
// in degrees can be used directly).
function airportMarkerElement(airbase: Theater["airbases"][number]): HTMLElement {
  const el = document.createElement("div");
  el.style.width = "26px";
  el.style.height = "26px";
  el.style.cursor = "pointer";

  if (airbase.category === "helipad") {
    el.innerHTML = `
      <svg width="26" height="26" viewBox="0 0 26 26">
        <circle cx="13" cy="13" r="10" fill="#fff" stroke="#1d3557" stroke-width="2" />
        <text x="13" y="17.5" text-anchor="middle" font-size="11" font-weight="700" font-family="system-ui, sans-serif" fill="#1d3557">H</text>
      </svg>
    `;
    return el;
  }

  if (airbase.category === "airdrome") {
    const heading = airbase.runways[0] ? airbase.runways[0].designators[0] * 10 : 0;
    el.innerHTML = `
      <svg width="26" height="26" viewBox="0 0 26 26">
        <circle cx="13" cy="13" r="10" fill="#fff" stroke="#1d3557" stroke-width="2" />
        <rect x="11.5" y="6.5" width="3" height="13" rx="1" fill="#1d3557" transform="rotate(${heading} 13 13)" />
      </svg>
    `;
    return el;
  }

  el.innerHTML = `
    <svg width="26" height="26" viewBox="0 0 26 26">
      <circle cx="13" cy="13" r="8" fill="#fff" stroke="#c02020" stroke-width="2" />
    </svg>
  `;
  return el;
}

function popupHtml(airbase: Theater["airbases"][number]): string {
  const runways = airbase.runways
    .map((rw) => `${rw.id} — ${Math.round(rw.lengthM)} m × ${Math.round(rw.widthM)} m — ILS ${rw.ilsFrequencyMhz}`)
    .join("<br />");

  return `
    <strong>${airbase.name}</strong><br />
    ${CATEGORY_LABEL[airbase.category]}<br />
    HF ${airbase.radio.hfMhz} · VHF-L ${airbase.radio.vhfLowMhz} · VHF-H ${airbase.radio.vhfHighMhz} · UHF ${airbase.radio.uhfMhz}<br />
    TACAN ${airbase.tacanChannel}<br />
    ${runways || "Runway unknown"}
  `;
}

// Unfilled circle marking a flight's alternate (diversion) airbase - same
// color as its waypoints, but never connected to the route line: it's a
// fallback destination, not a leg the flight is planned to actually fly.
function alternateAirbaseMarkerElement(color: string): HTMLElement {
  const el = document.createElement("div");
  el.style.width = "20px";
  el.style.height = "20px";
  el.style.borderRadius = "50%";
  el.style.border = `3px solid ${color}`;
  el.style.boxSizing = "border-box";
  el.style.background = "transparent";
  return el;
}

// Small numbered, draggable waypoint marker used while a flight's route is
// being edited (index is 1-based, matching the "WP{n}" labels in the panel).
function waypointMarkerElement(index: number, color: string): HTMLElement {
  const el = document.createElement("div");
  el.style.width = "20px";
  el.style.height = "20px";
  el.style.borderRadius = "50%";
  el.style.background = color;
  el.style.border = "2px solid #fff";
  el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.4)";
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.color = "#fff";
  el.style.fontSize = "10px";
  el.style.fontWeight = "700";
  el.style.fontFamily = "system-ui, sans-serif";
  el.style.cursor = "grab";
  el.textContent = String(index);
  return el;
}

function bullseyeMarkerElement(bullseye: Bullseye): HTMLElement {
  const color = bullseye.color ?? DEFAULT_BULLSEYE_COLOR[bullseye.side];
  const wrap = document.createElement("div");
  wrap.style.display = "flex";
  wrap.style.flexDirection = "column";
  wrap.style.alignItems = "center";
  wrap.style.cursor = "grab";
  wrap.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 22 22">
      <circle cx="11" cy="11" r="8" fill="none" stroke="${color}" stroke-width="2" />
      <line x1="11" y1="0" x2="11" y2="22" stroke="${color}" stroke-width="2" />
      <line x1="0" y1="11" x2="22" y2="11" stroke="${color}" stroke-width="2" />
    </svg>`;
  if (bullseye.showName ?? true) {
    const label = document.createElement("div");
    label.textContent = "BULLSEYE";
    label.style.fontSize = "9px";
    label.style.fontWeight = "700";
    label.style.color = color;
    label.style.background = "rgba(255,255,255,0.85)";
    label.style.padding = "0 3px";
    label.style.borderRadius = "2px";
    label.style.whiteSpace = "nowrap";
    wrap.appendChild(label);
  }
  return wrap;
}

function bullseyeLinesFeatureCollection(list: Bullseye[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: list.flatMap((b) => {
      const color = b.color ?? DEFAULT_BULLSEYE_COLOR[b.side];
      const rings = bullseyeRingRadiiNm(b.outerRingNm, b.rings).map((radiusNm) => ({
        type: "Feature" as const,
        properties: { color },
        geometry: { type: "LineString" as const, coordinates: circlePoints(b.position, radiusNm * 1852).map((p): [number, number] => [p.lon, p.lat]) },
      }));
      const spokes = bullseyeSpokeEndpoints(b.position, b.outerRingNm, b.spokes).map((end) => ({
        type: "Feature" as const,
        properties: { color },
        geometry: {
          type: "LineString" as const,
          coordinates: [
            [b.position.lon, b.position.lat],
            [end.lon, end.lat],
          ] as [number, number][],
        },
      }));
      return [...rings, ...spokes];
    }),
  };
}

function labelMarkerElement(label: LabelObject): HTMLElement {
  const el = document.createElement("div");
  el.textContent = label.name;
  el.style.color = label.color ?? DEFAULT_LABEL_COLOR;
  el.style.background = label.fillColor ?? DEFAULT_LABEL_FILL_COLOR;
  el.style.border = `1.5px solid ${label.borderColor ?? DEFAULT_LABEL_BORDER_COLOR}`;
  el.style.fontSize = `${label.fontSizePx ?? DEFAULT_LABEL_FONT_SIZE_PX}px`;
  el.style.fontWeight = label.bold ? "700" : "400";
  el.style.fontFamily = "system-ui, sans-serif";
  el.style.padding = "2px 6px";
  el.style.borderRadius = "3px";
  el.style.whiteSpace = "nowrap";
  el.style.cursor = "grab";
  el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.25)";
  return el;
}

// A zone/orbit's name, shown at its centroid. Plain text (no background chip,
// unlike point/flight labels) since it sits inside the zone's own fill/border
// rather than next to a small icon; pointer-events are disabled so a click
// still reaches the polygon fill layer underneath for selection.
function zoneLabelMarkerElement(name: string, color: string): HTMLElement {
  const el = document.createElement("div");
  el.textContent = name;
  el.style.fontSize = "11px";
  el.style.fontWeight = "600";
  el.style.color = color;
  el.style.textShadow = "0 0 3px #ffffff, 0 0 3px #ffffff, 0 0 3px #ffffff";
  el.style.whiteSpace = "nowrap";
  el.style.pointerEvents = "none";
  return el;
}

// Wraps a marker icon with its object's name shown alongside it, without
// changing the icon's own footprint - the label is absolutely positioned
// (out of flow) so the wrapper's size still matches the icon's, keeping the
// marker's map anchor exactly on the icon rather than drifting toward the label.
function withNameLabel(icon: HTMLElement, name: string, color: string): HTMLElement {
  if (!name.trim()) return icon;
  const wrap = document.createElement("div");
  wrap.style.position = "relative";
  wrap.style.width = icon.style.width || `${icon.offsetWidth}px`;
  wrap.style.height = icon.style.height || `${icon.offsetHeight}px`;
  wrap.appendChild(icon);

  const label = document.createElement("span");
  label.textContent = name;
  label.style.position = "absolute";
  label.style.left = "100%";
  label.style.top = "50%";
  label.style.transform = "translateY(-50%)";
  label.style.marginLeft = "4px";
  label.style.fontSize = "11px";
  label.style.fontWeight = "600";
  label.style.color = color;
  label.style.background = "rgba(255,255,255,0.85)";
  label.style.padding = "0 4px";
  label.style.borderRadius = "2px";
  label.style.whiteSpace = "nowrap";
  label.style.pointerEvents = "none";
  wrap.appendChild(label);
  return wrap;
}

// Dragging an object that's itself already a snap candidate must not snap
// back onto its own pre-drag position; approximate "is this candidate the
// object being dragged" by exact coordinate match rather than plumbing ids
// through every candidate source.
function samePosition(a: LatLon, b: LatLon): boolean {
  return a.lat === b.lat && a.lon === b.lon;
}

/** Applies "glue" snapping to a marker's post-drag position, if enabled. */
function snapDragPosition(
  map: maplibregl.Map,
  snapEnabled: boolean,
  lngLat: maplibregl.LngLat,
  candidates: LatLon[],
  excludePosition: LatLon,
): LatLon {
  const raw: LatLon = { lat: lngLat.lat, lon: lngLat.lng };
  if (!snapEnabled) return raw;
  const filtered = candidates.filter((c) => !samePosition(c, excludePosition));
  return snapToNearestCandidate(map, map.project(lngLat), raw, filtered);
}

// "Glue" snap targets: every existing point-like position a new placement
// click can lock onto (airbases, point/label objects and their DMPIs, flight
// waypoints and their DMPIs, bullseyes). Zone vertices are intentionally
// excluded to keep this a simple, predictable set.
function collectSnapCandidates(theater: Theater, objects: MissionObject[], flights: Flight[], bullseyes: Bullseye[]): LatLon[] {
  const candidates: LatLon[] = [];
  for (const airbase of theater.airbases) candidates.push({ lat: airbase.position.lat, lon: airbase.position.lon });
  for (const obj of objects) {
    if (obj.type === "point") {
      candidates.push(obj.position);
      for (const dmpi of obj.dmpis ?? []) candidates.push(dmpi.position);
    } else if (obj.type === "label") {
      candidates.push(obj.position);
    }
  }
  for (const flight of flights) {
    for (const wp of flight.route ?? []) {
      candidates.push(wp.position);
      for (const dmpi of wp.dmpis ?? []) candidates.push(dmpi.position);
    }
  }
  for (const bullseye of bullseyes) candidates.push(bullseye.position);
  return candidates;
}

export interface HoverInfo {
  lat: number;
  lon: number;
  elevationM: number | null;
}

interface TheaterMapProps {
  theater: Theater;
  objects: MissionObject[];
  flights: Flight[];
  bullseyes?: Bullseye[];
  /** The flight currently open in the editor, if any - its route is drawn live on the map. */
  editingFlight?: Flight | null;
  creationRequest: CreationRequest | null;
  /** "Glue": when true, a placement click near an existing point snaps to its exact coordinates. */
  snapEnabled?: boolean;
  onDraftComplete: (draft: ObjectDraft) => void;
  onCreationCancel: () => void;
  onSelectObject?: (id: string) => void;
  onSelectFlight?: (id: string) => void;
  onSelectBullseye?: (side: Side) => void;
  onMovePoint?: (id: string, position: LatLon) => void;
  onMovePolygon?: (id: string, dLat: number, dLon: number) => void;
  onMoveLine?: (id: string, dLat: number, dLon: number) => void;
  onMoveWaypoint?: (waypointId: string, position: LatLon) => void;
  onMoveBullseye?: (side: Side, position: LatLon) => void;
  onMoveLabel?: (id: string, position: LatLon) => void;
  onHover?: (info: HoverInfo | null) => void;
}

export interface TheaterMapHandle {
  getView: () => MapView;
  setView: (view: MapView) => void;
}

function polygonsToFeatureCollection(list: PolygonObject[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: list.map((p) => ({
      type: "Feature",
      properties: { id: p.id, name: p.name, color: p.color ?? DEFAULT_POLYGON_COLOR, isOrbit: p.shape.kind === "orbit" },
      geometry: { type: "Polygon", coordinates: [polygonRing(p)] },
    })),
  };
}

function linesToFeatureCollection(list: LineObject[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: list.map((l) => ({
      type: "Feature",
      properties: { id: l.id, name: l.name, color: l.color ?? DEFAULT_LINE_COLOR },
      geometry: { type: "LineString", coordinates: l.vertices.map((v) => [v.lon, v.lat]) },
    })),
  };
}

function orbitArrowFeatureCollection(list: PolygonObject[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: list.flatMap((p) => {
      const arrow = orbitArrow(p.shape);
      if (!arrow) return [];
      return [
        {
          type: "Feature" as const,
          properties: { bearing: arrow.bearingDeg },
          geometry: { type: "Point" as const, coordinates: [arrow.position.lon, arrow.position.lat] },
        },
      ];
    }),
  };
}

function orbitAnchorFeatureCollection(list: PolygonObject[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: list.flatMap((p) => {
      if (p.shape.kind !== "orbit") return [];
      const { center } = p.shape;
      return [
        {
          type: "Feature" as const,
          properties: {},
          geometry: { type: "Point" as const, coordinates: [center.lon, center.lat] },
        },
      ];
    }),
  };
}

export const TheaterMap = forwardRef<TheaterMapHandle, TheaterMapProps>(function TheaterMap(
  {
    theater,
    objects,
    flights,
    bullseyes = [],
    editingFlight,
    creationRequest,
    snapEnabled = false,
    onDraftComplete,
    onCreationCancel,
    onSelectObject,
    onSelectFlight,
    onSelectBullseye,
    onMovePoint,
    onMovePolygon,
    onMoveLine,
    onMoveWaypoint,
    onMoveBullseye,
    onMoveLabel,
    onHover,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onHoverRef = useRef(onHover);
  onHoverRef.current = onHover;
  const onDraftCompleteRef = useRef(onDraftComplete);
  onDraftCompleteRef.current = onDraftComplete;
  const onCreationCancelRef = useRef(onCreationCancel);
  onCreationCancelRef.current = onCreationCancel;
  const onSelectObjectRef = useRef(onSelectObject);
  onSelectObjectRef.current = onSelectObject;
  const onSelectFlightRef = useRef(onSelectFlight);
  onSelectFlightRef.current = onSelectFlight;
  const onSelectBullseyeRef = useRef(onSelectBullseye);
  onSelectBullseyeRef.current = onSelectBullseye;
  const onMovePointRef = useRef(onMovePoint);
  onMovePointRef.current = onMovePoint;
  const onMovePolygonRef = useRef(onMovePolygon);
  onMovePolygonRef.current = onMovePolygon;
  const onMoveLineRef = useRef(onMoveLine);
  onMoveLineRef.current = onMoveLine;
  const onMoveWaypointRef = useRef(onMoveWaypoint);
  onMoveWaypointRef.current = onMoveWaypoint;
  const onMoveBullseyeRef = useRef(onMoveBullseye);
  onMoveBullseyeRef.current = onMoveBullseye;
  const onMoveLabelRef = useRef(onMoveLabel);
  onMoveLabelRef.current = onMoveLabel;
  const polygonsRef = useRef<PolygonObject[]>([]);
  const linesRef = useRef<LineObject[]>([]);
  const airbaseMarkerElementsRef = useRef<HTMLElement[]>([]);
  const snapEnabledRef = useRef(snapEnabled);
  snapEnabledRef.current = snapEnabled;

  useImperativeHandle(ref, () => ({
    getView: () => {
      const map = mapRef.current;
      if (!map) return { center: [42, 43], zoom: 6 };
      const center = map.getCenter();
      return { center: [center.lng, center.lat], zoom: map.getZoom() };
    },
    setView: (view) => {
      mapRef.current?.jumpTo({ center: view.center, zoom: view.zoom });
    },
  }));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = new maplibregl.Map({
      container,
      style: BASEMAP_STYLE_URL,
      center: [42, 43],
      zoom: 6,
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.on("load", () => {
      addHillshadeLayer(map);
      ensureOrbitArrowImage(map);
      map.addControl(new ReliefControl(), "top-left");
      map.addControl(new MeasureControl(), "top-left");

      map.addSource(EDITING_ROUTE_LINE_SOURCE_ID, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: EDITING_ROUTE_LINE_LAYER_ID,
        type: "line",
        source: EDITING_ROUTE_LINE_SOURCE_ID,
        paint: { "line-color": ["get", "color"], "line-width": 2, "line-dasharray": [3, 2] },
      });
    });

    // Monotonically increasing id so a slow elevation lookup for a
    // now-stale cursor position can't overwrite a newer one.
    let hoverRequestId = 0;
    map.on("mousemove", (e) => {
      const requestId = ++hoverRequestId;
      const lat = e.lngLat.lat;
      const lon = e.lngLat.lng;
      onHoverRef.current?.({ lat, lon, elevationM: null });
      getElevationAt(lon, lat).then((elevationM) => {
        if (requestId !== hoverRequestId) return;
        onHoverRef.current?.({ lat, lon, elevationM });
      });
    });
    map.on("mouseout", () => onHoverRef.current?.(null));

    const bounds = new maplibregl.LngLatBounds();
    const markers: maplibregl.Marker[] = [];
    airbaseMarkerElementsRef.current = [];

    for (const airbase of theater.airbases) {
      const lngLat: [number, number] = [airbase.position.lon, airbase.position.lat];
      bounds.extend(lngLat);

      const element = airportMarkerElement(airbase);
      const popup = new maplibregl.Popup({ offset: 14 }).setHTML(popupHtml(airbase));
      const marker = new maplibregl.Marker({ element }).setLngLat(lngLat).setPopup(popup).addTo(map);

      airbaseMarkerElementsRef.current.push(element);
      markers.push(marker);
    }

    if (theater.airbases.length > 0) {
      map.fitBounds(bounds, { padding: 48, duration: 0 });
    }

    return () => {
      for (const marker of markers) marker.remove();
      map.remove();
      mapRef.current = null;
      onHoverRef.current?.(null);
    };
  }, [theater]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const polygons = objects.filter((o): o is PolygonObject => o.type === "polygon");
    polygonsRef.current = polygons;
    const lines = objects.filter((o): o is LineObject => o.type === "line");
    linesRef.current = lines;

    function renderPolygons() {
      if (!map) return;
      const data = polygonsToFeatureCollection(polygonsRef.current);
      const arrowData = orbitArrowFeatureCollection(polygonsRef.current);
      const anchorData = orbitAnchorFeatureCollection(polygonsRef.current);
      const source = map.getSource(OBJECTS_POLYGON_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;

      if (source) {
        source.setData(data);
        (map.getSource(OBJECTS_ORBIT_ARROW_SOURCE_ID) as maplibregl.GeoJSONSource | undefined)?.setData(arrowData);
        (map.getSource(OBJECTS_ORBIT_ANCHOR_SOURCE_ID) as maplibregl.GeoJSONSource | undefined)?.setData(anchorData);
        return;
      }

      map.addSource(OBJECTS_POLYGON_SOURCE_ID, { type: "geojson", data });
      map.addLayer({
        id: OBJECTS_POLYGON_FILL_ID,
        type: "fill",
        source: OBJECTS_POLYGON_SOURCE_ID,
        // Orbit tracks are shown as an outline only, never filled.
        paint: { "fill-color": ["get", "color"], "fill-opacity": ["case", ["get", "isOrbit"], 0, 0.15] },
      });
      map.addLayer({
        id: OBJECTS_POLYGON_LINE_ID,
        type: "line",
        source: OBJECTS_POLYGON_SOURCE_ID,
        paint: { "line-color": ["case", ["get", "isOrbit"], "#000000", ["get", "color"]], "line-width": 2 },
      });
      ensureOrbitArrowImage(map);
      map.addSource(OBJECTS_ORBIT_ARROW_SOURCE_ID, { type: "geojson", data: arrowData });
      map.addLayer({
        id: OBJECTS_ORBIT_ARROW_LAYER_ID,
        type: "symbol",
        source: OBJECTS_ORBIT_ARROW_SOURCE_ID,
        layout: {
          "icon-image": ORBIT_ARROW_IMAGE_ID,
          "icon-rotate": ["get", "bearing"],
          "icon-rotation-alignment": "map",
          "icon-allow-overlap": true,
          "icon-size": 0.9,
        },
      });

      // The orbit's anchor/fix point, shown as a small waypoint dot.
      map.addSource(OBJECTS_ORBIT_ANCHOR_SOURCE_ID, { type: "geojson", data: anchorData });
      map.addLayer({
        id: OBJECTS_ORBIT_ANCHOR_LAYER_ID,
        type: "circle",
        source: OBJECTS_ORBIT_ANCHOR_SOURCE_ID,
        paint: {
          "circle-radius": 4,
          "circle-color": "#000000",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      let dragging: { id: string; startLng: number; startLat: number; shape: PolygonObject["shape"] } | null = null;
      let dragMoved = false;

      map.on("click", OBJECTS_POLYGON_FILL_ID, (e) => {
        if (dragMoved) {
          dragMoved = false;
          return;
        }
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (id) onSelectObjectRef.current?.(id);
      });
      map.on("mouseenter", OBJECTS_POLYGON_FILL_ID, () => {
        if (!dragging) map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", OBJECTS_POLYGON_FILL_ID, () => {
        if (!dragging) map.getCanvas().style.cursor = "";
      });

      map.on("mousedown", OBJECTS_POLYGON_FILL_ID, (e) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        const polygon = polygonsRef.current.find((p) => p.id === id);
        if (!id || !polygon || polygon.locked) return;
        e.preventDefault();
        dragging = { id, startLng: e.lngLat.lng, startLat: e.lngLat.lat, shape: polygon.shape };
        dragMoved = false;
        map.getCanvas().style.cursor = "grabbing";
        map.dragPan.disable();
      });

      map.on("mousemove", (e) => {
        if (!dragging) return;
        dragMoved = true;
        const dLat = e.lngLat.lat - dragging.startLat;
        const dLon = e.lngLat.lng - dragging.startLng;
        const preview = polygonsRef.current.map((p) =>
          p.id === dragging!.id ? { ...p, shape: translatePolygonShape(dragging!.shape, dLat, dLon) } : p,
        );
        (map.getSource(OBJECTS_POLYGON_SOURCE_ID) as maplibregl.GeoJSONSource | undefined)?.setData(polygonsToFeatureCollection(preview));
        (map.getSource(OBJECTS_ORBIT_ARROW_SOURCE_ID) as maplibregl.GeoJSONSource | undefined)?.setData(orbitArrowFeatureCollection(preview));
        (map.getSource(OBJECTS_ORBIT_ANCHOR_SOURCE_ID) as maplibregl.GeoJSONSource | undefined)?.setData(orbitAnchorFeatureCollection(preview));
      });

      map.on("mouseup", (e) => {
        if (!dragging) return;
        const dLat = e.lngLat.lat - dragging.startLat;
        const dLon = e.lngLat.lng - dragging.startLng;
        const id = dragging.id;
        dragging = null;
        map.getCanvas().style.cursor = "";
        map.dragPan.enable();
        if (dragMoved) onMovePolygonRef.current?.(id, dLat, dLon);
      });
    }

    // Once the polygon source exists, updating it via setData() is always
    // safe regardless of isStyleLoaded() - which can transiently report
    // false long after the map's one-time "load" event already fired (e.g.
    // while any other source is mid-update), so relying on it here for
    // anything but the very first, source-creating call would silently
    // drop later updates: "load" never fires again, so a once("load", ...)
    // registered after that point would never run.
    if (map.getSource(OBJECTS_POLYGON_SOURCE_ID) || map.isStyleLoaded()) {
      renderPolygons();
    } else {
      map.once("load", renderPolygons);
    }

    function renderObjectLines() {
      if (!map) return;
      const data = linesToFeatureCollection(linesRef.current);
      const source = map.getSource(OBJECTS_LINE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;

      if (source) {
        source.setData(data);
        return;
      }

      map.addSource(OBJECTS_LINE_SOURCE_ID, { type: "geojson", data });
      map.addLayer({
        id: OBJECTS_LINE_LAYER_ID,
        type: "line",
        source: OBJECTS_LINE_SOURCE_ID,
        paint: { "line-color": ["get", "color"], "line-width": 3 },
      });

      let dragging: { id: string; startLng: number; startLat: number; vertices: LatLon[] } | null = null;
      let dragMoved = false;

      map.on("click", OBJECTS_LINE_LAYER_ID, (e) => {
        if (dragMoved) {
          dragMoved = false;
          return;
        }
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (id) onSelectObjectRef.current?.(id);
      });
      map.on("mouseenter", OBJECTS_LINE_LAYER_ID, () => {
        if (!dragging) map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", OBJECTS_LINE_LAYER_ID, () => {
        if (!dragging) map.getCanvas().style.cursor = "";
      });

      map.on("mousedown", OBJECTS_LINE_LAYER_ID, (e) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        const line = linesRef.current.find((l) => l.id === id);
        if (!id || !line || line.locked) return;
        e.preventDefault();
        dragging = { id, startLng: e.lngLat.lng, startLat: e.lngLat.lat, vertices: line.vertices };
        dragMoved = false;
        map.getCanvas().style.cursor = "grabbing";
        map.dragPan.disable();
      });

      map.on("mousemove", (e) => {
        if (!dragging) return;
        dragMoved = true;
        const dLat = e.lngLat.lat - dragging.startLat;
        const dLon = e.lngLat.lng - dragging.startLng;
        const preview = linesRef.current.map((l) =>
          l.id === dragging!.id ? { ...l, vertices: translateLineVertices(dragging!.vertices, dLat, dLon) } : l,
        );
        (map.getSource(OBJECTS_LINE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined)?.setData(linesToFeatureCollection(preview));
      });

      map.on("mouseup", (e) => {
        if (!dragging) return;
        const dLat = e.lngLat.lat - dragging.startLat;
        const dLon = e.lngLat.lng - dragging.startLng;
        const id = dragging.id;
        dragging = null;
        map.getCanvas().style.cursor = "";
        map.dragPan.enable();
        if (dragMoved) onMoveLineRef.current?.(id, dLat, dLon);
      });
    }

    if (map.getSource(OBJECTS_LINE_SOURCE_ID) || map.isStyleLoaded()) {
      renderObjectLines();
    } else {
      map.once("load", renderObjectLines);
    }

    const pointMarkers: maplibregl.Marker[] = [];
    for (const obj of objects) {
      if (obj.type !== "point") continue;
      const color = obj.color ?? DEFAULT_POINT_COLOR[obj.kind];
      const element = withNameLabel(pointMarkerElement(obj.kind, obj.color), obj.name, color);
      const marker = new maplibregl.Marker({ element, draggable: !obj.locked })
        .setLngLat([obj.position.lon, obj.position.lat])
        .addTo(map);

      let didDrag = false;
      marker.on("dragstart", () => {
        didDrag = true;
      });
      marker.on("dragend", () => {
        const candidates = collectSnapCandidates(theater, objects, flights, bullseyes);
        const position = snapDragPosition(map, snapEnabledRef.current, marker.getLngLat(), candidates, obj.position);
        onMovePointRef.current?.(obj.id, position);
      });
      element.addEventListener("click", (e) => {
        e.stopPropagation();
        if (didDrag) {
          didDrag = false;
          return;
        }
        onSelectObjectRef.current?.(obj.id);
      });

      pointMarkers.push(marker);
    }

    const labelMarkers: maplibregl.Marker[] = [];
    for (const obj of objects) {
      if (obj.type !== "label") continue;
      const element = labelMarkerElement(obj);
      const marker = new maplibregl.Marker({ element, draggable: !obj.locked, anchor: "left" })
        .setLngLat([obj.position.lon, obj.position.lat])
        .addTo(map);

      let didDrag = false;
      marker.on("dragstart", () => {
        didDrag = true;
      });
      marker.on("dragend", () => {
        const candidates = collectSnapCandidates(theater, objects, flights, bullseyes);
        const position = snapDragPosition(map, snapEnabledRef.current, marker.getLngLat(), candidates, obj.position);
        onMoveLabelRef.current?.(obj.id, position);
      });
      element.addEventListener("click", (e) => {
        e.stopPropagation();
        if (didDrag) {
          didDrag = false;
          return;
        }
        onSelectObjectRef.current?.(obj.id);
      });

      labelMarkers.push(marker);
    }

    const zoneLabelMarkers: maplibregl.Marker[] = [];
    for (const polygon of polygons) {
      if (!polygon.name.trim()) continue;
      const color = polygon.color ?? DEFAULT_POLYGON_COLOR;
      const center = polygonCentroid(polygon.shape);
      const marker = new maplibregl.Marker({ element: zoneLabelMarkerElement(polygon.name, color), anchor: "center" })
        .setLngLat([center.lon, center.lat])
        .addTo(map);
      zoneLabelMarkers.push(marker);
    }

    for (const line of lines) {
      if (!line.name.trim()) continue;
      const color = line.color ?? DEFAULT_LINE_COLOR;
      const anchor = lineMidpoint(line.vertices);
      const marker = new maplibregl.Marker({ element: zoneLabelMarkerElement(line.name, color), anchor: "center" })
        .setLngLat([anchor.lon, anchor.lat])
        .addTo(map);
      zoneLabelMarkers.push(marker);
    }

    return () => {
      for (const marker of pointMarkers) marker.remove();
      for (const marker of labelMarkers) marker.remove();
      for (const marker of zoneLabelMarkers) marker.remove();
    };
    // theater/flights/bullseyes are only read inside dragend handlers (for
    // glue snap candidates), fresh at drag time via closure; re-running this
    // whole effect - and recreating every point/label marker - whenever a
    // flight or bullseye changes elsewhere would be wasteful and unrelated
    // to what this effect actually renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objects]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const airbaseById = new Map(theater.airbases.map((ab) => [ab.id, ab]));
    // Stack multiple flights departing from the same airbase in a small vertical fan.
    const countByAirbase = new Map<string, number>();
    const flightMarkers: maplibregl.Marker[] = [];

    // Show the flight currently open in the editor too - as soon as it has a
    // departure airbase, even before it's saved - using its live (unsaved)
    // draft in place of the stale saved version if it's an existing flight.
    const displayFlights = editingFlight ? [...flights.filter((f) => f.id !== editingFlight.id), editingFlight] : flights;

    for (const flight of displayFlights) {
      const airbase = flight.departureAirbaseId ? airbaseById.get(flight.departureAirbaseId) : undefined;
      if (!airbase) continue;

      const index = countByAirbase.get(airbase.id) ?? 0;
      countByAirbase.set(airbase.id, index + 1);

      const category = findAircraft(flight.aircraftId)?.category ?? "fixed-wing";
      const flightColor = flight.color ?? DEFAULT_FLIGHT_COLOR;
      const element = withNameLabel(flightMarkerElement(category, flightColor), flight.name, flightColor);
      const marker = new maplibregl.Marker({ element, offset: [22, -14 - index * 22] })
        .setLngLat([airbase.position.lon, airbase.position.lat])
        .addTo(map);

      element.title = flight.name;
      element.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectFlightRef.current?.(flight.id);
      });

      flightMarkers.push(marker);
    }

    return () => {
      for (const marker of flightMarkers) marker.remove();
    };
  }, [flights, theater, editingFlight]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    function renderLines() {
      if (!map) return;
      const data = bullseyeLinesFeatureCollection(bullseyes);
      const source = map.getSource(BULLSEYE_LINES_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      if (source) {
        source.setData(data);
        return;
      }
      map.addSource(BULLSEYE_LINES_SOURCE_ID, { type: "geojson", data });
      map.addLayer({
        id: BULLSEYE_LINES_LAYER_ID,
        type: "line",
        source: BULLSEYE_LINES_SOURCE_ID,
        paint: { "line-color": ["get", "color"], "line-width": 1.5, "line-opacity": 0.85 },
      });
    }

    if (map.getSource(BULLSEYE_LINES_SOURCE_ID)) {
      renderLines();
    } else {
      map.once("load", renderLines);
    }

    const bullseyeMarkers: maplibregl.Marker[] = [];
    for (const bullseye of bullseyes) {
      const element = bullseyeMarkerElement(bullseye);
      const marker = new maplibregl.Marker({ element, draggable: true, anchor: "center" })
        .setLngLat([bullseye.position.lon, bullseye.position.lat])
        .addTo(map);

      let didDrag = false;
      marker.on("dragstart", () => {
        didDrag = true;
      });
      marker.on("dragend", () => {
        const candidates = collectSnapCandidates(theater, objects, flights, bullseyes);
        const position = snapDragPosition(map, snapEnabledRef.current, marker.getLngLat(), candidates, bullseye.position);
        onMoveBullseyeRef.current?.(bullseye.side, position);
      });
      element.addEventListener("click", (e) => {
        e.stopPropagation();
        if (didDrag) {
          didDrag = false;
          return;
        }
        onSelectBullseyeRef.current?.(bullseye.side);
      });

      bullseyeMarkers.push(marker);
    }

    return () => {
      for (const marker of bullseyeMarkers) marker.remove();
    };
    // theater/objects/flights are only read inside dragend (glue snap
    // candidates); see the point/label marker effect above for why this
    // effect intentionally doesn't re-run for those.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bullseyes]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const route = editingFlight?.route ?? [];
    const color = editingFlight?.color ?? DEFAULT_FLIGHT_COLOR;

    const airbaseById = new Map(theater.airbases.map((ab) => [ab.id, ab]));
    const departureAirbase = editingFlight?.departureAirbaseId ? airbaseById.get(editingFlight.departureAirbaseId) : undefined;
    const arrivalAirbase = editingFlight?.arrivalAirbaseId ? airbaseById.get(editingFlight.arrivalAirbaseId) : undefined;
    const alternateAirbase = editingFlight?.alternateAirbaseId ? airbaseById.get(editingFlight.alternateAirbaseId) : undefined;

    function withAirbaseEndpoints(positions: LatLon[]): LatLon[] {
      return [
        ...(departureAirbase ? [{ lat: departureAirbase.position.lat, lon: departureAirbase.position.lon }] : []),
        ...positions,
        ...(arrivalAirbase ? [{ lat: arrivalAirbase.position.lat, lon: arrivalAirbase.position.lon }] : []),
      ];
    }

    function lineFeatureCollection(positions: LatLon[]): GeoJSON.FeatureCollection {
      return {
        type: "FeatureCollection",
        features:
          positions.length >= 2
            ? [
                {
                  type: "Feature",
                  properties: { color },
                  geometry: { type: "LineString", coordinates: positions.map((p) => [p.lon, p.lat]) },
                },
              ]
            : [],
      };
    }

    function renderLine(positions: LatLon[]) {
      (map?.getSource(EDITING_ROUTE_LINE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined)?.setData(lineFeatureCollection(positions));
    }

    if (map.getSource(EDITING_ROUTE_LINE_SOURCE_ID)) {
      renderLine(withAirbaseEndpoints(route.map((wp) => wp.position)));
    } else {
      // The source is only created once, inside the map's initial "load" handler; if this
      // effect runs before that fires (e.g. a flight is already open on mount), wait for it.
      map.once("load", () => renderLine(withAirbaseEndpoints(route.map((wp) => wp.position))));
    }

    const waypointMarkers: maplibregl.Marker[] = [];
    route.forEach((wp, index) => {
      const element = waypointMarkerElement(index + 1, color);
      const marker = new maplibregl.Marker({ element, draggable: true })
        .setLngLat([wp.position.lon, wp.position.lat])
        .addTo(map);

      marker.on("drag", () => {
        const lngLat = marker.getLngLat();
        const positions = route.map((w, i) => (i === index ? { lat: lngLat.lat, lon: lngLat.lng } : w.position));
        renderLine(withAirbaseEndpoints(positions));
      });
      marker.on("dragend", () => {
        const candidates = collectSnapCandidates(theater, objects, flights, bullseyes);
        const position = snapDragPosition(map, snapEnabledRef.current, marker.getLngLat(), candidates, wp.position);
        onMoveWaypointRef.current?.(wp.id, position);
      });

      waypointMarkers.push(marker);
    });

    const alternateMarkers: maplibregl.Marker[] = [];
    if (alternateAirbase) {
      const marker = new maplibregl.Marker({ element: alternateAirbaseMarkerElement(color) })
        .setLngLat([alternateAirbase.position.lon, alternateAirbase.position.lat])
        .addTo(map);
      alternateMarkers.push(marker);
    }

    return () => {
      for (const marker of waypointMarkers) marker.remove();
      for (const marker of alternateMarkers) marker.remove();
    };
    // objects/flights/bullseyes are only read inside dragend (glue snap
    // candidates); see the point/label marker effect above for why this
    // effect intentionally doesn't re-run for those.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingFlight, theater]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !creationRequest) return;

    const snap: SnapOptions = { enabled: snapEnabled, candidates: collectSnapCandidates(theater, objects, flights, bullseyes) };
    return setupPlacement(
      map,
      creationRequest,
      {
        onComplete: (draft) => onDraftCompleteRef.current(draft),
        onCancel: () => onCreationCancelRef.current(),
      },
      snap,
    );
    // Candidates are gathered fresh from theater/objects/flights/bullseyes at the
    // moment placement starts (creationRequest becomes non-null); intentionally
    // not re-collected mid-placement if those change while a placement is in progress.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creationRequest, snapEnabled]);

  // Airbase icons otherwise physically intercept clicks that land on them
  // (they sit above the map canvas), so a "glued" placement click aimed at
  // an airbase would never reach the map's own click handler to be
  // snapped. Only suspended while glue is on, so a plain (non-glue)
  // placement click still opens the airbase's popup as before, matching
  // how every other marker keeps intercepting clicks it sits on.
  useEffect(() => {
    const active = creationRequest != null && snapEnabled;
    for (const element of airbaseMarkerElementsRef.current) {
      element.style.pointerEvents = active ? "none" : "";
    }
  }, [creationRequest, snapEnabled]);

  return <div ref={containerRef} data-testid="theater-map" style={{ width: "100%", height: "100%" }} />;
});
