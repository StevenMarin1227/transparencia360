const BASE_URL = process.env.DATOS_GOV_BASE_URL;
const TOKEN = process.env.DATOS_GOV_TOKEN;
const DEPARTAMENTO =
  process.env.DEPARTAMENTO || "Antioquia";

const LIMITE_POR_PAGINA = 50000;

/**
 * Valida las variables requeridas para consultar Datos Abiertos.
 */
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

/**
 * Realiza una consulta GET a Datos Abiertos Colombia.
 */
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

/**
 * Extrae la URL del proceso, tanto si llega como objeto
 * como si llega directamente como texto.
 */
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

/**
 * Convierte un valor en fecha válida.
 */
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

/**
 * Retorna una fecha a las 00:00:00 para evitar diferencias
 * ocasionadas por las horas.
 */
const normalizarFechaAlInicioDelDia = (fecha) => {
  const fechaNormalizada = new Date(fecha);

  fechaNormalizada.setHours(0, 0, 0, 0);

  return fechaNormalizada;
};

/**
 * Calcula los días naturales restantes entre hoy y la fecha
 * de terminación.
 *
 * - Si termina hoy, retorna 0.
 * - Si terminó ayer, retorna -1.
 * - Si termina mañana, retorna 1.
 */
const calcularDiasRestantes = (
  fechaTerminacion,
  fechaActual = new Date()
) => {
  const fechaFin = convertirFecha(fechaTerminacion);

  if (!fechaFin) {
    return null;
  }

  const inicioHoy =
    normalizarFechaAlInicioDelDia(fechaActual);

  const inicioFechaFin =
    normalizarFechaAlInicioDelDia(fechaFin);

  const milisegundosPorDia =
    1000 * 60 * 60 * 24;

  return Math.round(
    (inicioFechaFin.getTime() - inicioHoy.getTime()) /
      milisegundosPorDia
  );
};

/**
 * Calcula los meses completos transcurridos desde una fecha.
 */
const calcularMesesTranscurridos = (
  fechaTerminacion,
  fechaActual = new Date()
) => {
  const fechaFin = convertirFecha(fechaTerminacion);

  if (!fechaFin || fechaFin > fechaActual) {
    return 0;
  }

  let meses =
    (fechaActual.getFullYear() -
      fechaFin.getFullYear()) *
      12 +
    (fechaActual.getMonth() -
      fechaFin.getMonth());

  if (fechaActual.getDate() < fechaFin.getDate()) {
    meses -= 1;
  }

  return Math.max(meses, 0);
};

/**
 * Suma meses a una fecha.
 */
const sumarMeses = (fechaOriginal, cantidadMeses) => {
  const fecha = convertirFecha(fechaOriginal);

  if (!fecha) {
    return null;
  }

  const resultado = new Date(fecha);

  resultado.setMonth(
    resultado.getMonth() + cantidadMeses
  );

  return resultado;
};

/**
 * Normaliza el estado para comparar mayúsculas, minúsculas
 * y acentos.
 */
