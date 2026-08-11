import { formatLatLonDdm, type GlobalAirport, type Theater } from "@dcs-flight-planner/core";
import { Field } from "./FormField";
import { CATEGORY_LABEL, formatIls } from "./TheaterMap";

type Airbase = Theater["airbases"][number];

type AirbaseInfoPanelProps =
  | { kind: "dcs"; airbase: Airbase; onClose: () => void }
  | { kind: "world"; airport: GlobalAirport; onClose: () => void };

const WORLD_AIRPORT_TYPE_LABEL: Record<GlobalAirport["type"], string> = {
  large: "Large airport",
  medium: "Medium airport",
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Field label={label}>
      <div style={{ fontSize: 13 }}>{value}</div>
    </Field>
  );
}

function DcsAirbaseDetails({ airbase }: { airbase: Airbase }) {
  const navaids = [
    `TACAN ${airbase.tacanChannel}`,
    airbase.vorFrequencyMhz ? `VOR ${airbase.vorFrequencyMhz}` : null,
    airbase.rsbnChannel ? `RSBN ${airbase.rsbnChannel}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <InfoRow label="Category" value={CATEGORY_LABEL[airbase.category]} />
      <InfoRow label="Position" value={formatLatLonDdm(airbase.position)} />
      <InfoRow
        label="Radio"
        value={`HF ${airbase.radio.hfMhz} · VHF-L ${airbase.radio.vhfLowMhz} · VHF-H ${airbase.radio.vhfHighMhz} · UHF ${airbase.radio.uhfMhz}`}
      />
      {navaids && <InfoRow label="Navaids" value={navaids} />}
      {airbase.runways.length > 0 && (
        <Field label="Runways">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {airbase.runways.map((rw) => (
              <div key={rw.id} style={{ fontSize: 13, lineHeight: 1.5 }}>
                <strong>{rw.id}</strong> — {Math.round(rw.lengthM)} m × {Math.round(rw.widthM)} m
                <br />
                {formatIls(rw)}
                {rw.prmgChannel ? ` · PRMG ${rw.prmgChannel}` : ""}
              </div>
            ))}
          </div>
        </Field>
      )}
    </>
  );
}

function WorldAirportDetails({ airport }: { airport: GlobalAirport }) {
  const codes = [airport.icao, airport.iata].filter(Boolean).join(" / ");
  return (
    <>
      <InfoRow label="Type" value={WORLD_AIRPORT_TYPE_LABEL[airport.type]} />
      {codes && <InfoRow label="ICAO / IATA" value={codes} />}
      <InfoRow label="Country" value={airport.country} />
      <InfoRow label="Position" value={formatLatLonDdm({ lat: airport.lat, lon: airport.lon })} />
      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
        World reference airport (OurAirports) — not part of the active DCS theater's curated data.
      </div>
    </>
  );
}

export function AirbaseInfoPanel(props: AirbaseInfoPanelProps) {
  const title = props.kind === "dcs" ? props.airbase.name : props.airport.name;

  return (
    <div
      className="dfp-panel"
      style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 300, borderLeft: "none", zIndex: 15, display: "flex", flexDirection: "column" }}
    >
      <div className="dfp-panel-header">
        <span>{title}</span>
        <button type="button" onClick={props.onClose} title="Close" className="dfp-panel-header-close">
          ×
        </button>
      </div>

      <div style={{ padding: 16, overflowY: "auto", flex: 1 }}>
        {props.kind === "dcs" ? <DcsAirbaseDetails airbase={props.airbase} /> : <WorldAirportDetails airport={props.airport} />}
      </div>
    </div>
  );
}
