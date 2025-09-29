import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDark = signal(false);

  private apply() {
    const html = document.documentElement; // <html>
    this.isDark() ? html.classList.add('dark') : html.classList.remove('dark');
  }

  // useSystemOnFirstLoad: si no hay preferencia guardada,
  // - true  -> usa prefers-color-scheme
  // - false -> usa 'light' (o lo que prefieras)
  init({ useSystemOnFirstLoad = false }: { useSystemOnFirstLoad?: boolean } = {}) {
    const saved = localStorage.getItem('theme'); // 'dark' | 'light' | null
    const initialDark = saved
      ? saved === 'dark'
      : (useSystemOnFirstLoad ? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false)
                              : false); // 👈 por defecto "light", sin depender del sistema

    this.isDark.set(initialDark);
    this.apply();

    window.addEventListener('storage', (ev) => {
      if (ev.key === 'theme' && ev.newValue) {
        this.isDark.set(ev.newValue === 'dark');
        this.apply();
      }
    });
  }

  set(dark: boolean, remember = true) {
    this.isDark.set(dark);
    this.apply();
    if (remember) localStorage.setItem('theme', dark ? 'dark' : 'light');
  }

  toggle() { this.set(!this.isDark()); }
}
