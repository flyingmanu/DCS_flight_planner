import type { Theater } from "@dcs-flight-planner/core";
import caucasus from "@dcs-flight-planner/core/data/caucasus.json";
import { TheaterMap } from "./TheaterMap";

const theater = caucasus as Theater;

function App() {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "8px 16px", borderBottom: "1px solid #3333" }}>
        <strong>DCS Flight Planner</strong> — {theater.name} ({theater.airbases.length} aérodromes)
      </header>
      <div style={{ flex: 1, minHeight: 0 }}>
        <TheaterMap theater={theater} />
      </div>
    </div>
  );
}

export default App;
