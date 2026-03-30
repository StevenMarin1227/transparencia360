import express from "express";
import { leerExcel } from "../services/excelProcessor.js";

const router = express.Router();

router.get("/", (req, res) => {
  try {
    const data = leerExcel();

    res.json({
      total: data.length,
      fechaActualizacion: new Date(),
      data: data, //Lectura del archivo de la matriz en excel
    });
  } catch (error) {
    res.status(500).json({
      error: "Error leyendo el Excel",
    });
  }
});

export default router;