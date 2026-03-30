import express from "express";
import { leerExcel } from "../services/excelProcessor.js";

const router = express.Router();

/**
 *OBTENER ENTIDADES
 */
router.get("/entidades", (req, res) => {
  try {
    const data = leerExcel();

    // Extraer entidades únicas
    const entidades = [
      ...new Set(
        data.map((item) => item.entidad)
      ),
    ].filter(Boolean); // elimina null/undefined

    // Ordenar alfabéticamente
    entidades.sort((a, b) => a.localeCompare(b));

    res.json(entidades);
  } catch (error) {
    console.error("Error obteniendo entidades:", error);

    res.status(500).json({
      error: "Error obteniendo entidades",
    });
  }
});

/**
 *OBTENER CONTRATOS (CON FILTRO POR ENTIDAD)
 */
router.get("/", (req, res) => {
  try {
    const { entidad } = req.query;

    const data = leerExcel();

    let dataFiltrada = data;

    if (entidad) {
      dataFiltrada = data.filter((item) =>
        (item.entidad || "")
          .toLowerCase()
          .includes(entidad.toLowerCase())
      );
    }

    res.json({
      total: dataFiltrada.length,
      fechaActualizacion: new Date(),
      data: dataFiltrada,
    });
  } catch (error) {
    console.error("Error obteniendo contratos:", error);

    res.status(500).json({
      error: "Error leyendo los archivos Excel",
    });
  }
});

export default router;