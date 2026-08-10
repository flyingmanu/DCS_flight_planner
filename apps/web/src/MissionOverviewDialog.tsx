import {
  addMinutesToClock,
  computeGrossWeightLb,
  computeLoadoutWeightLb,
  computeRouteLegs,
  DEFAULT_FLIGHT_COLOR,
  findAircraft,
  formatEte,
  formatLatLonDdm,
  POINT_KIND_LABEL,
  TASK_TYPE_LABEL,
  totalRouteDistanceNm,
  type Airbase,
  type Flight,
  type MissionObject,
  type PolygonShape,
} from "@dcs-flight-planner/core";
import { useState } from "react";
import { loadoutSummary } from "./armamentSummary";
import { exportKneeboards } from "./kneeboard";

interface MissionOverviewDialogProps {
  missionName: string;
  theaterName: string;
  airbases: Airbase[];
  flights: Flight[];
  objects: MissionObject[];
  onClose: () => void;
}

const POLYGON_KIND_LABEL: Record<PolygonShape["kind"], string> = {
  freeform: "Zone (freeform)",
  rectangle: "Rectangular zone",
  circle: "Circular zone",
  orbit: "Aeronautical orbit",
};

function polygonSummary(shape: PolygonShape): string {
  switch (shape.kind) {
    case "circle":
      return `${(shape.radiusM / 1852).toFixed(1)} NM radius`;
    case "orbit":
      return `${shape.hand === "left" ? "Left" : "Right"}-hand, ${shape.legLengthNm.toFixed(1)} NM legs, course ${Math.round(shape.courseDeg)}°`;
    case "rectangle":
      return `Rotation ${Math.round(shape.rotationDeg)}°`;
    case "freeform":
      return `${shape.vertices.length} vertices`;
  }
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{ textAlign: "left", padding: "3px 8px", fontSize: 10.5, color: "var(--dfp-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
      {children}
    </th>
  );
}

function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <td
      style={{
        padding: "3px 8px",
        fontSize: 12.5,
        borderTop: "1px solid var(--dfp-border)",
        fontFamily: mono ? "var(--dfp-font-mono)" : undefined,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </td>
  );
}

