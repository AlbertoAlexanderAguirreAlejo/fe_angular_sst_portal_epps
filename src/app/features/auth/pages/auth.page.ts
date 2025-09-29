// src/app/features/auth/pages/auth.page.ts
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';

import { AuthService } from '@core/services/auth/auth.service';
import { LoginFormComponent } from '../components/login-form.component';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, CardModule, DividerModule, LoginFormComponent],
  template: `
    <!-- Fondo -->
    <div class="fixed inset-0 overflow-hidden">
      <div class="absolute inset-0 bg-cover bg-center" [style.background-image]="'url(' + bgUrl + ')'"></div>
      <div class="absolute inset-0 bg-gradient-to-b from-slate-900/20 to-slate-950/45"></div>
    </div>

    <!-- Contenido -->
    <div class="relative min-h-screen flex items-center justify-center">
      <p-card class="p-3 shadow-sm w-full max-w-sm mx-auto flex flex-col" [style]="{ borderRadius: '2rem' }">
        <p class="text-2xl font-bold leading-tight text-center w-full mb-5">Portal EPPs</p>

        <app-login-form
          [loading]="loading()"
          (login)="onLogin($event)"
        />

        <p-divider />
        <p class="text-center text-sm">Agroindustrial Paramonga S.A.</p>
      </p-card>
    </div>
  `
})
export class AuthPage {
  private auth = inject(AuthService);
  private router = inject(Router);

  bgUrl = 'assets/background.webp';
  loading = signal(false);

  async onLogin({ user, pass }: { user: string; pass: string }) {
    if (this.loading()) return;
    this.loading.set(true);
    try {
      await this.auth.login(user, pass);
      this.router.navigateByUrl('/reports');
    } finally {
      this.loading.set(false);
    }
  }
}
