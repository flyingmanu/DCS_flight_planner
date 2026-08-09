import type { LatLon, MapView, MissionObject, PolygonObject, Theater } from "@dcs-flight-planner/core";
import { DEFAULT_POLYGON_COLOR } from "@dcs-flight-planner/core";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { getElevationAt } from "./elevation";
import { addHillshadeLayer, ensureOrbitArrowImage, MeasureControl, ORBIT_ARROW_IMAGE_ID, ReliefControl } from "./mapControls";
import { orbitArrow, polygonRing, translatePolygonShape } from "./objectGeometry";
import { pointMarkerElement } from "./objectIcons";
import { setupPlacement, type CreationRequest, type ObjectDraft } from "./placement";

// Free, no-API-key vector basemap (openfreemap.org) - usable commercially.
// It's a real-world basemap, so it only approximates DCS terrain art; good
// enough to get our bearings until theater-specific map tiles are added.
const BASEMAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

const OBJECTS_POLYGON_SOURCE_ID = "mission-objects-polygons";
const OBJECTS_POLYGON_FILL_ID = "mission-objects-polygons-fill";
const OBJECTS_POLYGON_LINE_ID = "mission-objects-polygons-line";
const OBJECTS_ORBIT_ARROW_SOURCE_ID = "mission-objects-orbit-arrows";
const OBJECTS_ORBIT_ARROW_LAYER_ID = "mission-objects-orbit-arrows-layer";
const OBJECTS_ORBIT_ANCHOR_SOURCE_ID = "mission-objects-orbit-anchors";
const OBJECTS_ORBIT_ANCHOR_LAYER_ID = "mission-objects-orbit-anchors-layer";

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
    .map((rw) => `${rw.id} — ${Math.round(rw.lengthM)} m × ${Math.round(rw.widthM)} m`)
    .join("<br />");

  return `
    <strong>${airbase.name}</strong><br />
    ${CATEGORY_LABEL[airbase.category]}<br />
    ${runways || "Runway unknown"}
  `;
}

export interface HoverInfo {
  lat: number;
  lon: number;
  elevationM: number | null;
}

interface TheaterMapProps {
  theater: Theater;
  objects: MissionObject[];
  creationRequest: CreationRequest | null;
  onDraftComplete: (draft: ObjectDraft) => void;
  onCreationCancel: () => void;
  onSelectObject?: (id: string) => void;
  onMovePoint?: (id: string, position: LatLon) => void;
  onMovePolygon?: (id: string, dLat: number, dLon: number) => void;
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
  { theater, objects, creationRequest, onDraftComplete, onCreationCancel, onSelectObject, onMovePoint, onMovePolygon, onHover },
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
  const onMovePointRef = useRef(onMovePoint);
  onMovePointRef.current = onMovePoint;
  const onMovePolygonRef = useRef(onMovePolygon);
  onMovePolygonRef.current = onMovePolygon;
  const polygonsRef = useRef<PolygonObject[]>([]);

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

    for (const airbase of theater.airbases) {
      const lngLat: [number, number] = [airbase.position.lon, airbase.position.lat];
      bounds.extend(lngLat);

      const popup = new maplibregl.Popup({ offset: 14 }).setHTML(popupHtml(airbase));
      const marker = new maplibregl.Marker({ element: airportMarkerElement(airbase) })
        .setLngLat(lngLat)
        .setPopup(popup)
        .addTo(map);

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
        if (!id || !polygon) return;
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

    if (map.isStyleLoaded()) {
      renderPolygons();
    } else {
      map.once("load", renderPolygons);
    }

    const pointMarkers: maplibregl.Marker[] = [];
    for (const obj of objects) {
      if (obj.type !== "point") continue;
      const element = pointMarkerElement(obj.kind, obj.color);
      const marker = new maplibregl.Marker({ element, draggable: true })
        .setLngLat([obj.position.lon, obj.position.lat])
        .addTo(map);

      let didDrag = false;
      marker.on("dragstart", () => {
        didDrag = true;
      });
      marker.on("dragend", () => {
        const lngLat = marker.getLngLat();
        onMovePointRef.current?.(obj.id, { lat: lngLat.lat, lon: lngLat.lng });
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

    return () => {
      for (const marker of pointMarkers) marker.remove();
    };
  }, [objects]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !creationRequest) return;

    return setupPlacement(map, creationRequest, {
      onComplete: (draft) => onDraftCompleteRef.current(draft),
      onCancel: () => onCreationCancelRef.current(),
    });
  }, [creationRequest]);

  return <div ref={containerRef} data-testid="theater-map" style={{ width: "100%", height: "100%" }} />;
});
