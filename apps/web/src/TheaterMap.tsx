import type { MapView, Theater } from "@dcs-flight-planner/core";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { getElevationAt } from "./elevation";
import { addHillshadeLayer, MeasureControl, ReliefControl } from "./mapControls";

// Free, no-API-key vector basemap (openfreemap.org) - usable commercially.
// It's a real-world basemap, so it only approximates DCS terrain art; good
// enough to get our bearings until theater-specific map tiles are added.
const BASEMAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

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
  onHover?: (info: HoverInfo | null) => void;
}

export interface TheaterMapHandle {
  getView: () => MapView;
  setView: (view: MapView) => void;
}

export const TheaterMap = forwardRef<TheaterMapHandle, TheaterMapProps>(function TheaterMap(
  { theater, onHover },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onHoverRef = useRef(onHover);
  onHoverRef.current = onHover;

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

  return <div ref={containerRef} data-testid="theater-map" style={{ width: "100%", height: "100%" }} />;
});
