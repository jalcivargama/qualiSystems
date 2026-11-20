import { HttpInterceptorFn } from '@angular/common/http';
import { decrypt } from '../config/crypto';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const encryptedToken = sessionStorage.getItem('TOKEN');
  const decryptedToken = encryptedToken ? decrypt(encryptedToken) : null;

  if (!decryptedToken) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${decryptedToken}`,
      },
    }),
  );
};
