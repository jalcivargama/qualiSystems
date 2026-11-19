import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AuthService } from "../pages/login/auth.service";
import { catchError, Observable, tap, throwError } from "rxjs";
import { decrypt } from "../config/crypto";

@Injectable()
export class AuthInterceptor implements HttpInterceptor{

    constructor(
        private authService: AuthService
    ){}

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const encryptedToken = sessionStorage.getItem('TOKEN');
        
        const descryptedToken = encryptedToken ? decrypt(encryptedToken) : null;
    
        const clonedRequest = descryptedToken
          ? request.clone({
            setHeaders: {
              Authorization: `Bearer ${descryptedToken}`
            }
          })
          : request;
    
        return next.handle(clonedRequest).pipe(
          tap(event => {
            if (event instanceof HttpResponse) {
              const newToken = event.headers.get('Authorization');
              if (newToken) {
                const cleanToken = newToken.replace('Bearer ', '').trim();
                //sessionStorage.setItem('token', encrypt(cleanToken));
              }
            }
          }),
    
          // Manejo de errores
          catchError((error: HttpErrorResponse) => {
            // Si el error es 401 (no autorizado), redirige al login
            // Se limpia el almacenamiento local primer que todo para evitar
            // que el usuario interrumpa el flujo de la aplicación
            if (error.status === 401 && !request.url.includes('/auth/close-session')) {
              console.log('Sesión expirada');
            } else if (error.status === 403) {
              /* this.toastService.showToast({
                message: 'No tienes permisos para acceder a este recurso',
                type: 'warning',
                duration: 5000
              }); */
              console.log('No tienes permisos para acceder a este recurso');
            }
    
            // Retorna el error para que pueda ser manejado por el componente
            return throwError(() => error);
          })
        );
      }
}