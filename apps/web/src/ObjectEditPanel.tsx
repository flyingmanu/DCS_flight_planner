import {
  DEFAULT_ORBIT_TURN_RADIUS_NM,
  DEFAULT_POINT_COLOR,
  DEFAULT_POLYGON_COLOR,
  formatLatDdm,
  formatLonDdm,
  fromLocalMeters,
  metersToNm,
  nmToMeters,
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
    <label style={{ display: "block", marginBottom: 12 }}>
      <span className="dfp-label">{label}</span>
      {children}
    </label>
  );
}

function NumberField({ label, value, onCommit, step = 0.0001 }: { label: string; value: number; onCommit: (v: number) => void; step?: number }) {
  return (
    <Field label={label}>
      <input
        type="number"
        step={step}
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
        className="dfp-input dfp-input-mono"
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
          className="dfp-select"
          value={preset ? preset.hex : "custom"}
          onChange={(e) => {
            if (e.target.value !== "custom") onChange(e.target.value);
          }}
          style={{ flex: 1 }}
        >
          <option value="custom">Custom…</option>
          {PRESET_COLORS.map((p) => (
            <option key={p.hex} value={p.hex}>
              {p.label}
            </option>
          ))}
        </select>
        <input type="color" className="dfp-color-swatch" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </Field>
  );
}

export function ObjectEditPanel({ object, onChange, onDelete, onClose, onResetDmpiElevation }: ObjectEditPanelProps) {
  const defaultColor =
    object.type === "point" ? DEFAULT_POINT_COLOR[object.kind] : DEFAULT_POLYGON_COLOR;

  return (
    <div
      className="dfp-panel"
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: 300,
        borderLeft: "none",
        zIndex: 15,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="dfp-panel-header">
        <span>Properties</span>
        <button type="button" onClick={onClose} title="Close" className="dfp-panel-header-close">
          ×
        </button>
      </div>

      <div style={{ padding: 16, overflowY: "auto", flex: 1 }}>
        <Field label="Name">
          <input
            type="text"
            defaultValue={object.name}
            key={object.id}
            className="dfp-input"
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
            <div
              style={{
                display: "inline-block",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.03em",
                textTransform: "uppercase",
                color: "var(--dfp-navy-900)",
                background: "var(--dfp-blue-soft)",
                borderRadius: 999,
                padding: "3px 10px",
                marginBottom: 14,
              }}
            >
              {POINT_KIND_LABEL[point.kind]}
            </div>
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
                        className="dfp-btn"
                        onClick={onResetDmpiElevation}
                        style={{ width: "100%", marginBottom: 12 }}
                      >
                        ⤓ Reset to ground level
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
                    label="Width (NM)"
                    step={0.1}
                    value={metersToNm(Math.abs(size.x))}
                    onCommit={(widthNm) =>
                      onChange({
                        ...polygon,
                        shape: { ...shape, corner2: fromLocalMeters(shape.corner1, { x: Math.sign(size.x || 1) * nmToMeters(widthNm), y: size.y }) },
                      })
                    }
                  />
                  <NumberField
                    label="Height (NM)"
                    step={0.1}
                    value={metersToNm(Math.abs(size.y))}
                    onCommit={(heightNm) =>
                      onChange({
                        ...polygon,
                        shape: { ...shape, corner2: fromLocalMeters(shape.corner1, { x: size.x, y: Math.sign(size.y || 1) * nmToMeters(heightNm) }) },
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
                    label="Radius (NM)"
                    step={0.1}
                    value={metersToNm(shape.radiusM)}
                    onCommit={(radiusNm) => onChange({ ...polygon, shape: { ...shape, radiusM: nmToMeters(radiusNm) } })}
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

      <div style={{ padding: 16, borderTop: "1px solid var(--dfp-border)" }}>
        <button type="button" className="dfp-btn dfp-btn-danger" onClick={onDelete} style={{ width: "100%" }}>
          Delete
        </button>
      </div>
    </div>
  );
}
