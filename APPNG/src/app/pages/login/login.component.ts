import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { LoginDto } from './models/login.dto';
import { ApiResponse } from '../../shared/models/response.type';
import { LoginResponseDto } from './models/login.response.dto';
import { Codigos } from '../../shared/enum/codigos.enum';
import { ToastService } from '../../core/toast.service';
import { transformInputToUpperCase } from '../../shared/functions/input.functions';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {

  transformToUpperCase = transformInputToUpperCase

  readonly toastService = inject(ToastService);
  
  loginForm: FormGroup;

  showPassword = false;
  formError = '';
  error = '';

  constructor(private readonly authService: AuthService, private readonly router: Router) {
    
    /**
     * Inicialización del formulario de login
     */
    this.loginForm = new FormGroup({
      username: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required])
    });
  }

  submit(): void {
    this.formError = '';

    if(this.loginForm.invalid) return; 
    
    const loginDto : LoginDto = {
      username: this.loginForm.value.username,
      password: this.loginForm.value.password
    };

    this.authService.login(loginDto).subscribe({
      next: (response: ApiResponse<LoginResponseDto>) => {
        if(response.codigo === Codigos.EXITO){
          this.authService.setToken(response.body!.token);
          this.toastService.success('Inicio de sesión exitoso');

          void this.router.navigateByUrl('/dashboard');
        }else{
          this.error = response.msg;
          this.toastService.error(response.msg);
        }
      },
      error: (error) => {
        
      }
    })
  }
}
