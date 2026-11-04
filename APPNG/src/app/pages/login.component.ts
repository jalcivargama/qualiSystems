import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <main class="login-page">
      <section class="login-visual">
        <div class="brand-lockup">
          <img class="brand-mark" src="assets/ImgQualitasVertical_Transparente.png" alt="" />
          <span>Qualitas<span class="brand-light">/</span>systems</span>
        </div>
        <div class="visual-copy">
          <span class="eyebrow">ARQUITECTURA CONECTADA</span>
          <h1>Todo tu ecosistema.<br /><em>En una sola vista.</em></h1>
          <p>Conecta sistemas, equipos y decisiones con una fuente confiable para tu arquitectura.</p>
        </div>
        <div class="network-art" aria-hidden="true">
          <div class="network-orbit orbit-one"></div>
          <div class="network-orbit orbit-two"></div>
          <span class="network-node node-center">Q</span>
          <span class="network-node node-a">API</span>
          <span class="network-node node-b">DB</span>
          <span class="network-node node-c">SYS</span>
          <span class="network-node node-d">↗</span>
        </div>
        <div class="visual-foot"><span class="pulse-dot"></span> Catálogo de arquitectura empresarial</div>
      </section>

      <section class="login-form-area">
        <div class="login-card">
          <div class="mobile-brand"><img class="brand-mark" src="assets/ImgQualitasVertical_Transparente.png" alt="" /> Qualitas/systems</div>
          <span class="eyebrow">BIENVENIDO DE VUELTA</span>
          <h2>Inicia sesión</h2>
          <p class="login-subtitle">Ingresa tus credenciales para continuar al catálogo.</p>

          <form (ngSubmit)="submit()" #loginForm="ngForm">
            <label for="username">Usuario</label>
            <div class="input-wrap">
              <span aria-hidden="true">＠</span>
              <input id="username" name="username" [(ngModel)]="username" autocomplete="username" required placeholder="Tu usuario" />
            </div>

            <div class="password-label">
              <label for="password">Contraseña</label>
              <button type="button" class="text-button" (click)="showPassword = !showPassword">
                {{ showPassword ? 'Ocultar' : 'Mostrar' }}
              </button>
            </div>
            <div class="input-wrap">
              <span aria-hidden="true">⌑</span>
              <input id="password" name="password" [(ngModel)]="password" [type]="showPassword ? 'text' : 'password'" autocomplete="current-password" required placeholder="Tu contraseña" />
            </div>

            @if (error) {
              <div class="login-error" role="alert">{{ error }}</div>
            }
            <button class="login-submit" type="submit" [disabled]="loginForm.invalid">
              Entrar al catálogo <span aria-hidden="true">→</span>
            </button>
          </form>

          <div class="demo-credentials">
            <div class="demo-icon">i</div>
            <div>
              <strong>Acceso de demostración</strong>
              <p>Usuario: <code>admin</code> &nbsp;·&nbsp; Contraseña: <code>Admin123!</code></p>
            </div>
          </div>
          <p class="login-legal">Prototipo navegable · Los datos se guardan localmente en este navegador.</p>
        </div>
      </section>
    </main>
  `,
  styleUrl: './login.component.css',
})
export class LoginComponent {
  username = 'admin';
  password = '';
  showPassword = false;
  error = '';

  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  submit(): void {
    this.error = '';
    if (!this.auth.signIn(this.username, this.password)) {
      this.error = 'Usuario o contraseña incorrectos. Revisa las credenciales de demostración.';
      return;
    }
    void this.router.navigateByUrl('/dashboard');
  }
}
