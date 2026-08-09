import type { Dmpi, Mission, MissionObject, Theater } from "@dcs-flight-planner/core";
import { POINT_KIND_LABEL } from "@dcs-flight-planner/core";
import caucasus from "@dcs-flight-planner/core/data/caucasus.json";
import { useEffect, useRef, useState } from "react";
import { CoordinateStatusBar } from "./CoordinateStatusBar";
import { deleteMission, listMissions, saveMission } from "./missionStore";
import { FileMenu } from "./FileMenu";
import { ObjectMenu } from "./ObjectMenu";
import { PromptDialog } from "./PromptDialog";
import { TheaterMap, type HoverInfo, type TheaterMapHandle } from "./TheaterMap";
import type { CreationRequest, ObjectDraft } from "./placement";

const theater = caucasus as Theater;
const UNTITLED = "Sans titre";

const POLYGON_KIND_DEFAULT_NAME: Record<string, string> = {
  freeform: "Zone",
  rectangle: "Zone rectangulaire",
  circle: "Zone circulaire",
  orbit: "Orbite",
};

function defaultObjectName(draft: ObjectDraft): string {
  if (draft.type === "point") return POINT_KIND_LABEL[draft.kind];
  return POLYGON_KIND_DEFAULT_NAME[draft.shape.kind] ?? "Objet";
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
    setObjects((prev) => [...prev, draftToObject(pendingDraft, name)]);
    setPendingDraft(null);
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          padding: "4px 12px",
          borderBottom: "1px solid #3333",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
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
          <strong>DCS Flight Planner</strong> — {theater.name} ({theater.airbases.length} aérodromes) —{" "}
          <em>{activeMissionName}</em>
        </div>
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
          onHover={setHover}
        />
      </div>
      <CoordinateStatusBar hover={hover} />
      {saveAsOpen && (
        <PromptDialog
          title="Enregistrer sous"
          defaultValue={activeMissionName === UNTITLED ? "" : activeMissionName}
          fallbackValue="Mission sans nom"
          onConfirm={handleSaveAsConfirm}
          onCancel={() => setSaveAsOpen(false)}
        />
      )}
      {pendingDraft && (
        <PromptDialog
          title="Nommer l'objet"
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
