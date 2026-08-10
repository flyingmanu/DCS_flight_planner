import type { MissionBriefing } from "@dcs-flight-planner/core";
import { Field } from "./FormField";

interface BriefingDialogProps {
  missionName: string;
  briefing: MissionBriefing;
  onChange: (updated: MissionBriefing) => void;
  onClose: () => void;
}

function BriefingTextarea({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: string;
  onCommit: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <textarea
        defaultValue={value}
        key={value}
        className="dfp-input"
        rows={5}
        style={{ resize: "vertical", fontFamily: "inherit" }}
        onBlur={(e) => onCommit(e.target.value)}
      />
    </Field>
  );
}

export function BriefingDialog({ missionName, briefing, onChange, onClose }: BriefingDialogProps) {
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
          width: "min(720px, 92vw)",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div className="dfp-panel-header">
          <span>Briefing — {missionName}</span>
          <button type="button" className="dfp-panel-header-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div style={{ padding: "14px 18px", overflowY: "auto", flex: 1 }}>
          <BriefingTextarea label="Situation" value={briefing.situation ?? ""} onCommit={(situation) => onChange({ ...briefing, situation })} />
          <BriefingTextarea label="Blue briefing" value={briefing.blue ?? ""} onCommit={(blue) => onChange({ ...briefing, blue })} />
          <BriefingTextarea label="Red briefing" value={briefing.red ?? ""} onCommit={(red) => onChange({ ...briefing, red })} />
          <BriefingTextarea label="Neutral briefing" value={briefing.neutral ?? ""} onCommit={(neutral) => onChange({ ...briefing, neutral })} />
        </div>
      </div>
    </div>
  );
}
