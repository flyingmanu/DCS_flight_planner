import { ICE_HALO_LABEL, PRECIPITATION_LABEL, summarizeWeatherMetar, WEATHER_MODE_LABEL, type MissionWeather, type WindLayer } from "@dcs-flight-planner/core";

const WIDTH = 1200;
const HEIGHT = 820;
const MARGIN = 48;
const CHART_TOP_FT = 40000;

function windArrowGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, layer: WindLayer) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#1a2733";
  ctx.fillStyle = "#1a2733";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.stroke();
  if (layer.velocityKt > 0) {
    // Arrow points in the direction the wind is blowing TOWARD (from-direction + 180deg).
    const rad = ((layer.directionDeg + 180) * Math.PI) / 180;
    ctx.rotate(rad);
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(0, 20);
    ctx.moveTo(0, -20);
    ctx.lineTo(-6, -12);
    ctx.moveTo(0, -20);
    ctx.lineTo(6, -12);
    ctx.stroke();
  }
  ctx.restore();
  ctx.font = "11px system-ui, sans-serif";
  ctx.fillStyle = "#3a4552";
  ctx.textAlign = "left";
  ctx.fillText(
    `${Math.round(layer.directionDeg).toString().padStart(3, "0")}° / ${Math.round(layer.velocityKt)} kt`,
    x + 24,
    y + 4,
  );
  ctx.textAlign = "left";
}

/** Draws a Combat Flite-style weather summary onto a fresh off-screen canvas. */
export function drawWeatherSummary(weather: MissionWeather, missionName: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.fillStyle = "#f5f2ea";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.strokeStyle = "#1a2733";
  ctx.lineWidth = 3;
  ctx.strokeRect(6, 6, WIDTH - 12, HEIGHT - 12);

  const left = MARGIN;
  const right = WIDTH - MARGIN;
  let y = MARGIN;

  ctx.fillStyle = "#e8a33d";
  ctx.fillRect(left, y, right - left, 6);
  y += 26;

  ctx.fillStyle = "#1a2733";
  ctx.font = "bold 34px system-ui, sans-serif";
  ctx.fillText("Weather", left, y + 30);
  y += 56;

  ctx.font = "16px system-ui, sans-serif";
  ctx.fillStyle = "#6b7684";
  ctx.fillText(`${missionName} — ${WEATHER_MODE_LABEL[weather.mode ?? "static"]}${weather.preset ? ` — ${weather.preset}` : ""}`, left, y);
  y += 30;

  ctx.strokeStyle = "#c7c0ae";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, y);
  ctx.lineTo(right, y);
  ctx.stroke();
  y += 30;

  // Chart area (left 640px of the body) + text summary (remaining width).
  const chartLeft = left;
  const chartWidth = 620;
  const chartTop = y;
  const chartHeight = HEIGHT - y - 100;
  const chartBottom = chartTop + chartHeight;

  const grad = ctx.createLinearGradient(0, chartTop, 0, chartBottom);
  grad.addColorStop(0, "#bcd6ee");
  grad.addColorStop(1, "#eaf2fa");
  ctx.fillStyle = grad;
  ctx.fillRect(chartLeft, chartTop, chartWidth, chartHeight);
  ctx.strokeStyle = "#1a2733";
  ctx.lineWidth = 2;
  ctx.strokeRect(chartLeft, chartTop, chartWidth, chartHeight);

  const yOf = (ft: number) => chartBottom - (Math.min(ft, CHART_TOP_FT) / CHART_TOP_FT) * chartHeight;

  ctx.font = "11px system-ui, sans-serif";
  for (let ft = 10000; ft <= CHART_TOP_FT; ft += 10000) {
    const gy = yOf(ft);
    ctx.strokeStyle = "rgba(26,39,51,0.18)";
    ctx.beginPath();
    ctx.moveTo(chartLeft, gy);
    ctx.lineTo(chartLeft + chartWidth, gy);
    ctx.stroke();
    ctx.fillStyle = "#3a4552";
    ctx.fillText(`${(ft / 1000).toFixed(0)},000 ft`, chartLeft + 6, gy - 4);
  }

  const cloudBase = weather.cloudBaseFt ?? 0;
  const cloudThickness = weather.cloudThicknessFt ?? 0;
  const oktas = weather.cloudCoverageOktas ?? 0;
  if (oktas > 0 && cloudThickness > 0) {
    const cTop = yOf(cloudBase + cloudThickness);
    const cBottom = yOf(cloudBase);
    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.9, 0.25 + oktas / 8)})`;
    ctx.strokeStyle = "rgba(90,100,112,0.6)";
    ctx.fillRect(chartLeft + 10, cTop, chartWidth - 20, cBottom - cTop);
    ctx.strokeRect(chartLeft + 10, cTop, chartWidth - 20, cBottom - cTop);
  }

  // Ground line.
  const groundY = yOf(0);
  ctx.strokeStyle = "#132c44";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(chartLeft, groundY);
  ctx.lineTo(chartLeft + chartWidth, groundY);
  ctx.stroke();

  const wind = weather.wind ?? [];
  wind.forEach((layer) => {
    windArrowGlyph(ctx, chartLeft + 70, yOf(layer.altitudeFt), layer);
  });

  // Text summary column.
  const textLeft = chartLeft + chartWidth + 32;
  let ty = chartTop + 6;
  function row(label: string, value: string) {
    ctx!.font = "11px system-ui, sans-serif";
    ctx!.fillStyle = "#8a93a0";
    ctx!.fillText(label.toUpperCase(), textLeft, ty);
    ctx!.font = "bold 17px system-ui, sans-serif";
    ctx!.fillStyle = "#1a2733";
    ctx!.fillText(value, textLeft, ty + 20);
    ty += 46;
  }
  row("Clouds", oktas > 0 ? `${oktas}/8, base ${cloudBase.toLocaleString()} ft, ${cloudThickness.toLocaleString()} ft thick` : "Clear");
  row("Ice halo", ICE_HALO_LABEL[weather.iceHalo ?? "auto"]);
  row("Precipitation", PRECIPITATION_LABEL[weather.precipitation ?? "none"]);
  row("Fog", weather.fogEnabled ? `Visibility ${(weather.fogVisibilityFt ?? 0).toLocaleString()} ft` : "Off");
  row("Dust", weather.dustEnabled ? `Visibility ${(weather.dustVisibilityFt ?? 0).toLocaleString()} ft` : "Off");
  row("Turbulence", `${weather.turbulence ?? 0} ft/s`);
  row("Temperature", `${weather.temperatureC ?? 20}°C`);
  row("QNH", `${weather.qnhHpa ?? 1013} hPa`);

  // METAR footer.
  const metarY = chartBottom + 40;
  ctx.font = "bold 16px ui-monospace, monospace";
  ctx.fillStyle = "#1a2733";
  ctx.fillText(summarizeWeatherMetar(weather), left, metarY);

  ctx.font = "11px system-ui, sans-serif";
  ctx.fillStyle = "#a3abb6";
  ctx.fillText("Generated by DCS Flight Planner — verify against the real mission before flying.", left, HEIGHT - 24);

  return canvas;
}
