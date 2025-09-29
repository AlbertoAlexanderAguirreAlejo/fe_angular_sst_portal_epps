/* src/app/shared/pdf/components/header.standard.ts */
import jsPDF from 'jspdf';
import { HeaderComponent } from '@shared/pdf/templates/base.template';
import { DEFAULT_SIZES, PDF_MARGIN, PDF_HEADER_H } from '@shared/pdf/common';

export interface HeaderMeta {
  codigo?: string;
  version?: string;
  aprobado?: string;
  fecha?: string;
}

export interface StandardHeaderCfg {
  title?: string;
  subtitle?: string;
  meta?: HeaderMeta;
  col1W?: number;
  col3W?: number;
}

export const HeaderStandard: HeaderComponent<{ config?: { headerCfg?: StandardHeaderCfg } }> = {
  draw(doc, input, ctx) {
    // Espera recibir headerCfg YA fusionado por la plantilla
    const cfg = (input.config?.headerCfg ?? {}) as StandardHeaderCfg;

    const title = cfg.title ?? '';
    const subtitle = cfg.subtitle ?? '';
    const meta = {
      codigo: cfg.meta?.codigo ?? '',
      version: cfg.meta?.version ?? '',
      aprobado: cfg.meta?.aprobado ?? '',
      fecha: cfg.meta?.fecha ?? '',
    };
    const col1W = cfg.col1W ?? 120;
    const col3W = cfg.col3W ?? 150;

    const pageW = doc.internal.pageSize.getWidth();
    const margin = PDF_MARGIN;
    const headerH = PDF_HEADER_H;
    const col2W = pageW - margin * 2 - col1W - col3W;

    doc
      .setLineWidth(0.5)
      .rect(margin, margin, col1W, headerH)
      .rect(margin + col1W, margin, col2W, headerH)
      .rect(margin + col1W + col2W, margin, col3W, headerH);

    // Logo (si llegó en assets)
    const img = ctx.assets?.logo;
    if (img) {
      const maxH = headerH - 4;
      const scale = maxH / img.height;
      const logoW = img.width * scale;
      const logoH = img.height * scale;
      const logoX = margin + (col1W - logoW) / 2;
      const logoY = margin + (headerH - logoH) / 2;
      doc.addImage(img, 'PNG', logoX, logoY, logoW, logoH);
    }

    // Título/Subtítulo
    const centerX = margin + col1W + col2W / 2;
    if (title) {
      doc.setFont('helvetica', 'bold').setFontSize(DEFAULT_SIZES.title)
         .text(title, centerX, margin + 20, { align: 'center' });
    }
    if (subtitle) {
      doc.setFont('helvetica', 'normal').setFontSize(DEFAULT_SIZES.subtitle)
         .text(subtitle, centerX, margin + 40, { align: 'center' });
    }

    // Meta
    const dataX = margin + col1W + col2W + 6;
    doc.setFont('helvetica', 'normal').setFontSize(8)
      .text(`Código  : ${meta.codigo}`,  dataX, margin + 10)
      .text(`Versión : ${meta.version}`, dataX, margin + 24)
      .text(`Aprobado: ${meta.aprobado}`,dataX, margin + 38)
      .text(`Fecha   : ${meta.fecha}`,   dataX, margin + 52);
  },
};
