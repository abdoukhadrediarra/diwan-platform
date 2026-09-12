import { Component, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
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
    inject(Meta).updateTag({
      name: 'description',
      content: 'Découvrez Cheikh Ahmadou Bamba et ses sept diwans : 40 248 abyat vocalisés, transcrits et consultables poème par poème.',
    });
  }
}
