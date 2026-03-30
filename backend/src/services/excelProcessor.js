import xlsx from "xlsx";
import path from "path";
import fs from "fs";

export const leerExcel = () => {
  const folderPath = path.join(process.cwd(), "data");
  let registrosTotales = [];

  try {
    const files = fs.readdirSync(folderPath);

    const excelFiles = files.filter((file) => {
      const lower = file.toLowerCase();
      return (
        (lower.endsWith(".xlsx") || lower.endsWith(".xls")) &&
        !lower.startsWith("~$")
      );
    });

    for (const file of excelFiles) {
      try {
        const filePath = path.join(folderPath, file);

        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const data = xlsx.utils.sheet_to_json(sheet);

        const dataLimpia = data.map((item) => ({
          entidad:
            item["Nombre de la Entidad"] ||
            item["Entidad"] ||
            item["Nombre Entidad"] ||
            item["Entidad Compradora"] ||
            "N/A",

          contrato:
            item["Número del Contrato"] ||
            item["No. Contrato"] ||
            item["Contrato"] ||
            item["ID del Contrato"] ||
            "N/A",

          contratista:
            item["Nombre del Contratista"] ||
            item["Contratista"] ||
            item["Proveedor"] ||
            "N/A",

          valor:
            Number(item["Valor del Contrato"]) ||
            Number(item["Valor"]) ||
            Number(item["Valor Total del Contrato"]) ||
            0,

          estado:
            item["Estado del Contrato"] ||
            item["Estado"] ||
            item["Estado del Proceso"] ||
            "N/A",

          archivoFuente: file,
        }));

        registrosTotales = [...registrosTotales, ...dataLimpia];
      } catch (errorArchivo) {
        console.error(`Error procesando el archivo ${file}:`, errorArchivo.message);
      }
    }

    return registrosTotales;
  } catch (error) {
    console.error("Error leyendo la carpeta de archivos Excel:", error);
    return [];
  }
};