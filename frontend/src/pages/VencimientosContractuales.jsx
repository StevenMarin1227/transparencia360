import { useEffect, useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaArrowUpRightFromSquare,
  FaClock,
  FaFilter,
  FaRotateLeft,
  FaTriangleExclamation,
} from "react-icons/fa6";
import { obtenerVencimientosContractuales } from "../services/api";

const REGISTROS_POR_PAGINA = 10;

const RESUMEN_INICIAL = {
  total: 0,
  rojo: 0,
  naranja: 0,
  amarillo: 0,
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

const obtenerClaseSemaforo = (nivel) => {
  const clases = {
    ROJO: "bg-danger text-white",
    NARANJA: "bg-orange text-white",
    AMARILLO: "bg-warning text-dark",
  };

  return clases[nivel] || "bg-secondary text-white";
};

const obtenerClaseTarjeta = (nivel) => {
  const clases = {
    ROJO: "border-danger",
    NARANJA: "border-orange",
    AMARILLO: "border-warning",
  };

  return clases[nivel] || "border-secondary";
};

const obtenerTextoDias = (dias) => {
  const valor = Number(dias);

  if (valor === 0) {
    return "Termina hoy";
  }

  if (valor === 1) {
    return "1 día";
  }

  return `${valor} días`;
};

export default function VencimientosContractuales({
  entidad,
  onBack,
}) {
  const [contratos, setContratos] = useState([]);
  const [resumen, setResumen] = useState(RESUMEN_INICIAL);
  const [fechaConsulta, setFechaConsulta] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filtroNivel, setFiltroNivel] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroContratista, setFiltroContratista] =
    useState("");
  const [filtroContrato, setFiltroContrato] = useState("");
  const [filtroObjeto, setFiltroObjeto] = useState("");

  const [paginaActual, setPaginaActual] = useState(1);

  useEffect(() => {
    const cargarVencimientos = async () => {
      try {
        setLoading(true);
        setError("");

        const respuesta =
          await obtenerVencimientosContractuales(entidad);

        setContratos(
          Array.isArray(respuesta.data)
            ? respuesta.data
            : []
        );

        setResumen(respuesta.resumen || RESUMEN_INICIAL);
        setFechaConsulta(respuesta.fechaConsulta || "");
      } catch (errorCarga) {
        console.error(
          "Error cargando vencimientos contractuales:",
          errorCarga
        );

        setError(
          "No fue posible cargar los contratos próximos a vencer."
        );

        setContratos([]);
        setResumen(RESUMEN_INICIAL);
      } finally {
        setLoading(false);
      }
    };

    cargarVencimientos();
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

    const textoObjeto = filtroObjeto
      .trim()
      .toLowerCase();

    return contratos.filter((contrato) => {
      const coincideNivel =
        !filtroNivel ||
        contrato.nivelAlerta === filtroNivel;

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

      const coincideObjeto =
        !textoObjeto ||
        String(contrato.objeto || "")
          .toLowerCase()
          .includes(textoObjeto);

      return (
        coincideNivel &&
        coincideEstado &&
        coincideContratista &&
        coincideContrato &&
        coincideObjeto
      );
    });
  }, [
    contratos,
    filtroNivel,
    filtroEstado,
    filtroContratista,
    filtroContrato,
    filtroObjeto,
  ]);

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
    setFiltroNivel("");
    setFiltroEstado("");
    setFiltroContratista("");
    setFiltroContrato("");
    setFiltroObjeto("");
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
    const fin = Math.min(totalPaginas, paginaActual + 2);

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
          Consultando contratos próximos a vencer...
        </p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 px-3 px-lg-4">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            Vencimientos Contractuales
          </h2>

          <p className="text-muted mb-0">
            Seguimiento preventivo a contratos que terminan
            dentro de los próximos 15 días.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onBack}
        >
          <FaArrowLeft className="me-2" />
          Volver al visor contractual
        </button>
      </div>

      <div className="alert alert-light border shadow-sm">
        <div className="row g-2">
          <div className="col-md-8">
            <strong>Entidad:</strong> {entidad}
          </div>

          <div className="col-md-4 text-md-end">
            <strong>Fecha de consulta:</strong>{" "}
            {formatearFecha(fechaConsulta)}
          </div>
        </div>
      </div>

      <div className="alert alert-info" role="alert">
        <FaClock className="me-2" />
        Este módulo identifica contratos registrados en estado
        En ejecución o Modificado cuya fecha de terminación
        está comprendida entre la fecha actual y los próximos
        15 días.
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3">
          <div className="card shadow-sm h-100 border-secondary">
            <div className="card-body">
              <p className="text-muted mb-1">
                Total próximos a vencer
              </p>

              <h3 className="mb-0">
                {resumen.total}
              </h3>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div
            className={`card shadow-sm h-100 ${obtenerClaseTarjeta(
              "ROJO"
            )}`}
          >
            <div className="card-body">
              <p className="text-muted mb-1">
                Entre 0 y 3 días
              </p>

              <h3 className="mb-0">
                {resumen.rojo}
              </h3>

              <small className="text-danger">
                Vencimiento inminente
              </small>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div
            className={`card shadow-sm h-100 ${obtenerClaseTarjeta(
              "NARANJA"
            )}`}
          >
            <div className="card-body">
              <p className="text-muted mb-1">
                Entre 4 y 8 días
              </p>

              <h3 className="mb-0">
                {resumen.naranja}
              </h3>

              <small className="text-orange">
                Atención prioritaria
              </small>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div
            className={`card shadow-sm h-100 ${obtenerClaseTarjeta(
              "AMARILLO"
            )}`}
          >
            <div className="card-body">
              <p className="text-muted mb-1">
                Entre 9 y 15 días
              </p>

              <h3 className="mb-0">
                {resumen.amarillo}
              </h3>

              <small className="text-warning-emphasis">
                Seguimiento preventivo
              </small>
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
                Nivel de alerta
              </label>

              <select
                className="form-select"
                value={filtroNivel}
                onChange={(event) => {
                  setFiltroNivel(event.target.value);
                  setPaginaActual(1);
                }}
              >
                <option value="">
                  Todos los niveles
                </option>
                <option value="ROJO">
                  Rojo — 0 a 3 días
                </option>
                <option value="NARANJA">
                  Naranja — 4 a 8 días
                </option>
                <option value="AMARILLO">
                  Amarillo — 9 a 15 días
                </option>
              </select>
            </div>

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
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
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
                placeholder="Referencia contractual"
                value={filtroContrato}
                onChange={(event) => {
                  setFiltroContrato(event.target.value);
                  setPaginaActual(1);
                }}
              />
            </div>

            <div className="col-md-10">
              <label className="form-label">
                Objeto contractual
              </label>

              <input
                type="text"
                className="form-control"
                placeholder="Buscar palabras contenidas en el objeto"
                value={filtroObjeto}
                onChange={(event) => {
                  setFiltroObjeto(event.target.value);
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
            <div>
              <h5 className="mb-1">
                Contratos próximos a vencer
              </h5>

              <small className="text-muted">
                Ordenados desde el vencimiento más próximo.
              </small>
            </div>

            <span className="text-muted">
              {contratosFiltrados.length} registros
            </span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-dark">
                <tr>
                  <th>Contrato</th>
                  <th style={{ minWidth: "300px" }}>
                    Objeto
                  </th>
                  <th>Fecha de inicio</th>
                  <th>Fecha de terminación</th>
                  <th>Días restantes</th>
                  <th>Alerta</th>
                  <th>Estado</th>
                  <th>Contratista</th>
                  <th>SECOP</th>
                </tr>
              </thead>

              <tbody>
                {contratosPaginados.map(
                  (contrato, index) => (
                    <tr
                      key={`${contrato.contrato}-${index}`}
                    >
                      <td className="fw-semibold">
                        {contrato.contrato}
                      </td>

                      <td>
                        <div
                          style={{
                            minWidth: "280px",
                            whiteSpace: "normal",
                          }}
                        >
                          {contrato.objeto}
                        </div>
                      </td>

                      <td>
                        {formatearFecha(
                          contrato.fechaInicio
                        )}
                      </td>

                      <td className="fw-semibold">
                        {formatearFecha(
                          contrato.fechaTerminacion
                        )}
                      </td>

                      <td className="text-center">
                        <span
                          className={
                            contrato.diasRestantes <= 3
                              ? "fw-bold text-danger"
                              : contrato.diasRestantes <= 8
                                ? "fw-bold text-orange"
                                : "fw-semibold"
                          }
                        >
                          {obtenerTextoDias(
                            contrato.diasRestantes
                          )}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`badge ${obtenerClaseSemaforo(
                            contrato.nivelAlerta
                          )}`}
                          title={
                            contrato.descripcionAlerta
                          }
                        >
                          {contrato.nivelAlerta}
                        </span>
                      </td>

                      <td>{contrato.estado}</td>

                      <td>
                        <div className="fw-semibold">
                          {contrato.contratista}
                        </div>

                        <small className="text-muted">
                          {contrato.documentoContratista}
                        </small>
                      </td>

                      <td>
                        {contrato.url ? (
                          <a
                            href={contrato.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-decoration-none"
                          >
                            Consultar
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
              <FaTriangleExclamation className="me-2" />
              No se encontraron contratos próximos a vencer
              con los filtros seleccionados.
            </div>
          )}

          {contratosFiltrados.length > 0 && (
            <nav
              className="d-flex justify-content-center mt-4"
              aria-label="Paginación de vencimientos"
            >
              <ul className="pagination mb-0">
                <li
                  className={`page-item ${
                    paginaActual === 1
                      ? "disabled"
                      : ""
                  }`}
                >
                  <button
                    type="button"
                    className="page-link"
                    onClick={() =>
                      cambiarPagina(paginaActual - 1)
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
                      className={`page-item ${
                        paginaActual === pagina
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
                  className={`page-item ${
                    paginaActual === totalPaginas
                      ? "disabled"
                      : ""
                  }`}
                >
                  <button
                    type="button"
                    className="page-link"
                    onClick={() =>
                      cambiarPagina(paginaActual + 1)
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