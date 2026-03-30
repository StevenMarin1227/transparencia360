import { useEffect, useState } from "react";
import { obtenerEntidades } from "../services/api";

export default function Login({ onLogin }) {
  const [entidades, setEntidades] = useState([]);
  const [entidad, setEntidad] = useState("");

  useEffect(() => {
    cargarEntidades();
  }, []);

  const cargarEntidades = async () => {
    try {
      const res = await obtenerEntidades();

      console.log("ENTIDADES BACKEND:", res.data); // 🔥 DEBUG

      setEntidades(res.data || []);
    } catch (error) {
      console.error("ERROR CARGANDO ENTIDADES:", error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!entidad) {
      alert("Selecciona una entidad");
      return;
    }

    onLogin(entidad);
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-4 shadow" style={{ width: "350px" }}>
        <h4 className="mb-3 text-center">Transparencia360</h4>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Selecciona entidad</label>

            <select
              className="form-select"
              value={entidad}
              onChange={(e) => setEntidad(e.target.value)}
            >
              <option value="">-- Seleccionar --</option>

              {entidades.length > 0 ? (
                entidades.map((ent, i) => (
                  <option key={i} value={ent}>
                    {ent}
                  </option>
                ))
              ) : (
                <option disabled>Cargando entidades...</option>
              )}
            </select>
          </div>

          <button className="btn btn-success w-100">
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}