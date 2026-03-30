import axios from "axios";

const API = axios.create({
  baseURL: "https://transparencia360.onrender.com",
});

export const obtenerContratos = () => API.get("/contratos");