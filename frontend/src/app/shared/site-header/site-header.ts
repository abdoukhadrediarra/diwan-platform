import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CorpusService } from '../../core/services/corpus.service';
import { LanguageService } from '../../core/services/language.service';
import { LanguageSwitcher } from '../language-switcher/language-switcher';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, LanguageSwitcher],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
})
export class SiteHeader {
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly diwans = inject(CorpusService).diwans;
  protected readonly i18n = inject(LanguageService);
  protected readonly open = signal(false);         // mobile menu
  protected readonly diwansOpen = signal(false);   // "Les diwans" panel

  constructor() {
    inject(Router).events.pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.close());
  }

  protected slug(n: number): string { return `diwan-${String(n).padStart(2, '0')}`; }
  protected toggle(): void { this.open.update((v) => !v); }
  protected toggleDiwans(): void { this.diwansOpen.update((v) => !v); }
  protected close(): void { this.open.set(false); this.diwansOpen.set(false); }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: Event): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.diwansOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void { this.close(); }
}
