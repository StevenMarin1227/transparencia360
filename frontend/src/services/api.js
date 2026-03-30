import axios from "axios";

const API = axios.create({
  baseURL: "https://transparencia360.onrender.com/api", //PRODUCCIÓN
});

export const obtenerEntidades = () =>
  API.get("/contratos/entidades");

export const obtenerContratos = (entidad) =>
  API.get(`/contratos?entidad=${encodeURIComponent(entidad)}`);