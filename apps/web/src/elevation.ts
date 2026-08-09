// Independent elevation lookup, decoupled from MapLibre's terrain/camera
// pipeline: map.queryTerrainElevation() returns elevation *relative to
// whatever is under the current map center* (MapLibre re-anchors
// transform.elevation to the center on every render), which is useless for
// an absolute altitude readout. This fetches and decodes AWS's public
// Terrarium DEM tiles directly instead.

const TILE_URL_TEMPLATE = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";
const QUERY_ZOOM = 12; // ~30 m/pixel - enough resolution for a cursor readout

const tileCache = new Map<string, Promise<ImageData | null>>();

function lonLatToTileFraction(lon: number, lat: number, z: number) {
  const n = 2 ** z;
  const worldX = ((lon + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const worldY = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { worldX, worldY };
}

async function loadTileImageData(z: number, x: number, y: number): Promise<ImageData | null> {
  const key = `${z}/${x}/${y}`;
  let promise = tileCache.get(key);
  if (!promise) {
    promise = fetchTileImageData(z, x, y);
    tileCache.set(key, promise);
  }
  return promise;
}

async function fetchTileImageData(z: number, x: number, y: number): Promise<ImageData | null> {
  try {
    const url = TILE_URL_TEMPLATE.replace("{z}", String(z)).replace("{x}", String(x)).replace("{y}", String(y));
    const res = await fetch(url);
    if (!res.ok) return null;
    const bitmap = await createImageBitmap(await res.blob());
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0);
    return ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  } catch {
    return null;
  }
}

function decodeTerrarium(r: number, g: number, b: number): number {
  return r * 256 + g + b / 256 - 32768;
}

/** Elevation in meters above sea level at a point, or null if unavailable. */
export async function getElevationAt(lon: number, lat: number): Promise<number | null> {
  const { worldX, worldY } = lonLatToTileFraction(lon, lat, QUERY_ZOOM);
  const tileX = Math.floor(worldX);
  const tileY = Math.floor(worldY);

  const imageData = await loadTileImageData(QUERY_ZOOM, tileX, tileY);
  if (!imageData) return null;

  const px = Math.min(imageData.width - 1, Math.max(0, Math.floor((worldX - tileX) * imageData.width)));
  const py = Math.min(imageData.height - 1, Math.max(0, Math.floor((worldY - tileY) * imageData.height)));
  const idx = (py * imageData.width + px) * 4;
  return decodeTerrarium(imageData.data[idx], imageData.data[idx + 1], imageData.data[idx + 2]);
}