export function MissionOverviewDialog({ missionName, theaterName, airbases, flights, objects, onClose }: MissionOverviewDialogProps) {
  const airbaseName = (id: string | undefined) => (id ? (airbases.find((a) => a.id === id)?.name ?? id) : "—");
  const points = objects.filter((o) => o.type === "point");
  const polygons = objects.filter((o) => o.type === "polygon");
  const [exporting, setExporting] = useState(false);

  async function handleExportKneeboards() {
    setExporting(true);
    try {
      await exportKneeboards(flights, airbases, missionName);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div
      className="dfp-scrim"
      onClick={onClose}
      style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20 }}
    >
      <div
        className="dfp-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          borderRadius: "var(--dfp-radius-lg)",
          width: "min(920px, 92vw)",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div className="dfp-panel-header">
          <span>Mission overview — {missionName}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              className="dfp-btn"
              disabled={flights.length === 0 || exporting}
              onClick={handleExportKneeboards}
              title={flights.length === 0 ? "Add a flight first" : "Download one kneeboard PNG per flight"}
            >
              {exporting ? "Exporting…" : "Export kneeboards (PNG)"}
            </button>
            <button type="button" className="dfp-panel-header-close" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        <div style={{ padding: "14px 18px", overflowY: "auto", flex: 1 }}>
          <div style={{ fontSize: 12, color: "var(--dfp-text-muted)", marginBottom: 16 }}>
            {theaterName} · {flights.length} flight{flights.length === 1 ? "" : "s"} · {objects.length} object{objects.length === 1 ? "" : "s"}
          </div>

          {flights.length === 0 && <div style={{ color: "var(--dfp-text-muted)", fontSize: 13, marginBottom: 20 }}>No flights planned yet.</div>}

          {flights.map((flight) => {
            const route = flight.route ?? [];
            const legs = computeRouteLegs(route);
            const etas: (string | null)[] = [];
            let cumMin = 0;
            let cumValid = true;
            for (let i = 0; i < route.length; i++) {
              if (i === 0) {
                etas.push(flight.takeoffTime ?? null);
                continue;
              }
              const leg = legs[i - 1];
              if (!leg || leg.eteMin === undefined) cumValid = false;
              cumMin += leg?.eteMin ?? 0;
              etas.push(cumValid && flight.takeoffTime ? addMinutesToClock(flight.takeoffTime, cumMin) : null);
            }

            return (
              <div key={flight.id} style={{ marginBottom: 22, border: "1px solid var(--dfp-border)", borderRadius: "var(--dfp-radius-sm)" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 12px",
                    background: "var(--dfp-bg)",
                    borderBottom: "1px solid var(--dfp-border)",
                  }}
                >
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: flight.color ?? DEFAULT_FLIGHT_COLOR, flexShrink: 0 }} />
                  <strong style={{ fontSize: 14 }}>{flight.name || "(unnamed flight)"}</strong>
                  <span style={{ fontSize: 12.5, color: "var(--dfp-text-muted)" }}>
                    {[flight.aircraftType, TASK_TYPE_LABEL[flight.taskType], `${flight.size} ship`].filter(Boolean).join(" · ")}
                  </span>
                </div>

                <div style={{ padding: "8px 12px", fontSize: 12.5, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2px 12px" }}>
                  <div>
                    Dep: <strong>{airbaseName(flight.departureAirbaseId)}</strong>
                  </div>
                  <div>
                    Arr: <strong>{airbaseName(flight.arrivalAirbaseId)}</strong>
                  </div>
                  <div>
                    Alt: <strong>{airbaseName(flight.alternateAirbaseId)}</strong>
                  </div>
                  <div>Takeoff: {flight.takeoffTime ?? "—"}</div>
                  <div>TACAN: {flight.tacanChannel ?? "—"}</div>
                  <div>Radio: {flight.radioFrequencyMhz ? `${flight.radioFrequencyMhz} MHz` : "—"}</div>
                  {(() => {
                    const summary = loadoutSummary(flight);
                    if (!summary) return null;
                    const aircraft = findAircraft(flight.aircraftId);
                    const ordnanceLb = computeLoadoutWeightLb(flight.pylonLoadout);
                    const gross = aircraft ? computeGrossWeightLb(aircraft, flight.pylonLoadout) : undefined;
                    return (
                      <div style={{ gridColumn: "1 / -1", color: "var(--dfp-text-muted)" }}>
                        Armament: {summary} — {ordnanceLb.toLocaleString()} lb
                        {gross !== undefined && <> · Est. gross weight {gross.toLocaleString()} lb</>}
                      </div>
                    );
                  })()}
                  {flight.loadout && (
                    <div style={{ gridColumn: "1 / -1", color: "var(--dfp-text-muted)" }}>Loadout notes: {flight.loadout}</div>
                  )}
                  {flight.notes && <div style={{ gridColumn: "1 / -1", color: "var(--dfp-text-muted)" }}>Notes: {flight.notes}</div>}
                </div>

                {route.length > 0 && (
                  <div style={{ overflowX: "auto", padding: "0 12px 10px" }}>
                    <table style={{ borderCollapse: "collapse", width: "100%" }}>
                      <thead>
                        <tr>
                          <Th>WP</Th>
                          <Th>Coordinates</Th>
                          <Th>Alt</Th>
                          <Th>Speed</Th>
                          <Th>Dist</Th>
                          <Th>Trk</Th>
                          <Th>ETE</Th>
                          <Th>ETA</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {route.map((wp, i) => {
                          const leg = i > 0 ? legs[i - 1] : undefined;
                          return (
                            <tr key={wp.id}>
                              <Td>{wp.name ?? `WP${i + 1}`}</Td>
                              <Td mono>{formatLatLonDdm(wp.position)}</Td>
                              <Td mono>{wp.altitudeFt ? `${wp.altitudeFt.toLocaleString()} ft` : "—"}</Td>
                              <Td mono>{wp.airspeedKt ? `${wp.airspeedKt} kt` : "—"}</Td>
                              <Td mono>{leg ? `${leg.distanceNm.toFixed(1)} NM` : "—"}</Td>
                              <Td mono>{leg ? `${Math.round(leg.trackDeg).toString().padStart(3, "0")}°` : "—"}</Td>
                              <Td mono>{leg?.eteMin !== undefined ? formatEte(leg.eteMin) : "—"}</Td>
                              <Td mono>{etas[i] ?? "—"}</Td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div style={{ fontSize: 11.5, color: "var(--dfp-text-muted)", marginTop: 6 }}>
                      Total distance {totalRouteDistanceNm(route).toFixed(1)} NM
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {points.length > 0 && (
            <>
              <div className="dfp-label" style={{ margin: "8px 0 4px" }}>
                Points ({points.length})
              </div>
              <table style={{ borderCollapse: "collapse", width: "100%", marginBottom: 20 }}>
                <thead>
                  <tr>
                    <Th>Name</Th>
                    <Th>Kind</Th>
                    <Th>Coordinates</Th>
                    <Th>DMPI elevation</Th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((object) =>
                    object.type === "point" ? (
                      <tr key={object.id}>
                        <Td>{object.name}</Td>
                        <Td>{POINT_KIND_LABEL[object.kind]}</Td>
                        <Td mono>{formatLatLonDdm(object.position)}</Td>
                        <Td mono>{object.dmpis?.[0]?.elevationFt !== undefined ? `${object.dmpis[0].elevationFt.toLocaleString()} ft` : "—"}</Td>
                      </tr>
                    ) : null,
                  )}
                </tbody>
              </table>
            </>
          )}

          {polygons.length > 0 && (
            <>
              <div className="dfp-label" style={{ margin: "8px 0 4px" }}>
                Zones ({polygons.length})
              </div>
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                  <tr>
                    <Th>Name</Th>
                    <Th>Kind</Th>
                    <Th>Details</Th>
                  </tr>
                </thead>
                <tbody>
                  {polygons.map((object) =>
                    object.type === "polygon" ? (
                      <tr key={object.id}>
                        <Td>{object.name}</Td>
                        <Td>{POLYGON_KIND_LABEL[object.shape.kind]}</Td>
                        <Td>{polygonSummary(object.shape)}</Td>
                      </tr>
                    ) : null,
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
