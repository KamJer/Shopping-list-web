import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { RecipeRequestDto } from './models/recipe-request-dto.model';
import { RecipeDto } from './models/recipe-dto.model';
import { PageResult } from './models/page-result.model';
import { adaptRecipePageResult, adaptSingleRecipeResponse } from './adapters/recipe-http-response.adapter';

export interface Pageable {
  page: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class RecipesService {
  private readonly baseUrl = '/recipe';

  constructor(private http: HttpClient) {}

  getAll(pageable: Pageable): Observable<PageResult<RecipeDto>> {
    return this.http
      .get<unknown>(this.baseUrl, { params: this.toHttpParams(pageable) })
      .pipe(map(res => adaptRecipePageResult(res)));
  }

  getByName(query: string, pageable: Pageable): Observable<PageResult<RecipeDto>> {
    const q = query.trim();

    if (!q) {
      return this.getAll(pageable);
    }

    const url = `${this.baseUrl}/name/${encodeURIComponent(q)}`;
    return this.http
      .get<unknown>(url, { params: this.toHttpParams(pageable) })
      .pipe(map(res => adaptRecipePageResult(res)));
  }

  getByIngredients(
    ingredients: string[],
    pageable: Pageable
  ): Observable<PageResult<RecipeDto>> {
    const url = `${this.baseUrl}/ingredients`;
    return this.http
      .post<unknown>(url, ingredients, { params: this.toHttpParams(pageable) })
      .pipe(map(res => adaptRecipePageResult(res)));
  }

  getByTags(tags: string[], pageable: Pageable): Observable<PageResult<RecipeDto>> {
    const url = `${this.baseUrl}/tag`;
    return this.http
      .post<unknown>(url, tags, { params: this.toHttpParams(pageable) })
      .pipe(map(res => adaptRecipePageResult(res)));
  }

  getById(id: string | number): Observable<RecipeDto> {
    const url = `${this.baseUrl}/id/${encodeURIComponent(String(id))}`;
    return this.http.get<unknown>(url).pipe(map(res => adaptSingleRecipeResponse(res)));
  }

  getRecipesForUser(pageable: Pageable): Observable<PageResult<RecipeDto>> {
    const url = `${this.baseUrl}/user`;
    return this.http
      .get<unknown>(url, { params: this.toHttpParams(pageable) })
      .pipe(map(res => adaptRecipePageResult(res)));
  }

  saveRecipe(recipe: RecipeDto): Observable<unknown> {
    if (recipe.recipeId === undefined) {
      return this.http.put<unknown>(this.baseUrl, recipe);
    }
    return this.http.post<unknown>(this.baseUrl, recipe);
  }

  deleteRecipe(recipeId: string | number): Observable<unknown> {
    const url = `${this.baseUrl}/${encodeURIComponent(String(recipeId))}`;
    return this.http.delete<unknown>(url);
  }

  private toHttpParams(pageable: Pageable): HttpParams {
    return new HttpParams().set('page', String(pageable.page)).set('size', String(pageable.size));
  }
}
