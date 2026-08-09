import { DEFAULT_POINT_COLOR, DEFAULT_POLYGON_COLOR, POINT_KIND_LABEL, type MissionObject } from "@dcs-flight-planner/core";

interface ObjectListDialogProps {
  objects: MissionObject[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const POLYGON_KIND_LABEL: Record<string, string> = {
  freeform: "Zone (libre)",
  rectangle: "Zone rectangulaire",
  circle: "Zone circulaire",
  orbit: "Orbite aéronautique",
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
      <div
        key={object.id}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "6px 8px",
          borderRadius: 4,
          cursor: "pointer",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#f2f2f2")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        onClick={() => onSelect(object.id)}
      >
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: object.type === "point" ? "50%" : 2,
            background: objectColor(object),
            flexShrink: 0,
          }}
        />
        <span style={{ flex: 1, fontSize: 13 }}>
          {object.name}
          <span style={{ color: "#888", marginLeft: 6, fontSize: 12 }}>{objectLabel(object)}</span>
        </span>
        <button
          type="button"
          title="Supprimer"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(object.id);
          }}
          style={{ border: "none", background: "none", color: "#c02020", cursor: "pointer", fontSize: 14 }}
        >
          🗑
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 6,
          width: 420,
          maxHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            borderBottom: "1px solid #eee",
          }}
        >
          <strong style={{ fontSize: 14 }}>Objets de la mission ({objects.length})</strong>
          <button type="button" onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 16 }}>
            ×
          </button>
        </div>

        <div style={{ padding: "8px 12px", overflowY: "auto", flex: 1 }}>
          {objects.length === 0 && <div style={{ color: "#888", fontSize: 13, padding: 8 }}>Aucun objet pour l'instant.</div>}

          {points.length > 0 && (
            <>
              <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", margin: "8px 4px 2px" }}>Points</div>
              {points.map(renderRow)}
            </>
          )}

          {polygons.length > 0 && (
            <>
              <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", margin: "8px 4px 2px" }}>Zones</div>
              {polygons.map(renderRow)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
