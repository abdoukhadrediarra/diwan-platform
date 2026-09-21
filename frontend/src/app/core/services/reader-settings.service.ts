import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

export type ReaderTheme = 'light' | 'sepia' | 'dark';

export interface FontSizeOption {
  level: number;
  label: string;
  cssSize: string;
}

export const FONT_SIZE_LEVELS: FontSizeOption[] = [
  { level: 1, label: 'Petit', cssSize: '1.45rem' },
  { level: 2, label: 'Moyen', cssSize: '1.68rem' },
  { level: 3, label: 'Normal', cssSize: '1.9rem' },
  { level: 4, label: 'Grand', cssSize: '2.25rem' },
  { level: 5, label: 'Très grand', cssSize: '2.65rem' },
];

const THEME_STORAGE_KEY = 'diwan.reader.theme';
const FONT_STORAGE_KEY = 'diwan.reader.fontSizeLevel';

@Injectable({ providedIn: 'root' })
export class ReaderSettingsService {
  private readonly document = inject(DOCUMENT);

  readonly theme = signal<ReaderTheme>('light');
  readonly fontSizeLevel = signal<number>(3); // Default level 3 (Normal)

  readonly currentFontSize = computed(() => {
    const lvl = this.fontSizeLevel();
    return FONT_SIZE_LEVELS.find((f) => f.level === lvl) ?? FONT_SIZE_LEVELS[2];
  });

  constructor() {
    this.loadSavedSettings();

    // Effect to apply theme & font size to DOM root and save to localStorage
    effect(() => {
      const currentTheme = this.theme();
      const currentFont = this.currentFontSize();

      this.saveSettings(currentTheme, currentFont.level);

      if (this.document?.documentElement) {
        this.document.documentElement.setAttribute('data-theme', currentTheme);
        this.document.documentElement.style.setProperty('--bayt-font-size', currentFont.cssSize);
      }
    });
  }

  setTheme(newTheme: ReaderTheme): void {
    this.theme.set(newTheme);
  }

  increaseFontSize(): void {
    this.fontSizeLevel.update((lvl) => Math.min(5, lvl + 1));
  }

  decreaseFontSize(): void {
    this.fontSizeLevel.update((lvl) => Math.max(1, lvl - 1));
  }

  resetFontSize(): void {
    this.fontSizeLevel.set(3);
  }

  private loadSavedSettings(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY) as ReaderTheme | null;
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'sepia' || savedTheme === 'dark')) {
          this.theme.set(savedTheme);
        }

        const savedFont = window.localStorage.getItem(FONT_STORAGE_KEY);
        if (savedFont) {
          const parsed = parseInt(savedFont, 10);
          if (parsed >= 1 && parsed <= 5) {
            this.fontSizeLevel.set(parsed);
          }
        }
      }
    } catch {
      // Safe fallback on storage restrictions
    }
  }

  private saveSettings(theme: ReaderTheme, fontLevel: number): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
        window.localStorage.setItem(FONT_STORAGE_KEY, String(fontLevel));
      }
    } catch {
      // Safe fallback
    }
  }
}
