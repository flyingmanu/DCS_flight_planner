import { DEFAULT_FLIGHT_COLOR, TASK_TYPE_LABEL, type Flight } from "@dcs-flight-planner/core";

interface FlightListDialogProps {
  flights: Flight[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewFlight: () => void;
  onClose: () => void;
}

export function FlightListDialog({ flights, onSelect, onDelete, onNewFlight, onClose }: FlightListDialogProps) {
  return (
    <div
      className="dfp-scrim"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 20,
      }}
    >
      <div
        className="dfp-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          borderRadius: "var(--dfp-radius-lg)",
          width: 460,
          maxHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div className="dfp-panel-header">
          <span>Flights ({flights.length})</span>
          <button type="button" className="dfp-panel-header-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div style={{ padding: "8px 12px", overflowY: "auto", flex: 1 }}>
          {flights.length === 0 && <div style={{ color: "var(--dfp-text-muted)", fontSize: 13, padding: 8 }}>No flights yet.</div>}

          {flights.map((flight) => (
            <div key={flight.id} className="dfp-list-row" onClick={() => onSelect(flight.id)}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  background: flight.color ?? DEFAULT_FLIGHT_COLOR,
                  border: "1px solid rgba(0,0,0,0.15)",
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1, fontSize: 13 }}>
                {flight.name}
                <span style={{ color: "var(--dfp-text-muted)", marginLeft: 6, fontSize: 12 }}>
                  {[flight.aircraftType, TASK_TYPE_LABEL[flight.taskType]].filter(Boolean).join(" · ")}
                </span>
              </span>
              <button
                type="button"
                title="Delete"
                className="dfp-list-row-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(flight.id);
                }}
              >
                🗑
              </button>
            </div>
          ))}
        </div>

        <div style={{ padding: 12, borderTop: "1px solid var(--dfp-border)" }}>
          <button type="button" className="dfp-btn dfp-btn-accent" style={{ width: "100%" }} onClick={onNewFlight}>
            + New flight
          </button>
        </div>
      </div>
    </div>
  );
}
