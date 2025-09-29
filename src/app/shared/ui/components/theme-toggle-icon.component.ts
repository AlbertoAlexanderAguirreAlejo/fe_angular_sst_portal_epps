// src/app/shared/ui/components/theme-toggle-icon.component.ts
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { GradientBorderDirective } from '@shared/ui/directives/gradient-border.directive'

@Component({
  selector: 'app-theme-toggle-icon',
  standalone: true,
  imports: [CommonModule, ButtonModule, RippleModule, GradientBorderDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .spin { transition: transform .25s ease; }
    .spin.on  { transform: rotate(180deg) scale(1.05); }
    .spin.off { transform: rotate(0deg)   scale(1.00); }
  `],
  template: `
    <button type="button"
            pButton
            appGradientBorder
            class="p-button-text p-button-rounded"
            (click)="toggle()"
            [attr.aria-label]="isDark ? 'Cambiar a claro' : 'Cambiar a oscuro'">
      <i class="pi spin" [ngClass]="isDark ? 'pi-sun on' : 'pi-moon off'"></i>
    </button>
  `
})
export class ThemeToggleIconComponent {
  isDark = false;

  ngOnInit() { this.restore(); }

  toggle() {
    this.isDark = !this.isDark;
    this.apply();
    localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
  }

  private apply() {
    const root = document.documentElement; // <html>
    this.isDark ? root.classList.add('dark') : root.classList.remove('dark');
  }

  private restore() {
    const saved = localStorage.getItem('theme');
    this.isDark = saved ? saved === 'dark' : window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    this.apply();
  }
}
