import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api';
import { CorpusOverview, DiwanDetail, DiwanSummary, PoemDetail } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class DiwanApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  corpus(): Observable<CorpusOverview> {
    return this.http.get<CorpusOverview>(`${this.base}/corpus/`);
  }

  diwans(): Observable<DiwanSummary[]> {
    return this.http.get<DiwanSummary[]>(`${this.base}/diwans/`);
  }

  diwan(slug: string): Observable<DiwanDetail> {
    return this.http.get<DiwanDetail>(`${this.base}/diwans/${encodeURIComponent(slug)}/`);
  }

  poem(diwanSlug: string, poemSlug: string): Observable<PoemDetail> {
    return this.http.get<PoemDetail>(
      `${this.base}/diwans/${encodeURIComponent(diwanSlug)}/poems/${encodeURIComponent(poemSlug)}/`,
    );
  }
}
