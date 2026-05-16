import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Za HTTPS: wskazuje backendowi publiczny schemat i host, żeby przekierowania
 * (np. Spring) nie budowały Location jako http://…:9080 (mixed content przy stronie na HTTPS).
 * Działa, gdy reverse proxy przepuszcza te nagłówki upstream (albo nie nadpisuje ich błędnie).
 */
export const forwardedHeadersInterceptor: HttpInterceptorFn = (req, next) => {
  if (typeof globalThis.location === 'undefined') {
    return next(req);
  }
  if (globalThis.location.protocol !== 'https:') {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        'X-Forwarded-Proto': 'https',
        'X-Forwarded-Host': globalThis.location.host
      }
    })
  );
};
