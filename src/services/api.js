import axios from "axios";

const API = axios.create({
  baseURL: "https://transparencia360.onrender.com/api", 
});

export const obtenerContratos = (entidad) =>
  API.get(`/contratos?entidad=${entidad}`);

export const obtenerEntidades = () =>
  API.get("/contratos/entidades");