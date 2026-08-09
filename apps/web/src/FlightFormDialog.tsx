import {
  AIRCRAFT_CATALOG,
  DEFAULT_FLIGHT_COLOR,
  findAircraft,
  TASK_TYPE_LABEL,
  type Airbase,
  type Flight,
  type LatLon,
  type TaskType,
  type Waypoint,
} from "@dcs-flight-planner/core";
import type { ReactNode } from "react";
import { ColorField } from "./ColorField";
import { CoordinateFields } from "./CoordinateFields";
import { Field } from "./FormField";

interface FlightFormDialogProps {
  airbases: Airbase[];
  flight: Flight;
  onChange: (updated: Flight) => void;
  onSave: () => void;
  onDelete?: () => void;
  onCancel: () => void;
  onAddWaypointOnMap: () => void;
  isNew: boolean;
}

const TASK_TYPES = Object.keys(TASK_TYPE_LABEL) as TaskType[];

const PLAYABLE_FIXED_WING = AIRCRAFT_CATALOG.filter((a) => a.playable && a.category === "fixed-wing");
const PLAYABLE_HELICOPTERS = AIRCRAFT_CATALOG.filter((a) => a.playable && a.category === "helicopter");
const AI_FIXED_WING = AIRCRAFT_CATALOG.filter((a) => !a.playable && a.category === "fixed-wing");
const AI_HELICOPTERS = AIRCRAFT_CATALOG.filter((a) => !a.playable && a.category === "helicopter");

