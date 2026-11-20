import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => localStorage.clear());

  it('accepts the documented demo credentials and stores a mock session', () => {
    expect(auth.signIn('admin', 'Admin123!')).toBe(true);
    expect(auth.signedIn()).toBe(true);
    expect(auth.displayName).toBe('Administrador de catálogo');
  });

  it('rejects invalid credentials', () => {
    expect(auth.signIn('admin', 'incorrecta')).toBe(false);
    expect(auth.signedIn()).toBe(false);
  });
});
