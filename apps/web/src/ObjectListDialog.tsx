import {
  DEFAULT_FLIGHT_COLOR,
  DEFAULT_LABEL_COLOR,
  DEFAULT_LINE_COLOR,
  DEFAULT_POINT_COLOR,
  DEFAULT_POLYGON_COLOR,
  POINT_KIND_LABEL,
  TASK_TYPE_LABEL,
  type Bullseye,
  type Flight,
  type MissionObject,
  type Package,
} from "@dcs-flight-planner/core";
import { useState } from "react";
import { exportObjectSet } from "./objectExport";

interface ObjectListDialogProps {
  theaterId: string;
  missionName: string;
  objects: MissionObject[];
  flights: Flight[];
  bullseyes: Bullseye[];
  packages: Package[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onToggleLocked: (id: string) => void;
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
  if (object.type === "line") return "Line";
  return POLYGON_KIND_LABEL[object.shape.kind] ?? "Zone";
}

function objectColor(object: MissionObject): string {
  if (object.color) return object.color;
  if (object.type === "point") return DEFAULT_POINT_COLOR[object.kind];
  if (object.type === "label") return DEFAULT_LABEL_COLOR;
  if (object.type === "line") return DEFAULT_LINE_COLOR;
  return DEFAULT_POLYGON_COLOR;
}

function ListRow({
  name,
  label,
  color,
  round,
  visible,
  locked,
  picked,
  onTogglePicked,
  onSelect,
  onDelete,
  onToggleVisible,
  onToggleLocked,
}: {
  name: string;
  label: string;
  color: string;
  round: boolean;
  visible: boolean;
  locked?: boolean;
  picked: boolean;
  onTogglePicked: () => void;
  onSelect: () => void;
  onDelete: () => void;
  onToggleVisible: () => void;
  onToggleLocked?: () => void;
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
      {onToggleLocked && (
        <button
          type="button"
          title={locked ? "Unlock (allow dragging)" : "Lock (prevent dragging)"}
          className="dfp-list-row-delete"
          onClick={(e) => {
            e.stopPropagation();
            onToggleLocked();
          }}
        >
          {locked ? "🔒" : "🔓"}
        </button>
      )}
      <input
        type="checkbox"
        title="Include in export selection"
        checked={picked}
        onClick={(e) => e.stopPropagation()}
        onChange={onTogglePicked}
        style={{ flexShrink: 0 }}
      />
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
  theaterId,
  missionName,
  objects,
  flights,
  bullseyes,
  packages,
  onSelect,
  onDelete,
  onToggleVisible,
  onToggleLocked,
  onSelectFlight,
  onDeleteFlight,
  onToggleFlightVisible,
  onClose,
}: ObjectListDialogProps) {
  const points = objects.filter((o) => o.type === "point");
  const polygons = objects.filter((o) => o.type === "polygon");
  const lines = objects.filter((o) => o.type === "line");
  const labels = objects.filter((o) => o.type === "label");
  const total = objects.length + flights.length;
  const ungroupedFlights = flights.filter((f) => !f.packageId || !packages.some((p) => p.id === f.packageId));

  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set());
  function togglePicked(id: string) {
    setPickedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleExportAll() {
    exportObjectSet(theaterId, missionName, { objects, flights, bullseyes, packages });
  }

  function handleExportSelected() {
    const pickedObjects = objects.filter((o) => pickedIds.has(o.id));
    const pickedFlights = flights.filter((f) => pickedIds.has(f.id));
    const referencedPackageIds = new Set(pickedFlights.map((f) => f.packageId).filter((id): id is string => Boolean(id)));
    const referencedPackages = packages.filter((p) => referencedPackageIds.has(p.id));
    exportObjectSet(theaterId, missionName, { objects: pickedObjects, flights: pickedFlights, bullseyes: [], packages: referencedPackages });
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
              {packages.map((pkg) => {
                const pkgFlights = flights.filter((f) => f.packageId === pkg.id);
                if (pkgFlights.length === 0) return null;
                return (
                  <div key={pkg.id} style={{ marginBottom: 4 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: "var(--dfp-text-muted)",
                        margin: "4px 4px 2px",
                      }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: pkg.color ?? DEFAULT_FLIGHT_COLOR, flexShrink: 0 }} />
                      {pkg.name}
                    </div>
                    {pkgFlights.map((flight) => (
                      <ListRow
                        key={flight.id}
                        name={flight.name}
                        label={[flight.aircraftType, TASK_TYPE_LABEL[flight.taskType]].filter(Boolean).join(" · ")}
                        color={flight.color ?? DEFAULT_FLIGHT_COLOR}
                        round={false}
                        visible={flight.visible !== false}
                        picked={pickedIds.has(flight.id)}
                        onTogglePicked={() => togglePicked(flight.id)}
                        onSelect={() => onSelectFlight(flight.id)}
                        onDelete={() => onDeleteFlight(flight.id)}
                        onToggleVisible={() => onToggleFlightVisible(flight.id)}
                      />
                    ))}
                  </div>
                );
              })}
              {ungroupedFlights.map((flight) => (
                <ListRow
                  key={flight.id}
                  name={flight.name}
                  label={[flight.aircraftType, TASK_TYPE_LABEL[flight.taskType]].filter(Boolean).join(" · ")}
                  color={flight.color ?? DEFAULT_FLIGHT_COLOR}
                  round={false}
                  visible={flight.visible !== false}
                  picked={pickedIds.has(flight.id)}
                  onTogglePicked={() => togglePicked(flight.id)}
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
                  locked={object.locked}
                  picked={pickedIds.has(object.id)}
                  onTogglePicked={() => togglePicked(object.id)}
                  onSelect={() => onSelect(object.id)}
                  onDelete={() => onDelete(object.id)}
                  onToggleVisible={() => onToggleVisible(object.id)}
                  onToggleLocked={() => onToggleLocked(object.id)}
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
                  locked={object.locked}
                  picked={pickedIds.has(object.id)}
                  onTogglePicked={() => togglePicked(object.id)}
                  onSelect={() => onSelect(object.id)}
                  onDelete={() => onDelete(object.id)}
                  onToggleVisible={() => onToggleVisible(object.id)}
                  onToggleLocked={() => onToggleLocked(object.id)}
                />
              ))}
            </>
          )}

          {lines.length > 0 && (
            <>
              <div className="dfp-label" style={{ margin: "8px 4px 2px" }}>
                Lines
              </div>
              {lines.map((object) => (
                <ListRow
                  key={object.id}
                  name={object.name}
                  label={objectLabel(object)}
                  color={objectColor(object)}
                  round={false}
                  visible={object.visible !== false}
                  locked={object.locked}
                  picked={pickedIds.has(object.id)}
                  onTogglePicked={() => togglePicked(object.id)}
                  onSelect={() => onSelect(object.id)}
                  onDelete={() => onDelete(object.id)}
                  onToggleVisible={() => onToggleVisible(object.id)}
                  onToggleLocked={() => onToggleLocked(object.id)}
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
                  locked={object.locked}
                  picked={pickedIds.has(object.id)}
                  onTogglePicked={() => togglePicked(object.id)}
                  onSelect={() => onSelect(object.id)}
                  onDelete={() => onDelete(object.id)}
                  onToggleVisible={() => onToggleVisible(object.id)}
                  onToggleLocked={() => onToggleLocked(object.id)}
                />
              ))}
            </>
          )}
        </div>

        {total > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderTop: "1px solid var(--dfp-border)",
            }}
          >
            <span style={{ fontSize: 12, color: "var(--dfp-text-muted)", flex: 1 }}>{pickedIds.size} selected</span>
            <button type="button" className="dfp-btn" onClick={handleExportAll} title="Download every object and flight as a JSON file">
              Export all
            </button>
            <button
              type="button"
              className="dfp-btn dfp-btn-accent"
              disabled={pickedIds.size === 0}
              onClick={handleExportSelected}
              title="Download only the checked objects/flights as a JSON file"
            >
              Export selection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
