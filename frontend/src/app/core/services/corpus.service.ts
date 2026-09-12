import { Injectable, computed, signal } from '@angular/core';
import { CORPUS_STATS } from '../data/corpus-stats';
import { CorpusStats } from '../models/corpus.model';

@Injectable({ providedIn: 'root' })
export class CorpusService {
  /** Static figures for now; replace with an HttpClient call to /api/v1/corpus/ when the API exists. */
  private readonly data = signal<CorpusStats>(CORPUS_STATS);

  readonly diwans = computed(() => this.data().diwans);
  readonly pages = computed(() => this.data().pages);

  readonly totals = computed(() =>
    this.diwans().reduce(
      (sum, d) => ({
        abyat: sum.abyat + d.abyat,
        hemistichs: sum.hemistichs + d.hemistichs,
        words: sum.words + d.words,
        letters: sum.letters + d.letters,
      }),
      { abyat: 0, hemistichs: 0, words: 0, letters: 0 },
    ),
  );

  readonly largestDiwanAbyat = computed(() => Math.max(...this.diwans().map((d) => d.abyat)));
}