const normalizarEstado = (estado) => {
  return String(estado || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

/**
 * Verifica si el contrato tiene un estado relevante
 * para los módulos preventivos.
 */
const esEstadoDeSeguimiento = (estado) => {
  const estadoNormalizado =
    normalizarEstado(estado);

  return (
    estadoNormalizado === "en ejecucion" ||
    estadoNormalizado === "modificado"
  );
};

/**
 * Asigna semaforización para control de liquidación.
 */
const asignarSemaforizacionLiquidacion = (
  mesesTranscurridos
) => {
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

/**
 * Asigna semaforización según los días restantes
 * para la terminación contractual.
 */
const asignarSemaforizacionVencimiento = (
  diasRestantes
) => {
  if (diasRestantes >= 0 && diasRestantes <= 3) {
    return {
      nivelAlerta: "ROJO",
      descripcionAlerta:
        diasRestantes === 0
          ? "El contrato termina hoy."
          : "Vencimiento inminente. Requiere atención inmediata.",
      prioridad: 3,
    };
  }

  if (diasRestantes >= 4 && diasRestantes <= 8) {
    return {
      nivelAlerta: "NARANJA",
      descripcionAlerta:
        "Atención prioritaria. El contrato se encuentra próximo a terminar.",
      prioridad: 2,
    };
  }

  if (diasRestantes >= 9 && diasRestantes <= 15) {
    return {
      nivelAlerta: "AMARILLO",
      descripcionAlerta:
        "Seguimiento preventivo. El contrato termina dentro de los próximos 15 días.",
      prioridad: 1,
    };
  }

  return null;
};

/**
 * Modelo general de contrato enviado al frontend.
 */
const normalizarContrato = (item) => ({
  entidad: item.nombre_entidad || "N/A",
  nitEntidad: item.nit_entidad || "N/A",
  departamento: item.departamento || "N/A",

  contrato:
    item.referencia_del_contrato || "N/A",

  objeto:
    item.descripcion_del_proceso || "N/A",

  contratista:
    item.proveedor_adjudicado || "N/A",

  documentoContratista:
    item.documento_proveedor || "N/A",

  valor:
    Number(item.valor_del_contrato || 0),

  estado:
    item.estado_contrato || "N/A",

  fechaInicio:
    item.fecha_de_inicio_del_contrato || null,

  fechaTerminacion:
    item.fecha_de_fin_del_contrato || null,

  url: obtenerUrlProceso(item.urlproceso),
});

/**
 * Obtiene las entidades de Antioquia.
 */
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
    .sort((a, b) =>
      a.localeCompare(b, "es")
    );
};

/**
 * Obtiene todos los contratos de una entidad, utilizando
 * paginación mediante limit y offset.
 */
export const obtenerContratosPorEntidad = async (
  entidad
) => {
  if (!entidad || !entidad.trim()) {
    throw new Error(
      "La entidad es obligatoria"
    );
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

/**
 * Obtiene contratos cuya fecha de terminación ya pasó,
 * para el módulo Control de Liquidación.
 */
export const obtenerSeguimientoLiquidacion = async (
  entidad
) => {
  if (!entidad || !entidad.trim()) {
    throw new Error(
      "La entidad es obligatoria"
    );
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
        "descripcion_del_proceso",
        "proveedor_adjudicado",
        "documento_proveedor",
        "valor_del_contrato",
        "estado_contrato",
        "fecha_de_inicio_del_contrato",
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
      if (
        !esEstadoDeSeguimiento(
          item.estado_contrato
        )
      ) {
        continue;
      }

      const fechaTerminacion =
        convertirFecha(
          item.fecha_de_fin_del_contrato
        );

      if (
        !fechaTerminacion ||
        normalizarFechaAlInicioDelDia(
          fechaTerminacion
        ) >
          normalizarFechaAlInicioDelDia(
            fechaActual
          )
      ) {
        continue;
      }

      const mesesTranscurridos =
        calcularMesesTranscurridos(
          fechaTerminacion,
          fechaActual
        );

      const fechaLimite30Meses =
        sumarMeses(fechaTerminacion, 30);

      const mesesRestantesPara30 =
        Math.max(
          30 - mesesTranscurridos,
          0
        );

      const semaforizacion =
        asignarSemaforizacionLiquidacion(
          mesesTranscurridos
        );

      contratosSeguimiento.push({
        ...normalizarContrato(item),

        fechaTerminacion:
          fechaTerminacion.toISOString(),

        mesesTranscurridos,

        mesesRestantesPara30,

        fechaLimite30Meses:
          fechaLimite30Meses
            ? fechaLimite30Meses.toISOString()
            : null,

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

  contratosSeguimiento.sort((a, b) => {
    if (
      b.mesesTranscurridos !==
      a.mesesTranscurridos
    ) {
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

/**
 * Obtiene contratos que terminarán en los próximos
 * 15 días para el módulo Vencimientos Contractuales.
 */
export const obtenerVencimientosContractuales =
  async (entidad) => {
    if (!entidad || !entidad.trim()) {
      throw new Error(
        "La entidad es obligatoria"
      );
    }

    const fechaActual = new Date();
    const contratosProximosAVencer = [];

    let offset = 0;
    let continuar = true;

    while (continuar) {
      const data =
        await consultarDatosAbiertos({
          "$select": [
            "nombre_entidad",
            "nit_entidad",
            "departamento",
            "referencia_del_contrato",
            "descripcion_del_proceso",
            "proveedor_adjudicado",
            "documento_proveedor",
            "valor_del_contrato",
            "estado_contrato",
            "fecha_de_inicio_del_contrato",
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
        if (
          !esEstadoDeSeguimiento(
            item.estado_contrato
          )
        ) {
          continue;
        }

        const fechaInicio =
          convertirFecha(
            item.fecha_de_inicio_del_contrato
          );

        const fechaTerminacion =
          convertirFecha(
            item.fecha_de_fin_del_contrato
          );

        if (!fechaTerminacion) {
          continue;
        }

        const diasRestantes =
          calcularDiasRestantes(
            fechaTerminacion,
            fechaActual
          );

        /*
         * Solo se incluyen contratos que:
         * - todavía no han vencido;
         * - terminan hoy o dentro de los próximos 15 días.
         */
        if (
          diasRestantes === null ||
          diasRestantes < 0 ||
          diasRestantes > 15
        ) {
          continue;
        }

        const semaforizacion =
          asignarSemaforizacionVencimiento(
            diasRestantes
          );

        if (!semaforizacion) {
          continue;
        }

        contratosProximosAVencer.push({
          ...normalizarContrato(item),

          fechaInicio: fechaInicio
            ? fechaInicio.toISOString()
            : null,

          fechaTerminacion:
            fechaTerminacion.toISOString(),

          diasRestantes,

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
     * Primero aparecen los contratos que vencen antes.
     * Si varios tienen los mismos días restantes, se
     * ordenan por fecha de terminación.
     */
    contratosProximosAVencer.sort(
      (a, b) => {
        if (
          a.diasRestantes !==
          b.diasRestantes
        ) {
          return (
            a.diasRestantes -
            b.diasRestantes
          );
        }

        return (
          new Date(a.fechaTerminacion) -
          new Date(b.fechaTerminacion)
        );
      }
    );

    return contratosProximosAVencer;
  };