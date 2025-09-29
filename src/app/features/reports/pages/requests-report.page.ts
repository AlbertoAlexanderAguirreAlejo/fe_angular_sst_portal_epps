// src/app/features/reports/pages/requests-report.page.ts
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';

import { ReportsStore } from '../data-access/reports.store';
import { StorageService } from '@core/services/storage/storage.service';

import { SmartTableComponent, SmartTableColumn } from '@shared/ui/components/smart-table/smart-table.component';
import { SmartAutocompleteComponent } from '@shared/ui/components/smart-autocomplete.component';
import { SmartDateRangeComponent } from '@shared/ui/components/smart-date-range.component';
import { SmartFilterBarComponent } from '@shared/ui/components/smart-filter-bar/smart-filter-bar.component';
import { FilterAdapterDirective } from '@shared/ui/components/smart-filter-bar/filter-adapter.directive';

import { toYYYYMMDD, isValidRange } from '@shared/utils/date/date.util';

@Component({
  standalone: true,
  selector: 'app-requests-report',
  imports: [
    CommonModule, FormsModule, DatePickerModule, ButtonModule, TagModule,
    ToolbarModule, SmartTableComponent, SmartAutocompleteComponent,
    SmartDateRangeComponent, SmartFilterBarComponent, FilterAdapterDirective
  ],
  template: `
    <div class="flex flex-col gap-5 h-dvh">
      <h1 class="text-3xl pt-3 font-bold w-full text-center">{{pageName}}</h1>

      <!-- Filtros -->
      <app-smart-filter-bar
        [disabled]="!dateRange()"
        [storageKey]="'filters:' + pageKey"
        (onFilter)="onFilter($event)"
      >
        <app-smart-date-range
          [(ngModel)]="dateRange"
          [maxDate]="today"
          appFilter="dateRange"
        />

        <app-smart-autocomplete
          title="Colaboradores"
          [items]="allColabs()"
          [labelKey]="'nombres'"
          [valueKey]="'nroDoc'"
          [searchKeys]="['nombres','nroDoc']"
          [minChars]="2"
          [maxResults]="5"
          [placeholder]="'Buscar…'"
          [(ngModel)]="selectedDocs"
          appFilter="docs"
        />
      </app-smart-filter-bar>

      <!-- Tabla -->
      <app-smart-table
        [columns]="cols"
        [rows]="rows()"
        rowKey="idSstSolicitudEppsEquipo"
        [stateKey]="'table:' + pageKey"
        [exportFilename]="pageName"
        [exportExclude]="['firma']"
        [displayMode]="'expand'"
      />
    </div>
  `
})
export class RequestsReportPage {
  pageName = 'Reporte de Solicitudes';
  pageKey = 'reports:requests';

  // Inyecciones
  private store = inject(ReportsStore);
  private storage = inject(StorageService);

