import type { Mission, Theater } from "@dcs-flight-planner/core";
import caucasus from "@dcs-flight-planner/core/data/caucasus.json";
import { useEffect, useRef, useState } from "react";
import { CoordinateStatusBar } from "./CoordinateStatusBar";
import { FileMenu } from "./FileMenu";
import { deleteMission, listMissions, saveMission } from "./missionStore";
import { SaveAsDialog } from "./SaveAsDialog";
import { TheaterMap, type HoverInfo, type TheaterMapHandle } from "./TheaterMap";

const theater = caucasus as Theater;
const UNTITLED = "Sans titre";

function App() {
  const mapRef = useRef<TheaterMapHandle | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  const [activeMissionName, setActiveMissionName] = useState(UNTITLED);
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [hover, setHover] = useState<HoverInfo | null>(null);

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
    };
    saveMission(mission);
    setMissions(listMissions());
    setActiveMissionId(mission.id);
    setActiveMissionName(mission.name);
  }

  function handleNew() {
    setActiveMissionId(null);
    setActiveMissionName(UNTITLED);
  }

  function handleOpen(id: string) {
    const mission = missions.find((m) => m.id === id);
    if (!mission) return;
    setActiveMissionId(mission.id);
    setActiveMissionName(mission.name);
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
        <div>
          <strong>DCS Flight Planner</strong> — {theater.name} ({theater.airbases.length} aérodromes) —{" "}
          <em>{activeMissionName}</em>
        </div>
      </header>
      <div style={{ flex: 1, minHeight: 0 }}>
        <TheaterMap ref={mapRef} theater={theater} onHover={setHover} />
      </div>
      <CoordinateStatusBar hover={hover} />
      {saveAsOpen && (
        <SaveAsDialog
          defaultName={activeMissionName === UNTITLED ? "" : activeMissionName}
          onConfirm={handleSaveAsConfirm}
          onCancel={() => setSaveAsOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
