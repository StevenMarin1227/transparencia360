import { useEffect, useState } from "react";
import { FaSearch, FaBuilding } from "react-icons/fa";
import { obtenerEntidades } from "../services/api";

export default function EntitySelect({ onSelectEntity }) {
  const [entidades, setEntidades] = useState([]);
  const [entidadSeleccionada, setEntidadSeleccionada] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarEntidades();
  }, []);

  const cargarEntidades = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await obtenerEntidades();

      setEntidades(data || []);
    } catch (error) {
      console.error("Error cargando entidades:", error);

      setError(
        "No fue posible cargar las entidades desde el servicio."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleIngresar = () => {
    if (!entidadSeleccionada) {
      alert("Selecciona una entidad");
      return;
    }

    onSelectEntity(entidadSeleccionada);
  };

  return (
    <div className="entity-page">
      <div className="entity-card shadow-lg">

        <div className="text-center mb-4">

          <div className="entity-icon mx-auto mb-3">
            <FaBuilding />
          </div>

          <h1 className="fw-bold mb-1">
            Transparencia360
          </h1>

          <h5 className="text-muted">
            Visor Contractual
          </h5>

          <p className="text-muted mt-3">
            Selecciona una entidad estatal para consultar
            información contractual.
          </p>

        </div>

        <div className="mb-3">

          <label className="form-label fw-semibold">
            Entidad
          </label>

          <select
            className="form-select form-select-lg"
            value={entidadSeleccionada}
            onChange={(e) =>
              setEntidadSeleccionada(e.target.value)
            }
            disabled={loading}
          >
            <option value="">
              {loading
                ? "Cargando entidades..."
                : "Seleccione una entidad"}
            </option>

            {entidades.map((entidad, index) => (
              <option
                key={index}
                value={entidad}
              >
                {entidad}
              </option>
            ))}

          </select>

        </div>

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        <button
          className="btn btn-success btn-lg w-100 mt-3"
          onClick={handleIngresar}
          disabled={loading || entidades.length === 0}
        >
          <FaSearch className="me-2" />
          Consultar información contractual
        </button>

      </div>
    </div>
  );
}