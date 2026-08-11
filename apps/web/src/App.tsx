import type {
  Bullseye,
  CustomAircraft,
  Dmpi,
  Flight,
  GlobalAirport,
  LatLon,
  LoadoutPreset,
  Mission,
  MissionBriefing,
  MissionDate,
  MissionObject,
  MissionWeather,
  Package,
  Side,
  SimTarget,
  Theater,
} from "@dcs-flight-planner/core";
import {
  DEFAULT_FLIGHT_COLOR,
  DEFAULT_PACKAGE_COLOR,
  isWithinBoundingBox,
  makeDefaultBullseye,
  metersToFeet,
  POINT_KIND_LABEL,
  theaterBoundingBox,
} from "@dcs-flight-planner/core";
import caucasus from "@dcs-flight-planner/core/data/caucasus.json";
import nevada from "@dcs-flight-planner/core/data/nevada.json";
import persianGulf from "@dcs-flight-planner/core/data/persian-gulf.json";
import afghanistan from "@dcs-flight-planner/core/data/afghanistan.json";
import coldWarGermany from "@dcs-flight-planner/core/data/cold-war-germany.json";
import iraq from "@dcs-flight-planner/core/data/iraq.json";
import kola from "@dcs-flight-planner/core/data/kola.json";
import marianas from "@dcs-flight-planner/core/data/marianas.json";
import normandy2 from "@dcs-flight-planner/core/data/normandy-2.json";
import marianasWwii from "@dcs-flight-planner/core/data/marianas-wwii.json";
import sinai from "@dcs-flight-planner/core/data/sinai.json";
import southAtlantic from "@dcs-flight-planner/core/data/south-atlantic.json";
import syria from "@dcs-flight-planner/core/data/syria.json";
import theChannel from "@dcs-flight-planner/core/data/the-channel.json";
import { useEffect, useMemo, useRef, useState } from "react";
import { BriefingDialog } from "./BriefingDialog";
import { BullseyeEditPanel } from "./BullseyeEditPanel";
import { CoordinateStatusBar } from "./CoordinateStatusBar";
import { CustomAircraftEditor } from "./CustomAircraftEditor";
import { CustomAircraftMenu } from "./CustomAircraftMenu";
import { deleteCustomAircraft, listCustomAircraft, saveCustomAircraft } from "./customAircraftStore";
import { getElevationAt } from "./elevation";
import { loadGlobalAirports } from "./globalAirportsLoader";
import { deleteMission, listMissions, saveMission } from "./missionStore";
import { FileMenu } from "./FileMenu";
import { FlightFormDialog } from "./FlightFormDialog";
import { FlightMenu } from "./FlightMenu";
import { Logo } from "./Logo";
import { MissionOverviewDialog } from "./MissionOverviewDialog";
import { MissionSettingsDialog } from "./MissionSettingsDialog";
import { ObjectEditPanel } from "./ObjectEditPanel";
import { ObjectListDialog } from "./ObjectListDialog";
import { ObjectMenu } from "./ObjectMenu";
import { PromptDialog } from "./PromptDialog";
import { ReferenceLayerMenu } from "./ReferenceLayerMenu";
import { TheaterMap, type HoverInfo, type TheaterMapHandle } from "./TheaterMap";
import { translateLineVertices, translatePolygonShape } from "./objectGeometry";
import type { CreationRequest, ObjectDraft } from "./placement";

/** Curated theaters this app can actually plan against, as opposed to the worldwide OurAirports reference layer. */
const THEATERS: Theater[] = [
  caucasus as Theater,
  nevada as Theater,
  persianGulf as Theater,
  syria as Theater,
  sinai as Theater,
  theChannel as Theater,
  southAtlantic as Theater,
  marianas as Theater,
  marianasWwii as Theater,
  kola as Theater,
  iraq as Theater,
  afghanistan as Theater,
  coldWarGermany as Theater,
  normandy2 as Theater,
];
const UNTITLED = "Untitled";

/** ObjectDraft narrowed to the kinds that become a MissionObject (waypoints and bullseyes are routed elsewhere). */
type PlaceableObjectDraft = Exclude<ObjectDraft, { type: "waypoint" } | { type: "bullseye" }>;

