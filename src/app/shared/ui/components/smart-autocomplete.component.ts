// src/app/shared/ui/components/smart-autocomplete.component.ts
import {
  Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, SimpleChanges,
  signal, ElementRef, ViewChild, HostListener, AfterViewInit, forwardRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PopoverModule } from 'primeng/popover';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Popover } from 'primeng/popover';

@Component({
  selector: 'app-smart-autocomplete',
  standalone: true,
  imports: [
    CommonModule, FormsModule, InputTextModule, PopoverModule,
    ButtonModule, BadgeModule, InputGroupModule, InputGroupAddonModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SmartAutocompleteComponent),
    multi: true
  }],
  template: `
    <div class="flex flex-col gap-2" #host>
      @if(title) {
        <label class="text-xs font-semibold uppercase tracking-wide">{{ title }}</label>
      }

      <div>
        <p-inputgroup>
          <input
            pInputText
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="onSearchChange($event)"
            (focus)="onInputFocus()"
            (blur)="onInputBlur()"
            (keydown)="onInputKeydown($event)"
            [placeholder]="placeholder"
            class="w-full"
            #searchInput
          />
          @if(multiple && selectedObjs.length > 0) {
            <p-inputgroup-addon
              class="cursor-pointer hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
              (click)="popover.toggle($event)">
              <div class="flex items-center gap-2">
                <i class="pi pi-check-circle text-primary-500"></i>
                <span class="font-medium">{{ selectedObjs.length }}</span>
                <span class="text-sm">{{ selectedObjs.length === 1 ? 'seleccionado' : 'seleccionados' }}</span>
                <i class="pi pi-chevron-down text-xs text-slate-400"></i>
              </div>
            </p-inputgroup-addon>
          }
        </p-inputgroup>

        @if(showSuggestions() && (suggestions().length > 0 || (searchQuery().length >= minChars && suggestions().length === 0))) {
          <div
            class="absolute z-50 w-100 mt-1 bg-white dark:bg-black border border-indigo-100 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden"
            (mousedown)="$event.preventDefault()">

            @if(suggestions().length > 0) {
              <div class="max-h-80 overflow-y-auto">
                @for (item of suggestions(); track item?.[valueKey]; let i = $index) {
                  <div
                    class="px-4 py-3 hover:bg-indigo-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors"
                    [class.bg-indigo-50]="i === highlightedIndex()"
                    [class.dark:bg-slate-800]="i === highlightedIndex()"
                    (click)="toggleItem(item)"
                    (mouseenter)="highlightedIndex.set(i)">

                    <div class="flex items-center justify-between gap-3">
                      <div class="flex-1 min-w-0">
                        <div class="font-medium truncate" [innerHTML]="labelHTML(item)"></div>
                        @if(item[valueKey] && item[valueKey] !== item[labelKey]) {
                          <div class="text-xs text-slate-500 dark:text-slate-400 truncate mt-1" [innerHTML]="valueHTML(item)"></div>
                        }
                      </div>
                      @if (rightKey && item[rightKey]) {
                        <span class="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[12rem]">
                          {{ item[rightKey] }}
                        </span>
                      }
                      @if(isItemSelected(item)) {
                        <p-badge value="✓" severity="success" [style]="{'font-size': '0.65rem', 'height': '1.25rem', 'min-width': '1.25rem'}"></p-badge>
                      }
                    </div>
                  </div>
                }
              </div>

              @if(suggestions().length === maxResults) {
                <div class="px-4 py-2 bg-indigo-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-700">
                  <i class="pi pi-info-circle mr-1"></i>
                  Mostrando los primeros {{ maxResults }} resultados. Refina tu búsqueda para ver más.
                </div>
              }
            } @else {
              <div class="p-4">
                <div class="text-slate-500 dark:text-slate-400 text-sm text-center">
                  <i class="pi pi-search text-2xl block mb-2"></i>
                  No se encontraron resultados para "<span class="font-medium">{{ searchQuery() }}</span>"
                </div>
              </div>
            }
          </div>
        }
      </div>

      <p-popover #popover class="contents" [style]="{'width':'28rem', 'max-width': 'min(90vw, 28rem)'}">
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
            <div class="flex items-center gap-2">
              <h3 class="font-semibold text-lg">Elementos seleccionados</h3>
              <p-badge [value]="selectedObjs.length.toString()"></p-badge>
            </div>
            @if(selectedObjs.length > 0) {
              <button pButton type="button" icon="pi pi-times" class="p-button-text p-button-rounded p-button-sm p-button-secondary" (click)="popover.hide()"></button>
            }
          </div>

          <div class="max-h-64 overflow-y-auto -mx-2">
            @if(selectedObjs.length > 0) {
              <div class="px-2">
                @for (item of selectedObjs; track item?.[valueKey]; let i = $index) {
                  <div class="flex items-center justify-between gap-3 py-2 px-3 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors group">
                    <div class="flex items-center gap-3 flex-1 min-w-0">
                      <span class="text-xs font-medium">{{ i + 1 }}</span>
                      <div class="flex-1 min-w-0">
                        <div class="font-medium truncate">
                          <i class="pi pi-user text-xs mr-1"></i>{{ item?.[labelKey] }}
                        </div>
                        @if(item?.[valueKey] && item?.[valueKey] !== item?.[labelKey]) {
                          <div class="text-xs truncate mt-0.5 text-slate-500 dark:text-slate-400">{{ item?.[valueKey] }}</div>
                        }
                        @if(rightKey && item?.[rightKey]) {
                          <div class="text-xs truncate mt-0.5 text-slate-500 dark:text-slate-400">{{ item?.[rightKey] }}</div>
                        }
                      </div>
                    </div>
                    <button pButton type="button" icon="pi pi-trash" class="p-button-rounded p-button-text p-button-sm p-button-danger" (click)="removeItem(item)"></button>
                  </div>
                }
              </div>
            } @else {
              <div class="text-center py-8 text-slate-500 dark:text-slate-400">
                <i class="pi pi-inbox text-4xl mb-3 block text-slate-300 dark:text-slate-600"></i>
                <p class="text-sm font-medium">No hay elementos seleccionados</p>
                <p class="text-xs mt-1">Los elementos que selecciones aparecerán aquí</p>
              </div>
            }
          </div>

          @if(selectedObjs.length > 0) {
            <div class="flex items-center justify-end pt-3 border-t border-slate-200 dark:border-slate-700">
              <div class="flex items-center gap-2">
                <button pButton type="button" label="Cerrar" class="p-button-text p-button-sm" (click)="popover.hide()"></button>
                <button pButton type="button" label="Quitar todos" icon="pi pi-trash" class="p-button-danger p-button-sm" severity="danger" (click)="clearAllWithClose(popover)"></button>
              </div>
            </div>
          }
        </div>
      </p-popover>
    </div>
  `
})
export class SmartAutocompleteComponent implements OnChanges, AfterViewInit, ControlValueAccessor {
  constructor(private sanitizer: DomSanitizer) {}

