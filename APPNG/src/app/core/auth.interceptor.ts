import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { decrypt } from '../config/crypto';
import { AuthService } from '../pages/login/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const encryptedToken = sessionStorage.getItem('TOKEN');
  const decryptedToken = encryptedToken ? decrypt(encryptedToken) : null;

  const authRequest = decryptedToken
    ? request.clone({
        setHeaders: {
          Authorization: `Bearer ${decryptedToken}`,
        },
      })
    : request;

  return next(authRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      const isLoginRequest = request.url.includes('/login');
      if (!isLoginRequest && (error.status === 401 || error.status === 403)) {
        authService.signOut();
      }
      return throwError(() => error);
    }),
  );
};
