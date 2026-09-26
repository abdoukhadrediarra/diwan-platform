import { DOCUMENT, Injectable, effect, inject, signal } from '@angular/core';

import { LANGUAGE_NAMES, Language, LANGUAGES, TRANSLATIONS } from '../i18n/translations';

const KEY = 'diwan.language';

/**
 * The language of the interface: French, English, Arabic or Wolof.
 * The poems themselves are never translated; only the words around them change.
 * The choice is kept in the browser and applied to <html lang> and <html dir>.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly document = inject(DOCUMENT);

  readonly language = signal<Language>('fr');
  readonly languages = LANGUAGES;
  readonly names = LANGUAGE_NAMES;

  constructor() {
    this.language.set(this.stored() ?? 'fr');
    effect(() => {
      const code = this.language();
      const html = this.document.documentElement;
      html.lang = code;
      html.dir = LANGUAGE_NAMES[code].rtl ? 'rtl' : 'ltr';
      html.classList.toggle('lang-ar', code === 'ar');
      try {
        this.document.defaultView?.localStorage.setItem(KEY, code);
      } catch { /* private mode, or rendering on the server */ }
    });
  }

  /** The text of a key in the language now chosen. */
  t(key: string, fallback?: string): string {
    const entry = TRANSLATIONS[key];
    if (entry) return entry[this.language()] || entry.fr;
    return fallback ?? key;                     // a missing key without a fallback shows itself
  }

  /** The language code now chosen (an alias for reading `language()` outside a template). */
  currentCode(): Language {
    return this.language();
  }

  /** "3 khassaïdes en ligne" — the count, then the word in the right language. */
  count(value: number, oneKey: string, manyKey: string): string {
    return `${value.toLocaleString(this.language() === 'ar' ? 'ar' : this.language())} ${this.t(value > 1 ? manyKey : oneKey)}`;
  }

  setLanguage(code: Language): void {
    this.language.set(code);
  }

  private stored(): Language | null {
    try {
      const saved = this.document.defaultView?.localStorage.getItem(KEY) as Language | null;
      return saved && LANGUAGES.includes(saved) ? saved : null;
    } catch {
      return null;
    }
  }
}
