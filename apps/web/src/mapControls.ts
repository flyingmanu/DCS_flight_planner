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
  button.style.transition = "background-color 0.12s ease";
  button.addEventListener("mouseenter", () => {
    if (button.dataset.active !== "true") button.style.backgroundColor = "var(--dfp-blue-soft)";
  });
  button.addEventListener("mouseleave", () => {
    if (button.dataset.active !== "true") button.style.backgroundColor = "";
  });
  return button;
}

function setButtonActive(button: HTMLButtonElement, active: boolean): void {
  button.dataset.active = active ? "true" : "false";
  button.style.backgroundColor = active ? "var(--dfp-accent-soft)" : "";
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
    setButtonActive(this.button, this.visible);
  }
}

/**
 * Toggle button that turns "glue" (snap-to-nearby-point) on/off. The button
 * owns its own visual active state (like Relief/Measure above); clicks call
 * back into React, which owns the actual snapEnabled state.
 */
export class GlueControl implements maplibregl.IControl {
  private container!: HTMLDivElement;
  private button!: HTMLButtonElement;
  private active: boolean;
  private readonly onToggle: (active: boolean) => void;

  constructor(initialActive: boolean, onToggle: (active: boolean) => void) {
    this.active = initialActive;
    this.onToggle = onToggle;
  }

  onAdd(): HTMLElement {
    this.container = document.createElement("div");
    this.container.className = "maplibregl-ctrl maplibregl-ctrl-group";
    this.button = controlButton("🧴", "Glue: snap new points/waypoints/zones to nearby existing points");
    setButtonActive(this.button, this.active);
    this.button.addEventListener("click", () => {
      this.active = !this.active;
      setButtonActive(this.button, this.active);
      this.onToggle(this.active);
    });
    this.container.appendChild(this.button);
    return this.container;
  }

  onRemove(): void {
    this.container.remove();
  }
}

const SATELLITE_SOURCE_ID = "esri-world-imagery";
const SATELLITE_LAYER_ID = "esri-world-imagery-layer";

// Esri's public World Imagery basemap - free to use (no API key) under
// Esri's ArcGIS Online terms. The tile path uses Esri's own {z}/{y}/{x}
// order, not the usual XYZ {z}/{x}/{y}.
const ESRI_WORLD_IMAGERY_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const VFR_CHART_SOURCE_ID = "sia-oaci-vfr-chart";
const VFR_CHART_LAYER_ID = "sia-oaci-vfr-chart-layer";

// IGN Geoplateforme WMTS, serving SIA's "Carte OACI-VFR" (the official
// French VFR aeronautical chart) under the Etalab Licence Ouverte 2.0 (free
// reuse incl. commercial, attribution only - no API key). The base
// data.geopf.fr WMTS endpoint is IGN's long-standing stable public service;
// the exact LAYER identifier below follows IGN's "SCAN-OACI" product naming
// convention but could NOT be verified against the live GetCapabilities from
// this sandbox (geoportail/data.geopf.fr is EGRESS_BLOCKED here) - if this
// renders blank, check the layer name against IGN's current WMTS capabilities.
const VFR_CHART_TILE_URL =
  "https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&LAYER=GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-OACI&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/png";

type BasemapMode = "vector" | "satellite" | "vfr";

const BASEMAP_MODE_SPECS: Array<{ mode: BasemapMode; glyph: string; title: string }> = [
  { mode: "vector", glyph: "🗺", title: "Vector map basemap" },
  { mode: "satellite", glyph: "🛰", title: "Satellite imagery basemap (Esri World Imagery)" },
  { mode: "vfr", glyph: "✈", title: "VFR aeronautical chart basemap (SIA/IGN Carte OACI-VFR, France only)" },
];

/**
 * Switches between the vector basemap, Esri satellite imagery, and the
 * French SIA/IGN VFR aeronautical chart - like the map/satellite switch in
 * Google Maps, extended with a third option. Rather than swapping the whole
 * map style (which would drop every runtime-added source/layer - mission
 * objects, airbases, hillshade...), this inserts hidden raster layers below
 * the vector style's own layers and flips visibility between exactly one
 * active set at a time, so everything drawn on top keeps working unchanged.
 */
export class BasemapControl implements maplibregl.IControl {
  private map?: maplibregl.Map;
  private container!: HTMLDivElement;
  private modeButtons: Array<{ mode: BasemapMode; button: HTMLButtonElement }> = [];
  private mode: BasemapMode = "vector";
  private readonly baseLayerIds: string[];

  /** `baseLayerIds` must be captured before any other runtime layer is added, e.g. from map.getStyle().layers right after "load". */
  constructor(baseLayerIds: string[]) {
    this.baseLayerIds = baseLayerIds;
  }

  onAdd(map: maplibregl.Map): HTMLElement {
    this.map = map;
    if (!map.getSource(SATELLITE_SOURCE_ID)) {
      map.addSource(SATELLITE_SOURCE_ID, {
        type: "raster",
        tiles: [ESRI_WORLD_IMAGERY_URL],
        tileSize: 256,
        maxzoom: 19,
        attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics",
      });
      map.addLayer(
        { id: SATELLITE_LAYER_ID, type: "raster", source: SATELLITE_SOURCE_ID, layout: { visibility: "none" } },
        this.baseLayerIds[0],
      );
    }
    if (!map.getSource(VFR_CHART_SOURCE_ID)) {
      map.addSource(VFR_CHART_SOURCE_ID, {
        type: "raster",
        tiles: [VFR_CHART_TILE_URL],
        tileSize: 256,
        maxzoom: 16,
        attribution: "Carte OACI-VFR &copy; SIA/IGN - Etalab Licence Ouverte 2.0",
      });
      map.addLayer(
        { id: VFR_CHART_LAYER_ID, type: "raster", source: VFR_CHART_SOURCE_ID, layout: { visibility: "none" } },
        this.baseLayerIds[0],
      );
    }

    this.container = document.createElement("div");
    this.container.className = "maplibregl-ctrl maplibregl-ctrl-group";
    this.modeButtons = BASEMAP_MODE_SPECS.map(({ mode, glyph, title }) => {
      const button = controlButton(glyph, title);
      button.addEventListener("click", () => this.setMode(mode));
      this.container.appendChild(button);
      return { mode, button };
    });
    setButtonActive(this.modeButtons[0]!.button, true);
    return this.container;
  }

  onRemove(): void {
    this.container.remove();
    this.map = undefined;
  }

  private setMode(mode: BasemapMode): void {
    if (!this.map || this.mode === mode) return;
    this.mode = mode;
    for (const id of this.baseLayerIds) {
      if (this.map.getLayer(id)) this.map.setLayoutProperty(id, "visibility", mode === "vector" ? "visible" : "none");
    }
    if (this.map.getLayer(SATELLITE_LAYER_ID)) {
      this.map.setLayoutProperty(SATELLITE_LAYER_ID, "visibility", mode === "satellite" ? "visible" : "none");
    }
    if (this.map.getLayer(VFR_CHART_LAYER_ID)) {
      this.map.setLayoutProperty(VFR_CHART_LAYER_ID, "visibility", mode === "vfr" ? "visible" : "none");
    }
    for (const { mode: m, button } of this.modeButtons) setButtonActive(button, m === mode);
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
    setButtonActive(this.button, true);
    this.map.getCanvas().style.cursor = "crosshair";
    this.map.on("click", this.onClick);
    this.map.on("contextmenu", this.onContextMenu);
    window.addEventListener("keydown", this.onKeyDown);
  }

  private deactivate(): void {
    if (!this.map) return;
    this.active = false;
    setButtonActive(this.button, false);
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
