import { useEffect, useMemo, useState } from "react";
import {
    FaArrowLeft,
    FaArrowUpRightFromSquare,
    FaDownload,
    FaFilter,
    FaRotateLeft,
} from "react-icons/fa6";
import { obtenerControlLiquidacion } from "../services/api";
import { generarReporteControlLiquidacion } from "../utils/generarReporteControlLiquidacion";

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

    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) {
        return "N/A";
    }

    return valor.toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const obtenerClaseSemaforo = (nivel) => {
    const clases = {
        VERDE: "bg-success",
        AMARILLO: "bg-warning text-dark",
        NARANJA: "bg-orange text-white",
        ROJO: "bg-danger",
    };

    return clases[nivel] || "bg-secondary";
};

const obtenerClaseTarjeta = (nivel) => {
    const clases = {
        VERDE: "border-success",
        AMARILLO: "border-warning",
        NARANJA: "border-orange",
        ROJO: "border-danger",
    };

    return clases[nivel] || "border-secondary";
};

export default function ControlLiquidacion({
    entidad,
    onBack,
}) {
    const [contratos, setContratos] = useState([]);
    const [resumen, setResumen] = useState({
        total: 0,
        verde: 0,
        amarillo: 0,
        naranja: 0,
        rojo: 0,
    });

    const [fechaConsulta, setFechaConsulta] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [entidadInfo, setEntidadInfo] = useState({
        nombre: entidad,
        nit: "No disponible",
        departamento: "No disponible",
    });

    const [generandoPdf, setGenerandoPdf] =
        useState(false);

    const [filtroNivel, setFiltroNivel] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("");
    const [filtroContratista, setFiltroContratista] =
        useState("");
    const [filtroContrato, setFiltroContrato] = useState("");

    const [paginaActual, setPaginaActual] = useState(1);

    useEffect(() => {
        const cargarControlLiquidacion = async () => {
            try {
                setLoading(true);
                setError("");

                const respuesta =
                    await obtenerControlLiquidacion(entidad);

                setContratos(
                    Array.isArray(respuesta.data)
                        ? respuesta.data
                        : []
                );

                setResumen(
                    respuesta.resumen || {
                        total: 0,
                        verde: 0,
                        amarillo: 0,
                        naranja: 0,
                        rojo: 0,
                    }
                );

                setFechaConsulta(respuesta.fechaConsulta || "");
                setEntidadInfo(
                    respuesta.entidadInfo || {
                        nombre: entidad,
                        nit: "No disponible",
                        departamento: "No disponible",
                    }
                );
            } catch (errorCarga) {
                console.error(
                    "Error cargando control de liquidación:",
                    errorCarga
                );

                setError(
                    "No fue posible cargar la información de control de liquidación."
                );
            } finally {
                setLoading(false);
            }
        };

        cargarControlLiquidacion();
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

            return (
                coincideNivel &&
                coincideEstado &&
                coincideContratista &&
                coincideContrato
            );
        });
    }, [
        contratos,
        filtroNivel,
        filtroEstado,
        filtroContratista,
        filtroContrato,
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

        for (let pagina = inicio; pagina <= fin; pagina += 1) {
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

    const descargarReportePdf = () => {
        try {
            setGenerandoPdf(true);

            generarReporteControlLiquidacion({
                entidadInfo,
                contratos,
                resumen,
                fechaConsulta,
            });
        } catch (errorPdf) {
            console.error(
                "Error generando el reporte PDF:",
                errorPdf
            );

            setError(
                "No fue posible generar el reporte PDF."
            );
        } finally {
            setGenerandoPdf(false);
        }
    };

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
                    Consultando contratos para control de liquidación...
                </p>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4 px-3 px-lg-4">
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
                <div>
                    <h2 className="fw-bold mb-1">
                        Control de Liquidación
                    </h2>

                    <p className="text-muted mb-0">
                        Seguimiento preventivo a contratos cuya fecha de
                        terminación ya venció.
                    </p>
                </div>

                <div className="d-flex flex-column flex-sm-row gap-2">
                    <button
                        type="button"
                        className="btn btn-success"
                        onClick={descargarReportePdf}
                        disabled={
                            generandoPdf ||
                            contratos.length === 0
                        }
                    >
                        <FaDownload className="me-2" />

                        {generandoPdf
                            ? "Generando reporte..."
                            : "Descargar reporte PDF"}
                    </button>

                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={onBack}
                    >
                        <FaArrowLeft className="me-2" />
                        Volver al visor contractual
                    </button>
                </div>
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

            <div
                className="alert alert-warning"
                role="alert"
            >
                La semaforización constituye una herramienta
                preventiva de seguimiento. No determina por sí sola
                la obligación de liquidar ni la pérdida de competencia.
                Cada caso debe verificarse con el contrato, sus
                modificaciones, suspensiones y actuaciones
                posteriores.
            </div>

            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}

            <div className="row g-3 mb-4">
                <div className="col-sm-6 col-xl">
                    <div className="card shadow-sm h-100 border-secondary">
                        <div className="card-body">
                            <p className="text-muted mb-1">
                                Total contratos
                            </p>
                            <h3 className="mb-0">{resumen.total}</h3>
                        </div>
                    </div>
                </div>

                <div className="col-sm-6 col-xl">
                    <div
                        className={`card shadow-sm h-100 ${obtenerClaseTarjeta(
                            "VERDE"
                        )}`}
                    >
                        <div className="card-body">
                            <p className="text-muted mb-1">
                                Menos de 12 meses
                            </p>
                            <h3 className="mb-0">{resumen.verde}</h3>
                        </div>
                    </div>
                </div>

                <div className="col-sm-6 col-xl">
                    <div
                        className={`card shadow-sm h-100 ${obtenerClaseTarjeta(
                            "AMARILLO"
                        )}`}
                    >
                        <div className="card-body">
                            <p className="text-muted mb-1">
                                Entre 12 y 23 meses
                            </p>
                            <h3 className="mb-0">
                                {resumen.amarillo}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="col-sm-6 col-xl">
                    <div
                        className={`card shadow-sm h-100 ${obtenerClaseTarjeta(
                            "NARANJA"
                        )}`}
                    >
                        <div className="card-body">
                            <p className="text-muted mb-1">
                                Entre 24 y 29 meses
                            </p>
                            <h3 className="mb-0">
                                {resumen.naranja}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="col-sm-6 col-xl">
                    <div
                        className={`card shadow-sm h-100 ${obtenerClaseTarjeta(
                            "ROJO"
                        )}`}
                    >
                        <div className="card-body">
                            <p className="text-muted mb-1">
                                30 meses o más
                            </p>
                            <h3 className="mb-0">{resumen.rojo}</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <div className="d-flex align-items-center gap-2 mb-3">
                        <FaFilter />
                        <h5 className="mb-0">Filtros</h5>
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
                                <option value="VERDE">Verde</option>
                                <option value="AMARILLO">
                                    Amarillo
                                </option>
                                <option value="NARANJA">
                                    Naranja
                                </option>
                                <option value="ROJO">Rojo</option>
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
                                <option value="">Todos los estados</option>

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
                                    setFiltroContratista(event.target.value);
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
                                    setFiltroContrato(event.target.value);
                                    setPaginaActual(1);
                                }}
                            />
                        </div>
                    </div>

                    <div className="d-flex justify-content-end mt-3">
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={limpiarFiltros}
                        >
                            <FaRotateLeft className="me-2" />
                            Limpiar filtros
                        </button>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm">
                <div className="card-body">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
                        <h5 className="mb-0">
                            Contratos identificados
                        </h5>

                        <span className="text-muted">
                            {contratosFiltrados.length} registros
                        </span>
                    </div>

                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-dark">
                                <tr>
                                    <th>Contrato</th>
                                    <th>Contratista</th>
                                    <th>Estado</th>
                                    <th>Valor</th>
                                    <th>Terminación</th>
                                    <th>Meses</th>
                                    <th>Restantes</th>
                                    <th>Alerta</th>
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
                                                <div className="fw-semibold">
                                                    {contrato.contratista}
                                                </div>

                                                <small className="text-muted">
                                                    {contrato.documentoContratista}
                                                </small>
                                            </td>

                                            <td>{contrato.estado}</td>

                                            <td>
                                                {formatearMoneda(contrato.valor)}
                                            </td>

                                            <td>
                                                {formatearFecha(
                                                    contrato.fechaTerminacion
                                                )}
                                            </td>

                                            <td className="text-center fw-semibold">
                                                {contrato.mesesTranscurridos}
                                            </td>

                                            <td className="text-center">
                                                {contrato.mesesRestantesPara30}
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

                                            <td>
                                                {contrato.url ? (
                                                    <a
                                                        href={contrato.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-decoration-none"
                                                    >
                                                        Consultar{" "}
                                                        <FaArrowUpRightFromSquare
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
                            No se encontraron contratos con los filtros
                            seleccionados.
                        </div>
                    )}

                    {contratosFiltrados.length > 0 && (
                        <nav
                            className="d-flex justify-content-center mt-4"
                            aria-label="Paginación"
                        >
                            <ul className="pagination mb-0">
                                <li
                                    className={`page-item ${paginaActual === 1 ? "disabled" : ""
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
                                                <span className="page-link">…</span>
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