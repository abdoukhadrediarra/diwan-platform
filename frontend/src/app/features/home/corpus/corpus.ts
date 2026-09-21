import { Component, computed, inject } from '@angular/core';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CorpusService } from '../../../core/services/corpus.service';
import { DiwanApi } from '../../../core/services/diwan-api.service';
import { Loadable, loadable } from '../../../core/api';
import { CorpusOverview } from '../../../core/models/api.model';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-corpus',
  imports: [DecimalPipe, PercentPipe, RouterLink, TranslatePipe],
  templateUrl: './corpus.html',
  styleUrl: './corpus.scss',
})
export class Corpus {
  protected readonly i18n = inject(LanguageService);
  protected readonly corpus = inject(CorpusService);

  /** Live counts from the database: how many khassaïdes are already online. */
  private readonly live = toSignal(loadable(inject(DiwanApi).corpus()), {
    initialValue: { state: 'loading' } as Loadable<CorpusOverview>,
  });
  protected readonly online = computed(() => {
    const l = this.live();
    return l.state === 'ready'
      ? { total: l.data.poem_count, byDiwan: new Map(l.data.diwans.map((d) => [d.number, d.poem_count])) }
      : null;
  });

  protected slug(n: number): string { return `diwan-${String(n).padStart(2, '0')}`; }

  /** Bar length relative to the largest diwan, so differences stay visible. */
  protected barWidth(abyat: number): string {
    return `${(abyat / this.corpus.largestDiwanAbyat()) * 100}%`;
  }
}
