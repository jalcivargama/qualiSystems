import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AuthService } from "../pages/login/auth.service";
import { catchError, Observable, tap, throwError } from "rxjs";
import { decrypt } from "../config/crypto";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const encryptedToken = sessionStorage.getItem('TOKEN');
    const decryptedToken = encryptedToken ? decrypt(encryptedToken) : null;

    const clonedRequest = decryptedToken
      ? request.clone({
          setHeaders: {
            Authorization: `Bearer ${decryptedToken}`
          }
        })
      : request;

    return next.handle(clonedRequest);
  }
}
