import { describe, expect, it } from "vitest";
import { defaultMissionWeather, summarizeWeatherMetar, WIND_LAYER_ALTITUDES_FT } from "./weather.js";

describe("defaultMissionWeather", () => {
  it("has one wind layer per fixed reference altitude", () => {
    const weather = defaultMissionWeather();
    expect(weather.wind.map((w) => w.altitudeFt)).toEqual([...WIND_LAYER_ALTITUDES_FT]);
  });
});

describe("summarizeWeatherMetar", () => {
  it("reports calm wind and clear sky for the defaults", () => {
    const metar = summarizeWeatherMetar(defaultMissionWeather());
    expect(metar).toBe("METAR 00000KT 9999 NSC 20 Q1013 RMK STATIC=");
  });

  it("encodes ground wind direction/speed and okta-banded cloud cover", () => {
    const weather = defaultMissionWeather();
    weather.wind[0].directionDeg = 270;
    weather.wind[0].velocityKt = 12;
    weather.cloudCoverageOktas = 6;
    weather.cloudBaseFt = 2500;
    const metar = summarizeWeatherMetar(weather);
    expect(metar).toContain("27012KT");
    expect(metar).toContain("BKN025");
  });

  it("never misfires the calm-wind sentinel on a non-zero direction with zero speed", () => {
    const weather = defaultMissionWeather();
    weather.wind[0].directionDeg = 180;
    weather.wind[0].velocityKt = 0;
    expect(summarizeWeatherMetar(weather)).toContain("00000KT");
  });
});
