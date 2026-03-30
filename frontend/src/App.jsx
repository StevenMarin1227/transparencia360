import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";

function App() {
  const [entidad, setEntidad] = useState("");

  const handleLogin = (ent) => {
    localStorage.setItem("entidad", ent);
    setEntidad(ent);
  };

  const cerrarSesion = () => {
    localStorage.removeItem("entidad");
    setEntidad("");
  };

  // 🔥 SIEMPRE LOGIN SI NO HAY ENTIDAD
  if (!entidad) {
    return <Login onLogin={handleLogin} />;
  }

  // 🔥 SOLO DASHBOARD SI YA HAY ENTIDAD
  return (
    <Dashboard
      entidad={entidad}
      onLogout={cerrarSesion}
    />
  );
}

export default App;