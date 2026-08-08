import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';
import { UserAdmin } from '../models/user-admin.model';
import { UserRole } from '../../core/models/user-info.model';

const ADMIN_REQUEST_TIMEOUT_MS = 10000;

@Injectable({ providedIn: 'root' })
export class UserAdminService {
  private readonly url = '/user';

  constructor(private http: HttpClient) {}

  getAll(): Observable<UserAdmin[]> {
    return this.http
      .get<UserAdmin[]>(`${this.url}/all`)
      .pipe(timeout(ADMIN_REQUEST_TIMEOUT_MS));
  }

  changeRole(userName: string, role: UserRole): Observable<void> {
    return this.http.patch<void>(
      `${this.url}/${encodeURIComponent(userName)}/role/${role}`,
      null
    );
  }

  changePassword(userName: string, password: string): Observable<void> {
    return this.http.patch<void>(
      `${this.url}/${encodeURIComponent(userName)}/password`,
      { password }
    );
  }

  deleteUser(userName: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${encodeURIComponent(userName)}`);
  }
}