const POLYGON_KIND_DEFAULT_NAME: Record<string, string> = {
  freeform: "Zone",
  rectangle: "Rectangular zone",
  circle: "Circular zone",
  orbit: "Orbit",
};

function defaultObjectName(draft: PlaceableObjectDraft): string {
  if (draft.type === "point") return POINT_KIND_LABEL[draft.kind];
  if (draft.type === "label") return "Label";
  if (draft.type === "line") return "Line";
  return POLYGON_KIND_DEFAULT_NAME[draft.shape.kind] ?? "Object";
}

function draftToObject(draft: PlaceableObjectDraft, name: string): MissionObject {
  const id = crypto.randomUUID();
  if (draft.type === "point") {
    const dmpis: Dmpi[] | undefined =
      draft.kind === "target" ? [{ id: crypto.randomUUID(), name, position: draft.position }] : undefined;
    return { id, type: "point", name, kind: draft.kind, position: draft.position, dmpis };
  }
  if (draft.type === "label") {
    return { id, type: "label", name, position: draft.position };
  }
  if (draft.type === "line") {
    return { id, type: "line", name, vertices: draft.vertices };
  }
  return { id, type: "polygon", name, shape: draft.shape };
}

function makeBlankFlight(): Flight {
  return { id: crypto.randomUUID(), name: "", aircraftType: "", size: 2, taskType: "CAP", color: DEFAULT_FLIGHT_COLOR, route: [] };
}

function makeBlankCustomAircraft(): CustomAircraft {
  return {
    id: crypto.randomUUID(),
    name: "",
    category: "fixed-wing",
    standardTasks: [],
    performance: {},
    launchers: [],
    weapons: [],
    pylons: [],
    presets: [],
  };
}

