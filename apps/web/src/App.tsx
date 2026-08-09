import type { Dmpi, Flight, LatLon, Mission, MissionObject, Theater } from "@dcs-flight-planner/core";
import { metersToFeet, POINT_KIND_LABEL } from "@dcs-flight-planner/core";
import caucasus from "@dcs-flight-planner/core/data/caucasus.json";
import { useEffect, useRef, useState } from "react";
import { CoordinateStatusBar } from "./CoordinateStatusBar";
import { getElevationAt } from "./elevation";
import { deleteMission, listMissions, saveMission } from "./missionStore";
import { FileMenu } from "./FileMenu";
import { FlightFormDialog } from "./FlightFormDialog";
import { FlightListDialog } from "./FlightListDialog";
import { FlightMenu } from "./FlightMenu";
import { Logo } from "./Logo";
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
  const [flights, setFlights] = useState<Flight[]>([]);
  const [flightListOpen, setFlightListOpen] = useState(false);
  const [flightForm, setFlightForm] = useState<{ flight?: Flight } | null>(null);

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
      flights,
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
    setFlights([]);
  }

  function handleOpen(id: string) {
    const mission = missions.find((m) => m.id === id);
    if (!mission) return;
    setActiveMissionId(mission.id);
    setActiveMissionName(mission.name);
    setObjects(mission.objects);
    setFlights(mission.flights ?? []);
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

  function handleFlightSave(flight: Flight) {
    setFlights((prev) => (prev.some((f) => f.id === flight.id) ? prev.map((f) => (f.id === flight.id ? flight : f)) : [...prev, flight]));
    setFlightForm(null);
  }

  function handleFlightDelete(id: string) {
    setFlights((prev) => prev.filter((f) => f.id !== id));
    setFlightForm(null);
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          padding: "6px 16px",
          background: "var(--dfp-navy-900)",
          color: "var(--dfp-text-inverse)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          boxShadow: "0 1px 0 var(--dfp-accent-dark), var(--dfp-shadow-sm)",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Logo />
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginRight: 6 }}>
            <strong style={{ fontSize: 15, letterSpacing: "0.01em" }}>DCS Flight Planner</strong>
            <span style={{ fontSize: 12, color: "var(--dfp-text-inverse-muted)" }}>
              {theater.name} · {theater.airbases.length} airbases
            </span>
          </div>
          <div style={{ width: 1, alignSelf: "stretch", background: "rgba(255,255,255,0.14)" }} />
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
          <FlightMenu onNewFlight={() => setFlightForm({})} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <em style={{ fontSize: 12.5, color: "var(--dfp-text-inverse-muted)", fontStyle: "normal" }}>{activeMissionName}</em>
          <button type="button" className="dfp-btn dfp-btn-accent" onClick={() => setFlightListOpen(true)}>
            Flights ({flights.length})
          </button>
          <button type="button" className="dfp-btn dfp-btn-accent" onClick={() => setObjectListOpen(true)}>
            Objects ({objects.length})
          </button>
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
      {flightListOpen && (
        <FlightListDialog
          flights={flights}
          onSelect={(id) => {
            const flight = flights.find((f) => f.id === id);
            if (flight) setFlightForm({ flight });
            setFlightListOpen(false);
          }}
          onDelete={handleFlightDelete}
          onNewFlight={() => {
            setFlightListOpen(false);
            setFlightForm({});
          }}
          onClose={() => setFlightListOpen(false)}
        />
      )}
      {flightForm && (
        <FlightFormDialog
          airbases={theater.airbases}
          initial={flightForm.flight}
          onSave={handleFlightSave}
          onDelete={flightForm.flight ? () => handleFlightDelete(flightForm.flight!.id) : undefined}
          onCancel={() => setFlightForm(null)}
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
