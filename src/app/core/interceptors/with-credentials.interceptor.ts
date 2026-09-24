import { HttpInterceptorFn } from '@angular/common/http';
import { WITH_CREDENTIALS } from '../http-context-keys';

/** Ustawia withCredentials tylko dla requestów oznaczonych z HttpContext. */
export const withCredentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const needCredentials = req.context.get(WITH_CREDENTIALS);
  if (needCredentials) {
    return next(req.clone({ withCredentials: true }));
  }
  return next(req);
};
