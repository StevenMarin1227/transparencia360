import { useEffect, useState } from "react";
import { obtenerEntidades } from "../services/api";

export default function Login({ onLogin }) {
  const [entidades, setEntidades] = useState([]);
  const [entidad, setEntidad] = useState("");

  useEffect(() => {
    const cargarEntidades = async () => {
      try {
        const res = await obtenerEntidades();
        setEntidades(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("❌ Error cargando entidades:", error);
        setEntidades([]);
      }
    };

    cargarEntidades();
  }, []);

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
      <div className="card p-4 shadow" style={{ width: "380px" }}>
        <h2 className="text-center mb-4">Transparencia360</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Selecciona entidad</label>

            <select
              className="form-select"
              value={entidad}
              onChange={(e) => setEntidad(e.target.value)}
            >
              <option value="">-- Seleccionar --</option>

              {entidades
                .filter((e) => e && e.trim() !== "")
                .map((ent, i) => (
                  <option key={i} value={ent}>
                    {ent}
                  </option>
                ))}
            </select>
          </div>

          <button type="submit" className="btn btn-success w-100">
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}