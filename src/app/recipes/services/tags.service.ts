import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { TagDto } from '../models/tag-dto.model';

@Injectable({ providedIn: 'root' })
export class TagsService {
  private readonly url = 'http://localhost:8080/tags';

  constructor(private http: HttpClient) {}

  getAll(): Observable<TagDto[]> {
    return this.http.get<{ tag: string }[]>(this.url).pipe(
      map(response => response.map(item => ({ name: item.tag })))
    );
  }
}
