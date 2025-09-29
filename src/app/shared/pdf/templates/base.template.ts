/* src/app/shared/pdf/templates/base.template.ts */
import jsPDF from 'jspdf';
import { renderPagedTable } from '@shared/pdf/table-paged';
import { getResponsable } from '@shared/pdf/common';
import { Injectable } from '@angular/core';

export type TemplateId = 'delivery-epp'; // agrega más ids aquí

/** Forma mínima común que deben aceptar todas las plantillas */
export interface TemplateInput {
  rows: any[];
  config?: any;
  hint?: any;
}

export interface RenderContext {
  renderPagedTable: typeof renderPagedTable;
  assets?: { logo?: HTMLImageElement };
  helpers?: any;
  // slots internos (asignados por BaseTemplate)
  __slots?: {
    header?: HeaderComponent<any>;
    subheader?: SubHeaderComponent<any>;
    footer?: FooterComponent<any>;
  };
}

/** Subcomponentes composables (slots) */
export interface HeaderComponent<I = any> {
  draw(doc: jsPDF, input: I, ctx: RenderContext): void;
}
export interface SubHeaderComponent<I = any> {
  draw(doc: jsPDF, input: I, ctx: RenderContext): void;
}
export interface BodyComponent<I = any> {
  draw(doc: jsPDF, input: I, ctx: RenderContext): void;
}
export interface FooterComponent<I = any> {
  draw(doc: jsPDF, input: I, ctx: RenderContext): void;
}

/** Contrato de Plantilla dedicada pero armada con componentes */
export interface DedicatedTemplate<Data extends TemplateInput = TemplateInput> {
  id: TemplateId;
  header?: HeaderComponent<Data>;
  subheader?: SubHeaderComponent<Data>;
  body: BodyComponent<Data>;
  footer?: FooterComponent<Data>;

  // helpers opcionales
  helpers?(): any;
  // ordenamiento general por grupo si aplica
  sortGroup?(rows: any[]): void;

  // nombres por defecto (personalizables)
  defaultFilename?(key: string, hint?: any): string;
  defaultBundleName?(stamp: string): string;

  renderDocument(doc: jsPDF, input: Data, ctx: RenderContext): void;
}

/** Base con render por defecto que inyecta slots */
export abstract class BaseTemplate<Data extends TemplateInput = TemplateInput>
  implements DedicatedTemplate<Data>
{
  abstract id: TemplateId;
  header?: HeaderComponent<Data>;
  subheader?: SubHeaderComponent<Data>;
  body!: BodyComponent<Data>;
  footer?: FooterComponent<Data>;

  helpers() {
    // helpers por defecto (puedes añadir más)
    return { getResponsable };
  }

  sortGroup?(rows: any[]): void;

  defaultFilename?(key: string, hint?: any): string {
    const nombre = (hint?.nombre || '').toString().trim();
    return nombre ? `${key} - ${nombre}.pdf` : `${key}.pdf`;
  }

  defaultBundleName?(stamp: string): string {
    return `Reportes_${stamp}.zip`;
  }

  renderDocument(doc: jsPDF, input: Data, ctx: RenderContext): void {
    if (!this.body) throw new Error('Body no definido en la plantilla');

    // Inyectar slots en el contexto para que el body pueda dibujar en cada página
    const ctxWithSlots: RenderContext = {
      ...ctx,
      __slots: {
        header: this.header,
        subheader: this.subheader,
        footer: this.footer,
      },
    };

    // El body controla el paginado y llama a los slots por página
    this.body.draw(doc, input, ctxWithSlots);
  }
}

/** Registro simple de plantillas (inyectable) */
@Injectable({ providedIn: 'root' })
export class TemplateRegistry {
  private registry = new Map<TemplateId, DedicatedTemplate<any>>();
  register<T extends TemplateInput>(tpl: DedicatedTemplate<T>) {
    this.registry.set(tpl.id, tpl as DedicatedTemplate<any>);
  }
  get(id: TemplateId) {
    return this.registry.get(id);
  }
}
