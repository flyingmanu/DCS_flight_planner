import type { Theater } from "@dcs-flight-planner/core";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";

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

interface TheaterMapProps {
  theater: Theater;
}

export function TheaterMap({ theater }: TheaterMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = new maplibregl.Map({
      container,
      style: BASEMAP_STYLE_URL,
      center: [42, 43],
      zoom: 6,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    const bounds = new maplibregl.LngLatBounds();
    const markers: maplibregl.Marker[] = [];

    for (const airbase of theater.airbases) {
      const lngLat: [number, number] = [airbase.position.lon, airbase.position.lat];
      bounds.extend(lngLat);

      const popup = new maplibregl.Popup({ offset: 12 }).setHTML(popupHtml(airbase));
      const marker = new maplibregl.Marker({ color: "#c02020" })
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
    };
  }, [theater]);

  return <div ref={containerRef} data-testid="theater-map" style={{ width: "100%", height: "100%" }} />;
}
