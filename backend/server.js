import express from "express";
import cors from "cors";
import contratosRoutes from "./src/routes/contratos.routes.js";
import { cargarExcels } from "./src/services/excelProcessor.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api/contratos", contratosRoutes);

app.get("/", (req, res) => {
  res.send("Backend de Transparencia360 funcionando");
});

cargarExcels();

setInterval(() => {
  console.log("Actualizando datos en memoria...");
  cargarExcels();
}, 5 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});