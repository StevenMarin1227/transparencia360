const BASE_URL = import.meta.env.VITE_API_URL;

const request = async (endpoint) => {
  if (!BASE_URL) {
    throw new Error(
      "No está configurada la variable VITE_API_URL"
    );
  }

  const response = await fetch(
    `${BASE_URL}${endpoint}`,
    {
      method: "GET",

      // No reutilizar respuestas guardadas por el navegador.
      cache: "no-store",

      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    }
  );

  if (!response.ok) {
    const detalle = await response.text();

    throw new Error(
      `Error HTTP ${response.status}: ${detalle}`
    );
  }

  return response.json();
};

export const obtenerEntidades = async () => {
  const respuesta = await request(
    "/contratos/entidades"
  );

  return respuesta.data || [];
};

export const obtenerContratos = async (entidad) => {
  return request(
    `/contratos?entidad=${encodeURIComponent(entidad)}`
  );
};