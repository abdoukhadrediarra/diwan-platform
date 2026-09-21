import { Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-hero',
  imports: [NgOptimizedImage, RouterLink, TranslatePipe],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero {
  protected readonly i18n = inject(LanguageService);
}
