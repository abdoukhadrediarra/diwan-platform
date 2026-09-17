import { Component, inject } from '@angular/core';

import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-project',
  templateUrl: './project.html',
  styleUrl: './project.scss',
})
export class Project {
  protected readonly i18n = inject(LanguageService);
  protected readonly offers = ['page', 'latin', 'pdf', 'search', 'sort'];

  protected readonly steps = ['typing', 'normal', 'tashkeel', 'publish'];
}
