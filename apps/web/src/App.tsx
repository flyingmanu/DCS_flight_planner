import type { Mission, Theater } from "@dcs-flight-planner/core";
import caucasus from "@dcs-flight-planner/core/data/caucasus.json";
import { useEffect, useRef, useState } from "react";
import { deleteMission, listMissions, saveMission } from "./missionStore";
import { TheaterMap, type TheaterMapHandle } from "./TheaterMap";

const theater = caucasus as Theater;

function App() {
  const mapRef = useRef<TheaterMapHandle | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [activeMissionId, setActiveMissionId] = useState<string>("");
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    setMissions(listMissions());
  }, []);

  function handleSave() {
    const name = nameInput.trim() || "Mission sans nom";
    const now = new Date().toISOString();
    const existing = missions.find((m) => m.id === activeMissionId);
    const mission: Mission = {
      id: existing?.id ?? crypto.randomUUID(),
      name,
      theaterId: theater.id,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      view: mapRef.current?.getView() ?? { center: [42, 43], zoom: 6 },
    };
    saveMission(mission);
    setMissions(listMissions());
    setActiveMissionId(mission.id);
    setNameInput(mission.name);
  }

  function handleSelect(id: string) {
    setActiveMissionId(id);
    if (!id) {
      setNameInput("");
      return;
    }
    const mission = missions.find((m) => m.id === id);
    if (!mission) return;
    setNameInput(mission.name);
    mapRef.current?.setView(mission.view);
  }

  function handleDelete() {
    if (!activeMissionId) return;
    deleteMission(activeMissionId);
    setMissions(listMissions());
    setActiveMissionId("");
    setNameInput("");
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          padding: "8px 16px",
          borderBottom: "1px solid #3333",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <strong>DCS Flight Planner</strong> — {theater.name} ({theater.airbases.length} aérodromes)
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <select value={activeMissionId} onChange={(e) => handleSelect(e.target.value)}>
            <option value="">— Nouvelle mission —</option>
            {missions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({new Date(m.updatedAt).toLocaleString()})
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Nom de la mission"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            style={{ width: 160 }}
          />
          <button type="button" onClick={handleSave}>
            Enregistrer
          </button>
          <button type="button" onClick={handleDelete} disabled={!activeMissionId} title="Supprimer">
            🗑
          </button>
        </div>
      </header>
      <div style={{ flex: 1, minHeight: 0 }}>
        <TheaterMap ref={mapRef} theater={theater} />
      </div>
    </div>
  );
}

export default App;
