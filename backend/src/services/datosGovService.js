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

const consultarDatosAbiertos = async (params = {}) => {
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

const convertirFecha = (valor) => {
  if (!valor) {
    return null;
  }

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return null;
  }

  return fecha;
};

const calcularMesesTranscurridos = (
  fechaTerminacion,
  fechaActual = new Date()
) => {
  const fechaFin = convertirFecha(fechaTerminacion);

  if (!fechaFin || fechaFin > fechaActual) {
    return 0;
  }

  let meses =
    (fechaActual.getFullYear() - fechaFin.getFullYear()) * 12 +
    (fechaActual.getMonth() - fechaFin.getMonth());

  if (fechaActual.getDate() < fechaFin.getDate()) {
    meses -= 1;
  }

  return Math.max(meses, 0);
};

const sumarMeses = (fechaOriginal, cantidadMeses) => {
  const fecha = convertirFecha(fechaOriginal);

  if (!fecha) {
    return null;
  }

  const resultado = new Date(fecha);
  resultado.setMonth(resultado.getMonth() + cantidadMeses);

  return resultado;
};

const asignarSemaforizacion = (mesesTranscurridos) => {
  if (mesesTranscurridos >= 30) {
    return {
      nivelAlerta: "ROJO",
      descripcionAlerta:
        "Supera el umbral general de 30 meses. Requiere validación jurídica y documental.",
      prioridad: 4,
    };
  }

  if (mesesTranscurridos >= 24) {
    return {
      nivelAlerta: "NARANJA",
      descripcionAlerta:
        "Prioridad alta. Se encuentra próximo al umbral general de 30 meses.",
      prioridad: 3,
    };
  }

  if (mesesTranscurridos >= 12) {
    return {
      nivelAlerta: "AMARILLO",
      descripcionAlerta:
        "Atención preventiva. Debe verificarse el estado de liquidación.",
      prioridad: 2,
    };
  }

  return {
    nivelAlerta: "VERDE",
    descripcionAlerta:
      "Seguimiento ordinario.",
    prioridad: 1,
  };
};

const normalizarContrato = (item) => ({
  entidad: item.nombre_entidad || "N/A",
  nitEntidad: item.nit_entidad || "N/A",
  departamento: item.departamento || "N/A",
  contrato: item.referencia_del_contrato || "N/A",
  contratista: item.proveedor_adjudicado || "N/A",
  documentoContratista:
    item.documento_proveedor || "N/A",
  valor: Number(item.valor_del_contrato || 0),
  estado: item.estado_contrato || "N/A",
  fechaTerminacion:
    item.fecha_de_fin_del_contrato || null,
  url: obtenerUrlProceso(item.urlproceso),
});

const normalizarEstado = (estado) =>
  String(estado || "")
    .trim()
    .toLocaleLowerCase("es");

const esEstadoDeSeguimiento = (estado) => {
  const estadoNormalizado = normalizarEstado(estado);

  return (
    estadoNormalizado === "en ejecución" ||
    estadoNormalizado === "en ejecucion" ||
    estadoNormalizado === "modificado"
  );
};

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
  let continuar = true;

  while (continuar) {
    const data = await consultarDatosAbiertos({
      departamento: DEPARTAMENTO,
      nombre_entidad: entidad.trim(),
      "$limit": LIMITE_POR_PAGINA,
      "$offset": offset,
      "$order": ":id ASC",
    });

    contratosTotales.push(
      ...data.map(normalizarContrato)
    );

    if (data.length < LIMITE_POR_PAGINA) {
      continuar = false;
    } else {
      offset += LIMITE_POR_PAGINA;
    }
  }

  return contratosTotales;
};

export const obtenerSeguimientoLiquidacion = async (
  entidad
) => {
  if (!entidad || !entidad.trim()) {
    throw new Error("La entidad es obligatoria");
  }

  const fechaActual = new Date();
  const contratosSeguimiento = [];

  let offset = 0;
  let continuar = true;

  while (continuar) {
    const data = await consultarDatosAbiertos({
      "$select": [
        "nombre_entidad",
        "nit_entidad",
        "departamento",
        "referencia_del_contrato",
        "proveedor_adjudicado",
        "documento_proveedor",
        "valor_del_contrato",
        "estado_contrato",
        "fecha_de_fin_del_contrato",
        "urlproceso",
      ].join(","),
  departamento: DEPARTAMENTO,
    nombre_entidad: entidad.trim(),
      "$limit": LIMITE_POR_PAGINA,
        "$offset": offset,
          "$order": ":id ASC",
    });

for (const item of data) {
  if (!esEstadoDeSeguimiento(item.estado_contrato)) {
    continue;
  }

  const fechaTerminacion = convertirFecha(
    item.fecha_de_fin_del_contrato
  );

  /*
   * Solo se incluyen contratos cuya fecha de terminación
   * ya pasó. Los contratos con fecha futura todavía no
   * empiezan a acumular meses para este seguimiento.
   */
  if (
    !fechaTerminacion ||
    fechaTerminacion > fechaActual
  ) {
    continue;
  }

  const mesesTranscurridos =
    calcularMesesTranscurridos(
      fechaTerminacion,
      fechaActual
    );

  const fechaLimite30Meses = sumarMeses(
    fechaTerminacion,
    30
  );

  const mesesRestantesPara30 = Math.max(
    30 - mesesTranscurridos,
    0
  );

  const semaforizacion =
    asignarSemaforizacion(mesesTranscurridos);

  contratosSeguimiento.push({
    ...normalizarContrato(item),

    fechaTerminacion:
      fechaTerminacion.toISOString(),

    mesesTranscurridos,

    mesesRestantesPara30,

    fechaLimite30Meses:
      fechaLimite30Meses?.toISOString() || null,

    nivelAlerta:
      semaforizacion.nivelAlerta,

    descripcionAlerta:
      semaforizacion.descripcionAlerta,

    prioridad:
      semaforizacion.prioridad,
  });
}

if (data.length < LIMITE_POR_PAGINA) {
  continuar = false;
} else {
  offset += LIMITE_POR_PAGINA;
}
  }

/*
 * Primero aparecen los contratos con mayor número de
 * meses transcurridos y, por tanto, con mayor prioridad.
 */
contratosSeguimiento.sort((a, b) => {
  if (b.mesesTranscurridos !== a.mesesTranscurridos) {
    return (
      b.mesesTranscurridos -
      a.mesesTranscurridos
    );
  }

  return (
    new Date(a.fechaTerminacion) -
    new Date(b.fechaTerminacion)
  );
});

return contratosSeguimiento;
};