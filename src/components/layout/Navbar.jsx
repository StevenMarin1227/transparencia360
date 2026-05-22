import { FaBars, FaSignOutAlt } from "react-icons/fa";

export default function Navbar({ fecha, entidad, toggleSidebar, onLogout }) {

  const formatearFecha = (fecha) => {
    if (!fecha) return "Cargando...";

    const f = new Date(fecha);
    const dia = String(f.getDate()).padStart(2, "0");
    const mes = String(f.getMonth() + 1).padStart(2, "0");
    const anio = f.getFullYear();

    return `${dia}/${mes}/${anio}`;
  };

  return (
    <nav className="navbar bg-white shadow-sm px-3 d-flex justify-content-between">

      <div className="d-flex align-items-center gap-3">

        <button
          className="btn btn-outline-secondary"
          onClick={toggleSidebar}
        >
          <FaBars />
        </button>

        <span className="navbar-brand mb-0 h5">
          Sistema de Análisis Contractual
        </span>

      </div>

      <div className="d-flex align-items-center gap-4">

        <div className="text-end">
          <div className="text-muted" style={{ fontSize: "12px" }}>
            Entidad
          </div>
          <div className="fw-bold text-success">
            {entidad}
          </div>
        </div>

        <div className="text-end">
          <div className="text-muted" style={{ fontSize: "12px" }}>
            Última actualización
          </div>
          <div className="fw-bold">
            {formatearFecha(fecha)}
          </div>
        </div>

        <button
          className="btn btn-outline-danger"
          onClick={onLogout}
        >
          <FaSignOutAlt />
        </button>

      </div>
    </nav>
  );
}