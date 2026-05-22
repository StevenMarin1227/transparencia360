export default function Table({ data }) {
  return (
    <div className="card shadow-sm">
      <div className="card-body">

        <h5 className="mb-3">Listado de Contratos</h5>

        {/* 🔥 SCROLL CONTROLADO */}
        <div
          className="table-responsive"
          style={{ maxHeight: "500px", overflowY: "auto" }}
        >
          <table className="table table-hover table-striped">

            <thead className="table-dark">
              <tr>
                <th>Entidad</th>
                <th>Contrato</th>
                <th>Contratista</th>
                <th>Valor</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {data.map((item, i) => (
                <tr key={i}>
                  <td>{item.entidad}</td>
                  <td>{item.contrato}</td>
                  <td>{item.contratista}</td>
                  <td>${Number(item.valor).toLocaleString()}</td>
                  <td>{item.estado}</td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>

      </div>
    </div>
  );
}