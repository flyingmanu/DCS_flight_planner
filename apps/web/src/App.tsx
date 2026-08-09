import type { Dmpi, LatLon, Mission, MissionObject, Theater } from "@dcs-flight-planner/core";
import { metersToFeet, POINT_KIND_LABEL } from "@dcs-flight-planner/core";
import caucasus from "@dcs-flight-planner/core/data/caucasus.json";
import { useEffect, useRef, useState } from "react";
import { CoordinateStatusBar } from "./CoordinateStatusBar";
import { getElevationAt } from "./elevation";
import { deleteMission, listMissions, saveMission } from "./missionStore";
import { FileMenu } from "./FileMenu";
import { ObjectEditPanel } from "./ObjectEditPanel";
import { ObjectListDialog } from "./ObjectListDialog";
import { ObjectMenu } from "./ObjectMenu";
import { PromptDialog } from "./PromptDialog";
import { TheaterMap, type HoverInfo, type TheaterMapHandle } from "./TheaterMap";
import { translatePolygonShape } from "./objectGeometry";
import type { CreationRequest, ObjectDraft } from "./placement";

const theater = caucasus as Theater;
const UNTITLED = "Untitled";

const POLYGON_KIND_DEFAULT_NAME: Record<string, string> = {
  freeform: "Zone",
  rectangle: "Rectangular zone",
  circle: "Circular zone",
  orbit: "Orbit",
};

function defaultObjectName(draft: ObjectDraft): string {
  if (draft.type === "point") return POINT_KIND_LABEL[draft.kind];
  return POLYGON_KIND_DEFAULT_NAME[draft.shape.kind] ?? "Object";
}

function draftToObject(draft: ObjectDraft, name: string): MissionObject {
  const id = crypto.randomUUID();
  if (draft.type === "point") {
    const dmpis: Dmpi[] | undefined =
      draft.kind === "target" ? [{ id: crypto.randomUUID(), name, position: draft.position }] : undefined;
    return { id, type: "point", name, kind: draft.kind, position: draft.position, dmpis };
  }
  return { id, type: "polygon", name, shape: draft.shape };
}

