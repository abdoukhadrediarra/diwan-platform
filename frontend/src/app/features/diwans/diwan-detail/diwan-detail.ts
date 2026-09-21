import { Component, computed, effect, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { DiwanApi } from '../../../core/services/diwan-api.service';
import { Loadable, loadable } from '../../../core/api';
import { DiwanDetail, PoemSummary } from '../../../core/models/api.model';
import { FavoritesService } from '../../../core/services/favorites.service';
import { normalizeArabic } from '../../../core/arabic';
import { LanguageService } from '../../../core/services/language.service';
import { Breadcrumb } from '../../../shared/breadcrumb/breadcrumb';
import { NotFound } from '../../../shared/not-found/not-found';

@Component({
  selector: 'app-diwan-detail',
  imports: [DecimalPipe, RouterLink, Breadcrumb, NotFound],
  templateUrl: './diwan-detail.html',
  styleUrl: './diwan-detail.scss',
})
export class DiwanDetailPage {
  private readonly api = inject(DiwanApi);
  protected readonly favorites = inject(FavoritesService);
  protected readonly i18n = inject(LanguageService);

  protected readonly diwan = toSignal(
    inject(ActivatedRoute).paramMap.pipe(switchMap((p) => loadable(this.api.diwan(p.get('diwan') ?? '')))),
    { initialValue: { state: 'loading' } as Loadable<DiwanDetail> },
  );

  protected readonly query = signal('');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = 50;

  protected readonly filteredPoems = computed(() => {
    const d = this.diwan();
    if (d.state !== 'ready') return [];
    const q = normalizeArabic(this.query());
    return q ? d.data.poems.filter((p) => normalizeArabic(p.title).includes(q) || String(p.number) === q) : d.data.poems;
  });

  protected readonly totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.filteredPoems().length / this.pageSize));
  });

  protected readonly pagesList = computed(() => {
    const count = this.totalPages();
    return Array.from({ length: count }, (_, i) => i + 1);
  });

  protected readonly poems = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredPoems().slice(start, start + this.pageSize);
  });

  protected readonly paginationInfo = computed(() => {
    const total = this.filteredPoems().length;
    if (total === 0) return '';
    const start = (this.currentPage() - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage() * this.pageSize, total);
    return this.i18n.t('pagination.showing')
      .replace('{start}', String(start))
      .replace('{end}', String(end))
      .replace('{total}', String(total));
  });

  constructor() {
    const title = inject(Title);
    effect(() => {
      const d = this.diwan();
      if (d.state === 'ready') title.setTitle(`${d.data.title} | Diwan ${d.data.number} | Diwan`);
    });
  }

  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  protected setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
      this.currentPage.set(page);
      this.scrollToTop();
    }
  }

  protected prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.scrollToTop();
    }
  }

  protected nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.scrollToTop();
    }
  }

  private scrollToTop(): void {
    if (typeof window !== 'undefined') {
      const el = document.querySelector('.list-tools') || document.querySelector('.poem-list');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  protected toggleFavorite(event: Event, poem: PoemSummary, diwan: DiwanDetail): void {
    event.preventDefault();
    event.stopPropagation();
    this.favorites.toggle({
      code: poem.code,
      number: poem.number,
      slug: poem.slug,
      title: poem.title,
      diwanSlug: diwan.slug,
      diwanNumber: diwan.number,
      baytCount: poem.bayt_count,
      isAcrostic: poem.is_acrostic,
    });
  }
}
