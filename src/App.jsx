import { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";

function App() {
  const [entidad, setEntidad] = useState("");

  useEffect(() => {
    const entidadGuardada = localStorage.getItem("entidad");
    if (entidadGuardada) {
      setEntidad(entidadGuardada);
    }
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem("entidad");
    setEntidad("");
  };

  if (!entidad) {
    return <Login onLogin={setEntidad} />;
  }

  return (
    <Dashboard
      entidad={entidad}
      onLogout={cerrarSesion}
    />
  );
}

export default App;