import type { Mission } from "@dcs-flight-planner/core";
import { useState } from "react";
import { menuButtonStyle, submenuPanelStyle } from "./menuStyles";

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
        onClick={() => setMenuOpen((open) => !open)}
        style={{
          padding: "4px 12px",
          background: menuOpen ? "#dbeafe" : "transparent",
          border: "1px solid transparent",
          cursor: "pointer",
          fontSize: 14,
        }}
      >
        File
      </button>

      {menuOpen && (
        <>
          {/* Click-outside-to-close overlay */}
          <div
            onClick={closeAll}
            style={{ position: "fixed", inset: 0, zIndex: 10 }}
          />
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              zIndex: 11,
              background: "#fff",
              border: "1px solid #ccc",
              borderRadius: 4,
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              paddingBlock: 4,
              minWidth: 200,
            }}
          >
            <button type="button" style={menuButtonStyle} onClick={() => run(onNew)}>
              New
            </button>

            <div style={{ position: "relative" }}>
              <button
                type="button"
                style={menuButtonStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenSubmenu((open) => !open);
                }}
              >
                Open ▸
              </button>
              {openSubmenu && (
                <div style={{ ...submenuPanelStyle, maxHeight: 300, overflowY: "auto" }}>
                  {missions.length === 0 ? (
                    <div style={{ padding: "6px 16px", color: "#888", fontSize: 13 }}>
                      (no saved missions)
                    </div>
                  ) : (
                    missions.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        style={{
                          ...menuButtonStyle,
                          fontWeight: m.id === activeMissionId ? 700 : 400,
                        }}
                        onClick={() => run(() => onOpen(m.id))}
                      >
                        {m.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div style={{ borderTop: "1px solid #eee", margin: "4px 0" }} />

            <button type="button" style={menuButtonStyle} onClick={() => run(onSave)}>
              Save
            </button>
            <button type="button" style={menuButtonStyle} onClick={() => run(onSaveAs)}>
              Save as...
            </button>

            <div style={{ borderTop: "1px solid #eee", margin: "4px 0" }} />

            <button
              type="button"
              style={{ ...menuButtonStyle, color: activeMissionId ? "#c02020" : "#aaa" }}
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
