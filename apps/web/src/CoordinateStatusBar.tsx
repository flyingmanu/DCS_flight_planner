import { formatLatLonDdm, metersToFeet, toMgrs } from "@dcs-flight-planner/core";
import type { HoverInfo } from "./TheaterMap";

interface CoordinateStatusBarProps {
  hover: HoverInfo | null;
}

const PLACEHOLDER = "—";

function Readout({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
      <span
        style={{
          fontFamily: "var(--dfp-font-sans)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.08em",
          color: "var(--dfp-text-inverse-muted)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--dfp-font-mono)",
          fontSize: 13,
          color: active ? "var(--dfp-accent)" : "var(--dfp-text-inverse-muted)",
          transition: "color 0.15s ease",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return <div style={{ width: 1, alignSelf: "stretch", background: "rgba(255,255,255,0.12)" }} />;
}

export function CoordinateStatusBar({ hover }: CoordinateStatusBarProps) {
  const point = hover ? { lat: hover.lat, lon: hover.lon } : null;
  const coords = point ? formatLatLonDdm(point) : PLACEHOLDER;
  const mgrs = point ? toMgrs(point) : PLACEHOLDER;
  const altitude =
    hover && hover.elevationM != null
      ? `${Math.round(hover.elevationM)} m / ${Math.round(metersToFeet(hover.elevationM))} ft`
      : PLACEHOLDER;

  return (
    <footer
      style={{
        padding: "6px 16px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        background: "var(--dfp-navy-950)",
        borderTop: "1px solid var(--dfp-navy-700)",
      }}
    >
      <Readout label="POSITION" value={coords} active={!!hover} />
      <Divider />
      <Readout label="MGRS" value={mgrs} active={!!hover} />
      <Divider />
      <Readout label="ELEV" value={altitude} active={!!hover} />
    </footer>
  );
}
