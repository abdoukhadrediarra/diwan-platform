import { Component, effect, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { LanguageService } from '../../core/services/language.service';
import { Hero } from './hero/hero';
import { Author } from './author/author';
import { Project } from './project/project';
import { Corpus } from './corpus/corpus';

@Component({
  selector: 'app-home',
  imports: [Hero, Author, Project, Corpus],
  template: `
    <app-hero />
    <app-author />
    <app-project />
    <app-corpus />
  `,
})
export class Home {
  constructor() {
    const meta = inject(Meta);
    const title = inject(Title);
    const i18n = inject(LanguageService);
    // the tab's title and the page's description follow the language chosen
    effect(() => {
      title.setTitle(i18n.t('meta.title'));
      meta.updateTag({ name: 'description', content: i18n.t('meta.description') });
    });
  }
}
