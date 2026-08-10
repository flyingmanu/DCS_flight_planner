import type { CustomAircraft } from "@dcs-flight-planner/core";
import { useState } from "react";
import { menuItemClassName, menuPanelClassName, submenuPanelStyle } from "./menuStyles";

interface CustomAircraftMenuProps {
  customAircraft: CustomAircraft[];
  onNew: () => void;
  onEdit: (id: string) => void;
}

export function CustomAircraftMenu({ customAircraft, onNew, onEdit }: CustomAircraftMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editSubmenuOpen, setEditSubmenuOpen] = useState(false);

  function closeAll() {
    setMenuOpen(false);
    setEditSubmenuOpen(false);
  }

  return (
    <div style={{ position: "relative" }}>
      <button type="button" className="dfp-btn dfp-btn-onnavy" data-open={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
        Aircraft
      </button>

      {menuOpen && (
        <>
          <div onClick={closeAll} style={{ position: "fixed", inset: 0, zIndex: 10 }} />
          <div className={menuPanelClassName} style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 11, minWidth: 220 }}>
            <button
              type="button"
              className={menuItemClassName}
              onClick={() => {
                onNew();
                closeAll();
              }}
            >
              New custom aircraft...
            </button>

            <div style={{ position: "relative" }}>
              <button
                type="button"
                className={menuItemClassName}
                disabled={customAircraft.length === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditSubmenuOpen((open) => !open);
                }}
              >
                Edit custom aircraft ▸
              </button>
              {editSubmenuOpen && customAircraft.length > 0 && (
                <div className={menuPanelClassName} style={{ ...submenuPanelStyle, maxHeight: 300, overflowY: "auto" }}>
                  {customAircraft.map((aircraft) => (
                    <button
                      key={aircraft.id}
                      type="button"
                      className={menuItemClassName}
                      onClick={() => {
                        onEdit(aircraft.id);
                        closeAll();
                      }}
                    >
                      {aircraft.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