function App() {
  const mapRef = useRef<TheaterMapHandle | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  const [activeMissionName, setActiveMissionName] = useState(UNTITLED);
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [objects, setObjects] = useState<MissionObject[]>([]);
  const [creationRequest, setCreationRequest] = useState<CreationRequest | null>(null);
  const [pendingDraft, setPendingDraft] = useState<ObjectDraft | null>(null);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const selectedObject = objects.find((o) => o.id === selectedObjectId) ?? null;
  const [objectListOpen, setObjectListOpen] = useState(false);

  useEffect(() => {
    setMissions(listMissions());
  }, []);

  function persist(id: string, name: string) {
    const now = new Date().toISOString();
    const existing = missions.find((m) => m.id === id);
    const mission: Mission = {
      id,
      name,
      theaterId: theater.id,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      view: mapRef.current?.getView() ?? { center: [42, 43], zoom: 6 },
      objects,
    };
    saveMission(mission);
    setMissions(listMissions());
    setActiveMissionId(mission.id);
    setActiveMissionName(mission.name);
  }

  function handleNew() {
    setActiveMissionId(null);
    setActiveMissionName(UNTITLED);
    setObjects([]);
  }

  function handleOpen(id: string) {
    const mission = missions.find((m) => m.id === id);
    if (!mission) return;
    setActiveMissionId(mission.id);
    setActiveMissionName(mission.name);
    setObjects(mission.objects);
    mapRef.current?.setView(mission.view);
  }

  function handleSave() {
    if (activeMissionId) {
      persist(activeMissionId, activeMissionName);
    } else {
      setSaveAsOpen(true);
    }
  }

  function handleSaveAsConfirm(name: string) {
    persist(crypto.randomUUID(), name);
    setSaveAsOpen(false);
  }

  function handleDelete() {
    if (!activeMissionId) return;
    deleteMission(activeMissionId);
    setMissions(listMissions());
    handleNew();
  }

  function handleObjectNameConfirm(name: string) {
    if (!pendingDraft) return;
    const object = draftToObject(pendingDraft, name);
    setObjects((prev) => [...prev, object]);
    if (object.type === "point" && object.kind === "target") applyGroundElevation(object.id, object.position);
    setPendingDraft(null);
  }

  function handleObjectEdit(updated: MissionObject) {
    setObjects((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  }

  function handleObjectDelete(id: string) {
    setObjects((prev) => prev.filter((o) => o.id !== id));
    if (selectedObjectId === id) setSelectedObjectId(null);
  }

  /** Refreshes a target's DMPI altitude to the ground elevation, unless the user set it manually. */
  function applyGroundElevation(objectId: string, position: LatLon) {
    getElevationAt(position.lon, position.lat).then((elevationM) => {
      if (elevationM == null) return;
      const elevationFt = Math.round(metersToFeet(elevationM));
      setObjects((prev) =>
        prev.map((o) => {
          if (o.id !== objectId || o.type !== "point" || o.kind !== "target") return o;
          const dmpi = o.dmpis?.[0];
          if (dmpi?.elevationManual) return o;
          const updated: Dmpi = dmpi
            ? { ...dmpi, elevationFt }
            : { id: crypto.randomUUID(), name: o.name, position: o.position, elevationFt };
          return { ...o, dmpis: [updated, ...(o.dmpis?.slice(1) ?? [])] };
        }),
      );
    });
  }

  function handleMovePoint(id: string, position: LatLon) {
    setObjects((prev) =>
      prev.map((o) => {
        if (o.id !== id || o.type !== "point") return o;
        const dmpis = o.kind === "target" ? o.dmpis?.map((d, i) => (i === 0 ? { ...d, position } : d)) : o.dmpis;
        return { ...o, position, dmpis };
      }),
    );
    const moved = objects.find((o) => o.id === id);
    if (moved?.type === "point" && moved.kind === "target") applyGroundElevation(id, position);
  }

  function handleMovePolygon(id: string, dLat: number, dLon: number) {
    setObjects((prev) =>
      prev.map((o) => (o.id === id && o.type === "polygon" ? { ...o, shape: translatePolygonShape(o.shape, dLat, dLon) } : o)),
    );
  }

  function handleResetDmpiElevation(id: string) {
    setObjects((prev) =>
      prev.map((o) => {
        if (o.id !== id || o.type !== "point" || !o.dmpis?.[0]) return o;
        const [first, ...rest] = o.dmpis;
        return { ...o, dmpis: [{ ...first, elevationManual: false }, ...rest] };
      }),
    );
    const obj = objects.find((o) => o.id === id);
    if (obj?.type === "point") applyGroundElevation(id, obj.position);
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          padding: "4px 12px",
          borderBottom: "1px solid #3333",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <FileMenu
            missions={missions}
            activeMissionId={activeMissionId}
            onNew={handleNew}
            onOpen={handleOpen}
            onSave={handleSave}
            onSaveAs={() => setSaveAsOpen(true)}
            onDelete={handleDelete}
          />
          <ObjectMenu onRequestCreation={setCreationRequest} />
          <div>
            <strong>DCS Flight Planner</strong> — {theater.name} ({theater.airbases.length} airbases) —{" "}
            <em>{activeMissionName}</em>
          </div>
        </div>
        <button type="button" onClick={() => setObjectListOpen(true)} style={{ padding: "4px 12px", fontSize: 14, cursor: "pointer" }}>
          Objects ({objects.length})
        </button>
      </header>
      <div style={{ flex: 1, minHeight: 0 }}>
        <TheaterMap
          ref={mapRef}
          theater={theater}
          objects={objects}
          creationRequest={creationRequest}
          onDraftComplete={(draft) => {
            setCreationRequest(null);
            setPendingDraft(draft);
          }}
          onCreationCancel={() => setCreationRequest(null)}
          onSelectObject={setSelectedObjectId}
          onMovePoint={handleMovePoint}
          onMovePolygon={handleMovePolygon}
          onHover={setHover}
        />
      </div>
      <CoordinateStatusBar hover={hover} />
      {selectedObject && (
        <ObjectEditPanel
          object={selectedObject}
          onChange={handleObjectEdit}
          onDelete={() => handleObjectDelete(selectedObject.id)}
          onClose={() => setSelectedObjectId(null)}
          onResetDmpiElevation={() => handleResetDmpiElevation(selectedObject.id)}
        />
      )}
      {objectListOpen && (
        <ObjectListDialog
          objects={objects}
          onSelect={(id) => {
            setSelectedObjectId(id);
            setObjectListOpen(false);
          }}
          onDelete={handleObjectDelete}
          onClose={() => setObjectListOpen(false)}
        />
      )}
      {saveAsOpen && (
        <PromptDialog
          title="Save as"
          defaultValue={activeMissionName === UNTITLED ? "" : activeMissionName}
          fallbackValue="Untitled mission"
          onConfirm={handleSaveAsConfirm}
          onCancel={() => setSaveAsOpen(false)}
        />
      )}
      {pendingDraft && (
        <PromptDialog
          title="Name the object"
          defaultValue={defaultObjectName(pendingDraft)}
          fallbackValue={defaultObjectName(pendingDraft)}
          onConfirm={handleObjectNameConfirm}
          onCancel={() => setPendingDraft(null)}
        />
      )}
    </div>
  );
}

export default App;
