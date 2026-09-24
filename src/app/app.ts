import { Component, inject, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TokenService } from './core/services/token.service';
import { ShoppingListDataService } from './shopping-list/services/shopping-list-data.service';
import { NotificationService } from './core/services/notification';
import { NotificationBanner } from './core/components/notification-banner';
import { Messages } from './core/messages';
import { firstValueFrom } from 'rxjs';
import { WITH_CREDENTIALS } from './core/http-context-keys';

@Component({
  selector: 'app-root',
  imports: [NgIf, RouterOutlet, RouterLink, RouterLinkActive, NotificationBanner],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly shoppingListData = inject(ShoppingListDataService);
  private readonly notify = inject(NotificationService);
  protected readonly title = signal('ShoppingListWeb');

  protected showMenu(): boolean {
    const path = this.router.url.split('?')[0];
    return path !== '/';
  }

  protected isAdmin(): boolean {
    return this.tokenService.isAdmin();
  }

  protected async logout(): Promise<void> {
    try {
      const context = new HttpContext().set(WITH_CREDENTIALS, true);
      const ok = await firstValueFrom(this.http.get<boolean>('/user/logout', { context }));
      if (ok === true) {
        this.shoppingListData.clearSessionForLogout();
        this.tokenService.clearAuth();
        await this.router.navigateByUrl('/');
        return;
      }
      this.notify.show(Messages.auth.logoutFailed, 'warn');
    } catch (err) {
      this.notify.show(Messages.auth.logoutError, 'error');
    }
  }
}
