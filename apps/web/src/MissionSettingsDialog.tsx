import type { MissionDate } from "@dcs-flight-planner/core";
import { Field } from "./FormField";

interface MissionSettingsDialogProps {
  missionName: string;
  date: MissionDate | undefined;
  onChangeDate: (date: MissionDate | undefined) => void;
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

export function MissionSettingsDialog({ missionName, date, onChangeDate, onClose }: MissionSettingsDialogProps) {
  function commitDate(patch: Partial<MissionDate>) {
    const base: MissionDate = date ?? { day: 1, month: 1, year: 2025 };
    onChangeDate({ ...base, ...patch });
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
          <span>Date — {missionName}</span>
          <button type="button" className="dfp-panel-header-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div style={{ padding: "14px 18px", overflowY: "auto", flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <NumberField label="Day" value={date?.day} step={1} onCommit={(v) => commitDate({ day: v ?? 1 })} />
            <NumberField label="Month" value={date?.month} step={1} onCommit={(v) => commitDate({ month: v ?? 1 })} />
            <NumberField label="Year" value={date?.year} step={1} onCommit={(v) => commitDate({ year: v ?? 2025 })} />
          </div>
        </div>
      </div>
    </div>
  );
}
