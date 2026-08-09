import {
  DEFAULT_ORBIT_TURN_RADIUS_NM,
  DEFAULT_POINT_COLOR,
  DEFAULT_POLYGON_COLOR,
  formatLatDdm,
  formatLonDdm,
  fromLocalMeters,
  parseLatDdm,
  parseLonDdm,
  POINT_KIND_LABEL,
  toLocalMeters,
  type Dmpi,
  type LatLon,
  type MissionObject,
} from "@dcs-flight-planner/core";
import type { ReactNode } from "react";

interface ObjectEditPanelProps {
  object: MissionObject;
  onChange: (updated: MissionObject) => void;
  onDelete: () => void;
  onClose: () => void;
  onResetDmpiElevation: () => void;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 10, fontSize: 12 }}>
      <span style={{ display: "block", color: "#555", marginBottom: 2 }}>{label}</span>
      {children}
    </label>
  );
}

const numberInputStyle = { width: "100%", padding: 4, boxSizing: "border-box" as const, fontSize: 13 };

function NumberField({ label, value, onCommit, step = 0.0001 }: { label: string; value: number; onCommit: (v: number) => void; step?: number }) {
  return (
    <Field label={label}>
      <input
        type="number"
        step={step}
        defaultValue={value}
        key={value}
        style={numberInputStyle}
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

function DdmField({
  label,
  value,
  format,
  parse,
  onCommit,
}: {
  label: string;
  value: number;
  format: (v: number) => string;
  parse: (s: string) => number | null;
  onCommit: (v: number) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="text"
        defaultValue={format(value)}
        key={value}
        style={{ ...numberInputStyle, fontFamily: "ui-monospace, Consolas, monospace" }}
        onBlur={(e) => {
          const parsed = parse(e.target.value);
          if (parsed !== null) {
            onCommit(parsed);
          } else {
            e.target.value = format(value);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
      />
    </Field>
  );
}

function CoordinateFields({ point, onChange }: { point: LatLon; onChange: (p: LatLon) => void }) {
  return (
    <>
      <DdmField label="Latitude" value={point.lat} format={formatLatDdm} parse={parseLatDdm} onCommit={(lat) => onChange({ ...point, lat })} />
      <DdmField label="Longitude" value={point.lon} format={formatLonDdm} parse={parseLonDdm} onCommit={(lon) => onChange({ ...point, lon })} />
    </>
  );
}

// A reasonable spread of ~20 standard colors, in addition to the free-form
// native color picker for a precise choice.
const PRESET_COLORS: { label: string; hex: string }[] = [
  { label: "Red", hex: "#dc2626" },
  { label: "Orange", hex: "#ea580c" },
  { label: "Amber", hex: "#d97706" },
  { label: "Yellow", hex: "#ca8a04" },
  { label: "Lime", hex: "#65a30d" },
  { label: "Green", hex: "#16a34a" },
  { label: "Emerald", hex: "#059669" },
  { label: "Teal", hex: "#0d9488" },
  { label: "Cyan", hex: "#0891b2" },
  { label: "Sky", hex: "#0284c7" },
  { label: "Blue", hex: "#2563eb" },
  { label: "Indigo", hex: "#4f46e5" },
  { label: "Violet", hex: "#7c3aed" },
  { label: "Purple", hex: "#9333ea" },
  { label: "Fuchsia", hex: "#c026d3" },
  { label: "Pink", hex: "#db2777" },
  { label: "Rose", hex: "#e11d48" },
  { label: "Slate", hex: "#475569" },
  { label: "Black", hex: "#1a1a1a" },
  { label: "White", hex: "#ffffff" },
];

function ColorField({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const preset = PRESET_COLORS.find((p) => p.hex.toLowerCase() === value.toLowerCase());
  return (
    <Field label="Color">
      <div style={{ display: "flex", gap: 6 }}>
        <select
          value={preset ? preset.hex : "custom"}
          onChange={(e) => {
            if (e.target.value !== "custom") onChange(e.target.value);
          }}
          style={{ flex: 1, padding: 4, fontSize: 13 }}
        >
          <option value="custom">Custom…</option>
          {PRESET_COLORS.map((p) => (
            <option key={p.hex} value={p.hex}>
              {p.label}
            </option>
          ))}
        </select>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 36, height: 28, padding: 0, border: "1px solid #ccc" }}
        />
      </div>
    </Field>
  );
}

export function ObjectEditPanel({ object, onChange, onDelete, onClose, onResetDmpiElevation }: ObjectEditPanelProps) {
  const defaultColor =
    object.type === "point" ? DEFAULT_POINT_COLOR[object.kind] : DEFAULT_POLYGON_COLOR;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: 280,
        background: "#fff",
        borderLeft: "1px solid #ccc",
        boxShadow: "-2px 0 8px rgba(0,0,0,0.15)",
        zIndex: 15,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          borderBottom: "1px solid #eee",
        }}
      >
        <strong style={{ fontSize: 13 }}>Properties</strong>
        <button type="button" onClick={onClose} title="Close" style={{ border: "none", background: "none", cursor: "pointer", fontSize: 16 }}>
          ×
        </button>
      </div>

      <div style={{ padding: 12, overflowY: "auto", flex: 1 }}>
        <Field label="Name">
          <input
            type="text"
            defaultValue={object.name}
            key={object.id}
            style={numberInputStyle}
            onBlur={(e) => onChange({ ...object, name: e.target.value.trim() || object.name })}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
          />
        </Field>

        <ColorField value={object.color ?? defaultColor} onChange={(color) => onChange({ ...object, color })} />

        {object.type === "point" && (
          <>
            {(() => {
              const point = object;
              return (
                <>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 8 }}>{POINT_KIND_LABEL[point.kind]}</div>
            <CoordinateFields point={point.position} onChange={(position) => onChange({ ...point, position })} />

            {point.kind === "target" &&
              (() => {
                const dmpi = point.dmpis?.[0];
                const elevationFt = dmpi?.elevationFt ?? 0;
                const isManual = dmpi?.elevationManual ?? false;

                function commitElevation(elevationFt: number) {
                  const updated: Dmpi = dmpi
                    ? { ...dmpi, elevationFt, elevationManual: true }
                    : { id: crypto.randomUUID(), name: point.name, position: point.position, elevationFt, elevationManual: true };
                  onChange({ ...point, dmpis: [updated, ...(point.dmpis?.slice(1) ?? [])] });
                }

                return (
                  <>
                    <NumberField label={isManual ? "DMPI altitude (ft)" : "DMPI altitude (ft) — ground"} step={1} value={elevationFt} onCommit={commitElevation} />
                    {isManual && (
                      <button
                        type="button"
                        onClick={onResetDmpiElevation}
                        style={{ width: "100%", padding: 5, marginBottom: 10, fontSize: 12, cursor: "pointer" }}
                      >
                        Reset to ground level
                      </button>
                    )}
                  </>
                );
              })()}
                </>
              );
            })()}
          </>
        )}

        {object.type === "polygon" &&
          (() => {
            const polygon = object;
            const shape = polygon.shape;

            if (shape.kind === "rectangle") {
              const size = toLocalMeters(shape.corner1, shape.corner2);
              return (
                <>
                  <CoordinateFields
                    point={shape.corner1}
                    onChange={(corner1) => {
                      // Translate both corners by the same offset, so editing
                      // coordinates moves the rectangle without resizing it.
                      const corner2 = fromLocalMeters(corner1, size);
                      onChange({ ...polygon, shape: { ...shape, corner1, corner2 } });
                    }}
                  />
                  <NumberField
                    label="Width (m)"
                    step={1}
                    value={Math.abs(size.x)}
                    onCommit={(width) =>
                      onChange({
                        ...polygon,
                        shape: { ...shape, corner2: fromLocalMeters(shape.corner1, { x: Math.sign(size.x || 1) * width, y: size.y }) },
                      })
                    }
                  />
                  <NumberField
                    label="Height (m)"
                    step={1}
                    value={Math.abs(size.y)}
                    onCommit={(height) =>
                      onChange({
                        ...polygon,
                        shape: { ...shape, corner2: fromLocalMeters(shape.corner1, { x: size.x, y: Math.sign(size.y || 1) * height }) },
                      })
                    }
                  />
                  <NumberField
                    label="Orientation (°)"
                    step={1}
                    value={shape.rotationDeg}
                    onCommit={(rotationDeg) => onChange({ ...polygon, shape: { ...shape, rotationDeg } })}
                  />
                </>
              );
            }

            if (shape.kind === "circle") {
              return (
                <>
                  <CoordinateFields point={shape.center} onChange={(center) => onChange({ ...polygon, shape: { ...shape, center } })} />
                  <NumberField
                    label="Radius (m)"
                    step={1}
                    value={shape.radiusM}
                    onCommit={(radiusM) => onChange({ ...polygon, shape: { ...shape, radiusM } })}
                  />
                </>
              );
            }

            if (shape.kind === "orbit") {
              return (
                <>
                  <CoordinateFields point={shape.center} onChange={(center) => onChange({ ...polygon, shape: { ...shape, center } })} />
                  <NumberField
                    label="Course / orientation (°)"
                    step={1}
                    value={shape.courseDeg}
                    onCommit={(courseDeg) => onChange({ ...polygon, shape: { ...shape, courseDeg } })}
                  />
                  <NumberField
                    label="Leg length (NM)"
                    step={0.5}
                    value={shape.legLengthNm}
                    onCommit={(legLengthNm) => onChange({ ...polygon, shape: { ...shape, legLengthNm } })}
                  />
                  <NumberField
                    label="Turn radius (NM)"
                    step={0.1}
                    value={shape.turnRadiusNm ?? DEFAULT_ORBIT_TURN_RADIUS_NM}
                    onCommit={(turnRadiusNm) => onChange({ ...polygon, shape: { ...shape, turnRadiusNm } })}
                  />
                </>
              );
            }

            return null;
          })()}
      </div>

      <div style={{ padding: 12, borderTop: "1px solid #eee" }}>
        <button
          type="button"
          onClick={onDelete}
          style={{ width: "100%", padding: 6, color: "#c02020", cursor: "pointer" }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
