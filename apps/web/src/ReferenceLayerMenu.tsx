import { SIM_TARGET_LABEL, type SimTarget } from "@dcs-flight-planner/core";
import { useState } from "react";
import { menuPanelClassName } from "./menuStyles";

const SIM_TARGETS: SimTarget[] = ["dcs", "bms", "fs"];

interface ReferenceLayerMenuProps {
  simTarget: SimTarget;
  onChangeSimTarget: (sim: SimTarget) => void;
}

/**
 * World airports (OurAirports) are always shown as a background layer; the
 * active curated theater for the selected sim (when it has one) masks out
 * only the world entries it overrides within its own footprint. This menu
 * just lets the target sim be picked ahead of future BMS/MSFS support.
 */
export function ReferenceLayerMenu({ simTarget, onChangeSimTarget }: ReferenceLayerMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        className="dfp-btn dfp-btn-onnavy"
        data-open={open}
        onClick={() => setOpen((o) => !o)}
        title="World airports reference layer (OurAirports) target sim"
      >
        🌐 Reference
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 10 }} />
          <div
            className={menuPanelClassName}
            style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 11, minWidth: 240, padding: 10 }}
          >
            <div style={{ fontSize: 12, padding: "2px 2px 8px" }}>
              World airports (OurAirports) are always shown on the map. The active DCS theater's own data overrides
              the world layer within its area.
            </div>
            <div className="dfp-label" style={{ margin: "4px 2px 2px" }}>
              Target sim
            </div>
            <select
              className="dfp-select"
              style={{ width: "100%" }}
              value={simTarget}
              onChange={(e) => onChangeSimTarget(e.target.value as SimTarget)}
            >
              {SIM_TARGETS.map((sim) => (
                <option key={sim} value={sim}>
                  {SIM_TARGET_LABEL[sim]}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
}
