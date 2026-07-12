const BASE_URL = process.env.DATOS_GOV_BASE_URL;
const TOKEN = process.env.DATOS_GOV_TOKEN;
const DEPARTAMENTO = process.env.DEPARTAMENTO || "Antioquia";

const LIMITE_POR_PAGINA = 50000;

const validarConfiguracion = () => {
  if (!BASE_URL) {
    throw new Error(
      "No está configurada la variable DATOS_GOV_BASE_URL"
    );
  }

  if (!TOKEN) {
    throw new Error(
      "No está configurada la variable DATOS_GOV_TOKEN"
    );
  }
};

const consultarDatosAbiertos = async (params) => {
  validarConfiguracion();

  const url = new URL(BASE_URL);

  Object.entries(params).forEach(([clave, valor]) => {
    if (
      valor !== undefined &&
      valor !== null &&
      valor !== ""
    ) {
      url.searchParams.set(clave, String(valor));
    }
  });

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-App-Token": TOKEN,
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  if (!response.ok) {
    const detalle = await response.text();

    throw new Error(
      `Datos Abiertos respondió ${response.status}: ${detalle}`
    );
  }

  return response.json();
};

const obtenerUrlProceso = (urlProceso) => {
  if (!urlProceso) {
    return "";
  }

  // En el JSON de SECOP II urlproceso puede venir como:
  // { url: "https://..." }
  if (
    typeof urlProceso === "object" &&
    typeof urlProceso.url === "string"
  ) {
    return urlProceso.url.trim();
  }

  if (typeof urlProceso === "string") {
    return urlProceso.trim();
  }

  return "";
};

const normalizarContrato = (item) => ({
  entidad: item.nombre_entidad || "N/A",
  contrato: item.referencia_del_contrato || "N/A",
  contratista: item.proveedor_adjudicado || "N/A",
  documentoContratista: item.documento_proveedor || "N/A",
  valor: Number(item.valor_del_contrato || 0),
  estado: item.estado_contrato || "N/A",
  url: obtenerUrlProceso(item.urlproceso),
});

export const obtenerEntidadesAntioquia = async () => {
  const data = await consultarDatosAbiertos({
    "$select": "distinct nombre_entidad",
    departamento: DEPARTAMENTO,
    "$order": "nombre_entidad ASC",
    "$limit": LIMITE_POR_PAGINA,
  });

  return data
    .map((item) => item.nombre_entidad)
    .filter(Boolean)
    .map((entidad) => entidad.trim())
    .filter((entidad) => entidad.length > 0)
    .sort((a, b) => a.localeCompare(b, "es"));
};

export const obtenerContratosPorEntidad = async (entidad) => {
  if (!entidad || !entidad.trim()) {
    throw new Error("La entidad es obligatoria");
  }

  const contratosTotales = [];
  let offset = 0;
  let seguirConsultando = true;

  while (seguirConsultando) {
    const data = await consultarDatosAbiertos({
      departamento: DEPARTAMENTO,
      nombre_entidad: entidad.trim(),
      "$limit": LIMITE_POR_PAGINA,
      "$offset": offset,

      // Orden estable para evitar duplicados u omisiones
      // mientras se recorren las páginas.
      "$order": ":id ASC",
    });

    contratosTotales.push(
      ...data.map(normalizarContrato)
    );

    if (data.length < LIMITE_POR_PAGINA) {
      seguirConsultando = false;
    } else {
      offset += LIMITE_POR_PAGINA;
    }
  }

  return contratosTotales;
};