  // Columnas
  cols: SmartTableColumn[] = [
    { field: 'nroReservaSap',           header: 'Reserva',            cellType: 'text',       minWidthPx: 100, sortable: true,  filterable: true, filterType: 'text',  filterUI: 'multiselect' },
    { field: 'docMaterialSap',          header: 'Material',           cellType: 'text',       minWidthPx: 100, sortable: true,  filterable: true, filterType: 'text',  filterUI: 'multiselect' },
    { field: 'nroDoc',                  header: 'Doc.',               cellType: 'text',       minWidthPx: 100, sortable: true,  filterable: true, filterType: 'text',  align: 'center' },
    { field: 'colaborador',             header: 'Nombres',            cellType: 'text',       minWidthPx: 200, sortable: true,  filterable: true, filterType: 'text',  filterUI: 'multiselect' },
    { field: 'codEquipo',               header: 'Equipo',             cellType: 'text',       minWidthPx: 100, sortable: true,  filterable: true, filterType: 'text',  filterUI: 'multiselect' },
    { field: 'descEquipo',              header: 'Descripción',        cellType: 'text',       minWidthPx: 220, sortable: true,  filterable: true, filterType: 'text',  filterUI: 'multiselect' },
    { field: 'cantidad',                header: 'Ctd.',               cellType: 'text',       minWidthPx: 100, sortable: true,  filterable: true, filterType: 'numeric', align: 'center', },
    { field: 'um',                      header: 'UM',                 cellType: 'text',       minWidthPx: 100, sortable: true,  filterable: true, filterType: 'text',  filterUI: 'multiselect', align: 'center' },
    { field: 'flagEstado',              header: 'Estado',             cellType: 'status',     minWidthPx: 100, sortable: true,  filterable: true, filterType: 'text',  filterUI: 'multiselect', align: 'center',
      cellArgs: {
        statusMap: {
          '0': { label: 'Anulado',                 severity: 'contrast',  icon: 'pi pi-exclamation-triangle' },
          '1': { label: 'Generado',                severity: 'info',      icon: 'pi pi-info-circle' },
          '2': { label: 'Revisado',                severity: 'warn',      icon: 'pi pi-thumbs-up' },
          '3': { label: 'Entregado',               severity: 'success',   icon: 'pi pi-check-circle' },
          '4': { label: 'Entregado a Encargado',   severity: 'warning',   icon: 'pi pi-truck' },
          '5': { label: 'Rechazado',               severity: 'danger',    icon: 'pi pi-times-circle' },
        },
      }
     },
    { field: 'flagPrimeraEntrega',      header: 'Primera entrega',    cellType: 'booleanTag', minWidthPx: 140, sortable: true,  filterable: true, filterType: 'text',  filterUI: 'multiselect', align: 'center' },
    { field: 'flagPerdida',             header: 'Pérdida',            cellType: 'booleanTag', minWidthPx: 120, sortable: true,  filterable: true, filterType: 'text',  filterUI: 'multiselect', align: 'center' },
    { field: 'fechaEntrega',            header: 'Fecha Entrega',      cellType: 'date',       minWidthPx: 140, sortable: true,  filterable: true, filterType: 'date' },
    { field: 'cencos',                  header: 'Centro Costo',       cellType: 'text',       minWidthPx: 260, sortable: true,  filterable: true, filterType: 'text',  filterUI: 'multiselect' },
    { field: 'usuarioCreacion',         header: 'Usr. Registro',      cellType: 'text',       minWidthPx: 200, sortable: true,  filterable: true, filterType: 'text',  filterUI: 'multiselect' },
    { field: 'fechaCreacion',           header: 'Fecha Registro',     cellType: 'date',       minWidthPx: 140, sortable: true,  filterable: true, filterType: 'date' },
    { field: 'usuarioRevision',         header: 'Usr. Revisión',      cellType: 'text',       minWidthPx: 200, sortable: true,  filterable: true, filterType: 'text',  filterUI: 'multiselect' },
    { field: 'fechaRevision',           header: 'Fecha Revisión',     cellType: 'date',       minWidthPx: 140, sortable: true,  filterable: true, filterType: 'date' },
    { field: 'nombresEncargadoRetiro',  header: 'Encargado Retiro',   cellType: 'text',       minWidthPx: 200, sortable: true,  filterable: true, filterType: 'text',  filterUI: 'multiselect' },
    { field: 'fechaRetiroEncargado',    header: 'Fecha R. Encargado', cellType: 'date',       minWidthPx: 140, sortable: true,  filterable: true, filterType: 'date' },
    { field: 'nombresEncargadoEntrega', header: 'Encargado Entrega',  cellType: 'text',       minWidthPx: 200, sortable: true,  filterable: true, filterType: 'text',  filterUI: 'multiselect' },
  ];

  // Filtros
  dateRange = signal<Date[] | null>(null);
  selectedDocs: string[] = [];

  // Datos
  today = new Date();
  allColabs = computed(() => this.store.listaTrabajadores());
  rows = computed(() => this.store.listaSolicitudes());

  constructor() {
    // Rehidratación
    const saved = this.storage.get<{ dateRange?: string[]; docs?: string[] }>('filters:' + this.pageKey, {});
    if (saved.dateRange?.length === 2) {
      const parsed = saved.dateRange.map(s => new Date(s));
      if (isValidRange(parsed)) this.dateRange.set(parsed);
    }
    if (Array.isArray(saved.docs)) {
      this.selectedDocs = saved.docs.slice();
    }
  }

  onFilter(f: { dateRange?: string[] | null; docs?: string[] | null }) {
    const iso = f?.dateRange ?? null;
    if (!iso || iso.length !== 2) return;
    const [d1, d2] = iso.map(s => new Date(s));
    if (!isValidRange([d1, d2])) return;

    const fini = toYYYYMMDD(d1);
    const ffin = toYYYYMMDD(d2);
    const docs = (f?.docs ?? []) as string[];
    this.store.loadSolicitudes({ fini, ffin, nroDoc: docs });
  }
}
