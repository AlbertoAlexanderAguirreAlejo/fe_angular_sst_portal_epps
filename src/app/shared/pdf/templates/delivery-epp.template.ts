/* src/app/shared/pdf/templates/delivery-epp.template.ts */
import jsPDF from 'jspdf';
import { BaseTemplate, TemplateInput, RenderContext } from './base.template';
import { HeaderStandard, StandardHeaderCfg, HeaderMeta } from '@shared/pdf/components/header.standard';
import { SubHeaderPerson } from '@shared/pdf/components/subheader.person';
import { FooterResponsable } from '@shared/pdf/components/footer.responsable';
import { BodyTableEpp } from '@shared/pdf/components/body.table.epp';

const DEFAULT_META: Required<HeaderMeta> = {
  codigo: 'SST -R-004',
  version: '04',
  aprobado: 'JSST',
  fecha: '30/11/23',
};

const DEFAULT_HEADER: StandardHeaderCfg = {
  title: 'REGISTRO',
  subtitle: 'Entrega de EPP',
  meta: DEFAULT_META,
  col1W: 120,
  col3W: 150,
};

// Deep merge mínimo y tipado para headerCfg.meta
function mergeHeaderCfg(base: StandardHeaderCfg, override?: StandardHeaderCfg): StandardHeaderCfg {
  const res: StandardHeaderCfg = { ...base, ...(override ?? {}) };

  const baseMeta: HeaderMeta = base.meta ?? {};
  const ovMeta: HeaderMeta = override?.meta ?? {};

  res.meta = {
    codigo: ovMeta.codigo ?? baseMeta.codigo ?? '',
    version: ovMeta.version ?? baseMeta.version ?? '',
    aprobado: ovMeta.aprobado ?? baseMeta.aprobado ?? '',
    fecha: ovMeta.fecha ?? baseMeta.fecha ?? '',
  };

  // cols (por si override sólo trae uno)
  res.col1W = override?.col1W ?? base.col1W;
  res.col3W = override?.col3W ?? base.col3W;

  return res;
}

export class DeliveryEppTemplate extends BaseTemplate<TemplateInput> {
  id = 'delivery-epp' as const;

  constructor() {
    super();
    this.header = HeaderStandard;
    this.subheader = SubHeaderPerson;
    this.body = BodyTableEpp;
    this.footer = FooterResponsable;
  }

  // Orden por fecha desc si existe
  override sortGroup(rows: any[]) {
    rows.sort((a, b) => new Date(b.fechaEntrega).getTime() - new Date(a.fechaEntrega).getTime());
  }

  // Nombre por defecto idéntico a tu caso original
  override defaultFilename(key: string, hint?: any): string {
    const nombre = (hint?.nombre || '').toString().trim().replace(/[\\/:*?"<>|]/g, ' ');
    return nombre ? `${key} - ${nombre}.pdf` : `${key}.pdf`;
  }

  /** FUSIÓN AQUÍ: antes de delegar al body, garantizamos headerCfg completo */
  override renderDocument(doc: jsPDF, input: TemplateInput, ctx: RenderContext): void {
    const incomingHeader: StandardHeaderCfg | undefined = input.config?.headerCfg;
    const mergedHeader = mergeHeaderCfg(DEFAULT_HEADER, incomingHeader);

    const nextInput: TemplateInput = {
      ...input,
      config: {
        ...input.config,
        headerCfg: mergedHeader, // HeaderStandard recibirá SIEMPRE estos datos
      },
    };

    super.renderDocument(doc, nextInput, ctx);
  }
}
