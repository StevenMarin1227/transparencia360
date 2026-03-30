import express from "express";
import cors from "cors";
import contratosRoutes from "./src/routes/contratos.routes.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use("/api/contratos", contratosRoutes);

app.get("/", (req, res) => {
  res.send("Backend de Transparencia360 funcionando");
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});