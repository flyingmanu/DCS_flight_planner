import type { Mission } from "@dcs-flight-planner/core";
import { useState } from "react";
import { menuItemClassName, menuPanelClassName, submenuPanelStyle } from "./menuStyles";

interface FileMenuProps {
  missions: Mission[];
  activeMissionId: string | null;
  onNew: () => void;
  onOpen: (id: string) => void;
  onSave: () => void;
  onSaveAs: () => void;
  onDelete: () => void;
}

export function FileMenu({ missions, activeMissionId, onNew, onOpen, onSave, onSaveAs, onDelete }: FileMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(false);

  function closeAll() {
    setMenuOpen(false);
    setOpenSubmenu(false);
  }

  function run(action: () => void) {
    action();
    closeAll();
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        className="dfp-btn dfp-btn-onnavy"
        data-open={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        File
      </button>

      {menuOpen && (
        <>
          {/* Click-outside-to-close overlay */}
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
            <button type="button" className={menuItemClassName} onClick={() => run(onNew)}>
              New
            </button>

            <div style={{ position: "relative" }}>
              <button
                type="button"
                className={menuItemClassName}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenSubmenu((open) => !open);
                }}
              >
                Open ▸
              </button>
              {openSubmenu && (
                <div className={menuPanelClassName} style={{ ...submenuPanelStyle, maxHeight: 300, overflowY: "auto" }}>
                  {missions.length === 0 ? (
                    <div style={{ padding: "6px 16px", color: "var(--dfp-text-muted)", fontSize: 13 }}>(no saved missions)</div>
                  ) : (
                    missions.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className={menuItemClassName}
                        style={{ fontWeight: m.id === activeMissionId ? 700 : 400 }}
                        onClick={() => run(() => onOpen(m.id))}
                      >
                        {m.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="dfp-menu-divider" />

            <button type="button" className={menuItemClassName} onClick={() => run(onSave)}>
              Save
            </button>
            <button type="button" className={menuItemClassName} onClick={() => run(onSaveAs)}>
              Save as...
            </button>

            <div className="dfp-menu-divider" />

            <button
              type="button"
              className={menuItemClassName}
              style={{ color: activeMissionId ? "var(--dfp-danger)" : undefined }}
              disabled={!activeMissionId}
              onClick={() => run(onDelete)}
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
