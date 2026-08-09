import {
  DEFAULT_ORBIT_TURN_RADIUS_NM,
  DEFAULT_POINT_COLOR,
  DEFAULT_POLYGON_COLOR,
  fromLocalMeters,
  POINT_KIND_LABEL,
  toLocalMeters,
  type LatLon,
  type MissionObject,
} from "@dcs-flight-planner/core";
import type { ReactNode } from "react";

interface ObjectEditPanelProps {
  object: MissionObject;
  onChange: (updated: MissionObject) => void;
  onDelete: () => void;
  onClose: () => void;
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

function CoordinateFields({ point, onChange }: { point: LatLon; onChange: (p: LatLon) => void }) {
  return (
    <>
      <NumberField label="Latitude" value={point.lat} onCommit={(lat) => onChange({ ...point, lat })} />
      <NumberField label="Longitude" value={point.lon} onCommit={(lon) => onChange({ ...point, lon })} />
    </>
  );
}

export function ObjectEditPanel({ object, onChange, onDelete, onClose }: ObjectEditPanelProps) {
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

        <Field label="Color">
          <input
            type="color"
            value={object.color ?? defaultColor}
            onChange={(e) => onChange({ ...object, color: e.target.value })}
            style={{ width: "100%", height: 28, padding: 0, border: "1px solid #ccc" }}
          />
        </Field>

        {object.type === "point" && (
          <>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 8 }}>{POINT_KIND_LABEL[object.kind]}</div>
            <CoordinateFields point={object.position} onChange={(position) => onChange({ ...object, position })} />

            {object.kind === "target" && (
              <NumberField
                label="DMPI altitude (ft)"
                step={1}
                value={object.dmpis?.[0]?.elevationFt ?? 0}
                onCommit={(elevationFt) => {
                  const dmpi = object.dmpis?.[0];
                  const dmpis = dmpi
                    ? [{ ...dmpi, elevationFt }, ...(object.dmpis?.slice(1) ?? [])]
                    : [{ id: crypto.randomUUID(), name: object.name, position: object.position, elevationFt }];
                  onChange({ ...object, dmpis });
                }}
              />
            )}
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
