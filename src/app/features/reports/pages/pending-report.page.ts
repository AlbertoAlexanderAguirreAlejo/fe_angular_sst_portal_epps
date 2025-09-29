// src/app/features/reports/pages/requests-report.page.ts
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';

import { ReportsApi } from '../data-access/reports.api';
import { ReportsStore } from '../data-access/reports.store';

import { SmartTableComponent, SmartTableColumn } from '@shared/ui/components/smart-table/smart-table.component';
import { SmartFilterBarComponent } from '@shared/ui/components/smart-filter-bar/smart-filter-bar.component';

@Component({
  standalone: true,
  selector: 'app-pending-report',
  imports: [
    CommonModule, FormsModule, DatePickerModule, ButtonModule, TagModule,
    ToolbarModule, SmartTableComponent, SmartFilterBarComponent
  ],
  template: `
    <div class="flex flex-col gap-5 h-dvh">
      <h1 class="text-3xl pt-3 font-bold w-full text-center">{{pageName}}</h1>

      <!-- Filtros -->
      <app-smart-filter-bar
        [storageKey]="'filters:' + pageKey"
        (onFilter)="onFilter()"
      />

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
export class PendingReportPage {
  pageName = 'Pendientes de Integración';
  pageKey = 'reports:pending';

  // Inyecciones
  private store = inject(ReportsStore);

  // Columnas
  cols: SmartTableColumn[] = [
    { field: 'nroDoc',              header: 'Doc.',             cellType: 'text',         minWidthPx: 100, sortable: true,  filterable: true, filterType: 'text',  align: 'center' },
    { field: 'colaborador',         header: 'Nombres',          cellType: 'text',         minWidthPx: 200, sortable: true,  filterable: true, filterType: 'text',  filterUI: 'multiselect' },
    { field: 'codEquipo',           header: 'Equipo',           cellType: 'text',         minWidthPx: 100, sortable: true,  filterable: true, filterType: 'text',  filterUI: 'multiselect' },
    { field: 'descEquipo',          header: 'Descripción',      cellType: 'text',         minWidthPx: 220, sortable: true,  filterable: true, filterType: 'text',  filterUI: 'multiselect' },
    { field: 'cantidad',            header: 'Ctd.',             cellType: 'text',         minWidthPx: 100, sortable: true,  filterable: true, filterType: 'numeric', align: 'center', },
    { field: 'um',                  header: 'UM',               cellType: 'text',         minWidthPx: 100, sortable: true,  filterable: true, filterType: 'text',  filterUI: 'multiselect', align: 'center' },
    { field: 'fechaEntrega',        header: 'Fecha Entrega',    cellType: 'date',         minWidthPx: 140, sortable: true,  filterable: true, filterType: 'date' }
  ];

  // Datos
  today = new Date();
  rows = computed(() => this.store.listaPendientes());

  onFilter() { this.store.loadPendientes(); }
}
