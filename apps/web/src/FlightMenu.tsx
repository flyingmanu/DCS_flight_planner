import { useState } from "react";
import { menuItemClassName, menuPanelClassName } from "./menuStyles";

interface FlightMenuProps {
  onNewFlight: () => void;
}

export function FlightMenu({ onNewFlight }: FlightMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  function closeAll() {
    setMenuOpen(false);
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
              minWidth: 180,
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
          </div>
        </>
      )}
    </div>
  );
}
