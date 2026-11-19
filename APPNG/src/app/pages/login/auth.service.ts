import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { LoginDto } from './models/login.dto';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../shared/models/response.type';
import { LoginResponseDto } from './models/login.response.dto';
import { decrypt, encrypt } from '../../config/crypto';

const TOKEN = 'TOKEN';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly signedIn = signal(this.hasSession());
  
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private readonly router: Router
  ){}

  signOut(): void {
    sessionStorage.removeItem(TOKEN);
    this.signedIn.set(false);
    void this.router.navigateByUrl('/login');
  }

  get displayName(): string {
    return 'Administrador';
  }

  hasSession(): boolean {
    return sessionStorage.getItem(TOKEN) !== null;
  }



  login(loginDto: LoginDto) : Observable<ApiResponse<LoginResponseDto>>{
    return this.http.post<ApiResponse<LoginResponseDto>>(`${this.baseUrl}/login`, loginDto);
  }

  setToken(token: string): void {
    sessionStorage.setItem(TOKEN, encrypt(token));
  }

  encrypt(string: string) : string {
    return encrypt(string);
  }

  decrypt(string: string) : string {
    return decrypt(string);
  }
}
