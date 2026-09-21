import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

export interface FavoritePoem {
  code: string;
  number: number;
  slug: string;
  title: string;
  diwanSlug: string;
  diwanNumber: number;
  baytCount: number;
  isAcrostic?: boolean;
  addedAt: number;
}

const FAVORITES_STORAGE_KEY = 'diwan-favorites';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly document = inject(DOCUMENT);

  readonly favorites = signal<FavoritePoem[]>([]);
  readonly count = computed(() => this.favorites().length);
  readonly favoriteCodes = computed(() => new Set(this.favorites().map((item) => item.code)));

  constructor() {
    this.favorites.set(this.readFromStorage());

    effect(() => {
      this.writeToStorage(this.favorites());
    });
  }

  isFavorite(code: string): boolean {
    return this.favoriteCodes().has(code);
  }

  toggle(poem: Omit<FavoritePoem, 'addedAt'> & { addedAt?: number }): boolean {
    const exists = this.isFavorite(poem.code);
    if (exists) {
      this.remove(poem.code);
      return false;
    }

    const item: FavoritePoem = {
      ...poem,
      addedAt: poem.addedAt ?? Date.now(),
    };
    this.favorites.update((list) => [item, ...list.filter((f) => f.code !== poem.code)]);
    return true;
  }

  remove(code: string): void {
    this.favorites.update((list) => list.filter((item) => item.code !== code));
  }

  clear(): void {
    this.favorites.set([]);
  }

  private readFromStorage(): FavoritePoem[] {
    try {
      const raw = this.document.defaultView?.localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      return parsed
        .map((item: unknown): FavoritePoem | null => {
          if (typeof item === 'string') {
            return {
              code: item,
              number: 0,
              slug: '',
              title: item,
              diwanSlug: '',
              diwanNumber: 0,
              baytCount: 0,
              addedAt: Date.now(),
            };
          }
          if (typeof item === 'object' && item !== null && 'code' in item) {
            const f = item as Partial<FavoritePoem>;
            return {
              code: String(f.code),
              number: Number(f.number ?? 0),
              slug: String(f.slug ?? ''),
              title: String(f.title ?? f.code),
              diwanSlug: String(f.diwanSlug ?? ''),
              diwanNumber: Number(f.diwanNumber ?? 0),
              baytCount: Number(f.baytCount ?? 0),
              isAcrostic: Boolean(f.isAcrostic),
              addedAt: Number(f.addedAt ?? Date.now()),
            };
          }
          return null;
        })
        .filter((item): item is FavoritePoem => item !== null);
    } catch {
      return [];
    }
  }

  private writeToStorage(items: FavoritePoem[]): void {
    try {
      this.document.defaultView?.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore if localStorage is unavailable (SSR or private mode restrictions)
    }
  }
}
