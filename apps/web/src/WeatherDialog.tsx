import {
  ICE_HALO_LABEL,
  PRECIPITATION_LABEL,
  summarizeWeatherMetar,
  WEATHER_MODE_LABEL,
  WEATHER_PRESETS,
  withWeatherDefaults,
  type IceHaloMode,
  type MissionWeather,
  type PrecipitationKind,
  type WeatherMode,
  type WindLayer,
} from "@dcs-flight-planner/core";
import { canvasToPngBlob, downloadBlob, slug } from "./pngExport";
import { drawWeatherSummary } from "./weatherExport";

interface WeatherDialogProps {
  missionName: string;
  weather: MissionWeather | undefined;
  onChangeWeather: (weather: MissionWeather) => void;
  onClose: () => void;
}

function HSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span className="dfp-label" style={{ marginBottom: 0 }}>
          {label}
        </span>
        <span style={{ fontSize: 12, color: "var(--dfp-text-muted)" }}>
          {Math.round(value)}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%" }}
      />
    </div>
  );
}

function VSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 84 }}>
      <div style={{ fontSize: 12, color: "var(--dfp-text-muted)" }}>
        {Math.round(value)}
        {unit}
      </div>
      <div style={{ width: 44, height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ width: 140, height: 24, transform: "rotate(-90deg)" }}
        />
      </div>
      <div className="dfp-label" style={{ marginBottom: 0, textAlign: "center" }}>
        {label}
      </div>
    </div>
  );
}

