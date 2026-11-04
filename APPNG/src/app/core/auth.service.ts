import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

const SESSION_KEY = 'appng.mock.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly signedIn = signal(this.hasSession());

  constructor(private readonly router: Router) {}

  signIn(username: string, password: string): boolean {
    if (username.trim().toLowerCase() !== 'admin' || password !== 'Admin123!') return false;
    localStorage.setItem(SESSION_KEY, 'Administrador de catálogo');
    this.signedIn.set(true);
    return true;
  }

  signOut(): void {
    localStorage.removeItem(SESSION_KEY);
    this.signedIn.set(false);
    void this.router.navigateByUrl('/login');
  }

  get displayName(): string {
    return localStorage.getItem(SESSION_KEY) ?? 'Administrador';
  }

  hasSession(): boolean {
    return localStorage.getItem(SESSION_KEY) !== null;
  }
}
