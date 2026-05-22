const BASE_URL = "http://localhost:3001/api";

const request = async (endpoint) => {
  const response = await fetch(`${BASE_URL}${endpoint}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  return response.json();
};

export const obtenerEntidades = () => {
  return request("/contratos/entidades");
};

export const obtenerContratos = (entidad) => {
  return request(`/contratos?entidad=${encodeURIComponent(entidad)}`);
};