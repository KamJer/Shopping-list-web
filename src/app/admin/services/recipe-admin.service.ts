import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, timeout } from 'rxjs';
import { RecipeDto } from '../../recipes/models/recipe-dto.model';
import { PageResult } from '../../recipes/models/page-result.model';
import { adaptRecipePageResult } from '../../recipes/adapters/recipe-http-response.adapter';

const ADMIN_REQUEST_TIMEOUT_MS = 10000;

export interface Pageable {
  page: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class RecipeAdminService {
  private readonly baseUrl = '/recipe';

  constructor(private http: HttpClient) {}

  /** Wszystkie przepisy, w tym niepublikowane (tylko ADMIN). */
  getAll(pageable: Pageable): Observable<PageResult<RecipeDto>> {
    const params = new HttpParams()
      .set('page', String(pageable.page))
      .set('size', String(pageable.size));
    return this.http
      .get<unknown>(`${this.baseUrl}/admin/all`, { params })
      .pipe(
        timeout(ADMIN_REQUEST_TIMEOUT_MS),
        map(res => adaptRecipePageResult(res))
      );
  }

  changePublished(recipeId: string | number, published: boolean): Observable<boolean> {
    const url = `${this.baseUrl}/${encodeURIComponent(String(recipeId))}/published`;
    return this.http.patch<boolean>(url, published);
  }

  deleteRecipe(recipeId: string | number): Observable<unknown> {
    const url = `${this.baseUrl}/${encodeURIComponent(String(recipeId))}`;
    return this.http.delete<unknown>(url);
  }
}
