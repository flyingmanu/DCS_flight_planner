import {
  DEFAULT_FLIGHT_COLOR,
  DEFAULT_POINT_COLOR,
  DEFAULT_POLYGON_COLOR,
  POINT_KIND_LABEL,
  TASK_TYPE_LABEL,
  type Flight,
  type MissionObject,
} from "@dcs-flight-planner/core";

interface ObjectListDialogProps {
  objects: MissionObject[];
  flights: Flight[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onSelectFlight: (id: string) => void;
  onDeleteFlight: (id: string) => void;
  onClose: () => void;
}

const POLYGON_KIND_LABEL: Record<string, string> = {
  freeform: "Zone (freeform)",
  rectangle: "Rectangular zone",
  circle: "Circular zone",
  orbit: "Aeronautical orbit",
};

function objectLabel(object: MissionObject): string {
  return object.type === "point" ? POINT_KIND_LABEL[object.kind] : (POLYGON_KIND_LABEL[object.shape.kind] ?? "Zone");
}

function objectColor(object: MissionObject): string {
  if (object.color) return object.color;
  return object.type === "point" ? DEFAULT_POINT_COLOR[object.kind] : DEFAULT_POLYGON_COLOR;
}

function ListRow({
  name,
  label,
  color,
  round,
  onSelect,
  onDelete,
}: {
  name: string;
  label: string;
  color: string;
  round: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="dfp-list-row" onClick={onSelect}>
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: round ? "50%" : 2,
          background: color,
          border: "1px solid rgba(0,0,0,0.15)",
          flexShrink: 0,
        }}
      />
      <span style={{ flex: 1, fontSize: 13 }}>
        {name}
        <span style={{ color: "var(--dfp-text-muted)", marginLeft: 6, fontSize: 12 }}>{label}</span>
      </span>
      <button
        type="button"
        title="Delete"
        className="dfp-list-row-delete"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        🗑
      </button>
    </div>
  );
}

export function ObjectListDialog({ objects, flights, onSelect, onDelete, onSelectFlight, onDeleteFlight, onClose }: ObjectListDialogProps) {
  const points = objects.filter((o) => o.type === "point");
  const polygons = objects.filter((o) => o.type === "polygon");
  const total = objects.length + flights.length;

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
          width: 420,
          maxHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div className="dfp-panel-header">
          <span>Mission objects ({total})</span>
          <button type="button" className="dfp-panel-header-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div style={{ padding: "8px 12px", overflowY: "auto", flex: 1 }}>
          {total === 0 && <div style={{ color: "var(--dfp-text-muted)", fontSize: 13, padding: 8 }}>No objects yet.</div>}

          {flights.length > 0 && (
            <>
              <div className="dfp-label" style={{ margin: "8px 4px 2px" }}>
                Flights
              </div>
              {flights.map((flight) => (
                <ListRow
                  key={flight.id}
                  name={flight.name}
                  label={[flight.aircraftType, TASK_TYPE_LABEL[flight.taskType]].filter(Boolean).join(" · ")}
                  color={flight.color ?? DEFAULT_FLIGHT_COLOR}
                  round={false}
                  onSelect={() => onSelectFlight(flight.id)}
                  onDelete={() => onDeleteFlight(flight.id)}
                />
              ))}
            </>
          )}

          {points.length > 0 && (
            <>
              <div className="dfp-label" style={{ margin: "8px 4px 2px" }}>
                Points
              </div>
              {points.map((object) => (
                <ListRow
                  key={object.id}
                  name={object.name}
                  label={objectLabel(object)}
                  color={objectColor(object)}
                  round
                  onSelect={() => onSelect(object.id)}
                  onDelete={() => onDelete(object.id)}
                />
              ))}
            </>
          )}

          {polygons.length > 0 && (
            <>
              <div className="dfp-label" style={{ margin: "8px 4px 2px" }}>
                Zones
              </div>
              {polygons.map((object) => (
                <ListRow
                  key={object.id}
                  name={object.name}
                  label={objectLabel(object)}
                  color={objectColor(object)}
                  round={false}
                  onSelect={() => onSelect(object.id)}
                  onDelete={() => onDelete(object.id)}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
