// src/app/shared/ui/components/smart-filter-bar/smart-filter-bar.component.ts
import {
  Component, ChangeDetectionStrategy, Input, Output, EventEmitter,
  ContentChildren, QueryList, AfterContentInit, OnDestroy, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule, ButtonSeverity } from 'primeng/button';
import { FilterAdapterDirective } from './filter-adapter.directive';
import { StorageService } from '@core/services/storage/storage.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-smart-filter-bar',
  standalone: true,
  imports: [CommonModule, ToolbarModule, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .filters-wrap { display: flex; flex-wrap: wrap; align-items: end; gap: .75rem; }
  `],
  template: `
    <p-toolbar class="shadow">
      <ng-template pTemplate="start">
        <div class="filters-wrap">
          <ng-content></ng-content>
        </div>
      </ng-template>

      <ng-template pTemplate="end">
        <div class="flex items-center gap-2">
          <p-button
            type="button"
            [label]="filterLabel"
            [icon]="filterIcon"
            [severity]="filterSeverity"
            [disabled]="disabled || !allValid"
            (onClick)="apply()"
          ></p-button>
        </div>
      </ng-template>
    </p-toolbar>
  `,
})
export class SmartFilterBarComponent implements AfterContentInit, OnDestroy {
  private storage = inject(StorageService);

  @Input() filterLabel = 'Filtrar';
  @Input() filterIcon = 'pi pi-filter';
  @Input() filterSeverity: ButtonSeverity = 'info';
  @Input() disabled = false;

  @Input() storageKey?: string;

  @Output() onFilter = new EventEmitter<Record<string, any>>();

  @ContentChildren(FilterAdapterDirective) private adapters!: QueryList<FilterAdapterDirective>;
  private sub?: Subscription;

  get allValid(): boolean {
    return (this.adapters?.toArray() || []).every(a => a.valid());
  }

  ngAfterContentInit(): void {
    if (this.storageKey) {
      const saved = this.storage.get<Record<string, any>>(this.storageKey, {});
      // en microtarea para asegurar que NgModel/CVA de los hijos esté listo
      queueMicrotask(() => {
        for (const a of this.adapters) {
          if (Object.prototype.hasOwnProperty.call(saved, a.key)) {
            a.setSerialized(saved[a.key]);
          }
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private collectSerialized(): Record<string, any> {
    const out: Record<string, any> = {};
    for (const a of this.adapters) out[a.key] = a.getSerialized();
    return out;
  }

  apply(): void {
    if (!this.allValid) return;
    const values = this.collectSerialized();
    if (this.storageKey) this.storage.set(this.storageKey, values);
    this.onFilter.emit(values);
  }
}
