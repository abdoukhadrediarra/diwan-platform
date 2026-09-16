import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <section class="section">
      <div class="container measure">
        <h1 class="section-title">{{ heading() }}</h1>
        <p class="section-intro">{{ text() }}</p>
        <p class="mt-4"><a class="btn btn-primary" routerLink="/diwans">{{ i18n.t('menu.diwans') }}</a></p>
      </div>
    </section>
  `,
})
export class NotFound {
  protected readonly i18n = inject(LanguageService);
  readonly heading = input(this.i18n.t('error.pageTitle'));
  readonly text = input(this.i18n.t('error.pageText'));
}
