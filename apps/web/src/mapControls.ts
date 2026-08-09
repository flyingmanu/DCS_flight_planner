import { distanceKm } from "@dcs-flight-planner/core";
import maplibregl from "maplibre-gl";

const HILLSHADE_SOURCE_ID = "terrain-dem";
const HILLSHADE_LAYER_ID = "hillshade";

export const ORBIT_ARROW_IMAGE_ID = "orbit-arrow-icon";

/** Registers the black triangular icon used to show orbit direction-of-travel (idempotent). */
export function ensureOrbitArrowImage(map: maplibregl.Map): void {
  if (map.hasImage(ORBIT_ARROW_IMAGE_ID)) return;
  const size = 20;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.moveTo(size / 2, 0);
  ctx.lineTo(size, size);
  ctx.lineTo(0, size);
  ctx.closePath();
  ctx.fill();
  map.addImage(ORBIT_ARROW_IMAGE_ID, ctx.getImageData(0, 0, size, size));
}

// AWS's public elevation-tiles-prod bucket (Terrarium encoding, Mapzen/OSM
// data) - free, no API key, usable commercially with attribution.
const TERRAIN_TILES_URL = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";

function controlButton(label: string, title: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.title = title;
  button.textContent = label;
  button.style.fontSize = "16px";
  return button;
}

/** Adds a hillshade relief layer to the map (hidden by default). */
export function addHillshadeLayer(map: maplibregl.Map): void {
  if (map.getSource(HILLSHADE_SOURCE_ID)) return;

  map.addSource(HILLSHADE_SOURCE_ID, {
    type: "raster-dem",
    tiles: [TERRAIN_TILES_URL],
    tileSize: 256,
    encoding: "terrarium",
    maxzoom: 15,
    attribution: "Terrain data © Mapzen, OpenStreetMap contributors",
  });

  map.addLayer({
    id: HILLSHADE_LAYER_ID,
    type: "hillshade",
    source: HILLSHADE_SOURCE_ID,
    layout: { visibility: "none" },
    paint: { "hillshade-exaggeration": 0.7 },
  });
}

/** Toggle button that shows/hides the hillshade relief layer. */
export class ReliefControl implements maplibregl.IControl {
  private map?: maplibregl.Map;
  private container!: HTMLDivElement;
  private button!: HTMLButtonElement;
  private visible = false;

  onAdd(map: maplibregl.Map): HTMLElement {
    this.map = map;
    this.container = document.createElement("div");
    this.container.className = "maplibregl-ctrl maplibregl-ctrl-group";
    this.button = controlButton("⛰", "Show/hide terrain relief");
    this.button.addEventListener("click", () => this.toggle());
    this.container.appendChild(this.button);
    return this.container;
  }

  onRemove(): void {
    this.container.remove();
    this.map = undefined;
  }

  private toggle(): void {
    if (!this.map || !this.map.getLayer(HILLSHADE_LAYER_ID)) return;
    this.visible = !this.visible;
    this.map.setLayoutProperty(HILLSHADE_LAYER_ID, "visibility", this.visible ? "visible" : "none");
    this.button.style.backgroundColor = this.visible ? "#dbeafe" : "";
  }
}

const MEASURE_LINE_SOURCE_ID = "measure-line";
const MEASURE_LINE_LAYER_ID = "measure-line-layer";

const KM_PER_NM = 1.852;

function formatDistance(km: number): string {
  return `${km.toFixed(1)} km · ${(km / KM_PER_NM).toFixed(1)} NM`;
}

function cumulativeDistanceKm(points: maplibregl.LngLat[]): number {
  let km = 0;
  for (let i = 1; i < points.length; i++) {
    const a = { lat: points[i - 1]!.lat, lon: points[i - 1]!.lng };
    const b = { lat: points[i]!.lat, lon: points[i]!.lng };
    km += distanceKm(a, b);
  }
  return km;
}

function pointMarkerElement(): HTMLElement {
  const el = document.createElement("div");
  el.style.width = "10px";
  el.style.height = "10px";
  el.style.borderRadius = "50%";
  el.style.background = "#c02020";
  el.style.border = "2px solid #fff";
  el.style.boxShadow = "0 0 2px rgba(0,0,0,0.5)";
  return el;
}

