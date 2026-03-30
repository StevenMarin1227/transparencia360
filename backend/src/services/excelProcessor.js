import xlsx from "xlsx";
import fs from "fs";
import path from "path";

let cache = [];
let ultimaActualizacion = null;

export const cargarExcels = () => {
  try {
    console.log("Cargando Excel UNA SOLA VEZ...");

    const folderPath = path.join(process.cwd(), "data");
    const files = fs.readdirSync(folderPath);

    let dataTotal = [];

    files.forEach((file) => {
      if (!file.endsWith(".xlsx")) return;

      const filePath = path.join(folderPath, file);

      const workbook = xlsx.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      const data = xlsx.utils.sheet_to_json(sheet);

      const limpio = data.map((item) => ({
        entidad: item["Nombre de la Entidad"] || "N/A",
        contrato: item["Referencia del Contrato"] || "N/A",
        contratista: item["Proveedor Adjudicado"] || "N/A",
        valor: Number(item["Valor del Contrato"]) || 0,
        estado: item["Estado Contrato"] || "N/A",
      }));

      dataTotal = [...dataTotal, ...limpio];
    });

    cache = dataTotal;
    ultimaActualizacion = new Date();

    console.log(`🔥 ${cache.length} registros cargados`);
  } catch (error) {
    console.error("Error cargando Excel:", error);
  }
};

export const leerExcel = () => cache;

export const getFecha = () => ultimaActualizacion;