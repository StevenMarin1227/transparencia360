import express from "express";
import { leerExcel, getFecha } from "../services/excelProcessor.js";

const router = express.Router();

// 🔥 ENTIDADES
router.get("/entidades", (req, res) => {
  try {
    const data = leerExcel();

    const entidades = [
      ...new Set(
        data
          .map((item) => item.entidad)
          .filter((e) => e && e.trim() !== "")
      ),
    ].sort((a, b) => a.localeCompare(b));

    res.json(entidades);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo entidades" });
  }
});

// 🔥 CONTRATOS
router.get("/", (req, res) => {
  try {
    const { entidad } = req.query;

    let data = leerExcel();

    if (entidad) {
      data = data.filter((c) =>
        (c.entidad || "")
          .toLowerCase()
          .includes(entidad.toLowerCase())
      );
    }

    res.json({
      total: data.length,
      fechaActualizacion: getFecha(),
      data,
    });
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo contratos" });
  }
});

export default router;