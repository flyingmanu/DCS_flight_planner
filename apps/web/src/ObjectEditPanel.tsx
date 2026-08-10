import {
  DEFAULT_LABEL_BORDER_COLOR,
  DEFAULT_LABEL_COLOR,
  DEFAULT_LABEL_FILL_COLOR,
  DEFAULT_LABEL_FONT_SIZE_PX,
  DEFAULT_LINE_COLOR,
  DEFAULT_ORBIT_TURN_RADIUS_NM,
  DEFAULT_POINT_COLOR,
  DEFAULT_POLYGON_COLOR,
  fromLocalMeters,
  metersToNm,
  nmToMeters,
  POINT_KIND_LABEL,
  toLocalMeters,
  type Dmpi,
  type MissionObject,
} from "@dcs-flight-planner/core";
import { ColorField } from "./ColorField";
import { CoordinateFields } from "./CoordinateFields";
import { Field } from "./FormField";

interface ObjectEditPanelProps {
  object: MissionObject;
  onChange: (updated: MissionObject) => void;
  onDelete: () => void;
  onClose: () => void;
  onResetDmpiElevation: () => void;
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

export function ObjectEditPanel({ object, onChange, onDelete, onClose, onResetDmpiElevation }: ObjectEditPanelProps) {
  const defaultColor =
    object.type === "point"
      ? DEFAULT_POINT_COLOR[object.kind]
      : object.type === "label"
        ? DEFAULT_LABEL_COLOR
        : object.type === "line"
          ? DEFAULT_LINE_COLOR
          : DEFAULT_POLYGON_COLOR;

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
        <Field label={object.type === "label" ? "Text" : "Name"}>
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

        <Field label={object.type === "label" ? "Text color" : "Color"}>
          <ColorField value={object.color ?? defaultColor} onChange={(color) => onChange({ ...object, color })} />
        </Field>

        <Field label="Notes">
          <textarea
            defaultValue={object.notes ?? ""}
            key={`${object.id}-notes`}
            className="dfp-input"
            rows={3}
            style={{ resize: "vertical", fontFamily: "inherit" }}
            onBlur={(e) => onChange({ ...object, notes: e.target.value || undefined })}
          />
        </Field>

        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 14 }}>
          <input type="checkbox" checked={object.locked ?? false} onChange={(e) => onChange({ ...object, locked: e.target.checked })} />
          Locked (prevents dragging on the map)
        </label>

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

        {object.type === "polygon" && (
          <>
            <NumberField
              label="Min altitude (ft)"
              step={100}
              value={object.minAltFt ?? 0}
              onCommit={(minAltFt) => onChange({ ...object, minAltFt })}
            />
            <NumberField
              label="Max altitude (ft)"
              step={100}
              value={object.maxAltFt ?? 0}
              onCommit={(maxAltFt) => onChange({ ...object, maxAltFt })}
            />
            <NumberField
              label="Frequency (MHz)"
              step={0.025}
              value={object.frequencyMhz ?? 0}
              onCommit={(frequencyMhz) => onChange({ ...object, frequencyMhz })}
            />
          </>
        )}

        {object.type === "label" && (
          <>
            <CoordinateFields point={object.position} onChange={(position) => onChange({ ...object, position })} />

            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 10 }}>
              <input type="checkbox" checked={object.bold ?? false} onChange={(e) => onChange({ ...object, bold: e.target.checked })} />
              Bold
            </label>

            <Field label="Fill color">
              <ColorField value={object.fillColor ?? DEFAULT_LABEL_FILL_COLOR} onChange={(fillColor) => onChange({ ...object, fillColor })} />
            </Field>

            <Field label="Border color">
              <ColorField value={object.borderColor ?? DEFAULT_LABEL_BORDER_COLOR} onChange={(borderColor) => onChange({ ...object, borderColor })} />
            </Field>

            <NumberField
              label="Font size (px)"
              step={1}
              value={object.fontSizePx ?? DEFAULT_LABEL_FONT_SIZE_PX}
              onCommit={(fontSizePx) => onChange({ ...object, fontSizePx: Math.max(6, Math.round(fontSizePx)) })}
            />
          </>
        )}
      </div>

      <div style={{ padding: 16, borderTop: "1px solid var(--dfp-border)" }}>
        <button type="button" className="dfp-btn dfp-btn-danger" onClick={onDelete} style={{ width: "100%" }}>
          Delete
        </button>
      </div>
    </div>
  );
}
