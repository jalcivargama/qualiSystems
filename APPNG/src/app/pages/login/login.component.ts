import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
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
