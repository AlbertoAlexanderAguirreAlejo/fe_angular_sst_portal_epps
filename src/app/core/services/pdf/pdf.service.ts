/* src/app/core/services/pdf/pdf.service.ts */
import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import JSZip from 'jszip';

import { loadImage, formatDateDDMMYY } from '@shared/pdf/common';
import {
  RenderContext,
  TemplateId,
  TemplateRegistry,
  DedicatedTemplate,
} from '@shared/pdf/templates/base.template';
import { renderPagedTable } from '@shared/pdf/table-paged';

export type BundleStrategy =
  | { mode: 'single'; filename?: string } // fuerza PDF único
  | {
      mode: 'bundle';
      bundleName?: string;
      fileNamer?: (key: string, hint?: any) => string;
    } // siempre ZIP
  | {
      mode: 'auto';
      bundleName?: string;
      fileNamer?: (key: string, hint?: any) => string;
    }; // 1 -> PDF, >1 -> ZIP

export interface ExportOptions {
  logoUrl?: string;
  templateConfig?: any; // se pasa directo a la plantilla
  groupBy?: (row: any) => { key: string; hint?: any }; // por defecto: agrupa por nroDoc
  bundle?: BundleStrategy;
}

@Injectable({ providedIn: 'root' })
export class PdfService {
  constructor(private registry: TemplateRegistry) {}

  /** Exporta usando una plantilla registrada. No impone nombres específicos. */
  async export(templateId: TemplateId, rows: any[], options: ExportOptions = {}) {
    if (!rows?.length) throw new Error('No hay datos para exportar');

    const tpl = this.registry.get(templateId);
    if (!tpl) throw new Error(`Plantilla no registrada: ${templateId}`);

    const {
      logoUrl = 'assets/logo.png',
      templateConfig,
      groupBy = (r: any) => ({ key: String(r.nroDoc ?? 'default'), hint: { nombre: r.nombres } }),
      bundle = { mode: 'auto' as const },
    } = options;

    // assets
    let logo: HTMLImageElement | undefined;
    try {
      logo = await loadImage(logoUrl);
    } catch {}

    const ctx: RenderContext = {
      renderPagedTable,
      assets: { logo },
      helpers: tpl.helpers?.(), // deja que la plantilla exponga helpers por defecto (ej. getResponsable)
    };

    // Agrupar
    const groups = rows.reduce<Record<string, { hint?: any; rows: any[] }>>((acc, r) => {
      const g = groupBy(r);
      const bucket = (acc[g.key] ||= { hint: g.hint, rows: [] });
      bucket.rows.push(r);
      return acc;
    }, {});
    const entries = Object.entries(groups);

    // Orden por grupo si la plantilla lo define
    for (const [, g] of entries) tpl.sortGroup?.(g.rows);

    // ¿PDF único o ZIP?
    const auto = bundle.mode === 'auto';
    const willBundle = bundle.mode === 'bundle' || (auto && entries.length > 1);

    if (!willBundle) {
      // PDF único (primer grupo)
      const [key, g] = entries[0];
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4', compress: true });
      tpl.renderDocument(doc, { rows: g.rows, config: templateConfig, hint: g.hint }, ctx);

      const base =
        bundle.mode === 'single' && bundle.filename
          ? bundle.filename
          : tpl.defaultFilename?.(key, g.hint) || `${key}.pdf`;

      doc.save(base.endsWith('.pdf') ? base : base + '.pdf');
      return;
    }

    // ZIP
    const zip = new JSZip();
    for (const [key, g] of entries) {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4', compress: true });
      tpl.renderDocument(doc, { rows: g.rows, config: templateConfig, hint: g.hint }, ctx);

      const filename =
        bundle.fileNamer?.(key, g.hint) ?? tpl.defaultFilename?.(key, g.hint) ?? `${key}.pdf`;

      const pdfArrayBuffer = doc.output('arraybuffer');
      zip.file(filename.endsWith('.pdf') ? filename : filename + '.pdf', pdfArrayBuffer);
    }

    const stamp = formatDateDDMMYY(new Date()).replace(/\//g, '_');
    const zipName = bundle.bundleName ?? tpl.defaultBundleName?.(stamp) ?? `Reportes_${stamp}.zip`;

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(zipBlob);
    a.download = zipName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }
}
