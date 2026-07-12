import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

const formatearMoneda = (valor) => {
  return Number(valor || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
};

const formatearFecha = (fecha) => {
  if (!fecha) {
    return "N/A";
  }

  const fechaConvertida = new Date(fecha);

  if (Number.isNaN(fechaConvertida.getTime())) {
    return "N/A";
  }

  return fechaConvertida.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const limpiarNombreArchivo = (texto) => {
  return String(texto || "entidad")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
};

const obtenerColorNivel = (nivel) => {
  const colores = {
    VERDE: [25, 135, 84],
    AMARILLO: [255, 193, 7],
    NARANJA: [253, 126, 20],
    ROJO: [220, 53, 69],
  };

  return colores[nivel] || [108, 117, 125];
};

const agregarEncabezado = (
  doc,
  titulo,
  entidadInfo,
  fechaGeneracion
) => {
  const anchoPagina = doc.internal.pageSize.getWidth();

  doc.setFillColor(25, 135, 84);
  doc.rect(0, 0, anchoPagina, 27, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("Transparencia360", 14, 11);

  doc.setFontSize(12);
  doc.text(titulo, 14, 19);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    `Generado: ${formatearFecha(fechaGeneracion)}`,
    anchoPagina - 14,
    11,
    { align: "right" }
  );

  doc.text(
    entidadInfo?.nombre || "Entidad no disponible",
    anchoPagina - 14,
    19,
    { align: "right" }
  );

  doc.setTextColor(0, 0, 0);
};

const agregarPiePagina = (doc) => {
  const totalPaginas =
    doc.internal.getNumberOfPages();

  for (
    let numeroPagina = 1;
    numeroPagina <= totalPaginas;
    numeroPagina += 1
  ) {
    doc.setPage(numeroPagina);

    const anchoPagina =
      doc.internal.pageSize.getWidth();

    const altoPagina =
      doc.internal.pageSize.getHeight();

    doc.setDrawColor(210, 210, 210);
    doc.line(
      14,
      altoPagina - 12,
      anchoPagina - 14,
      altoPagina - 12
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);

    doc.text(
      "Fuente: SECOP II",
      14,
      altoPagina - 7
    );

    doc.text(
      `Página ${numeroPagina} de ${totalPaginas}`,
      anchoPagina - 14,
      altoPagina - 7,
      { align: "right" }
    );
  }

  doc.setTextColor(0, 0, 0);
};

const dibujarTarjeta = (
  doc,
  x,
  y,
  ancho,
  titulo,
  valor,
  color
) => {
  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(...color);
  doc.setLineWidth(0.8);
  doc.roundedRect(x, y, ancho, 22, 2, 2, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  doc.text(titulo, x + 4, y + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...color);
  doc.text(String(valor), x + 4, y + 17);

  doc.setTextColor(0, 0, 0);
};

const dibujarGraficaBarras = ({
  doc,
  x,
  y,
  ancho,
  alto,
  titulo,
  datos,
  formatearValor = (valor) => String(valor),
}) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(titulo, x, y);

  const graficaY = y + 8;
  const altoUtil = alto - 14;
  const anchoUtil = ancho - 20;

  const valorMaximo = Math.max(
    ...datos.map((item) => item.valor),
    1
  );

  const espacioPorBarra =
    anchoUtil / datos.length;

  const anchoBarra = Math.min(
    18,
    espacioPorBarra * 0.55
  );

  doc.setDrawColor(210, 210, 210);
  doc.line(
    x + 10,
    graficaY + altoUtil,
    x + ancho,
    graficaY + altoUtil
  );

  datos.forEach((item, index) => {
    const alturaBarra =
      (item.valor / valorMaximo) *
      (altoUtil - 13);

    const barraX =
      x +
      13 +
      index * espacioPorBarra;

    const barraY =
      graficaY +
      altoUtil -
      alturaBarra;

    const color =
      item.color ||
      [25, 135, 84];

    doc.setFillColor(...color);
    doc.roundedRect(
      barraX,
      barraY,
      anchoBarra,
      alturaBarra,
      1,
      1,
      "F"
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(40, 40, 40);

    doc.text(
      formatearValor(item.valor),
      barraX + anchoBarra / 2,
      barraY - 2,
      { align: "center" }
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);

    doc.text(
      item.etiqueta,
      barraX + anchoBarra / 2,
      graficaY + altoUtil + 5,
      {
        align: "center",
        maxWidth: espacioPorBarra,
      }
    );
  });

  doc.setTextColor(0, 0, 0);
};

export const generarReporteControlLiquidacion = ({
  entidadInfo,
  contratos,
  resumen,
  fechaConsulta,
}) => {
  if (!Array.isArray(contratos)) {
    throw new Error(
      "La información contractual no es válida."
    );
  }

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const fechaGeneracion = new Date();

  agregarEncabezado(
    doc,
    "Informe gerencial - Control de Liquidación",
    entidadInfo,
    fechaGeneracion
  );

  let posicionY = 35;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(
    "1. Información general de la entidad",
    14,
    posicionY
  );

  posicionY += 7;

  autoTable(doc, {
    startY: posicionY,
    theme: "grid",
    margin: {
      left: 14,
      right: 14,
    },
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [25, 135, 84],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    head: [
      [
        "Nombre de la entidad",
        "NIT",
        "Departamento",
        "Fecha de consulta",
      ],
    ],
    body: [
      [
        entidadInfo?.nombre || "No disponible",
        String(
          entidadInfo?.nit || "No disponible"
        ),
        entidadInfo?.departamento ||
          "No disponible",
        formatearFecha(fechaConsulta),
      ],
    ],
  });

  posicionY = doc.lastAutoTable.finalY + 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(
    "2. Introducción",
    14,
    posicionY
  );

  posicionY += 7;

  const textoIntroduccion =
    "El presente informe presenta un seguimiento preventivo a los contratos que, de acuerdo con la información registrada en SECOP II, se encuentran en estado En ejecución o Modificado y cuya fecha de terminación reportada ya fue superada. La semaforización clasifica los contratos según los meses transcurridos desde su fecha de terminación, con el propósito de apoyar la priorización administrativa, documental y jurídica de las actuaciones relacionadas con su liquidación.";

  const textoAdvertencia =
    "La información y las alertas generadas no determinan por sí solas la obligación de liquidar ni la pérdida de competencia de la entidad. Cada caso requiere la verificación del contrato, sus modificaciones, prórrogas, suspensiones, terminaciones anticipadas, actuaciones posteriores y demás documentos aplicables.";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);

  const lineasIntroduccion =
    doc.splitTextToSize(
      textoIntroduccion,
      268
    );

  doc.text(
    lineasIntroduccion,
    14,
    posicionY
  );

  posicionY +=
    lineasIntroduccion.length * 4.5 + 3;

  doc.setFont("helvetica", "italic");
  doc.setTextColor(110, 80, 0);

  const lineasAdvertencia =
    doc.splitTextToSize(
      textoAdvertencia,
      268
    );

  doc.text(
    lineasAdvertencia,
    14,
    posicionY
  );

  doc.setTextColor(0, 0, 0);

  posicionY +=
    lineasAdvertencia.length * 4.5 + 9;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(
    "3. Resumen ejecutivo",
    14,
    posicionY
  );

  posicionY += 7;

  const anchoTarjeta = 49;
  const separacion = 5;

  dibujarTarjeta(
    doc,
    14,
    posicionY,
    anchoTarjeta,
    "Total contratos",
    resumen?.total || 0,
    [80, 80, 80]
  );

  dibujarTarjeta(
    doc,
    14 + (anchoTarjeta + separacion),
    posicionY,
    anchoTarjeta,
    "Menos de 12 meses",
    resumen?.verde || 0,
    obtenerColorNivel("VERDE")
  );

  dibujarTarjeta(
    doc,
    14 + 2 * (anchoTarjeta + separacion),
    posicionY,
    anchoTarjeta,
    "Entre 12 y 23 meses",
    resumen?.amarillo || 0,
    obtenerColorNivel("AMARILLO")
  );

  dibujarTarjeta(
    doc,
    14 + 3 * (anchoTarjeta + separacion),
    posicionY,
    anchoTarjeta,
    "Entre 24 y 29 meses",
    resumen?.naranja || 0,
    obtenerColorNivel("NARANJA")
  );

  dibujarTarjeta(
    doc,
    14 + 4 * (anchoTarjeta + separacion),
    posicionY,
    anchoTarjeta,
    "30 meses o más",
    resumen?.rojo || 0,
    obtenerColorNivel("ROJO")
  );

  posicionY += 32;

  const niveles = [
    "VERDE",
    "AMARILLO",
    "NARANJA",
    "ROJO",
  ];

  const datosCantidad = niveles.map(
    (nivel) => ({
      etiqueta: nivel,
      valor: contratos.filter(
        (contrato) =>
          contrato.nivelAlerta === nivel
      ).length,
      color: obtenerColorNivel(nivel),
    })
  );

  const datosValor = niveles.map(
    (nivel) => ({
      etiqueta: nivel,
      valor: contratos
        .filter(
          (contrato) =>
            contrato.nivelAlerta === nivel
        )
        .reduce(
          (total, contrato) =>
            total +
            Number(contrato.valor || 0),
          0
        ),
      color: obtenerColorNivel(nivel),
    })
  );

  dibujarGraficaBarras({
    doc,
    x: 14,
    y: posicionY,
    ancho: 128,
    alto: 55,
    titulo:
      "Distribución de contratos por nivel de alerta",
    datos: datosCantidad,
    formatearValor: (valor) =>
      String(valor),
  });

  dibujarGraficaBarras({
    doc,
    x: 154,
    y: posicionY,
    ancho: 128,
    alto: 55,
    titulo:
      "Valor contractual por nivel de alerta",
    datos: datosValor,
    formatearValor: (valor) => {
      if (valor >= 1_000_000_000) {
        return `${(
          valor / 1_000_000_000
        ).toFixed(1)} mil M`;
      }

      if (valor >= 1_000_000) {
        return `${(
          valor / 1_000_000
        ).toFixed(1)} M`;
      }

      return String(valor);
    },
  });

  doc.addPage("a4", "landscape");

  agregarEncabezado(
    doc,
    "Informe gerencial - Control de Liquidación",
    entidadInfo,
    fechaGeneracion
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(
    "4. Detalle de contratos",
    14,
    35
  );

  const filas = contratos.map(
    (contrato, index) => ({
      numero: index + 1,
      contrato:
        contrato.contrato || "N/A",
      contratista:
        contrato.contratista || "N/A",
      estado:
        contrato.estado || "N/A",
      terminacion:
        formatearFecha(
          contrato.fechaTerminacion
        ),
      meses:
        contrato.mesesTranscurridos ?? 0,
      restantes:
        contrato.mesesRestantesPara30 ?? 0,
      alerta:
        contrato.nivelAlerta || "N/A",
      valor:
        formatearMoneda(
          contrato.valor
        ),
      secop:
        contrato.url ? "Abrir" : "N/A",
      url:
        contrato.url || "",
    })
  );

  autoTable(doc, {
    startY: 41,
    margin: {
      top: 31,
      bottom: 17,
      left: 8,
      right: 8,
    },
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 6.5,
      cellPadding: 1.6,
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: {
      fillColor: [33, 37, 41],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    alternateRowStyles: {
      fillColor: [246, 247, 248],
    },
    columns: [
      {
        header: "No.",
        dataKey: "numero",
      },
      {
        header: "Contrato",
        dataKey: "contrato",
      },
      {
        header: "Contratista",
        dataKey: "contratista",
      },
      {
        header: "Estado",
        dataKey: "estado",
      },
      {
        header: "Terminación",
        dataKey: "terminacion",
      },
      {
        header: "Meses",
        dataKey: "meses",
      },
      {
        header: "Restantes",
        dataKey: "restantes",
      },
      {
        header: "Alerta",
        dataKey: "alerta",
      },
      {
        header: "Valor",
        dataKey: "valor",
      },
      {
        header: "SECOP",
        dataKey: "secop",
      },
    ],
    body: filas,
    columnStyles: {
      numero: {
        cellWidth: 9,
        halign: "center",
      },
      contrato: {
        cellWidth: 29,
      },
      contratista: {
        cellWidth: 55,
      },
      estado: {
        cellWidth: 25,
      },
      terminacion: {
        cellWidth: 22,
        halign: "center",
      },
      meses: {
        cellWidth: 13,
        halign: "center",
      },
      restantes: {
        cellWidth: 15,
        halign: "center",
      },
      alerta: {
        cellWidth: 17,
        halign: "center",
      },
      valor: {
        cellWidth: 31,
        halign: "right",
      },
      secop: {
        cellWidth: 17,
        halign: "center",
        textColor: [0, 102, 204],
      },
    },
    didParseCell: (data) => {
      if (
        data.section === "body" &&
        data.column.dataKey === "alerta"
      ) {
        const nivel =
          data.cell.raw || "";

        data.cell.styles.textColor =
          obtenerColorNivel(nivel);

        data.cell.styles.fontStyle =
          "bold";
      }
    },
    didDrawCell: (data) => {
      if (
        data.section !== "body" ||
        data.column.dataKey !== "secop"
      ) {
        return;
      }

      const fila = data.row.raw;

      if (!fila.url) {
        return;
      }

      doc.link(
        data.cell.x,
        data.cell.y,
        data.cell.width,
        data.cell.height,
        {
          url: fila.url,
        }
      );
    },
    didDrawPage: () => {
      if (doc.internal.getCurrentPageInfo().pageNumber > 2) {
        agregarEncabezado(
          doc,
          "Informe gerencial - Control de Liquidación",
          entidadInfo,
          fechaGeneracion
        );
      }
    },
  });

  agregarPiePagina(doc);

  const nombreEntidad =
    limpiarNombreArchivo(
      entidadInfo?.nombre
    );

  const nombreArchivo =
    `control_liquidacion_${nombreEntidad}_${fechaGeneracion
      .toISOString()
      .slice(0, 10)}.pdf`;

  doc.save(nombreArchivo);
};