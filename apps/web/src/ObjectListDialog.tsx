import { DEFAULT_POINT_COLOR, DEFAULT_POLYGON_COLOR, POINT_KIND_LABEL, type MissionObject } from "@dcs-flight-planner/core";

interface ObjectListDialogProps {
  objects: MissionObject[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
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

export function ObjectListDialog({ objects, onSelect, onDelete, onClose }: ObjectListDialogProps) {
  const points = objects.filter((o) => o.type === "point");
  const polygons = objects.filter((o) => o.type === "polygon");

  function renderRow(object: MissionObject) {
    return (
      <div key={object.id} className="dfp-list-row" onClick={() => onSelect(object.id)}>
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: object.type === "point" ? "50%" : 2,
            background: objectColor(object),
            border: "1px solid rgba(0,0,0,0.15)",
            flexShrink: 0,
          }}
        />
        <span style={{ flex: 1, fontSize: 13 }}>
          {object.name}
          <span style={{ color: "var(--dfp-text-muted)", marginLeft: 6, fontSize: 12 }}>{objectLabel(object)}</span>
        </span>
        <button
          type="button"
          title="Delete"
          className="dfp-list-row-delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(object.id);
          }}
        >
          🗑
        </button>
      </div>
    );
  }

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
          <span>Mission objects ({objects.length})</span>
          <button type="button" className="dfp-panel-header-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div style={{ padding: "8px 12px", overflowY: "auto", flex: 1 }}>
          {objects.length === 0 && <div style={{ color: "var(--dfp-text-muted)", fontSize: 13, padding: 8 }}>No objects yet.</div>}

          {points.length > 0 && (
            <>
              <div className="dfp-label" style={{ margin: "8px 4px 2px" }}>
                Points
              </div>
              {points.map(renderRow)}
            </>
          )}

          {polygons.length > 0 && (
            <>
              <div className="dfp-label" style={{ margin: "8px 4px 2px" }}>
                Zones
              </div>
              {polygons.map(renderRow)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
