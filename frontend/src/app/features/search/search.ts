import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { SearchResponse, SearchResultItem, SearchService } from '../../core/services/search.service';
import { LanguageService } from '../../core/services/language.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { Breadcrumb } from '../../shared/breadcrumb/breadcrumb';

@Component({
  selector: 'app-search-page',
  imports: [CommonModule, FormsModule, RouterLink, Breadcrumb, TranslatePipe, DecimalPipe],
  templateUrl: './search.html',
  styleUrl: './search.scss',
})
export class SearchPage implements OnInit {
  private readonly searchService = inject(SearchService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly lang = inject(LanguageService);

  readonly query = signal('');
  readonly scope = signal<'all' | 'titles' | 'verses'>('all');
  readonly selectedDiwan = signal('');
  readonly loading = signal(false);
  readonly response = signal<SearchResponse | null>(null);

  readonly results = computed(() => this.response()?.results ?? []);
  readonly total = computed(() => this.response()?.total ?? 0);

  readonly quickChips = computed(() => {
    const c = this.lang.currentCode();
    if (c === 'wo') {
      return ['bismillahi', 'D01K08', "a'oûzou", 'diwan 1', 'xassida'];
    } else if (c === 'en') {
      return ['bismillahi', 'D01K08', "a'oûzou", 'diwan 1', 'quranic', 'acrostic'];
    } else if (c === 'ar') {
      return ['الله', 'D01K08', 'طوبى', 'الشيطان', 'القرآن'];
    }
    return ['bismillahi', 'D01K08', "a'oûzou", 'diwan 1', 'coranique', 'acrostiche'];
  });

  constructor() {
    const title = inject(Title);
    effect(() => {
      title.setTitle(`${this.lang.t('search.title')} | Diwan`);
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const q = params.get('q') ?? '';
      const sc = (params.get('scope') as 'all' | 'titles' | 'verses') ?? 'all';
      const d = params.get('diwan') ?? '';

      if (q !== this.query() || sc !== this.scope() || d !== this.selectedDiwan()) {
        this.query.set(q);
        this.scope.set(sc);
        this.selectedDiwan.set(d);
        if (q.trim().length >= 2) {
          this.executeSearch(q, sc, d);
        }
      }
    });
  }

  onSubmit(): void {
    const q = this.query().trim();
    if (!q) return;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q,
        scope: this.scope() !== 'all' ? this.scope() : null,
        diwan: this.selectedDiwan() || null,
      },
      queryParamsHandling: 'merge',
    });

    this.executeSearch(q, this.scope(), this.selectedDiwan());
  }

  setScope(scope: 'all' | 'titles' | 'verses'): void {
    this.scope.set(scope);
    if (this.query().trim().length >= 2) {
      this.onSubmit();
    }
  }

  quickSearch(term: string): void {
    this.query.set(term);
    this.onSubmit();
  }

  private executeSearch(q: string, scope: 'all' | 'titles' | 'verses', diwan: string): void {
    if (q.trim().length < 2) return;
    this.loading.set(true);

    this.searchService.search(q, scope, diwan).subscribe({
      next: (res) => {
        this.response.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
