// src/app/shared/ui/components/smart-table/smart-table.component.ts
import {
  Component,
  Input,
  ViewChild,
  ContentChildren,
  QueryList,
  ChangeDetectionStrategy,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { TagModule } from 'primeng/tag';

// Celda y filtro proyectados
import { SmartCellDef } from './smart-cell.directive';
import { SmartFilterDef } from './smart-filter.directive';

// Pipes para render automático
import { FormatFechaPipe } from '@shared/pipes/format-fecha.pipe';
import { IsTruePipe } from '@shared/pipes/is-true.pipe';
import { BadgeSiNoPipe } from '@shared/pipes/badge-si-no.pipe';
import { ImageSrcFromBase64Pipe } from '@shared/pipes/image-src-from-base64.pipe';

export interface SmartTableColumn {
  field: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  widthPx?: number;
  minWidthPx?: number;
  sortable?: boolean;
  filterable?: boolean;
  /** Tipo para p-columnFilter: 'text' | 'numeric' | 'date' | 'boolean' */
  filterType?: 'text' | 'numeric' | 'date' | 'boolean';
  /** Campo alterno para filtrar (soporta notación "dot") */
  filterField?: string;
  /** Campo alterno para ordenar (soporta notación "dot") */
  sortField?: string;
  /** UI rápida para filtros de igualdad/lista */
  filterUI?: 'select' | 'multiselect';
  filterPlaceholder?: string;

  /** NUEVO: tipo de celda para render automático */
  cellType?: 'text' | 'date' | 'boolean' | 'booleanTag' | 'imageBase64' | 'status';
  /** Args opcionales por tipo (p.ej. formato de fecha) */
  cellArgs?: {
    // Para cellType='date'
    dateTz?: string;
    datePattern?: string;
    // Para cellType='status'
    statusMap?: Record<
      string | number,
      { label: string; severity?: 'success' | 'info' | 'warn' | 'warning' | 'danger' | 'secondary' | 'contrast'; icon?: string }
    >;
    statusDefault?: { label: string; severity?: 'secondary' | 'contrast'; icon?: string };
  };
}

@Component({
  selector: 'app-smart-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    SelectModule,
    MultiSelectModule,
    TagModule,

    // Pipes usados en el switch del body
    FormatFechaPipe,
    IsTruePipe,
    BadgeSiNoPipe,
    ImageSrcFromBase64Pipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 100%;
    }
    .st-container {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      min-height: 0;
    }
    .st-expand {
      height: 100%;
    }
    :host ::ng-deep .p-table {
      min-height: 0;
      display: flex;
      flex-direction: column;
    }
    .st-expand :host ::ng-deep .p-table {
      height: 100%;
      flex: 1 1 auto;
    }
    .st-expand :host ::ng-deep .p-table-wrapper {
      flex: 1 1 auto;
      min-height: 0;
    }
    .st-expand :host ::ng-deep .p-table-scrollable-body {
      flex: 1 1 auto;
      min-height: 0;
    }
  `],
  template: `
    <div class="st-container" [ngClass]="{ 'st-expand': isExpand, 'overflow-hidden': isExpand }">
      <p-table
        #dt
        [value]="tableData"
        [columns]="visibleColumns"

        [paginator]="isPaged && paginator"
        [rows]="isPaged ? rowsPerPage : undefined"
        [rowsPerPageOptions]="isPaged ? rowsPerPageOptions : undefined"

        [sortMode]="multiSort ? 'multiple' : 'single'"
        size="small"
        [reorderableColumns]="enableColumnReorder"
        [resizableColumns]="enableColumnResize"
        columnResizeMode="fit"
        [stateStorage]="'local'"
        [stateKey]="stateKey || undefined"

        [scrollable]="pScrollable"
        [scrollHeight]="pScrollHeight"
        [tableStyle]="{ 'min-width': minTableWidth }"
        [virtualScroll]="true"
        [virtualScrollItemSize]="50"

        [dataKey]="rowKey"
        [showGridlines]="showGridlines"
        [globalFilterFields]="globalFilterFields"
        [exportFilename]="exportFilename"
        [csvSeparator]="csvSeparator"
        [ngClass]="{ 'w-full flex-1 min-h-0': true, 'h-full': isExpand }"
        stripedRows

        (onFilter)="onFilterChange()"
      >
        <!-- CAPTION -->
        <ng-template pTemplate="caption">
          <div class="flex items-center gap-3">
            <div class="relative inline-flex">
              <p-button
                label="Limpiar"
                [outlined]="!hasAnyFilter"
                icon="pi pi-filter-slash"
                (click)="clear(dt)"
              ></p-button>

              @if (activeFilterCount > 0) {
                <span
                  class="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center
                         px-1 rounded-full text-[10px] font-semibold leading-none text-white
                         bg-red-500 dark:bg-red-500 shadow ring-1 ring-black/10 tabular-nums"
                >
                  {{ activeFilterCount }}
                </span>
              }
            </div>

            <div class="ml-auto flex items-center gap-2">
              @if (exportEnabled) {
                <p-button
                  label="Exportar"
                  icon="pi pi-file-excel"
                  severity="success"
                  (click)="exportCSV(dt)"
                  [disabled]="!canExport(dt)"
                />
              }
              @if (exportPdfHandler) {
                <p-button
                  label="Exportar"
                  icon="pi pi-file-pdf"
                  severity="danger"
                  (click)="exportPDF(dt)"
                  [disabled]="!canExport(dt)"
                />
              }
            </div>
          </div>
        </ng-template>

        <!-- HEADER -->
        <ng-template pTemplate="header" let-columns>
          <tr>
            @for (col of columns; track col.field) {
              <th
                pReorderableColumn
                pResizableColumn
                [pSortableColumn]="col.sortField || col.field"
                [pSortableColumnDisabled]="!enableSorting || col.sortable === false"
                [ngStyle]="thStyle(col)"
                [style.text-align]="col.align || 'left'"
                [ngClass]="{ 'p-highlight': isColSorted(col, dt) }"
              >
                <div class="flex items-center justify-between">
                  <div
                    class="flex items-center gap-2 min-w-0"
                    [class.cursor-pointer]="enableSorting && col.sortable !== false"
                    [title]="enableSorting && col.sortable !== false ? 'Ordenar (Shift=multi)' : ''"
                  >
                    <span class="text-xs font-semibold uppercase tracking-wider truncate text-wrap">
                      {{ col.header }}
                    </span>
                    @if (enableSorting && col.sortable !== false) {
                      <p-sortIcon [field]="col.sortField || col.field" />
                    }
                  </div>

                  @if (enableFilters && col.filterable !== false) {
                    <p-columnFilter
                      [type]="col.filterType || 'text'"
                      [field]="col.filterField || col.field"
                      display="menu"
                      [matchMode]="col.filterUI === 'multiselect' ? 'in' : (col.filterUI === 'select' ? 'equals' : undefined)"
                      [showMatchModes]="!col.filterUI"
                      [showOperator]="!col.filterUI"
                      [showAddButton]="!col.filterUI"
                    >
                      @let tpl = filterTpl(col.filterField || col.field);
                      @if (tpl) {
                        <ng-template pTemplate="filter" let-value let-filter="filterCallback">
                          <ng-container
                            [ngTemplateOutlet]="tpl"
                            [ngTemplateOutletContext]="{ value: value, filter: filter }"
                          ></ng-container>
                        </ng-template>
                      } @else {
                        @switch (col.filterUI) {
                          @case ('multiselect') {
                            <ng-template pTemplate="filter" let-value let-filter="filterCallback">
                              <p-multiselect
                                [ngModel]="value"
                                [options]="distinctOptions(col)"
                                optionLabel="label"
                                optionValue="value"
                                (ngModelChange)="filter($event)"
                                [placeholder]="col.filterPlaceholder || 'Any'"
                                style="min-width:14rem"
                                [panelStyle]="{ minWidth: '16rem' }"
                              ></p-multiselect>
                            </ng-template>
                          }
                          @case ('select') {
                            <ng-template pTemplate="filter" let-value let-filter="filterCallback">
                              <p-select
                                [ngModel]="value"
                                [options]="distinctOptions(col)"
                                (ngModelChange)="filter($event.value)"
                                optionLabel="label"
                                [placeholder]="col.filterPlaceholder || 'Select one'"
                                class="w-full"
                              ></p-select>
                            </ng-template>
                          }
                        }
                      }
                    </p-columnFilter>
                  }
                </div>
              </th>
            }
          </tr>
        </ng-template>

        <!-- BODY -->
        <ng-template pTemplate="body" let-row let-columns="columns">
          <tr>
            @for (col of columns; track col.field) {
              <td [ngStyle]="tdStyle(col)" [style.text-align]="col.align || 'left'">
                <div class="whitespace-normal break-words [text-wrap:pretty]">
                  @let tpl = cellTpl(col.field);
                  @if (tpl) {
                    <!-- Custom template tiene prioridad -->
                    <ng-container
                      [ngTemplateOutlet]="tpl"
                      [ngTemplateOutletContext]="{ $implicit: row, row: row, col: col }"
                    />
                  } @else {
                    <!-- Render automático por cellType -->
                    @switch (col.cellType) {

                      @case ('date') {
                        {{ (row[col.field]) | formatFecha:(col.cellArgs?.dateTz ?? 'UTC'):(col.cellArgs?.datePattern ?? 'dd/MM/yyyy, HH:mm'):'es-PE' }}
                      }

                      @case ('boolean') {
                        {{ (row[col.field] | isTrue) | badgeSiNo }}
                      }

                      @case ('booleanTag') {
                        <p-tag
                          [severity]="(row[col.field] | isTrue) ? 'success' : 'secondary'"
                          [value]="(row[col.field] | badgeSiNo)"
                        ></p-tag>
                      }

                      @case ('imageBase64') {
                        @let src = (row[col.field] | imageSrcFromBase64);
                        @if (src) {
                          <img [src]="src" class="max-h-10 object-contain select-none bg-white" alt="" draggable="false" />
                        } @else {
                          <span class="text-xs opacity-60">Sin imagen</span>
                        }
                      }

                      @case ('status') {
                        @let v = row[col.field];
                        @let map = col.cellArgs?.statusMap;
                        @let def = col.cellArgs?.statusDefault ?? { label: v ?? '', severity: 'secondary' };
                        @let meta = map ? (map[v] ?? def) : def;

                        <p-tag
                          [severity]="meta.severity || 'secondary'"
                          [value]="meta.label"
                          class="inline-flex items-center gap-1"
                        >
                          @if (meta.icon) {
                            <i [class]="meta.icon" style="margin-right:.25rem"></i>
                          }
                        </p-tag>
                      }

                      @case ('text') {
                        {{ row[col.field] }}
                      }

                      @default {
                        {{ row[col.field] }}
                      }
                    }
                  }
                </div>
              </td>
            }
          </tr>
        </ng-template>

        <!-- EMPTY -->
        <ng-template pTemplate="emptymessage">
          <tr>
            <td [attr.colspan]="visibleColumns.length" class="text-center py-6 text-slate-500 dark:text-slate-400">
              Sin datos para mostrar.
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
})
export class SmartTableComponent implements OnChanges, AfterViewInit {
  @Input() columns: SmartTableColumn[] = [];
  @Input() rows: any[] = [];
  @Input() rowKey = 'id';

