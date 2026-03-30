import axios from "axios";

const API = axios.create({
  baseURL: "https://transparencia360.onrender.com/api",
});

export const obtenerContratos = () => API.get("/contratos");