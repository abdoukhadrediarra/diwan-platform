import { Component, computed, effect, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { DiwanApi } from '../../../core/services/diwan-api.service';
import { Loadable, loadable } from '../../../core/api';
import { DiwanDetail } from '../../../core/models/api.model';
import { PoemSummary } from '../../../core/models/api.model';
import { FavoritesService } from '../../../core/services/favorites.service';
import { normalizeArabic } from '../../../core/arabic';
import { Breadcrumb } from '../../../shared/breadcrumb/breadcrumb';
import { NotFound } from '../../../shared/not-found/not-found';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-diwan-detail',
  imports: [DecimalPipe, RouterLink, Breadcrumb, NotFound, TranslatePipe],
  templateUrl: './diwan-detail.html',
  styleUrl: './diwan-detail.scss',
})
export class DiwanDetailPage {
  private readonly api = inject(DiwanApi);
  protected readonly favorites = inject(FavoritesService);
  protected readonly diwan = toSignal(
    inject(ActivatedRoute).paramMap.pipe(switchMap((p) => loadable(this.api.diwan(p.get('diwan') ?? '')))),
    { initialValue: { state: 'loading' } as Loadable<DiwanDetail> },
  );

  protected readonly query = signal('');

  protected readonly poems = computed(() => {
    const d = this.diwan();
    if (d.state !== 'ready') return [];
    const q = normalizeArabic(this.query());
    return q ? d.data.poems.filter((p) => normalizeArabic(p.title).includes(q) || String(p.number) === q) : d.data.poems;
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
