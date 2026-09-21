import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

export interface SearchResultLine {
  bayt_number: number | null;
  position: number;
  kind: string;
  hemistichs: string[];
  transcription?: string;
}

export interface SearchResultItem {
  diwan_number: number;
  diwan_slug: string;
  diwan_title: string;
  poem_number: number;
  poem_slug: string;
  poem_code: string;
  poem_title: string;
  bayt_count: number;
  is_acrostic: boolean;
  match_type: 'title' | 'verse';
  matched_lines: SearchResultLine[];
}

export interface SearchResponse {
  query: string;
  normalized_query: string;
  scope: string;
  total: number;
  results: SearchResultItem[];
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/search/';

  search(query: string, scope: 'all' | 'titles' | 'verses' = 'all', diwan = ''): Observable<SearchResponse> {
    const q = query.trim();
    if (!q || q.length < 2) {
      return of({
        query: q,
        normalized_query: '',
        scope,
        total: 0,
        results: [],
      });
    }

    let params = new HttpParams()
      .set('q', q)
      .set('scope', scope);

    if (diwan) {
      params = params.set('diwan', diwan);
    }

    return this.http.get<SearchResponse>(this.baseUrl, { params }).pipe(
      catchError((err) => {
        const message = err?.error?.error || 'Une erreur est survenue lors de la recherche.';
        return of({
          query: q,
          normalized_query: '',
          scope,
          total: 0,
          results: [],
          error: message,
        });
      })
    );
  }
}
