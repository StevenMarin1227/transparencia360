import { useEffect, useState } from "react";
import { obtenerContratos } from "../services/api";

export default function Dashboard({ entidad, onBack }) {
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroContratista, setFiltroContratista] = useState("");
  const [filtroContrato, setFiltroContrato] = useState("");

  useEffect(() => {
    const cargarContratos = async () => {
      try {
        const response = await obtenerContratos(entidad);
        setContratos(response.data || []);
      } catch (error) {
        console.error("Error cargando contratos:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarContratos();
  }, [entidad]);

  const estadosUnicos = [
    ...new Set(
      contratos
        .map((contrato) => contrato.estado)
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b));

  const contratosFiltrados = contratos.filter((contrato) => {
    const estado = (contrato.estado || "").toLowerCase();
    const contratista = (contrato.contratista || "").toLowerCase();
    const numeroContrato = (contrato.contrato || "").toLowerCase();

    const coincideEstado =
      !filtroEstado || estado === filtroEstado.toLowerCase();

    const coincideContratista =
      !filtroContratista ||
      contratista.includes(filtroContratista.toLowerCase());

    const coincideContrato =
      !filtroContrato ||
      numeroContrato.includes(filtroContrato.toLowerCase());

    return coincideEstado && coincideContratista && coincideContrato;
  });

  const totalContratos = contratosFiltrados.length;

  const valorTotal = contratosFiltrados.reduce(
    (total, contrato) => total + Number(contrato.valor || 0),
    0
  );

  const limpiarFiltros = () => {
    setFiltroEstado("");
    setFiltroContratista("");
    setFiltroContrato("");
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <h5>Cargando información contractual...</h5>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0">Transparencia360</h2>
          <p className="text-muted mb-0">Visor Contractual</p>
        </div>

        <button className="btn btn-outline-secondary" onClick={onBack}>
          Cambiar entidad
        </button>
      </div>

      <div className="alert alert-success">
        <strong>Entidad seleccionada:</strong> {entidad}
      </div>

      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h6 className="text-muted">Total contratos</h6>
              <h3>{totalContratos}</h3>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h6 className="text-muted">Valor total contratado</h6>
              <h3>${valorTotal.toLocaleString("es-CO")}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="mb-3">Filtros de consulta</h5>

          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Estado</label>
              <select
                className="form-select"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="">Todos</option>

                {estadosUnicos.map((estado, index) => (
                  <option key={index} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label">Contratista</label>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por contratista"
                value={filtroContratista}
                onChange={(e) => setFiltroContratista(e.target.value)}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">Número de contrato</label>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar contrato"
                value={filtroContrato}
                onChange={(e) => setFiltroContrato(e.target.value)}
              />
            </div>

            <div className="col-md-2 d-flex align-items-end">
              <button
                className="btn btn-secondary w-100"
                onClick={limpiarFiltros}
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="mb-3">Listado de contratos</h5>

          <div className="table-responsive">
            <table className="table table-striped table-hover align-middle">
              <thead className="table-dark">
                <tr>
                  <th>Contrato</th>
                  <th>Contratista</th>
                  <th>Documento</th>
                  <th>Valor</th>
                  <th>Estado</th>
                  <th>SECOP</th>
                </tr>
              </thead>

              <tbody>
                {contratosFiltrados.map((item, index) => (
                  <tr key={index}>
                    <td>{item.contrato}</td>
                    <td>{item.contratista}</td>
                    <td>{item.documentoContratista}</td>
                    <td>${Number(item.valor || 0).toLocaleString("es-CO")}</td>
                    <td>{item.estado}</td>
                    <td>
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Haga clic para ver enlace
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {contratosFiltrados.length === 0 && (
            <div className="alert alert-warning mt-3">
              No se encontraron contratos con los filtros seleccionados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}