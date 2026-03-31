import xlsx from "xlsx";
import fs from "fs";
import path from "path";

let cache = [];
let ultimaActualizacion = null;

// Normaliza texto
const limpiarTexto = (valor) => {
  if (!valor) return null;
  return String(valor).trim();
};

// Busca valor en múltiples posibles nombres de columna
const obtenerValor = (item, claves) => {
  for (const clave of claves) {
    if (item[clave] && String(item[clave]).trim() !== "") {
      return item[clave];
    }
  }
  return null;
};

export const cargarExcels = () => {
  try {
    console.log("Cargando archivos Excel...");

    const folderPath = path.join(process.cwd(), "data");
    const files = fs.readdirSync(folderPath);

    let dataTotal = [];

    files.forEach((file) => {
      if (!file.endsWith(".xlsx") || file.startsWith("~$")) return;

      const filePath = path.join(folderPath, file);

      const workbook = xlsx.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      const data = xlsx.utils.sheet_to_json(sheet, { defval: "" });

      const limpio = data.map((item) => {
        const entidad = limpiarTexto(
          obtenerValor(item, [
            "Nombre Entidad",
            "Nombre de la Entidad",
            "Entidad",
          ])
        );

        const contrato = limpiarTexto(
          obtenerValor(item, [
            "Referencia del Contrato",
            "Número del Contrato",
          ])
        );

        const contratista = limpiarTexto(
          obtenerValor(item, [
            "Proveedor Adjudicado",
            "Nombre del Contratista",
          ])
        );

        const valor = Number(
          String(
            obtenerValor(item, ["Valor del Contrato", "Valor"]) || "0"
          )
            .replace(/\./g, "")
            .replace(/,/g, "")
        );

        const estado = limpiarTexto(
          obtenerValor(item, ["Estado Contrato", "Estado"])
        );

        const url = limpiarTexto(
          obtenerValor(item, ["URLProceso", "URL Proceso", "URL"])
        );

        return {
          entidad,
          contrato,
          contratista,
          valor: isNaN(valor) ? 0 : valor,
          estado,
          url,
        };
      });

      dataTotal = [...dataTotal, ...limpio];
    });

    cache = dataTotal;
    ultimaActualizacion = new Date();

    console.log(`Registros cargados: ${cache.length}`);
    console.log("Ejemplo registro:", cache[0]); // VALIDACIÓN
  } catch (error) {
    console.error("Error cargando Excel:", error);
  }
};

export const leerExcel = () => cache;
export const getFecha = () => ultimaActualizacion;