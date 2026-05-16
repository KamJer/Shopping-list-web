import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { forwardedHeadersInterceptor } from './core/interceptors/forwarded-headers.interceptor';
import { withCredentialsInterceptor } from './core/interceptors/with-credentials.interceptor';
import { AuthSessionBootstrap } from './core/services/auth-session-bootstrap.service';
import { routes } from './app.routes';

function initAuthSession(bootstrap: AuthSessionBootstrap): () => Promise<void> {
  return () => bootstrap.refreshOnStartup();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([forwardedHeadersInterceptor, withCredentialsInterceptor, authInterceptor])
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: initAuthSession,
      deps: [AuthSessionBootstrap],
      multi: true
    },
    {
      provide: LocationStrategy,
      useClass: HashLocationStrategy
    }
  ]
};
