import "dotenv/config";
import express from "express";
import cors from "cors";
import contratosRoutes from "./src/routes/contratos.routes.js"

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api/contratos", contratosRoutes);

app.get("/", (req, res) => {
  res.send("Backend Transparencia360 - Visor Contractual funcionando");
})

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});