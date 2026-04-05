import { HttpInterceptorFn } from '@angular/common/http';

/** Wszystkie żądania HTTP z cookies (sesja / refresh HttpOnly na tym samym originie). */
export const withCredentialsInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.clone({ withCredentials: true }));