  // --- Modos de visualización ---
  @Input() displayMode: 'pages' | 'normal' | 'expand' = 'pages';
  @Input() normalRows = 10;

  // Alturas estimadas para "normal" (ajustables desde fuera si cambias estilos)
  @Input() rowHeightPx = 40;
  @Input() headerHeightPx = 44;
  @Input() captionHeightPx = 52;
  @Input() minScrollHeightPx = 120;

  // Paginación (solo aplica en 'pages')
  @Input() paginator = true;
  @Input() rowsPerPage = 5;
  @Input() rowsPerPageOptions: number[] = [5, 10, 25, 50];

  @Input() enableSorting = true;
  @Input() multiSort = true;

  @Input() enableColumnReorder = true;
  @Input() enableColumnResize = true;
  @Input() enableFilters = true;

  @Input() stateKey = '';
  @Input() minTableWidth = '1200px';

  // Compat: modo legado si no usas normal/expand
  @Input() scrollable = true;
  @Input() scrollHeight: string = 'flex';

  @Input() showGridlines = true;

  // Búsqueda global
  @Input() globalFilterFields: string[] = [];

  // Export CSV (nativo PrimeNG + custom exclude)
  @Input() exportEnabled = true;
  @Input() exportFilename = 'export';
  @Input() csvSeparator = ',';
  /** Campos (field) a excluir SOLO para CSV */
  @Input() exportExclude: string[] = [];

