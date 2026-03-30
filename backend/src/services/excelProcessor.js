import xlsx from "xlsx";
import path from "path";

export const leerExcel = () => {
  try {
    const filePath = path.join(
      process.cwd(),
      "data",
      "SECOP_II_-_Contratos_Electrónicos_20260329.xlsx"
    );

    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const data = xlsx.utils.sheet_to_json(sheet);

    // 🔥 NORMALIZACIÓN (CLAVE)
    const dataLimpia = data.map((item) => ({
      entidad:
        item["Nombre de la Entidad"] ||
        item["Entidad"] ||
        item["Nombre Entidad"] ||
        "N/A",

      contrato:
        item["Referencia del Contrato"] ||
        item["No. Contrato"] ||
        item["Contrato"] ||
        "N/A",

      contratista:
        item["Proveedor Adjudicado"] ||
        item["Contratista"] ||
        "N/A",

      valor:
        Number(item["Valor del Contrato"]) ||
        Number(item["Valor"]) ||
        0,

      estado:
        item["Estado Contrato"] ||
        item["Estado"] ||
        "N/A",
    }));

    return dataLimpia;
  } catch (error) {
    console.error("Error leyendo Excel:", error);
    return [];
  }
};