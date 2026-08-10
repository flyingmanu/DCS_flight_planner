import { POINT_KIND_LABEL, SIDE_LABEL, type Hand, type OrbitVariant, type PointKind, type Side } from "@dcs-flight-planner/core";
import { useState } from "react";
import { menuItemClassName, menuPanelClassName, submenuPanelStyle } from "./menuStyles";
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

const SIDES: Side[] = ["blue", "red", "neutral"];

export function ObjectMenu({ onRequestCreation }: ObjectMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [submenu, setSubmenu] = useState<"point" | "polygon" | "bullseye" | null>(null);
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
        className="dfp-btn dfp-btn-onnavy"
        data-open={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        Object
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
            <div style={{ position: "relative" }}>
              <button
                type="button"
                className={menuItemClassName}
                onClick={(e) => {
                  e.stopPropagation();
                  setOrbitOpen(false);
                  setSubmenu((s) => (s === "point" ? null : "point"));
                }}
              >
                Point ▸
              </button>
              {submenu === "point" && (
                <div className={menuPanelClassName} style={submenuPanelStyle}>
                  {POINT_KINDS.map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      className={menuItemClassName}
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
                className={menuItemClassName}
                onClick={(e) => {
                  e.stopPropagation();
                  setOrbitOpen(false);
                  setSubmenu((s) => (s === "polygon" ? null : "polygon"));
                }}
              >
                Polygon ▸
              </button>
              {submenu === "polygon" && (
                <div className={menuPanelClassName} style={submenuPanelStyle}>
                  <button
                    type="button"
                    className={menuItemClassName}
                    onClick={() => request({ kind: "polygon", polygonKind: "freeform" })}
                  >
                    Freeform (multiple points)
                  </button>
                  <button
                    type="button"
                    className={menuItemClassName}
                    onClick={() => request({ kind: "polygon", polygonKind: "rectangle" })}
                  >
                    Square / rectangle
                  </button>
                  <button
                    type="button"
                    className={menuItemClassName}
                    onClick={() => request({ kind: "polygon", polygonKind: "circle" })}
                  >
                    Circle
                  </button>
                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      className={menuItemClassName}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOrbitOpen((open) => !open);
                      }}
                    >
                      Aeronautical orbit ▸
                    </button>
                    {orbitOpen && (
                      <div className={menuPanelClassName} style={submenuPanelStyle}>
                        {ORBIT_OPTIONS.map((opt) => (
                          <button
                            key={`${opt.hand}-${opt.variant}`}
                            type="button"
                            className={menuItemClassName}
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

            <div style={{ position: "relative" }}>
              <button
                type="button"
                className={menuItemClassName}
                onClick={(e) => {
                  e.stopPropagation();
                  setOrbitOpen(false);
                  setSubmenu((s) => (s === "bullseye" ? null : "bullseye"));
                }}
              >
                Bullseye ▸
              </button>
              {submenu === "bullseye" && (
                <div className={menuPanelClassName} style={submenuPanelStyle}>
                  {SIDES.map((side) => (
                    <button key={side} type="button" className={menuItemClassName} onClick={() => request({ kind: "bullseye", side })}>
                      {SIDE_LABEL[side]}
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
