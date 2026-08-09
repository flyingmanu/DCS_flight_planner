import {
  DEFAULT_FLIGHT_COLOR,
  TASK_TYPE_LABEL,
  type Airbase,
  type Flight,
  type TaskType,
} from "@dcs-flight-planner/core";
import { useState, type ReactNode } from "react";
import { ColorField } from "./ColorField";

interface FlightFormDialogProps {
  airbases: Airbase[];
  /** Present when editing an existing flight; absent when creating one. */
  initial?: Flight;
  onSave: (flight: Flight) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

const TASK_TYPES = Object.keys(TASK_TYPE_LABEL) as TaskType[];

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span className="dfp-label">{label}</span>
      {children}
    </label>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>{children}</div>;
}

export function FlightFormDialog({ airbases, initial, onSave, onDelete, onCancel }: FlightFormDialogProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [aircraftType, setAircraftType] = useState(initial?.aircraftType ?? "");
  const [size, setSize] = useState(initial?.size ?? 2);
  const [taskType, setTaskType] = useState<TaskType>(initial?.taskType ?? "CAP");
  const [departureAirbaseId, setDepartureAirbaseId] = useState(initial?.departureAirbaseId ?? "");
  const [arrivalAirbaseId, setArrivalAirbaseId] = useState(initial?.arrivalAirbaseId ?? "");
  const [alternateAirbaseId, setAlternateAirbaseId] = useState(initial?.alternateAirbaseId ?? "");
  const [takeoffTime, setTakeoffTime] = useState(initial?.takeoffTime ?? "");
  const [tacanChannel, setTacanChannel] = useState(initial?.tacanChannel ?? "");
  const [radioFrequencyMhz, setRadioFrequencyMhz] = useState(initial?.radioFrequencyMhz ?? "");
  const [iffMode1, setIffMode1] = useState(initial?.iffMode1 ?? "");
  const [iffMode3, setIffMode3] = useState(initial?.iffMode3 ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [color, setColor] = useState(initial?.color ?? DEFAULT_FLIGHT_COLOR);

  const sortedAirbases = [...airbases].sort((a, b) => a.name.localeCompare(b.name));

  function airbaseSelect(value: string, onChange: (id: string) => void) {
    return (
      <select className="dfp-select" style={{ width: "100%" }} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {sortedAirbases.map((ab) => (
          <option key={ab.id} value={ab.id}>
            {ab.name}
          </option>
        ))}
      </select>
    );
  }

  function save() {
    const flight: Flight = {
      id: initial?.id ?? crypto.randomUUID(),
      name: name.trim() || "New flight",
      aircraftType: aircraftType.trim(),
      size,
      taskType,
      departureAirbaseId: departureAirbaseId || undefined,
      arrivalAirbaseId: arrivalAirbaseId || undefined,
      alternateAirbaseId: alternateAirbaseId || undefined,
      takeoffTime: takeoffTime.trim() || undefined,
      tacanChannel: tacanChannel.trim() || undefined,
      radioFrequencyMhz: radioFrequencyMhz.trim() || undefined,
      iffMode1: iffMode1.trim() || undefined,
      iffMode3: iffMode3.trim() || undefined,
      notes: notes.trim() || undefined,
      color,
    };
    onSave(flight);
  }

  return (
    <div
      className="dfp-scrim"
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 20,
      }}
    >
      <div
        className="dfp-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          borderRadius: "var(--dfp-radius-lg)",
          width: 560,
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div className="dfp-panel-header">
          <span>{initial ? "Edit flight" : "New flight"}</span>
          <button type="button" className="dfp-panel-header-close" onClick={onCancel}>
            ×
          </button>
        </div>

        <div style={{ padding: 18, overflowY: "auto", flex: 1 }}>
          <Row>
            <div style={{ gridColumn: "span 2" }}>
              <Field label="Callsign / flight">
                <input
                  type="text"
                  className="dfp-input"
                  placeholder="e.g. Enfield 1-1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </Field>
            </div>
            <Field label="Size">
              <input
                type="number"
                min={1}
                max={16}
                className="dfp-input"
                value={size}
                onChange={(e) => setSize(Math.max(1, Number.parseInt(e.target.value, 10) || 1))}
              />
            </Field>
          </Row>

          <Row>
            <div style={{ gridColumn: "span 2" }}>
              <Field label="Aircraft type">
                <input
                  type="text"
                  className="dfp-input"
                  placeholder="e.g. F/A-18C"
                  value={aircraftType}
                  onChange={(e) => setAircraftType(e.target.value)}
                />
              </Field>
            </div>
            <Field label="Task">
              <select className="dfp-select" style={{ width: "100%" }} value={taskType} onChange={(e) => setTaskType(e.target.value as TaskType)}>
                {TASK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TASK_TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </Field>
          </Row>

          <Row>
            <Field label="Departure">{airbaseSelect(departureAirbaseId, setDepartureAirbaseId)}</Field>
            <Field label="Arrival">{airbaseSelect(arrivalAirbaseId, setArrivalAirbaseId)}</Field>
            <Field label="Alternate">{airbaseSelect(alternateAirbaseId, setAlternateAirbaseId)}</Field>
          </Row>

          <Row>
            <Field label="Takeoff time">
              <input type="text" className="dfp-input dfp-input-mono" placeholder="HH:MM" value={takeoffTime} onChange={(e) => setTakeoffTime(e.target.value)} />
            </Field>
            <Field label="TACAN">
              <input type="text" className="dfp-input dfp-input-mono" placeholder="e.g. 10X" value={tacanChannel} onChange={(e) => setTacanChannel(e.target.value)} />
            </Field>
            <Field label="Radio (MHz)">
              <input
                type="text"
                className="dfp-input dfp-input-mono"
                placeholder="e.g. 251.0"
                value={radioFrequencyMhz}
                onChange={(e) => setRadioFrequencyMhz(e.target.value)}
              />
            </Field>
          </Row>

          <Row>
            <Field label="IFF Mode 1">
              <input type="text" className="dfp-input dfp-input-mono" value={iffMode1} onChange={(e) => setIffMode1(e.target.value)} />
            </Field>
            <Field label="IFF Mode 3">
              <input type="text" className="dfp-input dfp-input-mono" value={iffMode3} onChange={(e) => setIffMode3(e.target.value)} />
            </Field>
            <Field label="Color">
              <ColorField value={color} onChange={setColor} />
            </Field>
          </Row>

          <Field label="Notes">
            <textarea
              className="dfp-input"
              rows={3}
              style={{ resize: "vertical", fontFamily: "var(--dfp-font-sans)" }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", padding: 16, borderTop: "1px solid var(--dfp-border)" }}>
          <div>
            {onDelete && (
              <button type="button" className="dfp-btn dfp-btn-danger" onClick={onDelete}>
                Delete
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="dfp-btn" onClick={onCancel}>
              Cancel
            </button>
            <button type="button" className="dfp-btn dfp-btn-accent" onClick={save}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