function App() {
  const mapRef = useRef<TheaterMapHandle | null>(null);
  const [activeTheaterId, setActiveTheaterId] = useState(THEATERS[0]!.id);
  const theater = THEATERS.find((t) => t.id === activeTheaterId) ?? THEATERS[0]!;
  const [missions, setMissions] = useState<Mission[]>([]);
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  const [activeMissionName, setActiveMissionName] = useState(UNTITLED);
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [objects, setObjects] = useState<MissionObject[]>([]);
  const [creationRequest, setCreationRequest] = useState<CreationRequest | null>(null);
  const [pendingDraft, setPendingDraft] = useState<PlaceableObjectDraft | null>(null);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const selectedObject = objects.find((o) => o.id === selectedObjectId) ?? null;
  const visibleObjects = objects.filter((o) => o.visible !== false);
  const [objectListOpen, setObjectListOpen] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [flights, setFlights] = useState<Flight[]>([]);
  const visibleFlights = flights.filter((f) => f.visible !== false);
  const [flightForm, setFlightForm] = useState<{ flight: Flight; isNew: boolean } | null>(null);
  const [customAircraft, setCustomAircraft] = useState<CustomAircraft[]>([]);
  const [customAircraftForm, setCustomAircraftForm] = useState<{ aircraft: CustomAircraft; isNew: boolean } | null>(null);
  const [bullseyes, setBullseyes] = useState<Bullseye[]>([]);
  const [selectedBullseyeSide, setSelectedBullseyeSide] = useState<Side | null>(null);
  const selectedBullseye = bullseyes.find((b) => b.side === selectedBullseyeSide) ?? null;
  const [packages, setPackages] = useState<Package[]>([]);
  const [briefing, setBriefing] = useState<MissionBriefing>({});
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [missionDate, setMissionDate] = useState<MissionDate | undefined>(undefined);
  const [missionWeather, setMissionWeather] = useState<MissionWeather | undefined>(undefined);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [simTarget, setSimTarget] = useState<SimTarget>("dcs");
  const [allGlobalAirports, setAllGlobalAirports] = useState<GlobalAirport[]>([]);

  // World airports are always shown; the active sim's curated theater (when
  // it has one) masks out only the world entries it overrides within its own
  // footprint, so DCS-specific data always wins where it exists.
  useEffect(() => {
    if (allGlobalAirports.length > 0) return;
    loadGlobalAirports()
      .then(setAllGlobalAirports)
      .catch((err: unknown) => console.error("Failed to load OurAirports reference data", err));
  }, [allGlobalAirports.length]);

  const visibleGlobalAirports = useMemo(() => {
    if (allGlobalAirports.length === 0) return [];
    const curatedTheater = simTarget === "dcs" ? theater : null;
    if (!curatedTheater) return allGlobalAirports;
    const box = theaterBoundingBox(curatedTheater);
    return allGlobalAirports.filter((a) => !isWithinBoundingBox({ lat: a.lat, lon: a.lon }, box));
  }, [allGlobalAirports, simTarget, theater]);

  useEffect(() => {
    setMissions(listMissions());
    setCustomAircraft(listCustomAircraft());
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
      bullseyes,
      packages,
      briefing,
      date: missionDate,
      weather: missionWeather,
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
    setBullseyes([]);
    setSelectedBullseyeSide(null);
    setPackages([]);
    setBriefing({});
    setMissionDate(undefined);
    setMissionWeather(undefined);
  }

  function handleChangeTheater(id: string) {
    if (id === activeTheaterId || !THEATERS.some((t) => t.id === id)) return;
    setActiveTheaterId(id);
    setActiveMissionId(null);
    setActiveMissionName(UNTITLED);
    setObjects([]);
    setFlights([]);
    setBullseyes([]);
    setSelectedBullseyeSide(null);
    setPackages([]);
    setBriefing({});
    setMissionDate(undefined);
    setMissionWeather(undefined);
  }

  function handleOpen(id: string) {
    const mission = missions.find((m) => m.id === id);
    if (!mission) return;
    if (mission.theaterId !== activeTheaterId && THEATERS.some((t) => t.id === mission.theaterId)) {
      setActiveTheaterId(mission.theaterId);
    }
    setActiveMissionId(mission.id);
    setActiveMissionName(mission.name);
    setObjects(mission.objects);
    setFlights(mission.flights ?? []);
    setBullseyes(mission.bullseyes ?? []);
    setSelectedBullseyeSide(null);
    setPackages(mission.packages ?? []);
    setBriefing(mission.briefing ?? {});
    setMissionDate(mission.date);
    setMissionWeather(mission.weather);
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

  function handleToggleObjectVisible(id: string) {
    setObjects((prev) => prev.map((o) => (o.id === id ? { ...o, visible: o.visible === false } : o)));
  }

  function handleToggleObjectLocked(id: string) {
    setObjects((prev) => prev.map((o) => (o.id === id ? { ...o, locked: !o.locked } : o)));
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

  function handleMoveLine(id: string, dLat: number, dLon: number) {
    setObjects((prev) =>
      prev.map((o) => (o.id === id && o.type === "line" ? { ...o, vertices: translateLineVertices(o.vertices, dLat, dLon) } : o)),
    );
  }

  function handleMoveLabel(id: string, position: LatLon) {
    setObjects((prev) => prev.map((o) => (o.id === id && o.type === "label" ? { ...o, position } : o)));
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

  function handleFlightSave() {
    if (!flightForm) return;
    const flight = flightForm.flight;
    setFlights((prev) => (prev.some((f) => f.id === flight.id) ? prev.map((f) => (f.id === flight.id ? flight : f)) : [...prev, flight]));
    setFlightForm(null);
  }

  function handleFlightDelete(id: string) {
    setFlights((prev) => prev.filter((f) => f.id !== id));
    if (flightForm?.flight.id === id) setFlightForm(null);
  }

  function handleToggleFlightVisible(id: string) {
    setFlights((prev) => prev.map((f) => (f.id === id ? { ...f, visible: f.visible === false } : f)));
  }

  function handleNewFlight() {
    setFlightForm({ flight: makeBlankFlight(), isNew: true });
  }

  function handleEditFlight(id: string) {
    const flight = flights.find((f) => f.id === id);
    if (flight) setFlightForm({ flight: { ...flight }, isNew: false });
  }

  function handleMoveWaypoint(waypointId: string, position: LatLon) {
    setFlightForm((prev) =>
      prev
        ? { ...prev, flight: { ...prev.flight, route: (prev.flight.route ?? []).map((wp) => (wp.id === waypointId ? { ...wp, position } : wp)) } }
        : prev,
    );
  }

  function handleNewCustomAircraft() {
    setCustomAircraftForm({ aircraft: makeBlankCustomAircraft(), isNew: true });
  }

  function handleEditCustomAircraft(id: string) {
    const aircraft = customAircraft.find((a) => a.id === id);
    if (aircraft) setCustomAircraftForm({ aircraft: { ...aircraft }, isNew: false });
  }

  function handleCustomAircraftSave() {
    if (!customAircraftForm) return;
    const aircraft = customAircraftForm.aircraft;
    saveCustomAircraft(aircraft);
    setCustomAircraft(listCustomAircraft());
    setCustomAircraftForm(null);
  }

  function handleCustomAircraftDelete(id: string) {
    deleteCustomAircraft(id);
    setCustomAircraft(listCustomAircraft());
    if (customAircraftForm?.aircraft.id === id) setCustomAircraftForm(null);
  }

  function handleBullseyeCreate(side: Side, position: LatLon) {
    const bullseye = makeDefaultBullseye(side, position);
    setBullseyes((prev) => [...prev.filter((b) => b.side !== side), bullseye]);
    setSelectedBullseyeSide(side);
  }

  function handleBullseyeChange(updated: Bullseye) {
    setBullseyes((prev) => prev.map((b) => (b.side === updated.side ? updated : b)));
  }

  function handleBullseyeDelete(side: Side) {
    setBullseyes((prev) => prev.filter((b) => b.side !== side));
    if (selectedBullseyeSide === side) setSelectedBullseyeSide(null);
  }

  function handleMoveBullseye(side: Side, position: LatLon) {
    setBullseyes((prev) => prev.map((b) => (b.side === side ? { ...b, position } : b)));
  }

  /** Appends a preset to a custom aircraft's saved list and persists it immediately (called from the flight form). */
  function handleSavePreset(customAircraftId: string, preset: LoadoutPreset) {
    const aircraft = customAircraft.find((a) => a.id === customAircraftId);
    if (!aircraft) return;
    const updated = { ...aircraft, presets: [...aircraft.presets, preset] };
    saveCustomAircraft(updated);
    setCustomAircraft(listCustomAircraft());
  }

  /** Quick-creates a package from the flight form and returns its id for immediate assignment. */
  function handleCreatePackage(name: string): string {
    const pkg: Package = { id: crypto.randomUUID(), name, color: DEFAULT_PACKAGE_COLOR };
    setPackages((prev) => [...prev, pkg]);
    return pkg.id;
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
            <select
              value={theater.id}
              onChange={(e) => handleChangeTheater(e.target.value)}
              title="Switch theater (starts a new mission)"
              style={{
                fontSize: 12,
                color: "var(--dfp-text-inverse-muted)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              {THEATERS.map((t) => (
                <option key={t.id} value={t.id} style={{ color: "var(--dfp-navy-900)" }}>
                  {t.name} · {t.airbases.length} airbases
                </option>
              ))}
            </select>
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
          <FlightMenu flights={flights} onNewFlight={handleNewFlight} onEditFlight={handleEditFlight} />
          <CustomAircraftMenu customAircraft={customAircraft} onNew={handleNewCustomAircraft} onEdit={handleEditCustomAircraft} />
          <ReferenceLayerMenu simTarget={simTarget} onChangeSimTarget={setSimTarget} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <em style={{ fontSize: 12.5, color: "var(--dfp-text-inverse-muted)", fontStyle: "normal" }}>{activeMissionName}</em>
          <button type="button" className="dfp-btn dfp-btn-onnavy" onClick={() => setSettingsOpen(true)}>
            Date &amp; weather
          </button>
          <button type="button" className="dfp-btn dfp-btn-onnavy" onClick={() => setBriefingOpen(true)}>
            Briefing
          </button>
          <button type="button" className="dfp-btn dfp-btn-onnavy" onClick={() => setOverviewOpen(true)}>
            Overview
          </button>
          <button type="button" className="dfp-btn dfp-btn-accent" onClick={() => setObjectListOpen(true)}>
            Objects ({objects.length + flights.length})
          </button>
        </div>
      </header>
      <div style={{ flex: 1, minHeight: 0 }}>
        <TheaterMap
          ref={mapRef}
          theater={theater}
          objects={visibleObjects}
          flights={visibleFlights}
          bullseyes={bullseyes}
          globalAirports={visibleGlobalAirports}
          editingFlight={flightForm?.flight ?? null}
          creationRequest={creationRequest}
          snapEnabled={snapEnabled}
          onToggleSnap={() => setSnapEnabled((v) => !v)}
          onDraftComplete={(draft) => {
            setCreationRequest(null);
            if (draft.type === "waypoint") {
              setFlightForm((prev) =>
                prev
                  ? {
                      ...prev,
                      flight: {
                        ...prev.flight,
                        route: [...(prev.flight.route ?? []), { id: crypto.randomUUID(), position: draft.position }],
                      },
                    }
                  : prev,
              );
              return;
            }
            if (draft.type === "bullseye") {
              handleBullseyeCreate(draft.side, draft.position);
              return;
            }
            setPendingDraft(draft);
          }}
          onCreationCancel={() => setCreationRequest(null)}
          onSelectObject={(id) => {
            setSelectedObjectId(id);
            setSelectedBullseyeSide(null);
          }}
          onSelectFlight={handleEditFlight}
          onSelectBullseye={(side) => {
            setSelectedBullseyeSide(side);
            setSelectedObjectId(null);
          }}
          onMovePoint={handleMovePoint}
          onMovePolygon={handleMovePolygon}
          onMoveLine={handleMoveLine}
          onMoveWaypoint={handleMoveWaypoint}
          onMoveBullseye={handleMoveBullseye}
          onMoveLabel={handleMoveLabel}
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
      {selectedBullseye && (
        <BullseyeEditPanel
          bullseye={selectedBullseye}
          onChange={handleBullseyeChange}
          onDelete={() => handleBullseyeDelete(selectedBullseye.side)}
          onClose={() => setSelectedBullseyeSide(null)}
        />
      )}
      {objectListOpen && (
        <ObjectListDialog
          theaterId={theater.id}
          missionName={activeMissionName}
          objects={objects}
          flights={flights}
          bullseyes={bullseyes}
          packages={packages}
          onSelect={(id) => {
            setSelectedObjectId(id);
            setObjectListOpen(false);
          }}
          onDelete={handleObjectDelete}
          onToggleVisible={handleToggleObjectVisible}
          onToggleLocked={handleToggleObjectLocked}
          onSelectFlight={(id) => {
            handleEditFlight(id);
            setObjectListOpen(false);
          }}
          onDeleteFlight={handleFlightDelete}
          onToggleFlightVisible={handleToggleFlightVisible}
          onClose={() => setObjectListOpen(false)}
        />
      )}
      {briefingOpen && (
        <BriefingDialog missionName={activeMissionName} briefing={briefing} onChange={setBriefing} onClose={() => setBriefingOpen(false)} />
      )}
      {settingsOpen && (
        <MissionSettingsDialog
          missionName={activeMissionName}
          date={missionDate}
          weather={missionWeather}
          onChangeDate={setMissionDate}
          onChangeWeather={setMissionWeather}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {overviewOpen && (
        <MissionOverviewDialog
          missionName={activeMissionName}
          theaterName={theater.name}
          airbases={theater.airbases}
          flights={flights}
          customAircraft={customAircraft}
          objects={objects}
          packages={packages}
          onClose={() => setOverviewOpen(false)}
        />
      )}
      {flightForm && creationRequest?.kind !== "waypoint" && (
        <FlightFormDialog
          airbases={theater.airbases}
          flight={flightForm.flight}
          customAircraft={customAircraft}
          packages={packages}
          isNew={flightForm.isNew}
          onChange={(flight) => setFlightForm((prev) => (prev ? { ...prev, flight } : prev))}
          onSave={handleFlightSave}
          onDelete={flightForm.isNew ? undefined : () => handleFlightDelete(flightForm.flight.id)}
          onCancel={() => setFlightForm(null)}
          onAddWaypointOnMap={() => setCreationRequest({ kind: "waypoint" })}
          onSavePreset={handleSavePreset}
          onCreatePackage={handleCreatePackage}
        />
      )}
      {customAircraftForm && (
        <CustomAircraftEditor
          aircraft={customAircraftForm.aircraft}
          isNew={customAircraftForm.isNew}
          onChange={(aircraft) => setCustomAircraftForm((prev) => (prev ? { ...prev, aircraft } : prev))}
          onSave={handleCustomAircraftSave}
          onDelete={customAircraftForm.isNew ? undefined : () => handleCustomAircraftDelete(customAircraftForm.aircraft.id)}
          onCancel={() => setCustomAircraftForm(null)}
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
