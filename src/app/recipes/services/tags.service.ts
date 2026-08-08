import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TagsService {
  private readonly url = '/tags';
  private readonly textHeaders = new HttpHeaders({ 'Content-Type': 'text/plain' });

  constructor(private http: HttpClient) {}

  getAll(): Observable<string[]> {
    return this.http.get<string[]>(this.url);
  }

  create(tag: string): Observable<string> {
    return this.http.post<string>(this.url, tag, { headers: this.textHeaders });
  }

  update(oldTag: string, newTag: string): Observable<string> {
    const encoded = encodeURIComponent(oldTag);
    return this.http.put<string>(`${this.url}/${encoded}`, newTag, {
      headers: this.textHeaders
    });
  }

  delete(tag: string): Observable<void> {
    const encoded = encodeURIComponent(tag);
    return this.http.delete<void>(`${this.url}/${encoded}`);
  }
}
