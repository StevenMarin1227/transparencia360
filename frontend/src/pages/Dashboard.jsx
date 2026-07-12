import { useEffect, useMemo, useState } from "react";

import {
  FaArrowRight,
  FaArrowUpRightFromSquare,
  FaFilter,
  FaRotateLeft,
} from "react-icons/fa6";

import { obtenerContratos } from "../services/api";

const REGISTROS_POR_PAGINA = 10;

const formatearMoneda = (valor) => {
  return Number(valor || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
};

const formatearFecha = (fecha) => {
  if (!fecha) {
    return "N/A";
  }

  const fechaConvertida = new Date(fecha);

  if (Number.isNaN(fechaConvertida.getTime())) {
    return "N/A";
  }

  return fechaConvertida.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function Dashboard({
  entidad,
  onBack,
  onOpenControlLiquidacion,
}) {
  const [contratos, setContratos] = useState([]);
  const [fechaConsulta, setFechaConsulta] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroContratista, setFiltroContratista] = useState("");
  const [filtroContrato, setFiltroContrato] = useState("");

  const [paginaActual, setPaginaActual] = useState(1);

  useEffect(() => {
    const cargarContratos = async () => {
      try {
        setLoading(true);
        setError("");

        const respuesta = await obtenerContratos(entidad);

        setContratos(
          Array.isArray(respuesta.data)
            ? respuesta.data
            : []
        );

        setFechaConsulta(respuesta.fechaConsulta || "");
      } catch (errorCarga) {
        console.error(
          "Error cargando contratos:",
          errorCarga
        );

        setError(
          "No fue posible cargar la información contractual."
        );

        setContratos([]);
      } finally {
        setLoading(false);
      }
    };

    cargarContratos();
  }, [entidad]);

  const estadosUnicos = useMemo(() => {
    return [
      ...new Set(
        contratos
          .map((contrato) => contrato.estado)
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b, "es"));
  }, [contratos]);

  const contratosFiltrados = useMemo(() => {
    const textoContratista = filtroContratista
      .trim()
      .toLowerCase();

    const textoContrato = filtroContrato
      .trim()
      .toLowerCase();

    return contratos.filter((contrato) => {
      const coincideEstado =
        !filtroEstado ||
        contrato.estado === filtroEstado;

      const coincideContratista =
        !textoContratista ||
        String(contrato.contratista || "")
          .toLowerCase()
          .includes(textoContratista) ||
        String(contrato.documentoContratista || "")
          .toLowerCase()
          .includes(textoContratista);

      const coincideContrato =
        !textoContrato ||
        String(contrato.contrato || "")
          .toLowerCase()
          .includes(textoContrato);

      return (
        coincideEstado &&
        coincideContratista &&
        coincideContrato
      );
    });
  }, [
    contratos,
    filtroEstado,
    filtroContratista,
    filtroContrato,
  ]);

  const totalContratos = contratosFiltrados.length;

  const valorTotal = useMemo(() => {
    return contratosFiltrados.reduce(
      (acumulado, contrato) =>
        acumulado + Number(contrato.valor || 0),
      0
    );
  }, [contratosFiltrados]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      contratosFiltrados.length / REGISTROS_POR_PAGINA
    )
  );

  const indiceInicial =
    (paginaActual - 1) * REGISTROS_POR_PAGINA;

  const contratosPaginados = contratosFiltrados.slice(
    indiceInicial,
    indiceInicial + REGISTROS_POR_PAGINA
  );

  const limpiarFiltros = () => {
    setFiltroEstado("");
    setFiltroContratista("");
    setFiltroContrato("");
    setPaginaActual(1);
  };

  const cambiarPagina = (pagina) => {
    if (pagina < 1 || pagina > totalPaginas) {
      return;
    }

    setPaginaActual(pagina);
  };

  const paginasVisibles = useMemo(() => {
    const paginas = [];
    const inicio = Math.max(1, paginaActual - 2);
    const fin = Math.min(
      totalPaginas,
      paginaActual + 2
    );

    if (inicio > 1) {
      paginas.push(1);

      if (inicio > 2) {
        paginas.push("inicio-ellipsis");
      }
    }

    for (
      let pagina = inicio;
      pagina <= fin;
      pagina += 1
    ) {
      paginas.push(pagina);
    }

    if (fin < totalPaginas) {
      if (fin < totalPaginas - 1) {
        paginas.push("fin-ellipsis");
      }

      paginas.push(totalPaginas);
    }

    return paginas;
  }, [paginaActual, totalPaginas]);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div
          className="spinner-border text-success"
          role="status"
        >
          <span className="visually-hidden">
            Cargando...
          </span>
        </div>

        <p className="mt-3 mb-0">
          Consultando información contractual...
        </p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 px-3 px-lg-4">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            Transparencia360
          </h2>

          <p className="text-muted mb-0">
            Visor Contractual
          </p>
        </div>

        <div className="d-flex flex-column flex-sm-row gap-2">
          <button
            type="button"
            className="btn btn-success"
            onClick={onOpenControlLiquidacion}
          >
            Control de Liquidación
            <FaArrowRight className="ms-2" />
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onBack}
          >
            Cambiar entidad
          </button>
        </div>
      </div>

      <div className="alert alert-light border shadow-sm">
        <div className="row g-2">
          <div className="col-md-8">
            <strong>Entidad seleccionada:</strong>{" "}
            {entidad}
          </div>

          <div className="col-md-4 text-md-end">
            <strong>Fecha de consulta:</strong>{" "}
            {formatearFecha(fechaConsulta)}
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <p className="text-muted mb-1">
                Total de contratos
              </p>

              <h3 className="mb-0">
                {totalContratos}
              </h3>
            </div>
          </div>
        </div>

        <div className="col-md-5">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <p className="text-muted mb-1">
                Valor total contratado
              </p>

              <h3 className="mb-0">
                {formatearMoneda(valorTotal)}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center gap-2 mb-3">
            <FaFilter />
            <h5 className="mb-0">
              Filtros de consulta
            </h5>
          </div>

          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">
                Estado contractual
              </label>

              <select
                className="form-select"
                value={filtroEstado}
                onChange={(event) => {
                  setFiltroEstado(event.target.value);
                  setPaginaActual(1);
                }}
              >
                <option value="">
                  Todos los estados
                </option>

                {estadosUnicos.map((estado) => (
                  <option
                    key={estado}
                    value={estado}
                  >
                    {estado}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label">
                Contratista o documento
              </label>

              <input
                type="text"
                className="form-control"
                placeholder="Nombre, NIT o documento"
                value={filtroContratista}
                onChange={(event) => {
                  setFiltroContratista(
                    event.target.value
                  );
                  setPaginaActual(1);
                }}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">
                Número de contrato
              </label>

              <input
                type="text"
                className="form-control"
                placeholder="Referencia del contrato"
                value={filtroContrato}
                onChange={(event) => {
                  setFiltroContrato(
                    event.target.value
                  );
                  setPaginaActual(1);
                }}
              />
            </div>

            <div className="col-md-2 d-flex align-items-end">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={limpiarFiltros}
              >
                <FaRotateLeft className="me-2" />
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
            <h5 className="mb-0">
              Listado de contratos
            </h5>

            <span className="text-muted">
              {contratosFiltrados.length} registros
            </span>
          </div>

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
                {contratosPaginados.map(
                  (contrato, index) => (
                    <tr
                      key={`${contrato.contrato}-${index}`}
                    >
                      <td>{contrato.contrato}</td>

                      <td>
                        {contrato.contratista}
                      </td>

                      <td>
                        {contrato.documentoContratista}
                      </td>

                      <td>
                        {formatearMoneda(
                          contrato.valor
                        )}
                      </td>

                      <td>{contrato.estado}</td>

                      <td>
                        {contrato.url ? (
                          <a
                            href={contrato.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-decoration-none"
                          >
                            Haga clic para ver enlace
                            <FaArrowUpRightFromSquare
                              className="ms-1"
                              size={12}
                            />
                          </a>
                        ) : (
                          <span className="text-muted">
                            Sin enlace
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {contratosFiltrados.length === 0 && (
            <div className="alert alert-info mb-0">
              No se encontraron contratos con los
              filtros seleccionados.
            </div>
          )}

          {contratosFiltrados.length > 0 && (
            <nav
              className="d-flex justify-content-center mt-4"
              aria-label="Paginación de contratos"
            >
              <ul className="pagination mb-0">
                <li
                  className={`page-item ${paginaActual === 1
                      ? "disabled"
                      : ""
                    }`}
                >
                  <button
                    type="button"
                    className="page-link"
                    onClick={() =>
                      cambiarPagina(
                        paginaActual - 1
                      )
                    }
                  >
                    Anterior
                  </button>
                </li>

                {paginasVisibles.map((pagina) => {
                  if (
                    pagina === "inicio-ellipsis" ||
                    pagina === "fin-ellipsis"
                  ) {
                    return (
                      <li
                        key={pagina}
                        className="page-item disabled"
                      >
                        <span className="page-link">
                          …
                        </span>
                      </li>
                    );
                  }

                  return (
                    <li
                      key={pagina}
                      className={`page-item ${paginaActual === pagina
                          ? "active"
                          : ""
                        }`}
                    >
                      <button
                        type="button"
                        className="page-link"
                        onClick={() =>
                          cambiarPagina(pagina)
                        }
                      >
                        {pagina}
                      </button>
                    </li>
                  );
                })}

                <li
                  className={`page-item ${paginaActual === totalPaginas
                      ? "disabled"
                      : ""
                    }`}
                >
                  <button
                    type="button"
                    className="page-link"
                    onClick={() =>
                      cambiarPagina(
                        paginaActual + 1
                      )
                    }
                  >
                    Siguiente
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}