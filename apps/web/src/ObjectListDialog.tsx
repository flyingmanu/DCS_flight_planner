import {
  DEFAULT_FLIGHT_COLOR,
  DEFAULT_LABEL_COLOR,
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
  onToggleVisible: (id: string) => void;
  onSelectFlight: (id: string) => void;
  onDeleteFlight: (id: string) => void;
  onToggleFlightVisible: (id: string) => void;
  onClose: () => void;
}

const POLYGON_KIND_LABEL: Record<string, string> = {
  freeform: "Zone (freeform)",
  rectangle: "Rectangular zone",
  circle: "Circular zone",
  orbit: "Aeronautical orbit",
};

function objectLabel(object: MissionObject): string {
  if (object.type === "point") return POINT_KIND_LABEL[object.kind];
  if (object.type === "label") return "Text label";
  return POLYGON_KIND_LABEL[object.shape.kind] ?? "Zone";
}

function objectColor(object: MissionObject): string {
  if (object.color) return object.color;
  if (object.type === "point") return DEFAULT_POINT_COLOR[object.kind];
  if (object.type === "label") return DEFAULT_LABEL_COLOR;
  return DEFAULT_POLYGON_COLOR;
}

function ListRow({
  name,
  label,
  color,
  round,
  visible,
  onSelect,
  onDelete,
  onToggleVisible,
}: {
  name: string;
  label: string;
  color: string;
  round: boolean;
  visible: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onToggleVisible: () => void;
}) {
  return (
    <div className="dfp-list-row" onClick={onSelect}>
      <input
        type="checkbox"
        title="Visible on map"
        checked={visible}
        onClick={(e) => e.stopPropagation()}
        onChange={onToggleVisible}
        style={{ flexShrink: 0 }}
      />
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: round ? "50%" : 2,
          background: color,
          border: "1px solid rgba(0,0,0,0.15)",
          flexShrink: 0,
          opacity: visible ? 1 : 0.4,
        }}
      />
      <span style={{ flex: 1, fontSize: 13, opacity: visible ? 1 : 0.55 }}>
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

export function ObjectListDialog({
  objects,
  flights,
  onSelect,
  onDelete,
  onToggleVisible,
  onSelectFlight,
  onDeleteFlight,
  onToggleFlightVisible,
  onClose,
}: ObjectListDialogProps) {
  const points = objects.filter((o) => o.type === "point");
  const polygons = objects.filter((o) => o.type === "polygon");
  const labels = objects.filter((o) => o.type === "label");
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
                  visible={flight.visible !== false}
                  onSelect={() => onSelectFlight(flight.id)}
                  onDelete={() => onDeleteFlight(flight.id)}
                  onToggleVisible={() => onToggleFlightVisible(flight.id)}
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
                  visible={object.visible !== false}
                  onSelect={() => onSelect(object.id)}
                  onDelete={() => onDelete(object.id)}
                  onToggleVisible={() => onToggleVisible(object.id)}
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
                  visible={object.visible !== false}
                  onSelect={() => onSelect(object.id)}
                  onDelete={() => onDelete(object.id)}
                  onToggleVisible={() => onToggleVisible(object.id)}
                />
              ))}
            </>
          )}

          {labels.length > 0 && (
            <>
              <div className="dfp-label" style={{ margin: "8px 4px 2px" }}>
                Labels
              </div>
              {labels.map((object) => (
                <ListRow
                  key={object.id}
                  name={object.name}
                  label={objectLabel(object)}
                  color={objectColor(object)}
                  round={false}
                  visible={object.visible !== false}
                  onSelect={() => onSelect(object.id)}
                  onDelete={() => onDelete(object.id)}
                  onToggleVisible={() => onToggleVisible(object.id)}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
