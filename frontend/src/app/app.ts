import { Component, inject } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SiteHeader } from './shared/site-header/site-header';
import { SiteFooter } from './shared/site-footer/site-footer';
import { ReadingService } from './core/services/reading.service';
import { LanguageService } from './core/services/language.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SiteHeader, SiteFooter],
  templateUrl: './app.html',
})
export class App {
  // created here so the reader's choice of script applies to every page, not only the poem page
  private readonly reading = inject(ReadingService);
  protected readonly i18n = inject(LanguageService);

  constructor() {
    // keep section titles visible below the sticky header when following #cheikh, #projet, #corpus
    inject(ViewportScroller).setOffset([0, 72]);
  }
}
