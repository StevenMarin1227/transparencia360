import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";

function App() {
  const [entidad, setEntidad] = useState("");

  const handleLogin = (entidadSeleccionada) => {
    setEntidad(entidadSeleccionada);
  };

  const cerrarSesion = () => {
    setEntidad("");
  };

  if (!entidad) {
    return <Login onLogin={handleLogin} />;
  }

  return <Dashboard entidad={entidad} onLogout={cerrarSesion} />;
}

export default App;