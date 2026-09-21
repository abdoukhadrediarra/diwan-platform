import { Component, computed, effect, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { FavoritesService, FavoritePoem } from '../../core/services/favorites.service';
import { LanguageService } from '../../core/services/language.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { normalizeArabic } from '../../core/arabic';
import { Breadcrumb } from '../../shared/breadcrumb/breadcrumb';

@Component({
  selector: 'app-favorites',
  imports: [DecimalPipe, RouterLink, Breadcrumb, TranslatePipe],
  templateUrl: './favorites.html',
  styleUrl: './favorites.scss',
})
export class FavoritesPage {
  protected readonly favoritesService = inject(FavoritesService);
  protected readonly lang = inject(LanguageService);
  protected readonly query = signal('');

  protected readonly filteredFavorites = computed(() => {
    const list = this.favoritesService.favorites();
    const q = normalizeArabic(this.query().trim());
    if (!q) return list;

    return list.filter((poem) =>
      normalizeArabic(poem.title).includes(q) ||
      poem.code.toLowerCase().includes(q.toLowerCase()) ||
      String(poem.number) === q ||
      String(poem.diwanNumber) === q
    );
  });

  constructor() {
    const title = inject(Title);
    effect(() => {
      title.setTitle(`${this.lang.t('fav.title')} | Diwan`);
    });
  }

  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected remove(event: Event, code: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.favoritesService.remove(code);
  }

  protected clearAll(): void {
    if (typeof window !== 'undefined' && window.confirm(this.lang.t('fav.clearConfirm'))) {
      this.favoritesService.clear();
    }
  }

  protected exportFavorites(): void {
    const list = this.favoritesService.favorites();
    if (list.length === 0 || typeof window === 'undefined') return;

    const content = list
      .map(
        (p) =>
          `Diwan ${p.diwanNumber} - ${this.lang.t('detail.poemTag')} ${p.number} (${p.code}): ${p.title} (${p.baytCount} ${this.lang.t('corpus.abyat')})`
      )
      .join('\n');

    const header = this.lang.t('fav.exportedTitle');
    const blob = new Blob([`${header}\n\n${content}`], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'diwan-mes-favoris.txt';
    link.click();
    URL.revokeObjectURL(url);
  }
}