export function WeatherDialog({ missionName, weather, onChangeWeather, onClose }: WeatherDialogProps) {
  const w = withWeatherDefaults(weather);

  function commit(patch: Partial<MissionWeather>) {
    onChangeWeather({ ...w, ...patch });
  }

  function commitWindLayer(index: number, patch: Partial<WindLayer>) {
    const wind = w.wind.map((layer, i) => (i === index ? { ...layer, ...patch } : layer)) as [WindLayer, WindLayer, WindLayer];
    commit({ wind });
  }

  function applyPreset(name: string) {
    if (name === "") return;
    commit({ ...(WEATHER_PRESETS[name] ?? {}), preset: name });
  }

  async function saveAsPng() {
    const canvas = drawWeatherSummary(w, missionName);
    const blob = await canvasToPngBlob(canvas);
    if (blob) downloadBlob(blob, `${slug(missionName)}-weather.png`);
  }

  // High to low, matching Combat Flite's top-to-bottom layout.
  const windRows = [...w.wind].reverse();

  return (
    <div
      className="dfp-scrim"
      onClick={onClose}
      style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20 }}
    >
      <div
        className="dfp-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          borderRadius: "var(--dfp-radius-lg)",
          width: "min(980px, 94vw)",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div className="dfp-panel-header">
          <span>Weather — {missionName}</span>
          <button type="button" className="dfp-panel-header-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div style={{ padding: "14px 18px", overflowY: "auto", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 4 }}>
              {(Object.keys(WEATHER_MODE_LABEL) as WeatherMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className="dfp-btn"
                  data-open={w.mode === mode ? "true" : undefined}
                  style={w.mode === mode ? { background: "var(--dfp-accent)", borderColor: "var(--dfp-accent-dark)", color: "#2a1a02" } : undefined}
                  onClick={() => commit({ mode })}
                >
                  {WEATHER_MODE_LABEL[mode]}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <select className="dfp-select" value={w.preset ?? ""} onChange={(e) => applyPreset(e.target.value)}>
                <option value="">Preset…</option>
                {Object.keys(WEATHER_PRESETS).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <button type="button" className="dfp-btn dfp-btn-accent" onClick={saveAsPng}>
                Save as PNG
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <div className="dfp-label" style={{ marginBottom: 8 }}>
                Wind
              </div>
              {windRows.map((layer) => {
                const index = w.wind.indexOf(layer);
                return (
                  <div
                    key={layer.altitudeFt}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "70px 1fr 1fr",
                      gap: 12,
                      alignItems: "center",
                      padding: "6px 0",
                      borderBottom: "1px solid var(--dfp-border)",
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--dfp-text-muted)" }}>{layer.altitudeFt.toLocaleString()} ft</span>
                    <HSlider
                      label="Direction"
                      value={layer.directionDeg}
                      min={0}
                      max={360}
                      step={1}
                      unit="°"
                      onChange={(v) => commitWindLayer(index, { directionDeg: v })}
                    />
                    <HSlider
                      label="Velocity"
                      value={layer.velocityKt}
                      min={0}
                      max={100}
                      step={1}
                      unit=" kt"
                      onChange={(v) => commitWindLayer(index, { velocityKt: v })}
                    />
                  </div>
                );
              })}

              <div className="dfp-label" style={{ margin: "16px 0 8px" }}>
                Clouds
              </div>
              <div style={{ display: "flex", gap: 18, justifyContent: "flex-start" }}>
                <VSlider label="Base (ft)" value={w.cloudBaseFt} min={0} max={30000} step={100} unit="" onChange={(v) => commit({ cloudBaseFt: v })} />
                <VSlider
                  label="Thickness (ft)"
                  value={w.cloudThicknessFt}
                  min={0}
                  max={20000}
                  step={100}
                  unit=""
                  onChange={(v) => commit({ cloudThicknessFt: v })}
                />
                <VSlider
                  label="Coverage (oktas)"
                  value={w.cloudCoverageOktas}
                  min={0}
                  max={8}
                  step={1}
                  unit=""
                  onChange={(v) => commit({ cloudCoverageOktas: v })}
                />
              </div>

              <div className="dfp-label" style={{ margin: "16px 0 6px" }}>
                Ice halo
              </div>
              <select
                className="dfp-select"
                value={w.iceHalo}
                onChange={(e) => commit({ iceHalo: e.target.value as IceHaloMode })}
                style={{ width: "100%" }}
              >
                {(Object.keys(ICE_HALO_LABEL) as IceHaloMode[]).map((mode) => (
                  <option key={mode} value={mode}>
                    {ICE_HALO_LABEL[mode]}
                  </option>
                ))}
              </select>

              <div className="dfp-label" style={{ margin: "16px 0 6px" }}>
                Precipitation
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(Object.keys(PRECIPITATION_LABEL) as PrecipitationKind[]).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    className="dfp-btn"
                    style={
                      w.precipitation === kind
                        ? { background: "var(--dfp-accent)", borderColor: "var(--dfp-accent-dark)", color: "#2a1a02" }
                        : undefined
                    }
                    onClick={() => commit({ precipitation: kind })}
                  >
                    {PRECIPITATION_LABEL[kind]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <input type="checkbox" checked={w.fogEnabled} onChange={(e) => commit({ fogEnabled: e.target.checked })} />
                <span className="dfp-label" style={{ marginBottom: 0 }}>
                  Fog
                </span>
              </label>
              {w.fogEnabled && (
                <div style={{ paddingLeft: 4 }}>
                  <HSlider
                    label="Visibility"
                    value={w.fogVisibilityFt}
                    min={0}
                    max={3000}
                    step={10}
                    unit=" ft"
                    onChange={(v) => commit({ fogVisibilityFt: v })}
                  />
                  <HSlider
                    label="Thickness"
                    value={w.fogThicknessFt}
                    min={0}
                    max={3000}
                    step={10}
                    unit=" ft"
                    onChange={(v) => commit({ fogThicknessFt: v })}
                  />
                </div>
              )}

              <label style={{ display: "flex", alignItems: "center", gap: 8, margin: "16px 0 8px" }}>
                <input type="checkbox" checked={w.dustEnabled} onChange={(e) => commit({ dustEnabled: e.target.checked })} />
                <span className="dfp-label" style={{ marginBottom: 0 }}>
                  Dust
                </span>
              </label>
              {w.dustEnabled && (
                <div style={{ paddingLeft: 4 }}>
                  <HSlider
                    label="Visibility"
                    value={w.dustVisibilityFt}
                    min={0}
                    max={10000}
                    step={50}
                    unit=" ft"
                    onChange={(v) => commit({ dustVisibilityFt: v })}
                  />
                </div>
              )}

              <div style={{ marginTop: 16 }}>
                <HSlider
                  label="Turbulence"
                  value={w.turbulence}
                  min={0}
                  max={10}
                  step={1}
                  unit=" ft/s"
                  onChange={(v) => commit({ turbulence: v })}
                />
                <HSlider
                  label="Temperature"
                  value={w.temperatureC}
                  min={-40}
                  max={50}
                  step={1}
                  unit="°C"
                  onChange={(v) => commit({ temperatureC: v })}
                />
              </div>

              <div className="dfp-label" style={{ margin: "16px 0 6px" }}>
                QNH (hPa)
              </div>
              <input
                type="number"
                className="dfp-input"
                value={w.qnhHpa}
                step={1}
                onChange={(e) => {
                  const v = Number.parseFloat(e.target.value);
                  if (Number.isFinite(v)) commit({ qnhHpa: v });
                }}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: 20,
              padding: "10px 14px",
              background: "var(--dfp-bg)",
              border: "1px solid var(--dfp-border)",
              borderRadius: "var(--dfp-radius)",
              fontFamily: "var(--dfp-font-mono)",
              fontSize: 13,
            }}
          >
            {summarizeWeatherMetar(w)}
          </div>
        </div>
      </div>
    </div>
  );
}
