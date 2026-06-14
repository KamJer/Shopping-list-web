import { Component, inject, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TokenService } from './core/services/token.service';
import { ShoppingListDataService } from './shopping-list/services/shopping-list-data.service';
import { NotificationService } from './core/services/notification';
import { NotificationBanner } from './core/components/notification-banner';
import { firstValueFrom } from 'rxjs';

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

  protected async logout(): Promise<void> {
    try {
      const ok = await firstValueFrom(this.http.get<boolean>('/user/logout'));
      if (ok === true) {
        this.shoppingListData.clearSessionForLogout();
        this.tokenService.clearAuth();
        await this.router.navigateByUrl('/');
        return;
      }
      this.notify.show('Wylogowanie nie powiodło się', 'warn');
    } catch (err) {
      this.notify.show('Błąd wylogowania', 'error');
    }
  }
}
