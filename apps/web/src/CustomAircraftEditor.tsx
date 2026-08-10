import { TASK_TYPE_LABEL, type AircraftCategory, type CustomAircraft, type CustomPylon, type CustomWeapon, type Launcher, type TaskType } from "@dcs-flight-planner/core";
import type { ReactNode } from "react";
import { Field } from "./FormField";

interface CustomAircraftEditorProps {
  aircraft: CustomAircraft;
  onChange: (updated: CustomAircraft) => void;
  onSave: () => void;
  onDelete?: () => void;
  onCancel: () => void;
  isNew: boolean;
}

const TASK_TYPES = Object.keys(TASK_TYPE_LABEL) as TaskType[];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div className="dfp-label" style={{ marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>{children}</div>;
}

function NumberField({ label, value, onChange, placeholder }: { label: string; value: number | undefined; onChange: (v: number | undefined) => void; placeholder?: string }) {
  return (
    <Field label={label}>
      <input
        type="number"
        className="dfp-input"
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number.parseFloat(e.target.value) : undefined)}
      />
    </Field>
  );
}

export function CustomAircraftEditor({ aircraft, onChange, onSave, onDelete, onCancel, isNew }: CustomAircraftEditorProps) {
  function set<K extends keyof CustomAircraft>(key: K, value: CustomAircraft[K]) {
    onChange({ ...aircraft, [key]: value });
  }

  function setPerformance<K extends keyof CustomAircraft["performance"]>(key: K, value: CustomAircraft["performance"][K]) {
    onChange({ ...aircraft, performance: { ...aircraft.performance, [key]: value } });
  }

  function toggleTask(task: TaskType) {
    const has = aircraft.standardTasks.includes(task);
    set("standardTasks", has ? aircraft.standardTasks.filter((t) => t !== task) : [...aircraft.standardTasks, task]);
  }

  // --- Launchers ---
  function addLauncher() {
    const launcher: Launcher = { id: crypto.randomUUID(), name: "New launcher", weightLb: 0 };
    set("launchers", [...aircraft.launchers, launcher]);
  }
  function updateLauncher(id: string, patch: Partial<Launcher>) {
    set("launchers", aircraft.launchers.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  function removeLauncher(id: string) {
    set("launchers", aircraft.launchers.filter((l) => l.id !== id));
    set("weapons", aircraft.weapons.map((w) => ({ ...w, compatibleLauncherIds: w.compatibleLauncherIds?.filter((lid) => lid !== id) })));
  }

  // --- Weapons ---
  function addWeapon() {
    const weapon: CustomWeapon = { id: crypto.randomUUID(), name: "New weapon", weightLb: 0, compatibleLauncherIds: [] };
    set("weapons", [...aircraft.weapons, weapon]);
  }
  function updateWeapon(id: string, patch: Partial<CustomWeapon>) {
    set("weapons", aircraft.weapons.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  }
  function removeWeapon(id: string) {
    set("weapons", aircraft.weapons.filter((w) => w.id !== id));
    set("pylons", aircraft.pylons.map((p) => ({ ...p, compatibleWeaponIds: p.compatibleWeaponIds.filter((wid) => wid !== id) })));
  }
  function toggleWeaponLauncher(weaponId: string, launcherId: string) {
    const weapon = aircraft.weapons.find((w) => w.id === weaponId);
    if (!weapon) return;
    const current = weapon.compatibleLauncherIds ?? [];
    updateWeapon(weaponId, { compatibleLauncherIds: current.includes(launcherId) ? current.filter((id) => id !== launcherId) : [...current, launcherId] });
  }

  // --- Pylons ---
  function addPylon() {
    const nextStation = String(aircraft.pylons.length + 1);
    const pylon: CustomPylon = { station: nextStation, compatibleWeaponIds: [] };
    set("pylons", [...aircraft.pylons, pylon]);
  }
  function updatePylon(station: string, patch: Partial<CustomPylon>) {
    set("pylons", aircraft.pylons.map((p) => (p.station === station ? { ...p, ...patch } : p)));
  }
  function removePylon(station: string) {
    set("pylons", aircraft.pylons.filter((p) => p.station !== station));
  }
  function togglePylonWeapon(station: string, weaponId: string) {
    const pylon = aircraft.pylons.find((p) => p.station === station);
    if (!pylon) return;
    updatePylon(station, {
      compatibleWeaponIds: pylon.compatibleWeaponIds.includes(weaponId)
        ? pylon.compatibleWeaponIds.filter((id) => id !== weaponId)
        : [...pylon.compatibleWeaponIds, weaponId],
    });
  }

  function removePreset(id: string) {
    set("presets", aircraft.presets.filter((p) => p.id !== id));
  }

  return (
    <div
      className="dfp-scrim"
      onClick={onCancel}
      style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20 }}
    >
      <div
        className="dfp-panel"
        onClick={(e) => e.stopPropagation()}
        style={{ borderRadius: "var(--dfp-radius-lg)", width: "min(760px, 94vw)", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <div className="dfp-panel-header">
          <span>{isNew ? "New custom aircraft" : "Edit custom aircraft"}</span>
          <button type="button" className="dfp-panel-header-close" onClick={onCancel}>
            ×
          </button>
        </div>

        <div style={{ padding: 16, overflowY: "auto", flex: 1 }}>
          <Row>
            <div style={{ gridColumn: "span 2" }}>
              <Field label="Name">
                <input type="text" className="dfp-input" placeholder="e.g. F-16C Viper (detailed)" value={aircraft.name} onChange={(e) => set("name", e.target.value)} autoFocus />
              </Field>
            </div>
            <Field label="Category">
              <select className="dfp-select" style={{ width: "100%" }} value={aircraft.category} onChange={(e) => set("category", e.target.value as AircraftCategory)}>
                <option value="fixed-wing">Fixed-wing</option>
                <option value="helicopter">Helicopter</option>
              </select>
            </Field>
          </Row>

          <Section title="Standard tasks">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px" }}>
              {TASK_TYPES.map((t) => (
                <label key={t} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13 }}>
                  <input type="checkbox" checked={aircraft.standardTasks.includes(t)} onChange={() => toggleTask(t)} />
                  {TASK_TYPE_LABEL[t]}
                </label>
              ))}
            </div>
          </Section>

          <Section title="Performance (approximate, all fields optional)">
            <Row>
              <NumberField label="Empty weight (lb)" value={aircraft.performance.emptyWeightLb} onChange={(v) => setPerformance("emptyWeightLb", v)} />
              <NumberField label="Internal fuel (lb)" value={aircraft.performance.internalFuelLb} onChange={(v) => setPerformance("internalFuelLb", v)} />
              <NumberField label="Max gross weight (lb)" value={aircraft.performance.maxGrossWeightLb} onChange={(v) => setPerformance("maxGrossWeightLb", v)} />
            </Row>
            <Row>
              <NumberField label="Max speed (kt)" value={aircraft.performance.maxSpeedKt} onChange={(v) => setPerformance("maxSpeedKt", v)} />
              <NumberField label="Cruise speed (kt)" value={aircraft.performance.cruiseSpeedKt} onChange={(v) => setPerformance("cruiseSpeedKt", v)} />
              <NumberField label="Service ceiling (ft)" value={aircraft.performance.serviceCeilingFt} onChange={(v) => setPerformance("serviceCeilingFt", v)} />
            </Row>
            <Row>
              <NumberField label="Cruise fuel flow (lb/hr)" value={aircraft.performance.cruiseFuelFlowLbHr} onChange={(v) => setPerformance("cruiseFuelFlowLbHr", v)} />
              <NumberField label="Ref. takeoff weight (lb)" value={aircraft.performance.referenceTakeoffWeightLb} onChange={(v) => setPerformance("referenceTakeoffWeightLb", v)} />
              <NumberField label="Ref. takeoff distance (ft)" value={aircraft.performance.referenceTakeoffDistanceFt} onChange={(v) => setPerformance("referenceTakeoffDistanceFt", v)} />
            </Row>
            <div style={{ fontSize: 11, color: "var(--dfp-text-muted)" }}>
              The takeoff-distance reference point (one known weight + distance pair) is used to scale a rough estimate to other loadouts — not a certified
              performance chart.
            </div>
          </Section>

          <Section title={`Launchers (${aircraft.launchers.length})`}>
            {aircraft.launchers.map((launcher) => (
              <div key={launcher.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <input
                  type="text"
                  className="dfp-input"
                  style={{ flex: 1 }}
                  value={launcher.name}
                  onChange={(e) => updateLauncher(launcher.id, { name: e.target.value })}
                />
                <input
                  type="number"
                  className="dfp-input"
                  style={{ width: 100 }}
                  placeholder="lb"
                  value={launcher.weightLb}
                  onChange={(e) => updateLauncher(launcher.id, { weightLb: Number.parseFloat(e.target.value) || 0 })}
                />
                <button type="button" className="dfp-list-row-delete" title="Remove" onClick={() => removeLauncher(launcher.id)}>
                  🗑
                </button>
              </div>
            ))}
            <button type="button" className="dfp-btn" onClick={addLauncher}>
              + Add launcher
            </button>
          </Section>

          <Section title={`Weapons (${aircraft.weapons.length})`}>
            {aircraft.weapons.map((weapon) => (
              <div key={weapon.id} style={{ border: "1px solid var(--dfp-border)", borderRadius: "var(--dfp-radius-sm)", padding: 8, marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                  <input
                    type="text"
                    className="dfp-input"
                    style={{ flex: 1 }}
                    value={weapon.name}
                    onChange={(e) => updateWeapon(weapon.id, { name: e.target.value })}
                  />
                  <input
                    type="number"
                    className="dfp-input"
                    style={{ width: 100 }}
                    placeholder="lb"
                    value={weapon.weightLb}
                    onChange={(e) => updateWeapon(weapon.id, { weightLb: Number.parseFloat(e.target.value) || 0 })}
                  />
                  <button type="button" className="dfp-list-row-delete" title="Remove" onClick={() => removeWeapon(weapon.id)}>
                    🗑
                  </button>
                </div>
                {aircraft.launchers.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px" }}>
                    <span style={{ fontSize: 11, color: "var(--dfp-text-muted)" }}>Launchers:</span>
                    {aircraft.launchers.map((launcher) => (
                      <label key={launcher.id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                        <input
                          type="checkbox"
                          checked={weapon.compatibleLauncherIds?.includes(launcher.id) ?? false}
                          onChange={() => toggleWeaponLauncher(weapon.id, launcher.id)}
                        />
                        {launcher.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <button type="button" className="dfp-btn" onClick={addWeapon}>
              + Add weapon
            </button>
          </Section>

          <Section title={`Pylons (${aircraft.pylons.length})`}>
            {aircraft.pylons.map((pylon) => (
              <div key={pylon.station} style={{ border: "1px solid var(--dfp-border)", borderRadius: "var(--dfp-radius-sm)", padding: 8, marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: "var(--dfp-text-muted)" }}>Station</span>
                  <input
                    type="text"
                    className="dfp-input dfp-input-mono"
                    style={{ width: 70 }}
                    value={pylon.station}
                    onChange={(e) => updatePylon(pylon.station, { station: e.target.value })}
                  />
                  <button type="button" className="dfp-list-row-delete" title="Remove" onClick={() => removePylon(pylon.station)} style={{ marginLeft: "auto" }}>
                    🗑
                  </button>
                </div>
                {aircraft.weapons.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px" }}>
                    {aircraft.weapons.map((weapon) => (
                      <label key={weapon.id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                        <input
                          type="checkbox"
                          checked={pylon.compatibleWeaponIds.includes(weapon.id)}
                          onChange={() => togglePylonWeapon(pylon.station, weapon.id)}
                        />
                        {weapon.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <button type="button" className="dfp-btn" onClick={addPylon}>
              + Add pylon
            </button>
          </Section>

          <Section title={`Saved loadout presets (${aircraft.presets.length})`}>
            {aircraft.presets.length === 0 && (
              <div style={{ fontSize: 12, color: "var(--dfp-text-muted)" }}>
                None yet — build a loadout for a flight using this aircraft, then "Save as preset" there.
              </div>
            )}
            {aircraft.presets.map((preset) => (
              <div key={preset.id} className="dfp-list-row">
                <span style={{ flex: 1, fontSize: 13 }}>
                  {preset.name}
                  <span style={{ color: "var(--dfp-text-muted)", marginLeft: 6, fontSize: 12 }}>
                    {preset.selections.filter((s) => s.weaponId).length} station{preset.selections.filter((s) => s.weaponId).length === 1 ? "" : "s"} loaded
                  </span>
                </span>
                <button type="button" className="dfp-list-row-delete" title="Delete" onClick={() => removePreset(preset.id)}>
                  🗑
                </button>
              </div>
            ))}
          </Section>
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
    </div>
  );
}
