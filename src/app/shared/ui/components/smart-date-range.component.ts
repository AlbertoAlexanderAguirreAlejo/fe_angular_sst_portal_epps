// src/app/shared/ui/components/smart-date-range.component.ts
import {
  Component, ChangeDetectionStrategy, forwardRef, Input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
  selector: 'app-smart-date-range',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePickerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SmartDateRangeComponent),
      multi: true,
    },
  ],
  template: `
    <div class="flex flex-col gap-2">
      <div class="flex items-center">
        @if(label) {
          <label class="text-xs font-semibold uppercase tracking-wide">{{ label }}</label>
        }
        @if(showInvalidHint && showInvalid()) {
          <small class="text-red-600 ms-3">*Rango inválido (Desde ≤ Hasta).</small>
        }
      </div>

      <p-datepicker
        [ngModel]="raw"
        (ngModelChange)="onInnerChange($event)"
        selectionMode="range"
        [showIcon]="showIcon"
        [numberOfMonths]="numberOfMonths"
        [minDate]="minDate ?? null"
        [maxDate]="maxDate ?? defaultMaxDate"
        [placeholder]="placeholder"
        [dateFormat]="dateFormat"
        [inputId]="inputId"
        [appendTo]="'body'"
        [disabled]="disabled"
        class="w-full"
      ></p-datepicker>
    </div>
  `,
})
export class SmartDateRangeComponent implements ControlValueAccessor {
  /** UI mínimos para reutilizar */
  @Input() label = 'Fecha de Notificación';
  @Input() placeholder = 'Seleccione rango';
  @Input() showInvalidHint = true;

  /** Ajustes comunes del datepicker con defaults */
  @Input() showIcon = true;
  @Input() numberOfMonths = 2;
  @Input() dateFormat = 'dd/mm/yy';
  @Input() inputId = 'f-rango';
  @Input() readonlyInput = true;

  /** Límites opcionales. Si no pasas maxDate, toma hoy. */
  @Input() minDate?: Date | null;
  @Input() maxDate?: Date | null;

  /** ControlValueAccessor */
  private value: Date[] | null = null; // valor “confirmado” que se propaga al exterior
  raw: Date[] | null = null;           // valor “en edición” (lo que el usuario va clicando)
  disabled = false;

  onChange: (v: Date[] | null) => void = () => {};
  onTouched: () => void = () => {};

  get defaultMaxDate() { return new Date(); }

  // CVA
  writeValue(v: Date[] | null): void {
    this.value = this.normalizeOrNull(v);
    this.raw = this.value ? [...this.value] : null;
  }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }

  /** Handler del datepicker */
  onInnerChange(v: Date[] | null) {
    this.raw = this.normalizeOrNull(v);

    // Si el usuario limpió todo (null o array vacío), propagamos null
    if (!this.raw || this.raw.length === 0) {
      this.value = null;
      this.onChange(null);
      this.onTouched();
      return;
    }

    // Si hay rango completo y válido → confirmamos y propagamos
    if (this.isCompleteValid(this.raw)) {
      // normaliza [a,b] con a<=b por si acaso
      const [a, b] = this.ordered(this.raw[0], this.raw[1]);
      this.value = [a, b];
      this.raw = [a, b];
      this.onChange(this.value);
      this.onTouched();
      return;
    }

    // Si NO es rango completo (primer clic) o inválido a medio camino:
    // NO propagamos nada todavía (no disparamos null) para evitar el “reset” visual.
    // El usuario dará el segundo clic y recién ahí confirmamos.
  }

  /** Etiqueta de invalidez para el hint (solo si hay 2 fechas y están invertidas) */
  showInvalid(): boolean {
    if (!this.raw || this.raw.length !== 2 || !this.raw[0] || !this.raw[1]) return false;
    return this.raw[0].getTime() > this.raw[1].getTime();
  }

  /** Utils */
  private isCompleteValid(r: Date[] | null): r is [Date, Date] {
    if (!r || r.length !== 2) return false;
    const a = r[0], b = r[1];
    return a instanceof Date && b instanceof Date && a.getTime() <= b.getTime();
  }

  private ordered(a: Date, b: Date): [Date, Date] {
    return a.getTime() <= b.getTime() ? [a, b] : [b, a];
  }

  private normalizeOrNull(v: any): Date[] | null {
    if (!Array.isArray(v) || v.length === 0) return null;
    const a = v[0] instanceof Date ? v[0] : null;
    const b = v[1] instanceof Date ? v[1] : null;
    if (!a && !b) return null;
    // Permitimos [a] o [a,b] mientras el usuario está seleccionando
    if (a && b) return [a, b];
    if (a && !b) return [a];
    if (!a && b) return [b];
    return null;
  }
}