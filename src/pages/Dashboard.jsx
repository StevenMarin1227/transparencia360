import { useEffect, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import Table from "../components/ui/Table";
import { obtenerContratos } from "../services/api";

export default function Dashboard({ entidad }) {
  const [contratos, setContratos] = useState([]);
  const [fecha, setFecha] = useState("");
  const [loading, setLoading] = useState(true);

  const [sidebarVisible, setSidebarVisible] = useState(true);

  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 10;

  // 🔥 IMPORTANTE: depende de entidad
  useEffect(() => {
    cargarDatos();

    const intervalo = setInterval(() => {
      cargarDatos();
    }, 60000);

    return () => clearInterval(intervalo);
  }, [entidad]);

  const cargarDatos = async () => {
    try {
      const res = await obtenerContratos(entidad);

      setContratos(res.data.data || []);
      setFecha(res.data.fechaActualizacion);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FILTROS (más seguro)
  const contratosFiltrados = contratos.filter((c) => {
    const texto = filtroTexto.toLowerCase();

    return (
      ((c.entidad || "").toLowerCase().includes(texto) ||
        (c.contrato || "").toLowerCase().includes(texto) ||
        (c.contratista || "").toLowerCase().includes(texto)) &&
      (filtroEstado === "" || c.estado === filtroEstado)
    );
  });

  // 🔥 PAGINACIÓN
  const totalPaginas = Math.ceil(
    contratosFiltrados.length / registrosPorPagina
  );

  const indiceInicio = (paginaActual - 1) * registrosPorPagina;

  const datosPaginados = contratosFiltrados.slice(
    indiceInicio,
    indiceInicio + registrosPorPagina
  );

  // 🔥 PAGINACIÓN INTELIGENTE
  const obtenerPaginasVisibles = () => {
    const rango = 2;
    let paginas = [];

    const inicio = Math.max(1, paginaActual - rango);
    const fin = Math.min(totalPaginas, paginaActual + rango);

    if (inicio > 1) {
      paginas.push(1);
      if (inicio > 2) paginas.push("...");
    }

    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }

    if (fin < totalPaginas) {
      if (fin < totalPaginas - 1) paginas.push("...");
      paginas.push(totalPaginas);
    }

    return paginas;
  };

  const paginas = obtenerPaginasVisibles();

  // 🔥 MÉTRICAS
  const total = contratosFiltrados.length;
  const totalValor = contratosFiltrados.reduce(
    (acc, c) => acc + (c.valor || 0),
    0
  );

  const estadosUnicos = [
    ...new Set(contratos.map((c) => c.estado)),
  ];

  if (loading) return <div className="p-5">Cargando...</div>;

  return (
    <div className="d-flex">

      {sidebarVisible && <Sidebar />}

      <div className="flex-grow-1 bg-light">

        {/* 🔥 AQUÍ VA LA ENTIDAD */}
        <Navbar
          fecha={fecha}
          entidad={entidad}
          toggleSidebar={() => setSidebarVisible(!sidebarVisible)}
        />

        <div className="container mt-4">

          {/* 🔹 CARDS */}
          <div className="row mb-4">

            <div className="col-md-3 mb-3">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h6>Total Contratos</h6>
                  <h4>{total}</h4>
                </div>
              </div>
            </div>

            <div className="col-md-3 mb-3">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h6>Valor Total</h6>
                  <h4>${totalValor.toLocaleString()}</h4>
                </div>
              </div>
            </div>

          </div>

          {/* 🔹 FILTROS */}
          <div className="card mb-4 shadow-sm">
            <div className="card-body">

              <div className="row">

                <div className="col-md-6">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar..."
                    value={filtroTexto}
                    onChange={(e) => {
                      setFiltroTexto(e.target.value);
                      setPaginaActual(1);
                    }}
                  />
                </div>

                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={filtroEstado}
                    onChange={(e) => {
                      setFiltroEstado(e.target.value);
                      setPaginaActual(1);
                    }}
                  >
                    <option value="">Todos</option>

                    {estadosUnicos.map((estado, i) => (
                      <option key={i}>{estado}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3">
                  <button
                    className="btn btn-secondary w-100"
                    onClick={() => {
                      setFiltroTexto("");
                      setFiltroEstado("");
                      setPaginaActual(1);
                    }}
                  >
                    Limpiar
                  </button>
                </div>

              </div>

            </div>
          </div>

          {/* 🔹 TABLA */}
          <Table data={datosPaginados} />

          {/* 🔥 PAGINACIÓN */}
          <div className="d-flex justify-content-center mt-4">

            <nav>
              <ul className="pagination">

                <li className={`page-item ${paginaActual === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setPaginaActual(paginaActual - 1)}
                  >
                    «
                  </button>
                </li>

                {paginas.map((num, index) => (
                  <li
                    key={index}
                    className={`page-item ${
                      paginaActual === num ? "active" : ""
                    } ${num === "..." ? "disabled" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => {
                        if (num !== "...") setPaginaActual(num);
                      }}
                    >
                      {num}
                    </button>
                  </li>
                ))}

                <li
                  className={`page-item ${
                    paginaActual === totalPaginas ? "disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => setPaginaActual(paginaActual + 1)}
                  >
                    »
                  </button>
                </li>

              </ul>
            </nav>

          </div>

        </div>
      </div>
    </div>
  );
}