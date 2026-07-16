import { useState } from "react";
import AppLayout from "./components/AppLayout";
import EntitySelect from "./pages/EntitySelect";
import Dashboard from "./pages/Dashboard";
import ControlLiquidacion from "./pages/ControlLiquidacion";
import VencimientosContractuales from "./pages/VencimientosContractuales";

function App() {
  const [entidad, setEntidad] = useState("");
  const [moduloActivo, setModuloActivo] =
    useState("dashboard");

  const seleccionarEntidad = (entidadSeleccionada) => {
    setEntidad(entidadSeleccionada);
    setModuloActivo("dashboard");
  };

  const cambiarEntidad = () => {
    setEntidad("");
    setModuloActivo("dashboard");
  };

  let contenido;

  if (!entidad) {
    contenido = (
      <EntitySelect
        onSelectEntity={seleccionarEntidad}
      />
    );
  } else if (
    moduloActivo === "control-liquidacion"
  ) {
    contenido = (
      <ControlLiquidacion
        entidad={entidad}
        onBack={() =>
          setModuloActivo("dashboard")
        }
      />
    );
  } else if (
    moduloActivo === "vencimientos-contractuales"
  ) {
    contenido = (
      <VencimientosContractuales
        entidad={entidad}
        onBack={() =>
          setModuloActivo("dashboard")
        }
      />
    );
  } else {
    contenido = (
      <Dashboard
        entidad={entidad}
        onBack={cambiarEntidad}
        onOpenControlLiquidacion={() =>
          setModuloActivo("control-liquidacion")
        }
        onOpenVencimientosContractuales={() =>
          setModuloActivo(
            "vencimientos-contractuales"
          )
        }
      />
    );
  }

  return <AppLayout>{contenido}</AppLayout>;
}

export default App;