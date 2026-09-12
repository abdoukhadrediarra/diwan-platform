import { Component, computed, effect, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { DiwanApi } from '../../../core/services/diwan-api.service';
import { Loadable, loadable } from '../../../core/api';
import { PoemDetail, PoemLine, Section } from '../../../core/models/api.model';
import { splitInitial } from '../../../core/arabic';
import { Breadcrumb } from '../../../shared/breadcrumb/breadcrumb';
import { NotFound } from '../../../shared/not-found/not-found';
import { ScriptToggle } from '../../../shared/script-toggle/script-toggle';
import { ReadingService } from '../../../core/services/reading.service';

interface ViewLine extends PoemLine {
  initial?: { initial: string; joiner: string; rest: string };
}

@Component({
  selector: 'app-poem-page',
  imports: [DecimalPipe, RouterLink, Breadcrumb, NotFound, ScriptToggle],
  templateUrl: './poem-page.html',
  styleUrl: './poem-page.scss',
})
export class PoemPage {
  private readonly api = inject(DiwanApi);
  protected readonly reading = inject(ReadingService);

  protected readonly poem = toSignal(
    inject(ActivatedRoute).paramMap.pipe(
      switchMap((p) => loadable(this.api.poem(p.get('diwan') ?? '', p.get('poem') ?? ''))),
    ),
    { initialValue: { state: 'loading' } as Loadable<PoemDetail> },
  );

  protected readonly showTranscription = this.reading.showTranscription;

  /** Lines grouped by section, with the first letter of each sadr split out when the name is an acrostic. */
  protected readonly sections = computed(() => {
    const p = this.poem();
    if (p.state !== 'ready') return [];
    const groups: { section: Section; lines: ViewLine[] }[] = [];
    for (const line of p.data.lines) {
      const view: ViewLine = line.kind === 'bayt' && p.data.is_acrostic
        ? { ...line, initial: splitInitial(line.hemistichs[0]) }
        : line;
      const last = groups[groups.length - 1];
      last && last.section === line.section ? last.lines.push(view) : groups.push({ section: line.section, lines: [view] });
    }
    return groups;
  });

  protected readonly sectionLabels: Record<Section, string> = {
    muqaddima: 'Ouverture', title: 'Nom du poème', matn: 'Abyat', khatima: 'Clôture',
  };

  constructor() {
    const title = inject(Title);
    effect(() => {
      const p = this.poem();
      if (p.state === 'ready') title.setTitle(`${p.data.title} | Diwan ${p.data.diwan.number} | Diwan`);
    });
  }

  protected toggleTranscription(): void {
    this.reading.toggleTranscription();
  }
}
