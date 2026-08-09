import { POINT_KIND_LABEL, type Hand, type OrbitVariant, type PointKind } from "@dcs-flight-planner/core";
import { useState } from "react";
import { menuButtonStyle, submenuPanelStyle } from "./menuStyles";
import type { CreationRequest } from "./placement";

interface ObjectMenuProps {
  onRequestCreation: (request: CreationRequest) => void;
}

const POINT_KINDS: PointKind[] = ["airNav", "reference", "push", "exit", "cp", "ip", "target", "lz"];

const ORBIT_OPTIONS: Array<{ hand: Hand; variant: OrbitVariant; label: string }> = [
  { hand: "right", variant: "hold", label: "Standard hold — right-hand" },
  { hand: "left", variant: "hold", label: "Standard hold — left-hand" },
  { hand: "right", variant: "aar", label: "AAR — right-hand" },
  { hand: "left", variant: "aar", label: "AAR — left-hand" },
];

export function ObjectMenu({ onRequestCreation }: ObjectMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [submenu, setSubmenu] = useState<"point" | "polygon" | null>(null);
  const [orbitOpen, setOrbitOpen] = useState(false);

  function closeAll() {
    setMenuOpen(false);
    setSubmenu(null);
    setOrbitOpen(false);
  }

  function request(req: CreationRequest) {
    onRequestCreation(req);
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
        Object
      </button>

      {menuOpen && (
        <>
          <div onClick={closeAll} style={{ position: "fixed", inset: 0, zIndex: 10 }} />
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
              minWidth: 180,
            }}
          >
            <div style={{ position: "relative" }}>
              <button
                type="button"
                style={menuButtonStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  setOrbitOpen(false);
                  setSubmenu((s) => (s === "point" ? null : "point"));
                }}
              >
                Point ▸
              </button>
              {submenu === "point" && (
                <div style={submenuPanelStyle}>
                  {POINT_KINDS.map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      style={menuButtonStyle}
                      onClick={() => request({ kind: "point", pointKind: kind })}
                    >
                      {POINT_KIND_LABEL[kind]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ position: "relative" }}>
              <button
                type="button"
                style={menuButtonStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  setOrbitOpen(false);
                  setSubmenu((s) => (s === "polygon" ? null : "polygon"));
                }}
              >
                Polygon ▸
              </button>
              {submenu === "polygon" && (
                <div style={submenuPanelStyle}>
                  <button
                    type="button"
                    style={menuButtonStyle}
                    onClick={() => request({ kind: "polygon", polygonKind: "freeform" })}
                  >
                    Freeform (multiple points)
                  </button>
                  <button
                    type="button"
                    style={menuButtonStyle}
                    onClick={() => request({ kind: "polygon", polygonKind: "rectangle" })}
                  >
                    Square / rectangle
                  </button>
                  <button
                    type="button"
                    style={menuButtonStyle}
                    onClick={() => request({ kind: "polygon", polygonKind: "circle" })}
                  >
                    Circle
                  </button>
                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      style={menuButtonStyle}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOrbitOpen((open) => !open);
                      }}
                    >
                      Aeronautical orbit ▸
                    </button>
                    {orbitOpen && (
                      <div style={submenuPanelStyle}>
                        {ORBIT_OPTIONS.map((opt) => (
                          <button
                            key={`${opt.hand}-${opt.variant}`}
                            type="button"
                            style={menuButtonStyle}
                            onClick={() =>
                              request({ kind: "polygon", polygonKind: "orbit", hand: opt.hand, variant: opt.variant })
                            }
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
