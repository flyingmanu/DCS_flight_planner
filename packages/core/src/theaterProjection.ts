import proj4 from "proj4";
import type { LatLon } from "./geo.js";

export interface TheaterProjectionParams {
  centralMeridianDeg: number;
  falseEastingM: number;
  falseNorthingM: number;
  scaleFactor: number;
}

/**
 * DCS World's per-theater Transverse Mercator (WGS84) parameters, needed to
 * convert the DCS mission-editor's internal x/y meters (used by .miz F10 map
 * drawings, nav points, bullseyes and unit/route positions) to/from real
 * lat/lon. DCS's in-game API (`coord.LOtoLL()`) does this conversion at
 * runtime, but a `.miz` read outside the game has no such API available -
 * these parameters are what a static importer/exporter needs instead.
 *
 * Sourced from pydcs (https://github.com/pydcs/dcs, MIT licensed), whose
 * `dcs/terrain/<theater>/projection.py` files are generated directly from
 * each DCS terrain's own projection data. Validated against a real .miz
 * mission (Persian Gulf): named map labels for Jask, Bandar Abbas and Bandar
 * Lengeh converted to within ~0.01-0.03 degrees of their real-world airport
 * coordinates.
 *
 * "germany" is an unreleased/work-in-progress DCS terrain as of writing;
 * included for completeness. Iraq and Afghanistan are not yet covered by
 * this source and are missing here.
 */
export const THEATER_PROJECTIONS: Record<string, TheaterProjectionParams> = {
  caucasus: { centralMeridianDeg: 33, falseEastingM: -99516.9999999732, falseNorthingM: -4998114.999999984, scaleFactor: 0.9996 },
  persiangulf: { centralMeridianDeg: 57, falseEastingM: 75755.99999999645, falseNorthingM: -2894933.0000000377, scaleFactor: 0.9996 },
  nevada: { centralMeridianDeg: -117, falseEastingM: -193996.80999964548, falseNorthingM: -4410028.063999966, scaleFactor: 0.9996 },
  normandy: { centralMeridianDeg: -3, falseEastingM: -195526.00000000204, falseNorthingM: -5484812.999999951, scaleFactor: 0.9996 },
  thechannel: { centralMeridianDeg: 3, falseEastingM: 99376.00000000288, falseNorthingM: -5636889.00000001, scaleFactor: 0.9996 },
  syria: { centralMeridianDeg: 39, falseEastingM: 282801.00000003993, falseNorthingM: -3879865.9999999935, scaleFactor: 0.9996 },
  marianaislands: { centralMeridianDeg: 147, falseEastingM: 238417.99999989968, falseNorthingM: -1491840.000000048, scaleFactor: 0.9996 },
  falklands: { centralMeridianDeg: -57, falseEastingM: 147639.99999997593, falseNorthingM: 5815417.000000032, scaleFactor: 0.9996 },
  sinai: { centralMeridianDeg: 33, falseEastingM: 169221.9999999585, falseNorthingM: -3325312.9999999693, scaleFactor: 0.9996 },
  kola: { centralMeridianDeg: 21, falseEastingM: -62702.00000000087, falseNorthingM: -7543624.999999979, scaleFactor: 0.9996 },
  germany: { centralMeridianDeg: 21, falseEastingM: 35427.619999985734, falseNorthingM: -6061633.128000011, scaleFactor: 0.9996 },
};

function proj4Def(p: TheaterProjectionParams): string {
  return [
    "+proj=tmerc",
    "+lat_0=0",
    `+lon_0=${p.centralMeridianDeg}`,
    `+k_0=${p.scaleFactor}`,
    `+x_0=${p.falseEastingM}`,
    `+y_0=${p.falseNorthingM}`,
    "+ellps=WGS84",
    "+towgs84=0,0,0,0,0,0,0",
    "+units=m",
    "+no_defs",
  ].join(" ");
}

function paramsFor(theaterId: string): TheaterProjectionParams {
  const params = THEATER_PROJECTIONS[theaterId];
  if (!params) throw new Error(`No coordinate projection parameters for theater "${theaterId}"`);
  return params;
}

/**
 * Converts DCS mission-editor x/y (meters) to WGS84 lat/lon for the given
 * theater. DCS's own x/y axis order is (north, east) rather than the usual
 * (east, north)/(lon, lat), so the swap below is intentional, not a bug.
 */
export function missionXYToLatLon(theaterId: string, x: number, y: number): LatLon {
  const [lon, lat] = proj4(proj4Def(paramsFor(theaterId))).inverse([y, x]);
  return { lat, lon };
}

/** Converts a WGS84 lat/lon to DCS mission-editor x/y (meters) for the given theater. */
export function latLonToMissionXY(theaterId: string, position: LatLon): { x: number; y: number } {
  const [easting, northing] = proj4(proj4Def(paramsFor(theaterId))).forward([position.lon, position.lat]);
  return { x: northing, y: easting };
}
