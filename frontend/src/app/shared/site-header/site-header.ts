import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CorpusService } from '../../core/services/corpus.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { LanguageCode, LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
})
export class SiteHeader {
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly diwans = inject(CorpusService).diwans;
  protected readonly favorites = inject(FavoritesService);
  protected readonly lang = inject(LanguageService);

  protected readonly open = signal(false);         // mobile menu
  protected readonly diwansOpen = signal(false);   // "Les diwans" panel
  protected readonly langOpen = signal(false);     // Language selector dropdown

  constructor() {
    inject(Router).events.pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.close());
  }

  protected slug(n: number): string { return `diwan-${String(n).padStart(2, '0')}`; }
  protected toggle(): void { this.open.update((v) => !v); }
  protected toggleDiwans(): void {
    this.diwansOpen.update((v) => !v);
    if (this.diwansOpen()) this.langOpen.set(false);
  }
  protected toggleLang(): void {
    this.langOpen.update((v) => !v);
    if (this.langOpen()) this.diwansOpen.set(false);
  }
  protected selectLanguage(code: LanguageCode): void {
    this.lang.setLanguage(code);
    this.langOpen.set(false);
  }
  protected close(): void {
    this.open.set(false);
    this.diwansOpen.set(false);
    this.langOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: Event): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.diwansOpen.set(false);
      this.langOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void { this.close(); }
}
