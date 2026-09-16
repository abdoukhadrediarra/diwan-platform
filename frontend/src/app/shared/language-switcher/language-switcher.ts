import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';

import { LanguageService } from '../../core/services/language.service';
import { Language } from '../../core/i18n/translations';

/** The button that changes the language of the interface. */
@Component({
  selector: 'app-language-switcher',
  template: `
    <div class="switcher">
      <button type="button" class="current" (click)="toggle()" [attr.aria-expanded]="open()"
              [attr.aria-label]="i18n.t('menu.language')">
        <span class="globe" aria-hidden="true">◍</span>
        {{ i18n.names[i18n.language()].short }}
      </button>
      @if (open()) {
        <ul class="menu">
          @for (code of i18n.languages; track code) {
            <li>
              <button type="button" [class.active]="i18n.language() === code" (click)="choose(code)">
                {{ i18n.names[code].label }}
              </button>
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: `
    .switcher { position: relative; }
    .current { display: inline-flex; align-items: center; gap: .4rem; border: 1px solid var(--rule);
               background: #fff; color: var(--ink); border-radius: 6px; padding: .35rem .7rem;
               font-weight: 600; cursor: pointer; }
    .current:hover { border-color: var(--emerald); color: var(--emerald); }
    .globe { color: var(--gold); }
    .menu { position: absolute; top: calc(100% + .4rem); inset-inline-end: 0; z-index: 20; min-width: 10rem;
            list-style: none; margin: 0; padding: .25rem 0; background: #fbfcfa; border: 1px solid var(--rule);
            border-top: 2px solid var(--gold); box-shadow: 0 14px 30px rgba(21, 33, 29, .12); }
    .menu button { display: block; width: 100%; text-align: start; border: 0; background: none;
                   padding: .5rem 1rem; color: var(--ink); cursor: pointer; }
    .menu button:hover { background: var(--stone); }
    .menu button.active { color: var(--emerald); font-weight: 600; }
  `,
})
export class LanguageSwitcher {
  protected readonly i18n = inject(LanguageService);
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly open = signal(false);

  protected toggle(): void { this.open.update((v) => !v); }

  protected choose(code: Language): void {
    this.i18n.setLanguage(code);
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  protected outside(event: Event): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.open.set(false);
  }
}