  @ViewChild('host', { static: true }) host!: ElementRef<HTMLElement>;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('popover') popover!: Popover;

  // UI
  @Input() title = '';
  @Input() placeholder = 'Buscar...';
  @Input() multiple = true;
  @Input() minChars = 2;
  @Input() maxResults = 5;

  // Data
  @Input() items: any[] = [];
  @Input() labelKey = 'label';
  @Input() valueKey = 'value';
  @Input() searchKeys: string[] = [];
  @Input() rightKey?: string;

  // Compatibilidad antigua (objetos) – la mantenemos emitiendo objetos seleccionados
  @Input() selected: any[] = [];
  @Output() selectedChange = new EventEmitter<any[]>();

  // Modelo oficial CVA: string[] (IDs)
  private valueIds: string[] = [];
  selectedObjs: any[] = [];

  // Search state
  searchQuery = signal('');
  suggestions = signal<any[]>([]);
  showSuggestions = signal(false);
  highlightedIndex = signal(-1);

  // Precomp
  private dataset: Array<{
    ref: any; fieldsRaw: Record<string, string>; fieldsNorm: Record<string, string>; fieldsMap: Record<string, number[]>;
  }> = [];
  private labelHtmlMap = new WeakMap<any, SafeHtml>();
  private valueHtmlMap = new WeakMap<any, SafeHtml>();
  private inputFocusTimeout?: number;

