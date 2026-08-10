import type { MissionDate, MissionWeather } from "@dcs-flight-planner/core";
import { Field } from "./FormField";

interface MissionSettingsDialogProps {
  missionName: string;
  date: MissionDate | undefined;
  weather: MissionWeather | undefined;
  onChangeDate: (date: MissionDate | undefined) => void;
  onChangeWeather: (weather: MissionWeather) => void;
  onClose: () => void;
}

function NumberField({
  label,
  value,
  onCommit,
  step = 1,
}: {
  label: string;
  value: number | undefined;
  onCommit: (v: number | undefined) => void;
  step?: number;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        step={step}
        defaultValue={value ?? ""}
        key={value ?? "empty"}
        className="dfp-input"
        onBlur={(e) => {
          if (e.target.value.trim() === "") {
            onCommit(undefined);
            return;
          }
          const v = Number.parseFloat(e.target.value);
          if (Number.isFinite(v)) onCommit(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
      />
    </Field>
  );
}

export function MissionSettingsDialog({ missionName, date, weather, onChangeDate, onChangeWeather, onClose }: MissionSettingsDialogProps) {
  function commitDate(patch: Partial<MissionDate>) {
    const base: MissionDate = date ?? { day: 1, month: 1, year: 2025 };
    onChangeDate({ ...base, ...patch });
  }

  function commitWeather(patch: Partial<MissionWeather>) {
    onChangeWeather({ ...(weather ?? {}), ...patch });
  }

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
          width: "min(480px, 92vw)",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div className="dfp-panel-header">
          <span>Date &amp; weather — {missionName}</span>
          <button type="button" className="dfp-panel-header-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div style={{ padding: "14px 18px", overflowY: "auto", flex: 1 }}>
          <div className="dfp-label" style={{ margin: "0 0 6px" }}>
            Date
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <NumberField label="Day" value={date?.day} step={1} onCommit={(v) => commitDate({ day: v ?? 1 })} />
            <NumberField label="Month" value={date?.month} step={1} onCommit={(v) => commitDate({ month: v ?? 1 })} />
            <NumberField label="Year" value={date?.year} step={1} onCommit={(v) => commitDate({ year: v ?? 2025 })} />
          </div>

          <div className="dfp-label" style={{ margin: "14px 0 6px" }}>
            Weather
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <NumberField label="Temperature (°C)" value={weather?.temperatureC} step={1} onCommit={(v) => commitWeather({ temperatureC: v })} />
            <NumberField label="QNH (inHg)" value={weather?.qnhInHg} step={0.01} onCommit={(v) => commitWeather({ qnhInHg: v })} />
            <NumberField label="Wind speed (kt)" value={weather?.windSpeedKt} step={1} onCommit={(v) => commitWeather({ windSpeedKt: v })} />
            <NumberField
              label="Wind direction (° from)"
              value={weather?.windDirectionDeg}
              step={1}
              onCommit={(v) => commitWeather({ windDirectionDeg: v })}
            />
            <NumberField label="Visibility (km)" value={weather?.visibilityKm} step={0.5} onCommit={(v) => commitWeather({ visibilityKm: v })} />
            <NumberField label="Cloud base (ft)" value={weather?.cloudBaseFt} step={100} onCommit={(v) => commitWeather({ cloudBaseFt: v })} />
            <NumberField
              label="Cloud coverage (oktas)"
              value={weather?.cloudCoverageOktas}
              step={1}
              onCommit={(v) => commitWeather({ cloudCoverageOktas: v })}
            />
            <NumberField label="Turbulence" value={weather?.turbulence} step={1} onCommit={(v) => commitWeather({ turbulence: v })} />
          </div>
        </div>
      </div>
    </div>
  );
}
