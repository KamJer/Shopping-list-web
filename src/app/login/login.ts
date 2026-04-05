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

  onLogin() {
    const user = {
    userName: this.username,
    password: this.password
  };

  this.http.post<TokenDto>('/user/log', user)
    .subscribe({
      next: (response) => {
        const dto = normalizeTokenResponse(response);
        if (dto?.accessToken) {
          this.tokenService.setUserName(this.username);
          this.tokenService.persistAuthTokens(dto);
          this.router.navigate(['/list']);
        } else {
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

    this.http.post('/user', data)
      .subscribe({
        next: () => {},
        error: (err) => {
          console.error('Błąd rejestracji', err);
        }
      });
  }
}