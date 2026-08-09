import type { CSSProperties } from "react";

export const menuButtonStyle: CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "6px 16px",
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: 14,
  whiteSpace: "nowrap",
};

export const submenuPanelStyle: CSSProperties = {
  position: "absolute",
  left: "100%",
  top: 0,
  background: "#fff",
  border: "1px solid #ccc",
  borderRadius: 4,
  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  paddingBlock: 4,
  minWidth: 220,
};
