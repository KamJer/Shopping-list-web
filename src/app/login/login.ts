import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { normalizeTokenResponse, TokenDto } from '../core/models/token-dto.model';
import { TokenService } from '../core/services/token.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  username: string = '';
  password: string = '';
  token: string = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private tokenService: TokenService
  ) {}

  /** Zapisuje sesję i przechodzi do listy, jeśli w `rawBody` jest token (jak z `/user/log`). */
  private tryFinishLogin(username: string, rawBody: unknown): boolean {
    const dto = normalizeTokenResponse(rawBody);
    if (!dto?.accessToken) {
      return false;
    }
    this.tokenService.setUserName(username);
    this.tokenService.persistAuthTokens(dto);
    void this.router.navigate(['/list']);
    return true;
  }

  onLogin() {
    const user = {
      userName: this.username,
      password: this.password
    };

    this.http.post<TokenDto>('/user/log', user).subscribe({
      next: (response) => {
        if (!this.tryFinishLogin(this.username, response)) {
          alert('Niepoprawny login lub hasło');
        }
      },
      error: (err) => {
        console.error(err);
        alert('Błąd logowania');
      }
    });
  }

  onRegister() {
    const data = {
      userName: this.username,
      password: this.password
    };

    /** `POST /user/register` — to samo DTO co logowanie; odpowiedź z tokenami jak `/user/log`. */
    this.http.post<TokenDto>('/user/register', data).subscribe({
      next: (response) => {
        if (!this.tryFinishLogin(this.username, response)) {
          alert('Rejestracja nie zwróciła tokenów — sprawdź odpowiedź serwisu.');
        }
      },
      error: (err) => {
        console.error('Błąd rejestracji', err);
        alert('Błąd rejestracji — sprawdź dane lub czy login jest wolny.');
      }
    });
  }
}