function labelMarkerElement(text: string): HTMLElement {
  const el = document.createElement("div");
  el.textContent = text;
  el.style.background = "#fff";
  el.style.color = "#1a1a1a";
  el.style.padding = "2px 8px";
  el.style.borderRadius = "10px";
  el.style.fontSize = "12px";
  el.style.fontWeight = "600";
  el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.3)";
  el.style.whiteSpace = "nowrap";
  return el;
}

/**
 * Toggle button that starts a running distance measurement: each click adds
 * another point to the path and the cumulative distance (km/NM) updates.
 * Right-click resets the current path without leaving measuring mode.
 * Escape (or pressing the button again) turns the tool off entirely.
 */
export class MeasureControl implements maplibregl.IControl {
  private map?: maplibregl.Map;
  private container!: HTMLDivElement;
  private button!: HTMLButtonElement;
  private active = false;
  private points: maplibregl.LngLat[] = [];
  private pointMarkers: maplibregl.Marker[] = [];
  private labelMarker: maplibregl.Marker | null = null;
  private readonly onClick = (e: maplibregl.MapMouseEvent) => this.handleMapClick(e);
  private readonly onContextMenu = (e: maplibregl.MapMouseEvent) => {
    e.preventDefault();
    this.resetPath();
  };
  private readonly onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") this.deactivate();
  };

  onAdd(map: maplibregl.Map): HTMLElement {
    this.map = map;
    this.container = document.createElement("div");
    this.container.className = "maplibregl-ctrl maplibregl-ctrl-group";
    this.button = controlButton("📏", "Measure a distance (click to add a point, right-click to reset)");
    this.button.addEventListener("click", () => this.toggle());
    this.container.appendChild(this.button);

    map.addSource(MEASURE_LINE_SOURCE_ID, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
    map.addLayer({
      id: MEASURE_LINE_LAYER_ID,
      type: "line",
      source: MEASURE_LINE_SOURCE_ID,
      paint: { "line-color": "#c02020", "line-width": 2, "line-dasharray": [2, 1] },
    });

    return this.container;
  }

  onRemove(): void {
    this.deactivate();
    if (this.map?.getLayer(MEASURE_LINE_LAYER_ID)) this.map.removeLayer(MEASURE_LINE_LAYER_ID);
    if (this.map?.getSource(MEASURE_LINE_SOURCE_ID)) this.map.removeSource(MEASURE_LINE_SOURCE_ID);
    this.container.remove();
    this.map = undefined;
  }

  private toggle(): void {
    if (this.active) {
      this.deactivate();
    } else {
      this.activate();
    }
  }

  private activate(): void {
    if (!this.map) return;
    this.resetPath();
    this.active = true;
    this.button.style.backgroundColor = "#dbeafe";
    this.map.getCanvas().style.cursor = "crosshair";
    this.map.on("click", this.onClick);
    this.map.on("contextmenu", this.onContextMenu);
    window.addEventListener("keydown", this.onKeyDown);
  }

  private deactivate(): void {
    if (!this.map) return;
    this.active = false;
    this.button.style.backgroundColor = "";
    this.map.getCanvas().style.cursor = "";
    this.map.off("click", this.onClick);
    this.map.off("contextmenu", this.onContextMenu);
    window.removeEventListener("keydown", this.onKeyDown);
    this.resetPath();
  }

  private resetPath(): void {
    this.points = [];
    for (const marker of this.pointMarkers) marker.remove();
    this.pointMarkers = [];
    this.labelMarker?.remove();
    this.labelMarker = null;
    const source = this.map?.getSource(MEASURE_LINE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    source?.setData({ type: "FeatureCollection", features: [] });
  }

  private handleMapClick(e: maplibregl.MapMouseEvent): void {
    if (!this.map) return;
    this.points.push(e.lngLat);
    this.pointMarkers.push(new maplibregl.Marker({ element: pointMarkerElement() }).setLngLat(e.lngLat).addTo(this.map));

    if (this.points.length < 2) return;

    const source = this.map.getSource(MEASURE_LINE_SOURCE_ID) as maplibregl.GeoJSONSource;
    source.setData({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: this.points.map((p) => [p.lng, p.lat]),
          },
        },
      ],
    });

    const label = formatDistance(cumulativeDistanceKm(this.points));
    const last = this.points[this.points.length - 1]!;
    if (this.labelMarker) {
      this.labelMarker.setLngLat(last);
      this.labelMarker.getElement().textContent = label;
    } else {
      this.labelMarker = new maplibregl.Marker({ element: labelMarkerElement(label), offset: [0, -16] })
        .setLngLat(last)
        .addTo(this.map);
    }
  }
}
