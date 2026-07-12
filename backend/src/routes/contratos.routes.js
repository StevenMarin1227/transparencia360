import express from "express";
import {
  obtenerContratosPorEntidad,
  obtenerEntidadesAntioquia,
} from "../services/datosGovService.js";

const router = express.Router();

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

router.get("/entidades", async (req, res) => {
  try {
    desactivarCache(res);

    const entidades =
      await obtenerEntidadesAntioquia();

    res.status(200).json({
      total: entidades.length,
      fechaConsulta: new Date().toISOString(),
      data: entidades,
    });
  } catch (error) {
    console.error(
      "Error consultando entidades:",
      error.message
    );

    res.status(500).json({
      error: "No fue posible consultar las entidades",
      detalle: error.message,
    });
  }
});

router.get("/", async (req, res) => {
  try {
    desactivarCache(res);

    const entidad = String(
      req.query.entidad || ""
    ).trim();

    if (!entidad) {
      return res.status(400).json({
        error: "Debe indicar una entidad",
      });
    }

    const contratos =
      await obtenerContratosPorEntidad(entidad);

    return res.status(200).json({
      entidad,
      total: contratos.length,

      // Esta fecha permite verificar que el backend
      // hizo una nueva consulta.
      fechaConsulta: new Date().toISOString(),

      data: contratos,
    });
  } catch (error) {
    console.error(
      "Error consultando contratos:",
      error.message
    );

    return res.status(500).json({
      error:
        "No fue posible consultar la información contractual",
      detalle: error.message,
    });
  }
});

export default router;