function Row({ children }: { children: ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>{children}</div>;
}

export function FlightFormDialog({ airbases, flight, onChange, onSave, onDelete, onCancel, onAddWaypointOnMap, isNew }: FlightFormDialogProps) {
  const sortedAirbases = [...airbases].sort((a, b) => a.name.localeCompare(b.name));
  const aircraft = findAircraft(flight.aircraftId);
  const route = flight.route ?? [];

  function set<K extends keyof Flight>(key: K, value: Flight[K]) {
    onChange({ ...flight, [key]: value });
  }

  function airbaseSelect(value: string | undefined, key: "departureAirbaseId" | "arrivalAirbaseId" | "alternateAirbaseId") {
    return (
      <select className="dfp-select" style={{ width: "100%" }} value={value ?? ""} onChange={(e) => set(key, e.target.value || undefined)}>
        <option value="">—</option>
        {sortedAirbases.map((ab) => (
          <option key={ab.id} value={ab.id}>
            {ab.name}
          </option>
        ))}
      </select>
    );
  }

  function aircraftOption(a: (typeof AIRCRAFT_CATALOG)[number]) {
    return (
      <option key={a.id} value={a.id}>
        {a.name}
      </option>
    );
  }

  function removeWaypoint(id: string) {
    set(
      "route",
      route.filter((wp) => wp.id !== id),
    );
  }

  function updateWaypoint(id: string, patch: Partial<Waypoint>) {
    set(
      "route",
      route.map((wp) => (wp.id === id ? { ...wp, ...patch } : wp)),
    );
  }

  return (
    <div
      className="dfp-panel"
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: 340,
        borderLeft: "none",
        zIndex: 15,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="dfp-panel-header">
        <span>{isNew ? "New flight" : "Edit flight"}</span>
        <button type="button" className="dfp-panel-header-close" onClick={onCancel}>
          ×
        </button>
      </div>

      <div style={{ padding: 16, overflowY: "auto", flex: 1 }}>
        <Field label="Callsign / flight">
          <input
            type="text"
            className="dfp-input"
            placeholder="e.g. Enfield 1-1"
            value={flight.name}
            onChange={(e) => set("name", e.target.value)}
            autoFocus
          />
        </Field>

        <Row>
          <div style={{ gridColumn: "span 2" }}>
            <Field label="Aircraft">
              <select
                className="dfp-select"
                style={{ width: "100%" }}
                value={flight.aircraftId ?? ""}
                onChange={(e) => {
                  const selected = findAircraft(e.target.value);
                  onChange({ ...flight, aircraftId: selected?.id, aircraftType: selected?.name ?? flight.aircraftType });
                }}
              >
                <option value="">—</option>
                {PLAYABLE_FIXED_WING.length > 0 && <optgroup label="Fixed-wing — playable">{PLAYABLE_FIXED_WING.map(aircraftOption)}</optgroup>}
                {PLAYABLE_HELICOPTERS.length > 0 && <optgroup label="Helicopter — playable">{PLAYABLE_HELICOPTERS.map(aircraftOption)}</optgroup>}
                {AI_FIXED_WING.length > 0 && <optgroup label="Fixed-wing — AI">{AI_FIXED_WING.map(aircraftOption)}</optgroup>}
                {AI_HELICOPTERS.length > 0 && <optgroup label="Helicopter — AI">{AI_HELICOPTERS.map(aircraftOption)}</optgroup>}
              </select>
            </Field>
          </div>
          <Field label="Size">
            <input
              type="number"
              min={1}
              max={16}
              className="dfp-input"
              value={flight.size}
              onChange={(e) => set("size", Math.max(1, Number.parseInt(e.target.value, 10) || 1))}
            />
          </Field>
        </Row>

        {aircraft?.performance && (
          <div
            style={{
              fontSize: 11.5,
              color: "var(--dfp-text-muted)",
              background: "var(--dfp-bg)",
              border: "1px solid var(--dfp-border)",
              borderRadius: "var(--dfp-radius-sm)",
              padding: "6px 8px",
              marginBottom: 14,
              lineHeight: 1.6,
            }}
          >
            Max speed {aircraft.performance.maxSpeedKt} kt · Ceiling {aircraft.performance.serviceCeilingFt?.toLocaleString()} ft
            <br />
            Combat radius {aircraft.performance.combatRadiusNm} NM · Fuel {aircraft.performance.internalFuelLb?.toLocaleString()} lb
          </div>
        )}

        <Field label="Task">
          <select
            className="dfp-select"
            style={{ width: "100%" }}
            value={flight.taskType}
            onChange={(e) => set("taskType", e.target.value as TaskType)}
          >
            {TASK_TYPES.map((t) => (
              <option key={t} value={t}>
                {TASK_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </Field>

        <div className="dfp-label" style={{ marginTop: 4 }}>
          Airbases
        </div>
        <Row>
          <Field label="Departure">{airbaseSelect(flight.departureAirbaseId, "departureAirbaseId")}</Field>
          <Field label="Arrival">{airbaseSelect(flight.arrivalAirbaseId, "arrivalAirbaseId")}</Field>
          <Field label="Alternate">{airbaseSelect(flight.alternateAirbaseId, "alternateAirbaseId")}</Field>
        </Row>

        <Row>
          <Field label="Takeoff time">
            <input
              type="text"
              className="dfp-input dfp-input-mono"
              placeholder="HH:MM"
              value={flight.takeoffTime ?? ""}
              onChange={(e) => set("takeoffTime", e.target.value)}
            />
          </Field>
          <Field label="TACAN">
            <input
              type="text"
              className="dfp-input dfp-input-mono"
              placeholder="e.g. 10X"
              value={flight.tacanChannel ?? ""}
              onChange={(e) => set("tacanChannel", e.target.value)}
            />
          </Field>
          <Field label="Radio (MHz)">
            <input
              type="text"
              className="dfp-input dfp-input-mono"
              placeholder="e.g. 251.0"
              value={flight.radioFrequencyMhz ?? ""}
              onChange={(e) => set("radioFrequencyMhz", e.target.value)}
            />
          </Field>
        </Row>

        <Row>
          <Field label="IFF Mode 1">
            <input type="text" className="dfp-input dfp-input-mono" value={flight.iffMode1 ?? ""} onChange={(e) => set("iffMode1", e.target.value)} />
          </Field>
          <Field label="IFF Mode 3">
            <input type="text" className="dfp-input dfp-input-mono" value={flight.iffMode3 ?? ""} onChange={(e) => set("iffMode3", e.target.value)} />
          </Field>
          <Field label="Color">
            <ColorField value={flight.color ?? DEFAULT_FLIGHT_COLOR} onChange={(color) => set("color", color)} />
          </Field>
        </Row>

        <Field label="Notes">
          <textarea
            className="dfp-input"
            rows={2}
            style={{ resize: "vertical", fontFamily: "var(--dfp-font-sans)" }}
            value={flight.notes ?? ""}
            onChange={(e) => set("notes", e.target.value)}
          />
        </Field>

        <Field label="Loadout">
          <textarea
            className="dfp-input"
            rows={2}
            placeholder="e.g. 4x AIM-120C, 2x AIM-9X, 2x GBU-12"
            style={{ resize: "vertical", fontFamily: "var(--dfp-font-sans)" }}
            value={flight.loadout ?? ""}
            onChange={(e) => set("loadout", e.target.value)}
          />
        </Field>
        {aircraft?.weapons && (
          <div style={{ fontSize: 11, color: "var(--dfp-text-muted)", marginTop: -8, marginBottom: 14 }}>Typical: {aircraft.weapons.join(", ")}</div>
        )}

        <div className="dfp-label" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Route ({route.length})</span>
        </div>
        {route.length === 0 && <div style={{ fontSize: 12, color: "var(--dfp-text-muted)", margin: "4px 0 8px" }}>No waypoints yet.</div>}
        {route.map((wp, i) => (
          <div key={wp.id} style={{ border: "1px solid var(--dfp-border)", borderRadius: "var(--dfp-radius-sm)", padding: 8, marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700 }}>WP{i + 1}</span>
              <button type="button" title="Remove" className="dfp-list-row-delete" onClick={() => removeWaypoint(wp.id)}>
                🗑
              </button>
            </div>
            <CoordinateFields point={wp.position} onChange={(position: LatLon) => updateWaypoint(wp.id, { position })} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input
                type="number"
                className="dfp-input"
                placeholder="Alt (ft)"
                value={wp.altitudeFt ?? ""}
                onChange={(e) => updateWaypoint(wp.id, { altitudeFt: e.target.value ? Number.parseInt(e.target.value, 10) : undefined })}
              />
              <input
                type="number"
                className="dfp-input"
                placeholder="Speed (kt)"
                value={wp.airspeedKt ?? ""}
                onChange={(e) => updateWaypoint(wp.id, { airspeedKt: e.target.value ? Number.parseInt(e.target.value, 10) : undefined })}
              />
            </div>
          </div>
        ))}
        <button type="button" className="dfp-btn" style={{ width: "100%", marginTop: 4 }} onClick={onAddWaypointOnMap}>
          + Add waypoint on map
        </button>
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
          <button type="button" className="dfp-btn dfp-btn-accent" onClick={onSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
