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
import { LanguageService } from '../../../core/services/language.service';

interface ViewLine extends PoemLine {
  initial?: { initial: string; joiner: string; rest: string };
  segments?: { text: string; hl: boolean }[];
}

/** Splits a line's text around its bolded span(s), so each one can be coloured red on its own,
 * leaving the untouched prose around it exactly as written. */
function splitAcrosticSpans(text: string, spans: string[]): { text: string; hl: boolean }[] {
  const segments: { text: string; hl: boolean }[] = [];
  let rest = text;
  for (const span of spans) {
    const i = rest.indexOf(span);
    if (i === -1) continue;   // not found in the remaining text (shouldn't happen): leave it plain
    if (i > 0) segments.push({ text: rest.slice(0, i), hl: false });
    segments.push({ text: span, hl: true });
    rest = rest.slice(i + span.length);
  }
  if (rest) segments.push({ text: rest, hl: false });
  return segments.length ? segments : [{ text, hl: false }];
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
  protected readonly i18n = inject(LanguageService);

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
        : line.acrostic_spans?.length
        ? { ...line, segments: splitAcrosticSpans(line.hemistichs[0], line.acrostic_spans) }
        : line;
      const last = groups[groups.length - 1];
      last && last.section === line.section ? last.lines.push(view) : groups.push({ section: line.section, lines: [view] });
    }
    return groups;
  });

  protected readonly sectionKeys: Record<Section, string> = {
    muqaddima: 'section.muqaddima', title: 'section.title', matn: 'section.matn', khatima: 'section.khatima',
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
