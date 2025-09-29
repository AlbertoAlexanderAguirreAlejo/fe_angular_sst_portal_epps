// src/app/shared/ui/components/smart-filter-bar/filter-adapter.directive.ts
import { Directive, Input, OnDestroy, Optional, Self } from '@angular/core';
import { NgModel } from '@angular/forms';
import { Observable, Subject } from 'rxjs';

export interface FilterAdapter {
  key: string;
  get(): any;
  set(v: any): void;
  valid(): boolean;
  changes$?: Observable<any>;
}

@Directive({
  selector: '[appFilter]',
  standalone: true,
})
export class FilterAdapterDirective implements FilterAdapter, OnDestroy {
  @Input('appFilter') key!: string;

  /** Si no defines nada, auto: Dates → ISO; arrays de Dates → array de ISO; lo demás -> idéntico */
  @Input() appFilterSerialize?: (v: any) => any;
  @Input() appFilterDeserialize?: (v: any) => any;

  /** Válido por defecto (si no lo estableces) */
  @Input() appFilterValid?: () => boolean;

  private destroyed$ = new Subject<void>();

  constructor(@Optional() @Self() private ngModel: NgModel | null) {}

  // --- API FilterAdapter ---
  get(): any {
    if (this.ngModel) return this.ngModel.viewModel;
    return null;
  }

  set(v: any): void {
    if (!this.ngModel) return;
    // usamos deserialize si aplica
    const val = this.deserialize(v);
    if (this.ngModel.control) {
      this.ngModel.control.setValue(val, { emitEvent: true });
    } else {
      // Fallback por si no hay control (muy raro en NgModel)
      (this.ngModel as any).update?.emit(val);
    }
  }

  valid(): boolean {
    if (this.appFilterValid) return this.appFilterValid();
    // Si hay NgModel, nos apoyamos en su validez (si existe), si no, true
    return (this.ngModel?.valid ?? true);
  }

  get changes$(): Observable<any> | undefined {
    // Si hay ngModel, usamos sus valueChanges
    return this.ngModel?.valueChanges as Observable<any> | undefined;
  }

  // --- Serialización automática ---
  getSerialized(): any {
    const raw = this.get();
    return this.serialize(raw);
  }

  setSerialized(v: any): void {
    this.set(v);
  }

  private serialize(v: any): any {
    if (this.appFilterSerialize) return this.appFilterSerialize(v);
    // Auto: Date → ISO; Date[] → ISO[]; else passthrough
    if (v instanceof Date) return v.toISOString();
    if (Array.isArray(v) && v.length && v[0] instanceof Date) {
      return v.map(d => (d instanceof Date ? d.toISOString() : d));
    }
    return v;
  }

  private deserialize(v: any): any {
    if (this.appFilterDeserialize) return this.appFilterDeserialize(v);
    // Auto: ISO -> Date; ISO[] -> Date[]
    if (typeof v === 'string' && this.looksISO(v)) return new Date(v);
    if (Array.isArray(v) && v.length && typeof v[0] === 'string' && this.looksISO(v[0])) {
      return v.map(s => new Date(s));
    }
    return v;
    }

  private looksISO(s: string): boolean {
    // check rápido
    return /^\d{4}-\d{2}-\d{2}T/.test(s);
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
