import { Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { DiwanApi } from '../../../core/services/diwan-api.service';
import { Loadable, loadable } from '../../../core/api';
import { CorpusService } from '../../../core/services/corpus.service';
import { DiwanSummary } from '../../../core/models/api.model';
import { Breadcrumb } from '../../../shared/breadcrumb/breadcrumb';

@Component({
  selector: 'app-diwan-list',
  imports: [DecimalPipe, RouterLink, Breadcrumb],
  templateUrl: './diwan-list.html',
  styleUrl: './diwan-list.scss',
})
export class DiwanList {
  private readonly corpus = inject(CorpusService);
  protected readonly remote = toSignal(loadable(inject(DiwanApi).diwans()), {
    initialValue: { state: 'loading' } as Loadable<DiwanSummary[]>,
  });

  /** Titles and full-text figures are always known; poem counts come from the API when it answers. */
  protected readonly diwans = computed(() => {
    const r = this.remote();
    const counts = r.state === 'ready' ? new Map(r.data.map((d) => [d.number, d.poem_count])) : null;
    return this.corpus.diwans().map((d) => ({
      ...d,
      slug: `diwan-${String(d.number).padStart(2, '0')}`,
      poemCount: counts ? counts.get(d.number) ?? 0 : null,
    }));
  });
}
