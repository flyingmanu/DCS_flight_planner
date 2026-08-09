import type { MapView, MissionObject, PolygonObject, Theater } from "@dcs-flight-planner/core";
import { POINT_KIND_LABEL } from "@dcs-flight-planner/core";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { getElevationAt } from "./elevation";
import { addHillshadeLayer, MeasureControl, ReliefControl } from "./mapControls";
import { polygonRing } from "./objectGeometry";
import { pointMarkerElement } from "./objectIcons";
import { setupPlacement, type CreationRequest, type ObjectDraft } from "./placement";

// Free, no-API-key vector basemap (openfreemap.org) - usable commercially.
// It's a real-world basemap, so it only approximates DCS terrain art; good
// enough to get our bearings until theater-specific map tiles are added.
const BASEMAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

const OBJECTS_POLYGON_SOURCE_ID = "mission-objects-polygons";
const OBJECTS_POLYGON_FILL_ID = "mission-objects-polygons-fill";
const OBJECTS_POLYGON_LINE_ID = "mission-objects-polygons-line";

const CATEGORY_LABEL: Record<Theater["airbases"][number]["category"], string> = {
  airdrome: "Aérodrome",
  helipad: "Hélipad",
  ship: "Navire",
  unknown: "Inconnu",
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
    ${runways || "Piste inconnue"}
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
  onHover?: (info: HoverInfo | null) => void;
}

export interface TheaterMapHandle {
  getView: () => MapView;
  setView: (view: MapView) => void;
}

export const TheaterMap = forwardRef<TheaterMapHandle, TheaterMapProps>(function TheaterMap(
  { theater, objects, creationRequest, onDraftComplete, onCreationCancel, onHover },
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

    function renderPolygons() {
      if (!map) return;
      const data: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: polygons.map((p) => ({
          type: "Feature",
          properties: { name: p.name },
          geometry: { type: "Polygon", coordinates: [polygonRing(p)] },
        })),
      };
      const source = map.getSource(OBJECTS_POLYGON_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      if (source) {
        source.setData(data);
      } else {
        map.addSource(OBJECTS_POLYGON_SOURCE_ID, { type: "geojson", data });
        map.addLayer({
          id: OBJECTS_POLYGON_FILL_ID,
          type: "fill",
          source: OBJECTS_POLYGON_SOURCE_ID,
          paint: { "fill-color": "#0f766e", "fill-opacity": 0.12 },
        });
        map.addLayer({
          id: OBJECTS_POLYGON_LINE_ID,
          type: "line",
          source: OBJECTS_POLYGON_SOURCE_ID,
          paint: { "line-color": "#0f766e", "line-width": 2 },
        });
      }
    }

    if (map.isStyleLoaded()) {
      renderPolygons();
    } else {
      map.once("load", renderPolygons);
    }

    const pointMarkers: maplibregl.Marker[] = [];
    for (const obj of objects) {
      if (obj.type !== "point") continue;
      const popup = new maplibregl.Popup({ offset: 14 }).setHTML(
        `<strong>${obj.name}</strong><br />${POINT_KIND_LABEL[obj.kind]}`,
      );
      const marker = new maplibregl.Marker({ element: pointMarkerElement(obj.kind) })
        .setLngLat([obj.position.lon, obj.position.lat])
        .setPopup(popup)
        .addTo(map);
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
