import { formatLatLonDdm, metersToFeet, toMgrs } from "@dcs-flight-planner/core";
import type { HoverInfo } from "./TheaterMap";

interface CoordinateStatusBarProps {
  hover: HoverInfo | null;
}

export function CoordinateStatusBar({ hover }: CoordinateStatusBarProps) {
  if (!hover) return null;

  const point = { lat: hover.lat, lon: hover.lon };
  const altitude =
    hover.elevationM == null
      ? "alt. —"
      : `alt. ${Math.round(hover.elevationM)} m / ${Math.round(metersToFeet(hover.elevationM))} ft`;

  return (
    <footer
      style={{
        padding: "4px 12px",
        borderTop: "1px solid #3333",
        display: "flex",
        gap: 24,
        fontFamily: "ui-monospace, Consolas, monospace",
        fontSize: 13,
        background: "#f5f5f5",
      }}
    >
      <span>{formatLatLonDdm(point)}</span>
      <span>MGRS {toMgrs(point)}</span>
      <span>{altitude}</span>
    </footer>
  );
}
