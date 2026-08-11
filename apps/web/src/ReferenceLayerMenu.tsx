import { SIM_TARGET_LABEL, type SimTarget } from "@dcs-flight-planner/core";
import { useState } from "react";
import { menuPanelClassName } from "./menuStyles";

const SIM_TARGETS: SimTarget[] = ["dcs", "bms", "fs"];

interface TheaterOption {
  id: string;
  name: string;
}

interface ReferenceLayerMenuProps {
  showGlobalAirports: boolean;
  onToggleShowGlobalAirports: () => void;
  simTarget: SimTarget;
  onChangeSimTarget: (sim: SimTarget) => void;
  theaterId: string | null;
  onChangeTheaterId: (id: string | null) => void;
  availableTheaters: TheaterOption[];
}

export function ReferenceLayerMenu({
  showGlobalAirports,
  onToggleShowGlobalAirports,
  simTarget,
  onChangeSimTarget,
  theaterId,
  onChangeTheaterId,
  availableTheaters,
}: ReferenceLayerMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        className="dfp-btn dfp-btn-onnavy"
        data-open={open}
        onClick={() => setOpen((o) => !o)}
        title="World airports reference layer (OurAirports) and target sim/theater"
      >
        🌐 Reference
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 10 }} />
          <div
            className={menuPanelClassName}
            style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 11, minWidth: 260, padding: 10 }}
          >
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "4px 2px", cursor: "pointer" }}>
              <input type="checkbox" checked={showGlobalAirports} onChange={onToggleShowGlobalAirports} />
              World airports (OurAirports)
            </label>

            <div className="dfp-label" style={{ margin: "10px 2px 2px" }}>
              Target sim
            </div>
            <select
              className="dfp-select"
              style={{ width: "100%", marginBottom: 8 }}
              value={simTarget}
              onChange={(e) => onChangeSimTarget(e.target.value as SimTarget)}
            >
              {SIM_TARGETS.map((sim) => (
                <option key={sim} value={sim}>
                  {SIM_TARGET_LABEL[sim]}
                </option>
              ))}
            </select>

            <div className="dfp-label" style={{ margin: "4px 2px 2px" }}>
              Target theater
            </div>
            <select
              className="dfp-select"
              style={{ width: "100%" }}
              value={theaterId ?? ""}
              disabled={availableTheaters.length === 0}
              onChange={(e) => onChangeTheaterId(e.target.value || null)}
            >
              <option value="">— None —</option>
              {availableTheaters.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {availableTheaters.length === 0 && (
              <div style={{ fontSize: 11.5, color: "var(--dfp-text-muted)", marginTop: 4 }}>
                No curated theater yet for {SIM_TARGET_LABEL[simTarget]} — the world layer shows everywhere.
              </div>
            )}
            {availableTheaters.length > 0 && (
              <div style={{ fontSize: 11.5, color: "var(--dfp-text-muted)", marginTop: 4 }}>
                The selected theater's own data overrides the world layer within its area.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
