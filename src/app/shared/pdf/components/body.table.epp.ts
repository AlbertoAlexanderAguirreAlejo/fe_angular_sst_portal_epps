/* src/app/shared/pdf/components/body.table.epp.ts */
import jsPDF from 'jspdf';
import { BodyComponent } from '@shared/pdf/templates/base.template';
import { PDF_MARGIN, PDF_HEADER_H, PDF_GAP, SUB_CELL_H } from '@shared/pdf/common';

export interface TableEppCfg {
  percWidths?: number[];
  rowsPerPage?: number;
  tableTopSpacer?: number;
}

function mapToHeadersAndBody(
  rows: any[],
  formatFecha?: (v: any, tz?: string) => string | undefined
) {
  const headers = [
    'Cantidad (UM)',
    'EPP (Equipo)',
    '1°Entrega',
    'Deterioro',
    'Pérdida',
    'Fecha de Entrega',
    'Firma',
  ];
  const body = rows.map((row) => [
    `${row.cantidad} (${row.um || row.descUm || ''})`,
    row.descEquipo ?? '',
    row.flagPrimeraEntrega === '1' && row.flagPerdida !== '1' ? 'X' : '',
    row.flagPrimeraEntrega === '0' && row.flagPerdida !== '1' ? 'X' : '',
    row.flagPerdida === '1' ? 'X' : '',
    formatFecha ? formatFecha(row.fechaEntrega, 'UTC') || '' : String(row.fechaEntrega ?? ''),
    row.firma,
  ]);
  return { headers, body, sigIdx: 6, eppIdx: 1 };
}

/** Body tabular reutilizable con paginado y hooks por página (slots). */
export const BodyTableEpp: BodyComponent<{
  rows: any[];
  config?: { table?: TableEppCfg; formatFecha?: any };
}> = {
  draw(doc, input, ctx) {
    const rows = input.rows || [];
    const cfg = input.config?.table || {};

    const ROWS_PER_PAGE = cfg.rowsPerPage ?? 8;
    const PERC_WIDTHS = cfg.percWidths ?? [9, 38, 9, 9, 9, 18, 8];
    const TABLE_TOP_SPACER = cfg.tableTopSpacer ?? 20;

    const marginTop = PDF_MARGIN + PDF_HEADER_H + PDF_GAP + SUB_CELL_H * 2 + TABLE_TOP_SPACER;

    const { headers, body, sigIdx, eppIdx } = mapToHeadersAndBody(
      rows,
      input.config?.formatFecha || ctx.helpers?.formatFecha
    );

    ctx.renderPagedTable(doc, {
      head: headers,
      body,
      percWidths: PERC_WIDTHS,
      rowsPerPage: ROWS_PER_PAGE,
      marginTop,
      sigIdx,
      leftAlignIdx: [eppIdx],
      onDrawPage: () => {
        // Slots por página
        ctx.__slots?.header?.draw(doc, input, ctx);
        ctx.__slots?.subheader?.draw(doc, input, ctx);
        ctx.__slots?.footer?.draw(doc, input, ctx);
      },
    });

    // numeración
    const pageCount = doc.getNumberOfPages();
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFont('helvetica', 'normal').setFontSize(8);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i).text(`Página ${i} de ${pageCount}`, pageW - 40, pageH - 10, { align: 'right' });
    }
  },
};