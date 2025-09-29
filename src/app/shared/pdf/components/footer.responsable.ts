/* src/app/shared/pdf/components/footer.responsable.ts */
import jsPDF from 'jspdf';
import { FooterComponent } from '@shared/pdf/templates/base.template';
import { PDF_MARGIN } from '@shared/pdf/common';

export interface ResponsableCfg {
  title?: string;
  labels?: { nombre: string; cargo: string };
  col1W?: number;
  col2W?: number;
  minRowH?: number;
}

export const FooterResponsable: FooterComponent<{ config?: { footerCfg?: ResponsableCfg } }> = {
  draw(doc, input, ctx) {
    const responsable = ctx.helpers?.getResponsable
      ? ctx.helpers.getResponsable()
      : { nombre: '', cargo: '' };

    const cfg = input.config?.footerCfg ?? {};
    const { title = 'Responsable del Registro', labels = { nombre: 'Nombre', cargo: 'Cargo' }, col1W = 80, col2W = 300, minRowH = 40 } =
      cfg;

    const margin = PDF_MARGIN;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const rows = 2;
    const tableH = rows * minRowH;
    const startY = pageH - margin - tableH - 16;

    doc.setFont('helvetica', 'bold').setFontSize(11).text(title, margin, startY);

    const totalW = pageW - margin * 2;
    const col3W = totalW - col1W - col2W;

    doc.setLineWidth(0.5);
    doc.rect(margin, startY + 8, col1W, minRowH);
    doc.rect(margin + col1W, startY + 8, col2W, minRowH);
    doc.rect(margin + col1W + col2W, startY + 8, col3W, minRowH * rows);
    doc.rect(margin, startY + 8 + minRowH, col1W, minRowH);
    doc.rect(margin + col1W, startY + 8 + minRowH, col2W, minRowH);

    doc.setFont('helvetica', 'bold').setFontSize(9).text(labels.nombre, margin + 4, startY + 8 + 14);
    doc.setFont('helvetica', 'normal').setFontSize(9).text(responsable.nombre, margin + 4 + col1W, startY + 8 + 14);

    const anyResp = responsable as any;
    if (anyResp.firma) {
      const imgData = anyResp.firma.startsWith('data:') ? anyResp.firma : `data:image/png;base64,${anyResp.firma}`;
      const props = doc.getImageProperties(imgData);
      const maxH = minRowH * rows - 8;
      const maxW = col3W - 8;
      const scale = Math.min(maxH / props.height, maxW / props.width);
      const w = props.width * scale;
      const h = props.height * scale;
      const x = margin + col1W + col2W + (col3W - w) / 2;
      const y = startY + 8 + (minRowH * rows - h) / 2;
      doc.addImage(imgData, 'PNG', x, y, w, h);
    }

    doc.setFont('helvetica', 'bold').setFontSize(9).text(labels.cargo, margin + 4, startY + 8 + minRowH + 14);
    doc.setFont('helvetica', 'normal').setFontSize(9).text(responsable.cargo, margin + 4 + col1W, startY + 8 + minRowH + 14);
  },
};