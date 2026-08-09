import type { Flight } from "@dcs-flight-planner/core";
import { useState } from "react";
import { menuItemClassName, menuPanelClassName, submenuPanelStyle } from "./menuStyles";

interface FlightMenuProps {
  flights: Flight[];
  onNewFlight: () => void;
  onEditFlight: (id: string) => void;
}

export function FlightMenu({ flights, onNewFlight, onEditFlight }: FlightMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editSubmenuOpen, setEditSubmenuOpen] = useState(false);

  function closeAll() {
    setMenuOpen(false);
    setEditSubmenuOpen(false);
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        className="dfp-btn dfp-btn-onnavy"
        data-open={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        Flight
      </button>

      {menuOpen && (
        <>
          <div onClick={closeAll} style={{ position: "fixed", inset: 0, zIndex: 10 }} />
          <div
            className={menuPanelClassName}
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              zIndex: 11,
              minWidth: 200,
            }}
          >
            <button
              type="button"
              className={menuItemClassName}
              onClick={() => {
                onNewFlight();
                closeAll();
              }}
            >
              New flight...
            </button>

            <div style={{ position: "relative" }}>
              <button
                type="button"
                className={menuItemClassName}
                disabled={flights.length === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditSubmenuOpen((open) => !open);
                }}
              >
                Edit flight ▸
              </button>
              {editSubmenuOpen && flights.length > 0 && (
                <div className={menuPanelClassName} style={{ ...submenuPanelStyle, maxHeight: 300, overflowY: "auto" }}>
                  {flights.map((flight) => (
                    <button
                      key={flight.id}
                      type="button"
                      className={menuItemClassName}
                      onClick={() => {
                        onEditFlight(flight.id);
                        closeAll();
                      }}
                    >
                      {flight.name}
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
