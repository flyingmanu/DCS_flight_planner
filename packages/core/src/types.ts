export type AirbaseCategory = "airdrome" | "helipad" | "ship" | "unknown";

export interface GeoPosition {
  lat: number;
  lon: number;
  altM: number;
}

export interface Runway {
  /** e.g. "04/22" */
  id: string;
  /** Both runway-end designators, e.g. [4, 22]. Nominal heading in degrees = designator * 10. */
  designators: [number, number];
  lengthM: number;
  widthM: number;
  /**
   * ILS frequency in MHz, e.g. "110.30", or "N/A" when the runway has none.
   * When each end has its own ILS on a different frequency, formatted as
   * "<end1 freq> / <end2 freq>" (order matches `designators`).
   */
  ilsFrequencyMhz: string;
  /** PRMG (Russian precision approach system) channel, when this runway end uses PRMG instead of/alongside ILS. */
  prmgChannel?: string;
}

/** Real per-band ATC radio frequencies in MHz, e.g. "251.000", or "N/A" when unknown. */
export interface AirbaseRadio {
  hfMhz: string;
  vhfLowMhz: string;
  vhfHighMhz: string;
  uhfMhz: string;
}

export interface Airbase {
  id: string;
  name: string;
  callsign: string;
  category: AirbaseCategory;
  /**
   * Coalition owning the airbase at export time (0 = neutral, 1 = red, 2 = blue
   * in DCS's convention). Ownership can change during a mission, so this is a
   * snapshot, not a permanent fact.
   */
  initialCoalition: number;
  position: GeoPosition;
  runways: Runway[];
  /** Real ATC radio frequencies in MHz, sourced from DCS World's own airbase database. */
  radio: AirbaseRadio;
  /** TACAN channel + band, e.g. "10X", or "N/A" when the airbase has none. */
  tacanChannel: string;
  /** VOR frequency in MHz, when the airbase has a VOR beacon. */
  vorFrequencyMhz?: string;
  /** RSBN (Russian short-range nav system) channel, when the airbase has one - distinct from TACAN, most Western aircraft can't receive it. */
  rsbnChannel?: string;
}

export interface Theater {
  id: string;
  name: string;
  airbases: Airbase[];
}