  // CVA
  onChange: (v: string[]) => void = () => {};
  onTouched: () => void = () => {};
  writeValue(ids: string[] | null): void {
    this.valueIds = Array.isArray(ids) ? ids.map(String) : [];
    this.selectedObjs = this.items.filter(it => this.valueIds.includes(String(it?.[this.valueKey])));
    this.selected = [...this.selectedObjs];
    this.selectedChange.emit(this.selected);
  }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void {}

  ngAfterViewInit() {
    if (this.searchKeys.length === 0) this.searchKeys = [this.labelKey, this.valueKey];
    this.precompute();
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items'] || changes['searchKeys'] || changes['labelKey'] || changes['valueKey']) {
      this.precompute();
      // Re-sincroniza objetos desde ids actuales
      this.selectedObjs = this.items.filter(it => this.valueIds.includes(String(it?.[this.valueKey])));
      this.selected = [...this.selectedObjs];
      this.selectedChange.emit(this.selected);
    }
  }

  // UI handlers
  onSearchChange(query: string) {
    this.searchQuery.set(query ?? '');
    const q = this.searchQuery();
    if (q.length >= this.minChars) { this.showSuggestions.set(true); this.performSearch(q); }
    else { this.suggestions.set([]); this.showSuggestions.set(false); }
  }
  onInputFocus() {
    clearTimeout(this.inputFocusTimeout);
    this.showSuggestions.set(true);
    if (this.searchQuery().length >= this.minChars) this.performSearch(this.searchQuery());
  }
  onInputBlur() {
    this.inputFocusTimeout = window.setTimeout(() => { this.showSuggestions.set(false); this.highlightedIndex.set(-1); }, 200);
  }
  onInputKeydown(event: KeyboardEvent) {
    if (!this.showSuggestions() || this.suggestions().length === 0) return;
    switch (event.key) {
      case 'ArrowDown': event.preventDefault(); this.highlightedIndex.update(i => i < this.suggestions().length - 1 ? i + 1 : 0); break;
      case 'ArrowUp': event.preventDefault(); this.highlightedIndex.update(i => i > 0 ? i - 1 : this.suggestions().length - 1); break;
      case 'Enter': if (this.highlightedIndex() >= 0) { event.preventDefault(); this.toggleItem(this.suggestions()[this.highlightedIndex()]); } break;
      case 'Escape': event.preventDefault(); this.showSuggestions.set(false); this.highlightedIndex.set(-1); this.searchInput.nativeElement.blur(); break;
    }
  }

  // Selección
  toggleItem(item: any) {
    if (this.multiple) {
      if (this.isItemSelected(item)) this.removeItem(item);
      else this.addItem(item);
    } else {
      this.selectedObjs = [item];
      this.syncOut();
    }
    this.afterPick();
  }
  addItem(item: any) {
    this.selectedObjs = [...this.selectedObjs, item];
    this.syncOut();
  }
  removeItem(item: any) {
    const key = this.valueKey;
    this.selectedObjs = this.selectedObjs.filter(x => x?.[key] !== item?.[key]);
    this.syncOut();
  }
  clearAllWithClose(popover: Popover) { this.clearAll(); popover.hide(); }
  clearAll() { this.selectedObjs = []; this.syncOut(); }
  isItemSelected(item: any): boolean {
    const key = this.valueKey;
    return this.selectedObjs.some(x => x?.[key] === item?.[key]);
  }
  private afterPick() {
    this.searchQuery.set(''); this.suggestions.set([]); this.showSuggestions.set(false); this.highlightedIndex.set(-1);
    queueMicrotask(() => this.searchInput?.nativeElement.focus());
  }
  private syncOut() {
    // Compat objetos
    this.selected = [...this.selectedObjs];
    this.selectedChange.emit(this.selected);
    // CVA ids
    const ids = this.selectedObjs.map(o => String(o?.[this.valueKey])).filter(Boolean);
    this.valueIds = ids;
    this.onChange(ids);
    this.onTouched();
  }

  // Búsqueda/score (igual a tu lógica, podado a lo esencial)
  private performSearch(query: string) {
    const q = this.normalize(query.trim());
    if (!q || q.length < this.minChars) { this.suggestions.set([]); return; }

    const tokens = q.split(/\s+/).filter(Boolean);
    const scored: Array<{ score: number; ref: any; labelRanges: Array<[number, number]>; valueRanges: Array<[number, number]> }> = [];
    this.labelHtmlMap = new WeakMap(); this.valueHtmlMap = new WeakMap();

    for (const item of this.dataset) {
      const res = this.scoreItem(item, tokens);
      if (!res) continue;

      const labelRaw = item.fieldsRaw[this.labelKey] ?? '';
      const valueRaw = item.fieldsRaw[this.valueKey] ?? '';

      const labelHtml = this.highlightHTML(labelRaw, item.fieldsMap[this.labelKey] ?? [], res.labelRanges);
      const valueHtml = this.highlightHTML(valueRaw, item.fieldsMap[this.valueKey] ?? [], res.valueRanges);

      this.labelHtmlMap.set(item.ref, this.sanitizer.bypassSecurityTrustHtml(labelHtml));
      this.valueHtmlMap.set(item.ref, this.sanitizer.bypassSecurityTrustHtml(valueHtml));

      scored.push({ score: res.total, ref: item.ref, labelRanges: res.labelRanges, valueRanges: res.valueRanges });
    }

    scored.sort((a, b) => b.score - a.score || String(a.ref[this.labelKey] ?? '').localeCompare(String(b.ref[this.labelKey] ?? '')));
    this.suggestions.set(scored.slice(0, this.maxResults).map(s => s.ref));
    this.highlightedIndex.set(-1);
  }

  labelHTML = (item: any): SafeHtml =>
    this.labelHtmlMap.get(item) ?? this.sanitizer.bypassSecurityTrustHtml(this.escapeHTML(String(item?.[this.labelKey] ?? '')));

  valueHTML = (item: any): SafeHtml =>
    this.valueHtmlMap.get(item) ?? this.sanitizer.bypassSecurityTrustHtml(this.escapeHTML(String(item?.[this.valueKey] ?? '')));

  private precompute() {
    const keys = Array.from(new Set([...this.searchKeys, this.labelKey, this.valueKey]));
    this.dataset = (this.items ?? []).map(ref => {
      const fieldsRaw: Record<string, string> = {};
      const fieldsNorm: Record<string, string> = {};
      const fieldsMap: Record<string, number[]> = {};
      for (const k of keys) {
        const raw = String(ref?.[k] ?? '');
        fieldsRaw[k] = raw;
        const { norm, map } = this.normalizeWithMap(raw);
        fieldsNorm[k] = norm; fieldsMap[k] = map;
      }
      return { ref, fieldsRaw, fieldsNorm, fieldsMap };
    });
  }

  private scoreItem(node: any, tokens: string[]): { total: number; labelRanges: Array<[number, number]>; valueRanges: Array<[number, number]> } | null {
    let total = 0;
    const rangesByKey: Record<string, Array<[number, number]>> = {};
    for (const k of this.searchKeys) rangesByKey[k] = [];

    for (const token of tokens) {
      let best = { ok: false, score: 0, key: '', ranges: [] as Array<[number, number]> };
      for (const k of this.searchKeys) {
        const result = this.bestTokenScoreInText(token, node.fieldsNorm[k] ?? '');
        if (result.ok && result.score > best.score) best = { ...result, key: k };
      }
      if (!best.ok) return null;
      total += best.score;
      if (best.ranges.length) rangesByKey[best.key].push(...best.ranges);
    }

    const labelNorm = node.fieldsNorm[this.labelKey] ?? '';
    const queryNorm = tokens.join(' ');
    if (labelNorm.startsWith(queryNorm)) total += 1;

    return {
      total,
      labelRanges: this.mergeRanges(rangesByKey[this.labelKey] ?? []),
      valueRanges: this.mergeRanges(rangesByKey[this.valueKey] ?? []),
    };
  }

  private bestTokenScoreInText(token: string, normText: string): { ok: boolean; score: number; ranges: Array<[number, number]> } {
    const hits = this.findAllSubstrings(normText, token);
    if (hits.length) {
      let score = 0;
      for (const [a] of hits) {
        const atStart = a === 0;
        const prev = a > 0 ? normText[a - 1] : ' ';
        const boundary = /\s|[.,;:/()\\-_'"]/.test(prev);
        score = Math.max(score, atStart ? 5 : boundary ? 4 : 3);
      }
      return { ok: true, score, ranges: hits };
    }
    const subseq = this.isSubsequence(token, normText);
    if (subseq) {
      const ranges: Array<[number, number]> = [];
      let start = subseq[0], prev = subseq[0];
      for (let i = 1; i < subseq.length; i++) {
        if (subseq[i] !== prev + 1) { ranges.push([start, prev + 1]); start = subseq[i]; }
        prev = subseq[i];
      }
      ranges.push([start, prev + 1]);
      return { ok: true, score: 2, ranges };
    }
    if (token.length >= 3) {
      const words = normText.split(/\s+/);
      for (const word of words) {
        if (!word) continue;
        if (Math.abs(word.length - token.length) > 1) continue;
        if (this.levenshtein(token, word) <= 1) return { ok: true, score: 1.5, ranges: [] };
      }
    }
    return { ok: false, score: 0, ranges: [] };
  }

  // Utils texto
  private normalize(s: string): string {
    return (s ?? '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }
  private normalizeWithMap(str: string): { norm: string; map: number[] } {
    const map: number[] = []; let norm = '';
    for (let i = 0; i < str.length; i++) {
      const base = str[i].normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      for (let j = 0; j < base.length; j++) { norm += base[j].toLowerCase(); map.push(i); }
    }
    return { norm, map };
  }
  private isSubsequence(needle: string, hay: string): number[] | null {
    const positions: number[] = []; let j = 0;
    for (let i = 0; i < hay.length && j < needle.length; i++) if (hay[i] === needle[j]) { positions.push(i); j++; }
    return j === needle.length ? positions : null;
  }
  private levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    const dp = Array(n + 1); for (let j = 0; j <= n; j++) dp[j] = j;
    for (let i = 1; i <= m; i++) { let prev = dp[0]; dp[0] = i;
      for (let j = 1; j <= n; j++) { const tmp = dp[j];
        dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = tmp; } }
    return dp[n];
  }
  private findAllSubstrings(text: string, token: string): Array<[number, number]> {
    const out: Array<[number, number]> = []; if (!token) return out;
    let idx = text.indexOf(token); while (idx !== -1) { out.push([idx, idx + token.length]); idx = text.indexOf(token, idx + 1); }
    return out;
  }
  private mergeRanges(ranges: Array<[number, number]>): Array<[number, number]> {
    if (!ranges.length) return []; ranges.sort((a,b)=>a[0]-b[0]);
    const merged = [ranges[0].slice() as [number, number]];
    for (let i=1;i<ranges.length;i++){const prev=merged[merged.length-1], cur=ranges[i]; if(cur[0]<=prev[1]) prev[1]=Math.max(prev[1],cur[1]); else merged.push(cur.slice() as [number,number]);}
    return merged;
  }
  private highlightHTML(original: string, map: number[], rangesNorm: Array<[number, number]>): string {
    if (!original) return ''; if (!rangesNorm.length) return this.escapeHTML(original);
    const rangesOrig = rangesNorm.map(([a,b]) => [map[a], map[b-1]+1] as [number,number]);
    const merged = this.mergeRanges(rangesOrig); let out = ''; let cur = 0;
    for (const [s,e] of merged) { if (cur < s) out += this.escapeHTML(original.slice(cur, s)); out += `<mark>${this.escapeHTML(original.slice(s, e))}</mark>`; cur = e; }
    if (cur < original.length) out += this.escapeHTML(original.slice(cur)); return out;
  }
  private escapeHTML(s: string): string {
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  }
}
