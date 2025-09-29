import {
  Directive, ElementRef, Input, OnInit, OnChanges, OnDestroy,
  Renderer2, SimpleChanges,
} from '@angular/core';

@Directive({
  selector: '[appGradientBorder]',
})
export class GradientBorderDirective implements OnInit, OnChanges, OnDestroy {
  @Input() gbWidth = 2;
  @Input() gbRadius?: string;
  @Input() gbSpeed = '2s';

  /** Si la dejas undefined/null, usará --gb-stops global (styles.css). */
  @Input() gbColors?: string[];  // <- ya no tiene default aquí

  @Input() gbPauseOnHover = false;

  private styleInjected = false;
  private cleanupEnter?: () => void;
  private cleanupLeave?: () => void;
  private mo?: MutationObserver;
  private childMo?: MutationObserver;

  constructor(private el: ElementRef<HTMLElement>, private r: Renderer2) {}

  ngOnInit(): void {
    const host = this.el.nativeElement;
    this.ensureGlobalStyles();

    this.r.setAttribute(host, 'data-gb-border', '');

    const cs = getComputedStyle(host);
    if (cs.position === 'static') this.r.setStyle(host, 'position', 'relative');
    this.r.setStyle(host, 'zIndex', '0');

    // width/speed: si no hay variables globales, usa inputs como fallback
    this.r.setStyle(host, '--gb-width', `var(--gb-width, ${this.gbWidth}px)`);
    this.r.setStyle(host, '--gb-speed', `var(--gb-speed, ${this.gbSpeed})`);
    this.r.setStyle(host, '--gb-angle', '0deg');

    // Solo setear --gb-stops si el usuario pasó gbColors
    if (this.gbColors?.length) {
      this.r.setStyle(host, '--gb-stops', this.gbColors.join(', '));
    }

    this.syncBorderRadius();

    if (this.gbPauseOnHover) {
      this.cleanupEnter = this.r.listen(host, 'mouseenter', () => this.r.addClass(host, 'gb-paused'));
      this.cleanupLeave = this.r.listen(host, 'mouseleave', () => this.r.removeClass(host, 'gb-paused'));
    }

    this.mo = new MutationObserver(() => this.syncBorderRadius());
    this.mo.observe(host, { attributes: true, attributeFilter: ['class', 'style'], childList: true });
    const first = host.firstElementChild as HTMLElement | null;
    if (first) {
      this.childMo = new MutationObserver(() => this.syncBorderRadius());
      this.childMo.observe(first, { attributes: true, attributeFilter: ['class', 'style'] });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const host = this.el.nativeElement;
    if (changes['gbWidth']) this.r.setStyle(host, '--gb-width', `var(--gb-width, ${this.gbWidth}px)`);
    if (changes['gbSpeed']) this.r.setStyle(host, '--gb-speed', `var(--gb-speed, ${this.gbSpeed})`);
    if (changes['gbRadius']) this.syncBorderRadius();

    if (changes['gbColors']) {
      if (this.gbColors?.length) {
        this.r.setStyle(host, '--gb-stops', this.gbColors.join(', '));
      } else {
        // si el input se volvió undefined/null, dejamos que tome la global
        this.r.removeStyle(host, '--gb-stops');
      }
    }
  }

  ngOnDestroy(): void {
    this.cleanupEnter?.();
    this.cleanupLeave?.();
    this.mo?.disconnect();
    this.childMo?.disconnect();
  }

  private ensureGlobalStyles(): void {
    if (this.styleInjected) return;
    if (document.head.querySelector('style[data-gb-global]')) {
      this.styleInjected = true;
      return;
    }
    const styleEl = this.r.createElement('style') as HTMLStyleElement;
    styleEl.setAttribute('data-gb-global', '');
    styleEl.textContent = `
      [data-gb-border]{position:relative;z-index:0}
      [data-gb-border]::after{
        content:"";
        position:absolute; inset:0; border-radius:inherit;
        padding:var(--gb-width,2px);
        background:conic-gradient(from var(--gb-angle,0deg), var(--gb-stops));
        -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
        -webkit-mask-composite:xor; mask-composite:exclude;
        pointer-events:none; z-index:1;
        animation:gb-angle var(--gb-speed,2s) linear infinite;
      }
      @property --gb-angle{syntax:'<angle>';inherits:false;initial-value:0deg}
      @keyframes gb-angle{to{--gb-angle:360deg}}
      @media (prefers-reduced-motion: reduce){[data-gb-border]::after{animation:none!important}}
      .gb-paused::after{animation-play-state:paused!important}
    `;
    this.r.appendChild(document.head, styleEl);
    this.styleInjected = true;
  }

  private syncBorderRadius(): void {
    const host = this.el.nativeElement;
    if (this.gbRadius) { this.r.setStyle(host, 'borderRadius', this.gbRadius); return; }
    const hostBR = getComputedStyle(host).borderRadius;
    if (this.hasNonZeroRadius(hostBR)) { this.r.setStyle(host, 'borderRadius', hostBR); return; }
    const first = host.firstElementChild as HTMLElement | null;
    if (first) {
      const childBR = getComputedStyle(first).borderRadius;
      if (this.hasNonZeroRadius(childBR)) { this.r.setStyle(host, 'borderRadius', childBR); return; }
    }
    this.r.removeStyle(host, 'borderRadius');
  }

  private hasNonZeroRadius(v: string | null): boolean {
    if (!v) return false;
    return /[1-9]/.test(v);
  }
}
