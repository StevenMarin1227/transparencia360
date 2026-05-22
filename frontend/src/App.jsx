import { useState } from "react";
import EntitySelect from "./pages/EntitySelect";
import Dashboard from "./pages/Dashboard";

function App() {
  const [entidad, setEntidad] = useState("");

  if (!entidad) {
    return <EntitySelect onSelectEntity={setEntidad} />;
  }

  return (
    <Dashboard
      entidad={entidad}
      onBack={() => setEntidad("")}
    />
  );
}

export default App;
