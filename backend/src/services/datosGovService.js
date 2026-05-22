const BASE_URL = process.env.DATOS_GOV_BASE_URL;
const TOKEN = process.env.DATOS_GOV_TOKEN;
const DEPARTAMENTO = process.env.DEPARTAMENTO || "Antioquia";

const headers = {
  "X-App-Token": TOKEN,
  Accept: "application/json",
};

const normalizarContrato = (item) => ({
  entidad: item.nombre_entidad || "N/A",
  contrato: item.referencia_del_contrato || "N/A",
  contratista: item.proveedor_adjudicado || "N/A",
  documentoContratista: item.documento_proveedor || "N/A",
  valor: Number(item.valor_del_contrato || 0),
  estado: item.estado_contrato || "N/A",
  url: item.urlproceso?.url || "",
});

export const obtenerEntidadesAntioquia = async () => {
  const params = new URLSearchParams();

  params.set("$select", "distinct nombre_entidad");
  params.set("departamento", DEPARTAMENTO);
  params.set("$order", "nombre_entidad");
  params.set("$limit", "50000");

  const response = await fetch(`${BASE_URL}?${params.toString()}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  const data = await response.json();

  return data
    .map((item) => item.nombre_entidad)
    .filter(Boolean)
    .map((item) => item.trim())
    .sort((a, b) => a.localeCompare(b));
};

export const obtenerContratosPorEntidad = async (entidad) => {
  if (!entidad) {
    throw new Error("La entidad es obligatoria");
  }

  const limite = 50000;
  let offset = 0;
  let contratosTotales = [];
  let continuar = true;

  while (continuar) {
    const params = new URLSearchParams();

    params.set("departamento", DEPARTAMENTO);
    params.set("nombre_entidad", entidad);
    params.set("$limit", String(limite));
    params.set("$offset", String(offset));

    const response = await fetch(`${BASE_URL}?${params.toString()}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }

    const data = await response.json();

    const contratosNormalizados = data.map(normalizarContrato);

    contratosTotales = [
      ...contratosTotales,
      ...contratosNormalizados,
    ];

    if (data.length < limite) {
      continuar = false;
    } else {
      offset += limite;
    }
  }

  return contratosTotales;
};