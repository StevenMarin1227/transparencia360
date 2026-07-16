import express from "express";

import {
  obtenerContratosPorEntidad,
  obtenerEntidadesAntioquia,
  obtenerSeguimientoLiquidacion,
  obtenerVencimientosContractuales,
} from "../services/datosGovService.js";

const router = express.Router();

/**
 * Evita que el navegador, Render o un proxy reutilicen
 * respuestas contractuales antiguas.
 */
const desactivarCache = (res) => {
  res.set({
    "Cache-Control":
      "no-store, no-cache, must-revalidate, proxy-revalidate",

    "CDN-Cache-Control": "no-store",

    Pragma: "no-cache",
    Expires: "0",

    "Surrogate-Control": "no-store",
  });
};

/**
 * GET /api/contratos/entidades
 *
 * Lista las entidades disponibles para Antioquia.
 */
router.get("/entidades", async (req, res) => {
  try {
    desactivarCache(res);

    const entidades =
      await obtenerEntidadesAntioquia();

    return res.status(200).json({
      total: entidades.length,
      fechaConsulta: new Date().toISOString(),
      data: entidades,
    });
  } catch (error) {
    console.error(
      "Error consultando entidades:",
      error
    );

    return res.status(500).json({
      error:
        "No fue posible consultar las entidades",
      detalle: error.message,
    });
  }
});

/**
 * GET /api/contratos/seguimiento-liquidacion
 *
 * Control preventivo de contratos cuya fecha de
 * terminación ya pasó.
 */
router.get(
  "/seguimiento-liquidacion",
  async (req, res) => {
    try {
      desactivarCache(res);

      const entidad = String(
        req.query.entidad || ""
      ).trim();

      if (!entidad) {
        return res.status(400).json({
          error:
            "Debe indicar una entidad",
        });
      }

      const contratos =
        await obtenerSeguimientoLiquidacion(
          entidad
        );

      const resumen = contratos.reduce(
        (acumulado, contrato) => {
          acumulado.total += 1;

          if (
            contrato.nivelAlerta === "VERDE"
          ) {
            acumulado.verde += 1;
          }

          if (
            contrato.nivelAlerta ===
            "AMARILLO"
          ) {
            acumulado.amarillo += 1;
          }

          if (
            contrato.nivelAlerta ===
            "NARANJA"
          ) {
            acumulado.naranja += 1;
          }

          if (
            contrato.nivelAlerta === "ROJO"
          ) {
            acumulado.rojo += 1;
          }

          return acumulado;
        },
        {
          total: 0,
          verde: 0,
          amarillo: 0,
          naranja: 0,
          rojo: 0,
        }
      );

      const primerContrato =
        contratos[0] || null;

      const entidadInfo = {
        nombre:
          primerContrato?.entidad ||
          entidad,

        nit:
          primerContrato?.nitEntidad ||
          "No disponible",

        departamento:
          primerContrato?.departamento ||
          DEPARTAMENTO ||
          "No disponible",
      };

      return res.status(200).json({
        entidad,
        entidadInfo,
        fechaConsulta:
          new Date().toISOString(),
        resumen,
        data: contratos,
      });
    } catch (error) {
      console.error(
        "Error en seguimiento de liquidación:",
        error
      );

      return res.status(500).json({
        error:
          "No fue posible consultar el seguimiento de liquidación",
        detalle: error.message,
      });
    }
  }
);

/**
 * GET /api/contratos/vencimientos
 *
 * Lista contratos que terminan hoy o durante los
 * próximos 15 días.
 */
router.get(
  "/vencimientos",
  async (req, res) => {
    try {
      desactivarCache(res);

      const entidad = String(
        req.query.entidad || ""
      ).trim();

      if (!entidad) {
        return res.status(400).json({
          error:
            "Debe indicar una entidad",
        });
      }

      const contratos =
        await obtenerVencimientosContractuales(
          entidad
        );

      const resumen = contratos.reduce(
        (acumulado, contrato) => {
          acumulado.total += 1;

          if (
            contrato.nivelAlerta === "ROJO"
          ) {
            acumulado.rojo += 1;
          }

          if (
            contrato.nivelAlerta ===
            "NARANJA"
          ) {
            acumulado.naranja += 1;
          }

          if (
            contrato.nivelAlerta ===
            "AMARILLO"
          ) {
            acumulado.amarillo += 1;
          }

          return acumulado;
        },
        {
          total: 0,
          rojo: 0,
          naranja: 0,
          amarillo: 0,
        }
      );

      const primerContrato =
        contratos[0] || null;

      const entidadInfo = {
        nombre:
          primerContrato?.entidad ||
          entidad,

        nit:
          primerContrato?.nitEntidad ||
          "No disponible",

        departamento:
          primerContrato?.departamento ||
          process.env.DEPARTAMENTO ||
          "No disponible",
      };

      return res.status(200).json({
        entidad,
        entidadInfo,

        rangoConsulta: {
          desdeDias: 0,
          hastaDias: 15,
        },

        fechaConsulta:
          new Date().toISOString(),

        resumen,

        data: contratos,
      });
    } catch (error) {
      console.error(
        "Error consultando vencimientos contractuales:",
        error
      );

      return res.status(500).json({
        error:
          "No fue posible consultar los vencimientos contractuales",
        detalle: error.message,
      });
    }
  }
);

/**
 * GET /api/contratos
 *
 * Obtiene todos los contratos de una entidad.
 *
 * Esta ruta debe declararse después de las rutas
 * específicas para evitar conflictos.
 */
router.get("/", async (req, res) => {
  try {
    desactivarCache(res);

    const entidad = String(
      req.query.entidad || ""
    ).trim();

    if (!entidad) {
      return res.status(400).json({
        error:
          "Debe indicar una entidad",
      });
    }

    const contratos =
      await obtenerContratosPorEntidad(
        entidad
      );

    return res.status(200).json({
      entidad,
      total: contratos.length,

      fechaConsulta:
        new Date().toISOString(),

      data: contratos,
    });
  } catch (error) {
    console.error(
      "Error consultando contratos:",
      error
    );

    return res.status(500).json({
      error:
        "No fue posible consultar la información contractual",
      detalle: error.message,
    });
  }
});

export default router;