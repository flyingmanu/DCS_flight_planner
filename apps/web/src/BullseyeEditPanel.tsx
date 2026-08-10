import { DEFAULT_BULLSEYE_COLOR, SIDE_LABEL, type Bullseye } from "@dcs-flight-planner/core";
import { ColorField } from "./ColorField";
import { CoordinateFields } from "./CoordinateFields";
import { Field } from "./FormField";

interface BullseyeEditPanelProps {
  bullseye: Bullseye;
  onChange: (updated: Bullseye) => void;
  onDelete: () => void;
  onClose: () => void;
}

function NumberField({
  label,
  value,
  onCommit,
  step = 1,
  min,
}: {
  label: string;
  value: number;
  onCommit: (v: number) => void;
  step?: number;
  min?: number;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        step={step}
        min={min}
        defaultValue={value}
        key={value}
        className="dfp-input"
        onBlur={(e) => {
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

export function BullseyeEditPanel({ bullseye, onChange, onDelete, onClose }: BullseyeEditPanelProps) {
  return (
    <div
      className="dfp-panel"
      style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 300, borderLeft: "none", zIndex: 15, display: "flex", flexDirection: "column" }}
    >
      <div className="dfp-panel-header">
        <span>{SIDE_LABEL[bullseye.side]} Bullseye</span>
        <button type="button" onClick={onClose} title="Close" className="dfp-panel-header-close">
          ×
        </button>
      </div>

      <div style={{ padding: 16, overflowY: "auto", flex: 1 }}>
        <Field label="Color">
          <ColorField value={bullseye.color ?? DEFAULT_BULLSEYE_COLOR[bullseye.side]} onChange={(color) => onChange({ ...bullseye, color })} />
        </Field>

        <CoordinateFields point={bullseye.position} onChange={(position) => onChange({ ...bullseye, position })} />

        <NumberField label="Outer ring (NM)" step={5} min={1} value={bullseye.outerRingNm} onCommit={(outerRingNm) => onChange({ ...bullseye, outerRingNm })} />
        <NumberField label="Number of rings" step={1} min={1} value={bullseye.rings} onCommit={(rings) => onChange({ ...bullseye, rings: Math.max(1, Math.round(rings)) })} />
        <NumberField label="Number of spokes" step={1} min={2} value={bullseye.spokes} onCommit={(spokes) => onChange({ ...bullseye, spokes: Math.max(2, Math.round(spokes)) })} />

        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 10 }}>
          <input type="checkbox" checked={bullseye.showName ?? true} onChange={(e) => onChange({ ...bullseye, showName: e.target.checked })} />
          Show name
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 10 }}>
          <input
            type="checkbox"
            checked={bullseye.showRangeLabels ?? true}
            onChange={(e) => onChange({ ...bullseye, showRangeLabels: e.target.checked })}
          />
          Show range labels
        </label>
      </div>

      <div style={{ padding: 16, borderTop: "1px solid var(--dfp-border)" }}>
        <button type="button" className="dfp-btn dfp-btn-danger" onClick={onDelete} style={{ width: "100%" }}>
          Delete
        </button>
      </div>
    </div>
  );
}
