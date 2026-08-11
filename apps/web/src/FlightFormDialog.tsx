import {
  AIRCRAFT_CATALOG,
  ALTITUDE_REFERENCE_LABEL,
  classifyLoad,
  computeGrossWeightLb,
  computeLoadoutWeightLb,
  computeRouteLegs,
  computeWaypointEtas,
  DEFAULT_FLIGHT_COLOR,
  estimateEnduranceMin,
  estimateRangeNm,
  estimateTakeoffDistanceFt,
  findAircraft,
  findCustomWeapon,
  findLauncher,
  formatEte,
  SPEED_TYPE_LABEL,
  TASK_TYPE_LABEL,
  totalRouteDistanceNm,
  type Airbase,
  type AltitudeReference,
  type CustomAircraft,
  type Dmpi,
  type Flight,
  type LatLon,
  type LoadoutPreset,
  type Package,
  type PylonSelection,
  type SpeedType,
  type TaskType,
  type Waypoint,
} from "@dcs-flight-planner/core";
import { useState, type ReactNode } from "react";
import { ColorField } from "./ColorField";
import { CoordinateFields } from "./CoordinateFields";
import { Field } from "./FormField";

interface FlightFormDialogProps {
  airbases: Airbase[];
  flight: Flight;
  customAircraft: CustomAircraft[];
  packages: Package[];
  onChange: (updated: Flight) => void;
  onSave: () => void;
  onDelete?: () => void;
  onCancel: () => void;
  onAddWaypointOnMap: () => void;
  onSavePreset: (customAircraftId: string, preset: LoadoutPreset) => void;
  onCreatePackage: (name: string) => string;
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

const LOAD_CLASS_LABEL: Record<string, string> = { light: "Light", medium: "Medium", heavy: "Heavy" };

export function FlightFormDialog({
  airbases,
  flight,
  customAircraft,
  packages,
  onChange,
  onSave,
  onDelete,
  onCancel,
  onAddWaypointOnMap,
  onSavePreset,
  onCreatePackage,
  isNew,
}: FlightFormDialogProps) {
  const sortedAirbases = [...airbases].sort((a, b) => a.name.localeCompare(b.name));
  const catalogAircraft = findAircraft(flight.aircraftId);
  const custom = customAircraft.find((a) => a.id === flight.customAircraftId);
  const route = flight.route ?? [];
  const legs = computeRouteLegs(route);
  const [presetName, setPresetName] = useState("");
  const [newPackageName, setNewPackageName] = useState("");

  const etas = computeWaypointEtas(route, legs, flight.takeoffTime);

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

  function catalogOption(a: (typeof AIRCRAFT_CATALOG)[number]) {
    return (
      <option key={a.id} value={`catalog:${a.id}`}>
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

  function addDmpi(waypointId: string) {
    const wp = route.find((w) => w.id === waypointId);
    if (!wp) return;
    const dmpi: Dmpi = { id: crypto.randomUUID(), name: `DMPI ${(wp.dmpis?.length ?? 0) + 1}`, position: wp.position };
    updateWaypoint(waypointId, { dmpis: [...(wp.dmpis ?? []), dmpi] });
  }

  function updateDmpi(waypointId: string, dmpiId: string, patch: Partial<Dmpi>) {
    const wp = route.find((w) => w.id === waypointId);
    if (!wp) return;
    updateWaypoint(waypointId, { dmpis: (wp.dmpis ?? []).map((d) => (d.id === dmpiId ? { ...d, ...patch } : d)) });
  }

  function removeDmpi(waypointId: string, dmpiId: string) {
    const wp = route.find((w) => w.id === waypointId);
    if (!wp) return;
    updateWaypoint(waypointId, { dmpis: (wp.dmpis ?? []).filter((d) => d.id !== dmpiId) });
  }

  function setPylon(station: string, weaponId: string | null) {
    if (!custom) return;
    const weapon = findCustomWeapon(custom, weaponId);
    const compatibleLauncherIds = weapon?.compatibleLauncherIds ?? [];
    const launcherId = compatibleLauncherIds.length === 1 ? compatibleLauncherIds[0]! : null;
    const pylonLoadout = flight.pylonLoadout ?? [];
    const next: PylonSelection[] = pylonLoadout.some((s) => s.station === station)
      ? pylonLoadout.map((s) => (s.station === station ? { ...s, weaponId, launcherId } : s))
      : [...pylonLoadout, { station, weaponId, launcherId }];
    set("pylonLoadout", next);
  }

  function setPylonLauncher(station: string, launcherId: string | null) {
    const pylonLoadout = flight.pylonLoadout ?? [];
    set(
      "pylonLoadout",
      pylonLoadout.map((s) => (s.station === station ? { ...s, launcherId } : s)),
    );
  }

  function applyPreset(presetId: string) {
    const preset = custom?.presets.find((p) => p.id === presetId);
    if (preset) set("pylonLoadout", preset.selections);
  }

  function saveCurrentAsPreset() {
    if (!custom || !presetName.trim()) return;
    onSavePreset(custom.id, { id: crypto.randomUUID(), name: presetName.trim(), selections: flight.pylonLoadout ?? [] });
    setPresetName("");
  }

  const grossWeightLb = custom ? computeGrossWeightLb(custom, flight.pylonLoadout) : undefined;
  const loadClass = custom && grossWeightLb !== undefined ? classifyLoad(custom, grossWeightLb) : undefined;
  const takeoffDistanceFt = custom && grossWeightLb !== undefined ? estimateTakeoffDistanceFt(custom, grossWeightLb) : undefined;
  const fuelForEstimate = custom?.performance.internalFuelLb;
  const enduranceMin = custom && fuelForEstimate !== undefined ? estimateEnduranceMin(custom, fuelForEstimate) : undefined;
  const rangeNm = custom && fuelForEstimate !== undefined ? estimateRangeNm(custom, fuelForEstimate) : undefined;

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
                value={flight.customAircraftId ? `custom:${flight.customAircraftId}` : flight.aircraftId ? `catalog:${flight.aircraftId}` : ""}
                onChange={(e) => {
                  const [kind, id] = e.target.value.split(":", 2);
                  if (kind === "custom") {
                    const selected = customAircraft.find((a) => a.id === id);
                    onChange({ ...flight, aircraftId: undefined, customAircraftId: selected?.id, aircraftType: selected?.name ?? flight.aircraftType, pylonLoadout: [] });
                  } else if (kind === "catalog") {
                    const selected = findAircraft(id);
                    onChange({ ...flight, aircraftId: selected?.id, customAircraftId: undefined, aircraftType: selected?.name ?? flight.aircraftType, pylonLoadout: [] });
                  } else {
                    onChange({ ...flight, aircraftId: undefined, customAircraftId: undefined, pylonLoadout: [] });
                  }
                }}
              >
                <option value="">—</option>
                {customAircraft.length > 0 && (
                  <optgroup label="Custom">
                    {customAircraft.map((a) => (
                      <option key={a.id} value={`custom:${a.id}`}>
                        {a.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                {PLAYABLE_FIXED_WING.length > 0 && <optgroup label="Fixed-wing — playable">{PLAYABLE_FIXED_WING.map(catalogOption)}</optgroup>}
                {PLAYABLE_HELICOPTERS.length > 0 && <optgroup label="Helicopter — playable">{PLAYABLE_HELICOPTERS.map(catalogOption)}</optgroup>}
                {AI_FIXED_WING.length > 0 && <optgroup label="Fixed-wing — AI">{AI_FIXED_WING.map(catalogOption)}</optgroup>}
                {AI_HELICOPTERS.length > 0 && <optgroup label="Helicopter — AI">{AI_HELICOPTERS.map(catalogOption)}</optgroup>}
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

        {custom && (
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
            {(custom.performance.maxSpeedKt || custom.performance.serviceCeilingFt) && (
              <>
                Max speed {custom.performance.maxSpeedKt ?? "—"} kt · Ceiling {custom.performance.serviceCeilingFt?.toLocaleString() ?? "—"} ft
                <br />
              </>
            )}
            {rangeNm !== undefined && (
              <>
                Est. range {Math.round(rangeNm).toLocaleString()} NM · Endurance {enduranceMin !== undefined ? formatEte(enduranceMin) : "—"}
                <br />
              </>
            )}
          </div>
        )}

        {catalogAircraft === undefined && !custom && flight.aircraftType && (
          <div style={{ fontSize: 11, color: "var(--dfp-text-muted)", marginTop: -10, marginBottom: 14 }}>{flight.aircraftType}</div>
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

        <Field label="Package">
          <select
            className="dfp-select"
            style={{ width: "100%" }}
            value={flight.packageId ?? ""}
            onChange={(e) => set("packageId", e.target.value || undefined)}
          >
            <option value="">— None —</option>
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name}
              </option>
            ))}
          </select>
        </Field>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input
            type="text"
            className="dfp-input"
            style={{ flex: 1 }}
            placeholder="New package name"
            value={newPackageName}
            onChange={(e) => setNewPackageName(e.target.value)}
          />
          <button
            type="button"
            className="dfp-btn"
            disabled={!newPackageName.trim()}
            onClick={() => {
              const id = onCreatePackage(newPackageName.trim());
              set("packageId", id);
              setNewPackageName("");
            }}
          >
            + New package
          </button>
        </div>

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
          <Field label="Internal (MHz)">
            <input
              type="text"
              className="dfp-input dfp-input-mono"
              placeholder="e.g. 305.0"
              value={flight.internalFrequencyMhz ?? ""}
              onChange={(e) => set("internalFrequencyMhz", e.target.value)}
            />
          </Field>
          <Field label="IFF Mode 1">
            <input type="text" className="dfp-input dfp-input-mono" value={flight.iffMode1 ?? ""} onChange={(e) => set("iffMode1", e.target.value)} />
          </Field>
          <Field label="IFF Mode 3">
            <input type="text" className="dfp-input dfp-input-mono" value={flight.iffMode3 ?? ""} onChange={(e) => set("iffMode3", e.target.value)} />
          </Field>
        </Row>

        <Field label="Color">
          <ColorField value={flight.color ?? DEFAULT_FLIGHT_COLOR} onChange={(color) => set("color", color)} />
        </Field>

        <Field label="Notes">
          <textarea
            className="dfp-input"
            rows={2}
            style={{ resize: "vertical", fontFamily: "var(--dfp-font-sans)" }}
            value={flight.notes ?? ""}
            onChange={(e) => set("notes", e.target.value)}
          />
        </Field>

        {custom && custom.pylons.length > 0 && (
          <>
            <div className="dfp-label" style={{ marginTop: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>Armament ({custom.pylons.length} pylons)</span>
            </div>
            {custom.presets.length > 0 && (
              <select className="dfp-select" style={{ width: "100%", marginBottom: 8 }} value="" onChange={(e) => applyPreset(e.target.value)}>
                <option value="">Apply saved preset...</option>
                {custom.presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
            {custom.pylons.map((pylon) => {
              const selection = flight.pylonLoadout?.find((s) => s.station === pylon.station);
              const selectedWeapon = findCustomWeapon(custom, selection?.weaponId);
              const launcherOptions = selectedWeapon?.compatibleLauncherIds ?? [];
              return (
                <div key={pylon.station} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: "var(--dfp-text-muted)", width: 42, flexShrink: 0 }}>Sta {pylon.station}</span>
                  <select
                    className="dfp-select"
                    style={{ width: "100%" }}
                    value={selection?.weaponId ?? ""}
                    onChange={(e) => setPylon(pylon.station, e.target.value || null)}
                  >
                    <option value="">— Empty —</option>
                    {pylon.compatibleWeaponIds.map((weaponId) => (
                      <option key={weaponId} value={weaponId}>
                        {findCustomWeapon(custom, weaponId)?.name ?? weaponId}
                      </option>
                    ))}
                  </select>
                  {launcherOptions.length > 1 && (
                    <select
                      className="dfp-select"
                      style={{ width: 120, flexShrink: 0 }}
                      value={selection?.launcherId ?? ""}
                      onChange={(e) => setPylonLauncher(pylon.station, e.target.value || null)}
                    >
                      {launcherOptions.map((launcherId) => (
                        <option key={launcherId} value={launcherId}>
                          {findLauncher(custom, launcherId)?.name ?? launcherId}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}
            <div
              style={{
                fontSize: 11.5,
                color: "var(--dfp-text-muted)",
                background: "var(--dfp-bg)",
                border: "1px solid var(--dfp-border)",
                borderRadius: "var(--dfp-radius-sm)",
                padding: "6px 8px",
                marginBottom: 8,
                lineHeight: 1.6,
              }}
            >
              Ordnance {computeLoadoutWeightLb(custom, flight.pylonLoadout).toLocaleString()} lb
              {grossWeightLb !== undefined && (
                <>
                  {" "}
                  · Gross weight <strong>{grossWeightLb.toLocaleString()} lb</strong>
                  {loadClass && <> ({LOAD_CLASS_LABEL[loadClass]})</>}
                </>
              )}
              {takeoffDistanceFt !== undefined && (
                <>
                  <br />
                  Est. takeoff distance {Math.round(takeoffDistanceFt).toLocaleString()} ft
                </>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <input
                type="text"
                className="dfp-input"
                style={{ flex: 1 }}
                placeholder="Preset name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
              />
              <button type="button" className="dfp-btn" disabled={!presetName.trim()} onClick={saveCurrentAsPreset}>
                Save as preset
              </button>
            </div>
          </>
        )}

        <Field label="Loadout notes">
          <textarea
            className="dfp-input"
            rows={2}
            placeholder="e.g. free-text call-outs not captured by the pylon list above"
            style={{ resize: "vertical", fontFamily: "var(--dfp-font-sans)" }}
            value={flight.loadout ?? ""}
            onChange={(e) => set("loadout", e.target.value)}
          />
        </Field>

        <div className="dfp-label" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Route ({route.length})</span>
        </div>
        {route.length === 0 && <div style={{ fontSize: 12, color: "var(--dfp-text-muted)", margin: "4px 0 8px" }}>No waypoints yet.</div>}
        {route.map((wp, i) => {
          const leg = i > 0 ? legs[i - 1] : undefined;
          const eta = etas[i];
          return (
            <div key={wp.id} style={{ border: "1px solid var(--dfp-border)", borderRadius: "var(--dfp-radius-sm)", padding: 8, marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>WP{i + 1}</span>
                <button type="button" title="Remove" className="dfp-list-row-delete" onClick={() => removeWaypoint(wp.id)}>
                  🗑
                </button>
              </div>
              {leg && (
                <div style={{ fontSize: 11, color: "var(--dfp-text-muted)", marginBottom: 4 }}>
                  {leg.distanceNm.toFixed(1)} NM · TRK {Math.round(leg.trackDeg).toString().padStart(3, "0")}°
                  {leg.eteMin !== undefined && <> · ETE {formatEte(leg.eteMin)}</>}
                  {eta && <> · ETA {eta}</>}
                </div>
              )}
              <CoordinateFields point={wp.position} onChange={(position: LatLon) => updateWaypoint(wp.id, { position })} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 70px", gap: 8, marginBottom: 8 }}>
                <input
                  type="number"
                  className="dfp-input"
                  placeholder="Alt (ft)"
                  value={wp.altitudeFt ?? ""}
                  onChange={(e) => updateWaypoint(wp.id, { altitudeFt: e.target.value ? Number.parseInt(e.target.value, 10) : undefined })}
                />
                <select
                  className="dfp-input"
                  value={wp.altitudeReference ?? "MSL"}
                  onChange={(e) => updateWaypoint(wp.id, { altitudeReference: e.target.value as AltitudeReference })}
                >
                  {(Object.keys(ALTITUDE_REFERENCE_LABEL) as AltitudeReference[]).map((ref) => (
                    <option key={ref} value={ref}>
                      {ALTITUDE_REFERENCE_LABEL[ref]}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  className="dfp-input"
                  placeholder="Speed (kt)"
                  value={wp.airspeedKt ?? ""}
                  onChange={(e) => updateWaypoint(wp.id, { airspeedKt: e.target.value ? Number.parseInt(e.target.value, 10) : undefined })}
                />
                <select
                  className="dfp-input"
                  value={wp.speedType ?? "IAS"}
                  onChange={(e) => updateWaypoint(wp.id, { speedType: e.target.value as SpeedType })}
                >
                  {(Object.keys(SPEED_TYPE_LABEL) as SpeedType[]).map((st) => (
                    <option key={st} value={st}>
                      {SPEED_TYPE_LABEL[st]}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, whiteSpace: "nowrap" }}>
                  <input
                    type="checkbox"
                    checked={wp.totLocked ?? false}
                    onChange={(e) => updateWaypoint(wp.id, { totLocked: e.target.checked })}
                  />
                  Lock TOT
                </label>
                <input
                  type="text"
                  className="dfp-input"
                  placeholder="HH:MM"
                  disabled={!wp.totLocked}
                  value={wp.tot ?? ""}
                  onChange={(e) => updateWaypoint(wp.id, { tot: e.target.value })}
                  style={{ flex: 1 }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--dfp-text-muted)" }}>DMPIs ({wp.dmpis?.length ?? 0})</span>
                <button type="button" className="dfp-btn" style={{ padding: "1px 8px", fontSize: 11 }} onClick={() => addDmpi(wp.id)}>
                  + Add DMPI
                </button>
              </div>
              {(wp.dmpis ?? []).map((dmpi) => (
                <div key={dmpi.id} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <input
                    type="text"
                    className="dfp-input"
                    style={{ flex: 1 }}
                    value={dmpi.name}
                    onChange={(e) => updateDmpi(wp.id, dmpi.id, { name: e.target.value })}
                  />
                  <input
                    type="number"
                    className="dfp-input"
                    style={{ width: 90 }}
                    placeholder="Elev (ft)"
                    value={dmpi.elevationFt ?? ""}
                    onChange={(e) =>
                      updateDmpi(wp.id, dmpi.id, {
                        elevationFt: e.target.value ? Number.parseInt(e.target.value, 10) : undefined,
                        elevationManual: true,
                      })
                    }
                  />
                  <button type="button" title="Remove" className="dfp-list-row-delete" onClick={() => removeDmpi(wp.id, dmpi.id)}>
                    🗑
                  </button>
                </div>
              ))}
            </div>
          );
        })}
        {legs.length > 0 && (
          <div style={{ fontSize: 11.5, color: "var(--dfp-text-muted)", margin: "2px 0 8px" }}>
            Total distance {totalRouteDistanceNm(route).toFixed(1)} NM
          </div>
        )}
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
