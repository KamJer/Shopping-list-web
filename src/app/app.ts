import { Component, inject, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TokenService } from './core/services/token.service';
import { ShoppingListDataService } from './shopping-list/services/shopping-list-data.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [NgIf, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly shoppingListData = inject(ShoppingListDataService);
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
      console.warn('Wylogowanie odrzucone przez backend (/user/logout != true).');
    } catch (err) {
      console.error('Błąd podczas /user/logout', err);
    }
  }
}
