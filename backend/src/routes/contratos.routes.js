import express from "express";
import {
  obtenerEntidadesAntioquia,
  obtenerContratosPorEntidad,
} from "../services/datosGovService.js";

const router = express.Router();

router.get("/entidades", async (req, res) => {
  try {
    const entidades = await obtenerEntidadesAntioquia();
    res.json(entidades);
  } catch (error) {
    console.error("Error en /entidades:", error.message);

    res.status(500).json({
      error: "Error obteniendo entidades",
      detalle: error.message,
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const { entidad } = req.query;

    const contratos = await obtenerContratosPorEntidad(entidad);

    res.json({
      total: contratos.length,
      fechaActualizacion: new Date(),
      data: contratos,
    });
  } catch (error) {
    console.error("Error en /contratos:", error.message);

    res.status(500).json({
      error: "Error obteniendo contratos",
      detalle: error.message,
    });
  }
});

export default router;