import type { IceHaloMode, MissionWeather, PrecipitationKind, WeatherMode, WindLayer } from "./mission.js";

/** Ground/mid/high reference altitudes for the three fixed wind layers, feet MSL. */
export const WIND_LAYER_ALTITUDES_FT: readonly [number, number, number] = [33, 6600, 26000];

export const PRECIPITATION_LABEL: Record<PrecipitationKind, string> = {
  none: "None",
  rain: "Rain",
  thunderstorm: "Thunderstorm",
  snow: "Snow",
  snowstorm: "Snowstorm",
};

export const ICE_HALO_LABEL: Record<IceHaloMode, string> = {
  auto: "Auto",
  on: "On",
  off: "Off",
};

function defaultWindLayers(): [WindLayer, WindLayer, WindLayer] {
  return WIND_LAYER_ALTITUDES_FT.map((altitudeFt) => ({ altitudeFt, directionDeg: 0, velocityKt: 0 })) as [
    WindLayer,
    WindLayer,
    WindLayer,
  ];
}

/** A weather state with every field populated, for the editor to work against. */
export function defaultMissionWeather(): Required<
  Pick<
    MissionWeather,
    | "mode"
    | "wind"
    | "cloudBaseFt"
    | "cloudThicknessFt"
    | "cloudCoverageOktas"
    | "iceHalo"
    | "precipitation"
    | "fogEnabled"
    | "fogVisibilityFt"
    | "fogThicknessFt"
    | "dustEnabled"
    | "dustVisibilityFt"
    | "turbulence"
    | "temperatureC"
    | "qnhHpa"
  >
> {
  return {
    mode: "static",
    wind: defaultWindLayers(),
    cloudBaseFt: 0,
    cloudThicknessFt: 0,
    cloudCoverageOktas: 0,
    iceHalo: "auto",
    precipitation: "none",
    fogEnabled: false,
    fogVisibilityFt: 82,
    fogThicknessFt: 0,
    dustEnabled: false,
    dustVisibilityFt: 984,
    turbulence: 0,
    temperatureC: 20,
    qnhHpa: 1013,
  };
}

/** Fills in every field the weather editor needs, defaulting anything not yet set. */
export function withWeatherDefaults(weather: MissionWeather | undefined): MissionWeather & ReturnType<typeof defaultMissionWeather> {
  const d = defaultMissionWeather();
  return {
    ...d,
    ...weather,
    wind: weather?.wind ?? d.wind,
  };
}

/** A handful of one-click starting points; each maps to a partial weather patch. */
export const WEATHER_PRESETS: Record<string, Partial<MissionWeather>> = {
  Nothing: {},
  "Clear sky": { cloudCoverageOktas: 0, precipitation: "none", fogEnabled: false, dustEnabled: false },
  "Few clouds": { cloudBaseFt: 3000, cloudThicknessFt: 2000, cloudCoverageOktas: 2, precipitation: "none" },
  "Scattered clouds": { cloudBaseFt: 2500, cloudThicknessFt: 3000, cloudCoverageOktas: 4, precipitation: "none" },
  "Broken clouds": { cloudBaseFt: 2000, cloudThicknessFt: 4000, cloudCoverageOktas: 6, precipitation: "none" },
  Overcast: { cloudBaseFt: 1500, cloudThicknessFt: 5000, cloudCoverageOktas: 8, precipitation: "none" },
  Rain: { cloudBaseFt: 1200, cloudThicknessFt: 6000, cloudCoverageOktas: 8, precipitation: "rain" },
  Thunderstorm: { cloudBaseFt: 1000, cloudThicknessFt: 12000, cloudCoverageOktas: 8, precipitation: "thunderstorm", turbulence: 8 },
  Snow: { cloudBaseFt: 1500, cloudThicknessFt: 4000, cloudCoverageOktas: 8, precipitation: "snow", temperatureC: -5 },
  Fog: { fogEnabled: true, fogVisibilityFt: 1600, fogThicknessFt: 500, cloudCoverageOktas: 2 },
};

function metarWindGroup(ground: WindLayer): string {
  if (ground.velocityKt <= 0) return "00000KT";
  const dir = Math.round(ground.directionDeg) % 360;
  const ddd = dir.toString().padStart(3, "0");
  const ff = Math.min(99, Math.round(ground.velocityKt)).toString().padStart(2, "0");
  return `${ddd}${ff}KT`;
}

function metarVisibilityGroup(weather: MissionWeather): string {
  if (weather.fogEnabled && weather.fogVisibilityFt !== undefined) {
    const meters = Math.round(weather.fogVisibilityFt * 0.3048);
    return meters >= 9999 ? "9999" : meters.toString().padStart(4, "0");
  }
  if (weather.dustEnabled && weather.dustVisibilityFt !== undefined) {
    const meters = Math.round(weather.dustVisibilityFt * 0.3048);
    return meters >= 9999 ? "9999" : meters.toString().padStart(4, "0");
  }
  return "9999";
}

function metarCloudGroup(weather: MissionWeather): string {
  const oktas = weather.cloudCoverageOktas ?? 0;
  if (oktas <= 0) return "NSC";
  const cover = oktas <= 2 ? "FEW" : oktas <= 4 ? "SCT" : oktas <= 7 ? "BKN" : "OVC";
  const hundreds = Math.round((weather.cloudBaseFt ?? 0) / 100)
    .toString()
    .padStart(3, "0");
  return `${cover}${hundreds}`;
}

function metarTemperatureGroup(tempC: number | undefined): string {
  if (tempC === undefined) return "";
  const rounded = Math.round(tempC);
  return rounded < 0 ? `M${Math.abs(rounded).toString().padStart(2, "0")}` : rounded.toString().padStart(2, "0");
}

/**
 * A METAR-style one-line summary of the current weather, for a quick
 * at-a-glance readout (not a byte-exact METAR encoder).
 */
export function summarizeWeatherMetar(weather: MissionWeather): string {
  const ground = weather.wind?.[0] ?? { altitudeFt: 0, directionDeg: 0, velocityKt: 0 };
  const parts = [
    "METAR",
    metarWindGroup(ground),
    metarVisibilityGroup(weather),
    metarCloudGroup(weather),
    metarTemperatureGroup(weather.temperatureC),
    weather.qnhHpa !== undefined ? `Q${Math.round(weather.qnhHpa).toString().padStart(4, "0")}` : undefined,
    `RMK ${(weather.mode ?? "static").toUpperCase()}=`,
  ].filter((p): p is string => Boolean(p));
  return parts.join(" ");
}

export const WEATHER_MODE_LABEL: Record<WeatherMode, string> = {
  static: "Static",
  dynamic: "Dynamic",
};
