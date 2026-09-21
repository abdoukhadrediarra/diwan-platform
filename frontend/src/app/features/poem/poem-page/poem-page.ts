import { Component, computed, effect, inject, signal } from '@angular/core';
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
import { FavoritesService } from '../../../core/services/favorites.service';
import { ReadingService } from '../../../core/services/reading.service';
import { PdfExportService } from '../../../core/services/pdf-export.service';
import { LanguageService } from '../../../core/services/language.service';
import { ReaderSettingsService } from '../../../core/services/reader-settings.service';

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
  private readonly pdfExport = inject(PdfExportService);
  protected readonly reading = inject(ReadingService);
  protected readonly favorites = inject(FavoritesService);
  protected readonly i18n = inject(LanguageService);
  protected readonly reader = inject(ReaderSettingsService);
  protected readonly isExportingPdf = signal(false);

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

  protected readonly sectionKeys: Record<Section, string> = {
    muqaddima: 'section.muqaddima',
    title: 'section.title',
    matn: 'section.matn',
    khatima: 'section.khatima',
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

  protected isFavorite(): boolean {
    const p = this.poem();
    return p.state === 'ready' ? this.favorites.isFavorite(p.data.code) : false;
  }

  protected share(): void {
    if (typeof navigator !== 'undefined' && navigator.share) {
      void navigator.share({ title: document.title, url: window.location.href });
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(window.location.href);
    }
  }

  protected async downloadPdf(): Promise<void> {
    const p = this.poem();
    if (p.state !== 'ready' || this.isExportingPdf()) return;

    this.isExportingPdf.set(true);
    try {
      await this.pdfExport.exportPoem(p.data, {
        showTranscription: this.showTranscription(),
      });
    } catch (err) {
      console.error('Erreur lors de la génération du PDF', err);
    } finally {
      this.isExportingPdf.set(false);
    }
  }

  protected printPoem(): void {
    const p = this.poem();
    if (p.state !== 'ready') return;
    this.pdfExport.printPoemDirect(p.data, this.showTranscription());
  }

  protected downloadPoem(): void {
    const p = this.poem();
    if (p.state !== 'ready' || typeof window === 'undefined') return;

    const text = p.data.lines
      .map((line) => line.hemistichs.join(' | '))
      .join('\n');
    const blob = new Blob([`${p.data.title}\n\n${text}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${p.data.code}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  protected toggleFavorite(): void {
    const p = this.poem();
    if (p.state !== 'ready') return;

    this.favorites.toggle({
      code: p.data.code,
      number: p.data.number,
      slug: p.data.slug,
      title: p.data.title,
      diwanSlug: p.data.diwan.slug,
      diwanNumber: p.data.diwan.number,
      baytCount: p.data.bayt_count,
      isAcrostic: p.data.is_acrostic,
    });
  }
}
