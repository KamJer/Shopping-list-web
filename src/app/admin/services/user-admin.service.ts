import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';
import { UserAdmin } from '../models/user-admin.model';
import { UserRole } from '../../core/models/user-info.model';
import { WITH_CREDENTIALS } from '../../core/http-context-keys';

const ADMIN_REQUEST_TIMEOUT_MS = 10000;
const credentialsContext = new HttpContext().set(WITH_CREDENTIALS, true);

@Injectable({ providedIn: 'root' })
export class UserAdminService {
  private readonly url = '/user';

  constructor(private http: HttpClient) {}

  getAll(): Observable<UserAdmin[]> {
    return this.http
      .get<UserAdmin[]>(`${this.url}/all`, { context: credentialsContext })
      .pipe(timeout(ADMIN_REQUEST_TIMEOUT_MS));
  }

  changeRole(userName: string, role: UserRole): Observable<void> {
    return this.http.patch<void>(
      `${this.url}/${encodeURIComponent(userName)}/role/${role}`,
      null,
      { context: credentialsContext }
    );
  }

  changePassword(userName: string, password: string): Observable<void> {
    return this.http.patch<void>(
      `${this.url}/${encodeURIComponent(userName)}/password`,
      { password },
      { context: credentialsContext }
    );
  }

  deleteUser(userName: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${encodeURIComponent(userName)}`, { context: credentialsContext });
  }
}
