import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PDF_MARGIN, DEFAULT_SIZES } from './common';

export function renderPagedTable(
  doc: jsPDF,
  opts: {
    head: string[];
    body: any[][];
    percWidths: number[];
    rowsPerPage?: number;
    marginTop: number;
    sigIdx?: number | null;
    leftAlignIdx?: number[];
    onDrawPage?: () => void;
  }
) {
  const {
    head, body, percWidths, marginTop,
    rowsPerPage = 5, sigIdx = null, leftAlignIdx = [], onDrawPage
  } = opts;

  const pageW = doc.internal.pageSize.getWidth();
  const available = pageW - PDF_MARGIN * 2;

  const columnStyles: Record<number, any> = {};
  percWidths.forEach((p, idx) => {
    const w = Math.floor((available * p) / 100);
    columnStyles[idx] = { cellWidth: w, halign: 'center' };
  });
  leftAlignIdx.forEach((i) => { if (columnStyles[i]) columnStyles[i].halign = 'left'; });

  for (let i = 0; i < body.length; i += rowsPerPage) {
    const slice = body.slice(i, i + rowsPerPage);
    if (i > 0) doc.addPage();

    autoTable(doc, {
      head: [head],
      body: slice,
      margin: { top: marginTop, right: PDF_MARGIN, bottom: PDF_MARGIN, left: PDF_MARGIN },
      startY: marginTop,
      tableWidth: available,
      styles: {
        font: 'helvetica',
        fontSize: DEFAULT_SIZES.bodyFont,
        cellPadding: DEFAULT_SIZES.cellPadding,
        overflow: 'linebreak',
        cellWidth: 'wrap',
        halign: 'center',
        valign: 'middle',
        minCellHeight: 28,
      },
      headStyles: {
        fillColor: [0,130,74],
        textColor: 255,
        fontSize: DEFAULT_SIZES.headFont,
        halign: 'center',
        valign: 'middle',
        cellPadding: 4,
      },
      columnStyles,
      showHead: 'everyPage',
      rowPageBreak: 'avoid',

      didParseCell: (data) => {
        if (sigIdx != null && data.section === 'body' && data.column.index === sigIdx) {
          data.cell.text = ['']; // evita que el contenido de firma afecte medición
        }
      },

      didDrawCell: (data) => {
        if (sigIdx != null && data.section === 'body' && data.column.index === sigIdx) {
          const raw = data.cell.raw;
          if (typeof raw !== 'string' || raw.length === 0) return; // ← clave

          const imgData = raw.startsWith('data:') ? raw : `data:image/png;base64,${raw}`;
          try {
            const props = doc.getImageProperties(imgData);
            const maxH = data.cell.height - 6;
            const maxW = data.cell.width - 6;
            const scale = Math.min(maxH / props.height, maxW / props.width);
            const w = props.width * scale, h = props.height * scale;
            const x = data.cell.x + (data.cell.width - w) / 2;
            const y = data.cell.y + (data.cell.height - h) / 2;
            doc.addImage(imgData, 'PNG', x, y, w, h);
          } catch {}
        }
      },

      didDrawPage: () => { if (onDrawPage) onDrawPage(); },
    });
  }
}
