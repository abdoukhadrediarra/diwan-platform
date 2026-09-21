import { Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-hero',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero {
  protected readonly i18n = inject(LanguageService);
}
