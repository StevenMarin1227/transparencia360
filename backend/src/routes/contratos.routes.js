import express from "express";
import { leerExcel } from "../services/excelProcessor.js";

const router = express.Router();

router.get("/", (req, res) => {
  const data = leerExcel();

  res.json({
    total: data.length,
    data,
  });
});

router.get("/entidades", (req, res) => {
  const data = leerExcel();

  const entidades = [
    ...new Set(data.map((item) => item.entidad)),
  ].filter(Boolean);

  res.json(entidades);
});

export default router;