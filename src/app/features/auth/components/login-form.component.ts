// src/app/features/auth/components/login-form.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, PasswordModule, IconFieldModule, InputIconModule],
  template: `
    <form (ngSubmit)="submit()" class="flex flex-col gap-5 w-full">
      <!-- Usuario -->
      <div class="flex flex-col gap-2 w-full">
        <label for="user" class="font-medium leading-normal">Usuario o email</label>
        <p-iconfield>
          <p-inputicon class="pi pi-user" />
          <input
            pInputText
            id="user"
            name="user"
            [(ngModel)]="user"
            type="text"
            placeholder="0199999999"
            class="w-full px-3 py-2 shadow-sm rounded-lg"
            autocomplete="username"
          />
        </p-iconfield>
      </div>

      <!-- Password con toggle -->
      <div class="flex flex-col gap-2 w-full">
        <label for="pass" class="font-medium leading-normal">Contraseña</label>
        <p-iconfield>
          <p-inputicon class="pi pi-key" />
          <p-password
            class="w-full"
            [(ngModel)]="pass"
            name="pass"
            [toggleMask]="true"
            [feedback]="false"
            inputId="pass"
            inputStyleClass="w-full px-3 py-2 rounded-lg"
            placeholder="••••••••"
            autocomplete="current-password">
          </p-password>
        </p-iconfield>
      </div>

      <!-- Acciones -->
      <button
        pButton
        type="submit"
        [label]="loading ? 'Ingresando…' : 'Iniciar sesión'"
        icon="pi pi-sign-in"
        [disabled]="loading"
        [rounded]="true">
      </button>
    </form>
  `
})
export class LoginFormComponent {
  @Input() loading = false;
  @Output() login = new EventEmitter<{ user: string; pass: string }>();

  user = '';
  pass = '';

  submit() {
    if (!this.user || !this.pass || this.loading) return;
    this.login.emit({ user: this.user, pass: this.pass });
  }
}