  /** Exportación PDF opcional */
  @Input() exportPdfHandler?: (args: {
    rows: any[];
    columns: SmartTableColumn[];
    filename: string;
  }) => void;

  @ViewChild('dt') dt!: Table;
  @ContentChildren(SmartCellDef) cells!: QueryList<SmartCellDef>;
  @ContentChildren(SmartFilterDef) filters!: QueryList<SmartFilterDef>;

  // ==== Estado de filtros ====
  activeFilterCount = 0;

  // ==== Modelo interno (columnas y filas transformadas) ====
  private _columnsInternal: SmartTableColumn[] = [];
  private _rowsInternal: any[] = [];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['columns'] || changes['rows']) {
      this.rebuildInternalModel();
    }
  }

  ngAfterViewInit() {
    // Recalcula al inicio (por si hay estado restaurado de localStorage)
    queueMicrotask(() => {
      this.recomputeFilters();
      this.cdr.markForCheck();
    });
  }

  // ====== Internal model ======
  private rebuildInternalModel(): void {
    const cols = this.columns ?? [];
    const rows = this.rows ?? [];

    // 1) Clona columnas y decide qué columnas son "date-typed"
    const enhancedCols: SmartTableColumn[] = cols.map((c) => ({ ...c }));

    // Mapea nombre de campo original -> alias __dt
    const dateFieldAlias = new Map<string, string>();

    for (const col of enhancedCols) {
      const isDateLike =
        col.filterType === 'date' || col.cellType === 'date';

      if (isDateLike) {
        const base = col.field.replace(/\./g, '_');
        const alias = `${base}__dt`;
        dateFieldAlias.set(col.field, alias);

        // Ajusta filter/sort si no fueron provistos desde afuera
        if (!col.filterField) col.filterField = alias;
        if (!col.sortField) col.sortField = alias;
      }
    }

    // 2) Construye filas internas, agregando los alias __dt cuando aplique
    const outRows: any[] = rows.map((r) => {
      if (dateFieldAlias.size === 0) return r;
      const copy = { ...r };
      for (const [origField, alias] of dateFieldAlias.entries()) {
        const raw = this._getByPath(r, origField);
        copy[alias] =
          raw instanceof Date ? raw : new Date(raw ?? NaN);
      }
      return copy;
    });

    this._columnsInternal = enhancedCols;
    this._rowsInternal = outRows;
  }

  // ===== Filtros activos =====
  get hasAnyFilter(): boolean {
    return this.activeFilterCount > 0;
  }

  onFilterChange() {
    // PrimeNG actualiza filters antes de emitir onFilter: podemos leerlos
    this.recomputeFilters();
    this.cdr.markForCheck();
  }

  private recomputeFilters(): void {
    const tableAny = this.dt as any;
    const filters: Record<string, any> | undefined = tableAny?.filters;
    if (!filters) {
      this.activeFilterCount = 0;
      return;
    }
    let count = 0;
    for (const meta of Object.values(filters)) {
      if (this._metaHasValue(meta)) count++;
    }
    this.activeFilterCount = count;
  }

  private _metaHasValue(meta: any): boolean {
    if (!meta) return false;

    // Formato A: { value, matchMode }
    if (Object.prototype.hasOwnProperty.call(meta, 'value')) {
      return !this._isEmpty(meta.value);
    }

    // Formato B: { operator, constraints: [{ value, matchMode }, ...] }
    if (Array.isArray(meta.constraints)) {
      return meta.constraints.some((c: any) => !this._isEmpty(c?.value));
    }

    // Algunos temas emiten arrays de metas (raro): considerar alguno con valor
    if (Array.isArray(meta)) {
      return meta.some((m) => this._metaHasValue(m));
    }

    return false;
  }

  private _isEmpty(v: any): boolean {
    if (v == null) return true;                 // null/undefined
    if (typeof v === 'string') return v.trim().length === 0;
    if (Array.isArray(v)) return v.length === 0;
    if (v instanceof Date) return isNaN(v.getTime());
    if (typeof v === 'number') return Number.isNaN(v);
    // boolean y objetos con valor cuentan como “con filtro”
    return false;
  }

  /** Marca cabecera activa para highlight */
  isColSorted(col: SmartTableColumn, table: Table): boolean {
    const f = col.sortField || col.field;
    if (!this.multiSort) {
      return !!f && table?.sortField === f && (table?.sortOrder === 1 || table?.sortOrder === -1);
    }
    return !!f && !!table?.multiSortMeta?.some(m => m.field === f);
  }

  // === columnas/filas visibles ===
  get visibleColumns(): SmartTableColumn[] {
    return this._columnsInternal;
  }
  get tableData(): any[] {
    return this._rowsInternal;
  }

  // ===== Caption actions =====
  clear(dt: Table) {
    dt.clear(); // limpia filtros/sort/selección/estado visible
    queueMicrotask(() => {
      this.recomputeFilters();
      this.cdr.markForCheck();
    });
  }

  canExport(dt: Table): boolean {
    const data = (dt.filteredValue as any[] | null | undefined) ?? this.rows ?? [];
    return data.length > 0;
  }

  exportCSV(dt: Table) {
    const hasExclude = (this.exportExclude?.length ?? 0) > 0;
    if (!hasExclude) { dt.exportCSV(); return; }

    const data = (dt.filteredValue as any[] | null | undefined) ?? this.rows ?? [];
    const cols = this.visibleColumns.filter(c => !this.exportExclude.includes(c.field));
    if (!cols.length || !data.length) return;

    const sep = this.csvSeparator || ',';
    const lines: string[] = [];
    lines.push(cols.map(c => this._csvEscape(c.header, sep)).join(sep));
    for (const r of data) {
      const row = cols.map(c => this._csvEscape(this._getByPath(r, c.field), sep)).join(sep);
      lines.push(row);
    }

    const csv = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = this._ensureExt(this.exportFilename, 'csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }

  exportPDF(dt: Table) {
    if (!this.exportPdfHandler) return;
    const data = (dt.filteredValue as any[] | null | undefined) ?? this.rows ?? [];
    const cols = this.visibleColumns;
    this.exportPdfHandler({ rows: data, columns: cols, filename: this.exportFilename });
  }

  // ===== Proyección =====
  cellTpl(key: string) {
    return this.cells?.find((c) => c.key === key)?.tpl;
  }
  filterTpl(field: string) {
    return this.filters?.find((f) => f.field === field)?.tpl;
  }

  // ===== Estilos de ancho =====
  thStyle(col: SmartTableColumn) {
    const s: any = {};
    if (col.minWidthPx) s['min-width'] = `${col.minWidthPx}px`;
    if (col.widthPx) s['width'] = `${col.widthPx}px`;
    return s;
  }
  tdStyle(col: SmartTableColumn) {
    const s: any = {};
    if (col.minWidthPx) s['min-width'] = `${col.minWidthPx}px`;
    if (col.widthPx) s['width'] = `${col.widthPx}px`;
    return s;
  }

  // ===== Utils =====
  private _getByPath(obj: any, path: string) {
    return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  }
  private _csvEscape(val: any, sep: string): string {
    if (val === null || val === undefined) return '';
    const s = String(val);
    const mustQuote = s.includes(sep) || s.includes('"') || s.includes('\n') || s.includes('\r');
    const escaped = s.replace(/"/g, '""');
    return mustQuote ? `"${escaped}"` : escaped;
  }
  private _ensureExt(name: string, ext: string) {
    const dot = `.${ext}`;
    return name?.toLowerCase().endsWith(dot) ? name : `${name || 'export'}${dot}`;
  }

  // Opciones únicas para filtros de lista
  distinctOptions(col: SmartTableColumn): Array<{ label: string; value: any }> {
    const field = col.filterField || col.field;
    const set = new Set<string>();
    const out: Array<{ label: string; value: any }> = [];

    for (const r of this._rowsInternal || []) {
      let v = this.getByPath(r, field);

      if (col.cellType === 'status' && col.cellArgs?.statusMap) {
        const map = col.cellArgs.statusMap;
        const present = new Set<string>();
        for (const r of this._rowsInternal || []) {
          const raw = this.getByPath(r, col.filterField || col.field);
          if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
            present.add(String(raw));
          }
        }
        const out = Array.from(present).map(k => {
          const meta = map[k];
          const label = meta?.label ?? k;
          return { label, value: k };
        });
        out.sort((a, b) => a.label.localeCompare(b.label, 'es'));
        return out;
      }

      if (col.filterType === 'boolean') {
        v = v === true || v === '1' || v === 1 || v === 'true';
      }

      if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) continue;

      const key = typeof v === 'object' ? JSON.stringify(v) : String(v);
      if (set.has(key)) continue;
      set.add(key);

      const label =
        col.filterType === 'boolean'
          ? (v ? 'Sí' : 'No')
          : String(this.getByPath(r, field) ?? v);

      out.push({ label, value: v });
    }

    out.sort((a, b) => a.label.localeCompare(b.label, 'es'));
    return out;
  }
  private getByPath(obj: any, path: string) {
    return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  }

  // ===== Modos =====
  get isPaged()  { return this.displayMode === 'pages'; }
  get isNormal() { return this.displayMode === 'normal'; }
  get isExpand() { return this.displayMode === 'expand'; }

  /** ¿Debe tener scroll interno el p-table? */
  get pScrollable(): boolean {
    if (this.isNormal || this.isExpand) return true;
    return this.scrollable;
  }

  /** Altura de scroll que verá PrimeNG */
  get pScrollHeight(): string {
    if (this.isExpand) return 'flex'; // ocupa alto disponible del contenedor
    if (this.isNormal) {
      const bodyPx = Math.max(1, this.normalRows) * this.rowHeightPx;
      const total = bodyPx + this.headerHeightPx + this.captionHeightPx;
      return `${Math.max(total, this.minScrollHeightPx)}px`;
    }
    return this.scrollHeight;
  }
}
