/* src/app/shared/pdf/components/subheader.person.ts */
import { SubHeaderComponent } from '@shared/pdf/templates/base.template';
import { PDF_MARGIN, PDF_HEADER_H, PDF_GAP, SUB_CELL_H } from '@shared/pdf/common';

export const SubHeaderPerson: SubHeaderComponent<{ rows: any[] }> = {
  draw(doc, input) {
    const row = input.rows?.[0] || {};
    const pageW = doc.internal.pageSize.getWidth();
    const margin = PDF_MARGIN;
    const headerH = PDF_HEADER_H;
    const gap = PDF_GAP;
    const y0 = margin + headerH + gap;
    const cellH = SUB_CELL_H;
    const totalW = pageW - margin * 2;
    const halfW = totalW / 2;

    doc
      .setLineWidth(0.5)
      .rect(margin, y0, halfW, cellH)
      .rect(margin + halfW, y0, halfW, cellH)
      .rect(margin, y0 + cellH, halfW, cellH)
      .rect(margin + halfW, y0 + cellH, halfW, cellH);

    doc.setFont('helvetica', 'normal').setFontSize(9);
    doc.text(`Apellidos y Nombres: ${row?.nombres || ''}`, margin + 4, y0 + 14);
    doc.text(`DNI: ${row?.nroDoc || ''}`, margin + halfW + 4, y0 + 14);
    doc.text(`Gerencia: ${row?.descSeccion || ''}`, margin + 4, y0 + cellH + 14);
    doc.text(`Área: ${row?.descArea || ''}`, margin + halfW + 4, y0 + cellH + 14);
  },
};
