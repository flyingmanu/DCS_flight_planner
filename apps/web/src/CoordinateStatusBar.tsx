import { formatLatLonDdm, metersToFeet, toMgrs } from "@dcs-flight-planner/core";
import type { HoverInfo } from "./TheaterMap";

interface CoordinateStatusBarProps {
  hover: HoverInfo | null;
}

const PLACEHOLDER = "—";

export function CoordinateStatusBar({ hover }: CoordinateStatusBarProps) {
  const point = hover ? { lat: hover.lat, lon: hover.lon } : null;
  const coords = point ? formatLatLonDdm(point) : PLACEHOLDER;
  const mgrs = point ? toMgrs(point) : PLACEHOLDER;
  const altitude =
    hover && hover.elevationM != null
      ? `alt. ${Math.round(hover.elevationM)} m / ${Math.round(metersToFeet(hover.elevationM))} ft`
      : `alt. ${PLACEHOLDER}`;

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
        color: hover ? undefined : "#999",
      }}
    >
      <span>{coords}</span>
      <span>MGRS {mgrs}</span>
      <span>{altitude}</span>
    </footer>
  );
}
