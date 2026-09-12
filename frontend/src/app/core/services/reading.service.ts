import { DOCUMENT, Injectable, effect, inject, signal } from '@angular/core';

export type ArabicScript = 'classic' | 'wolofal';

const SCRIPT_KEY = 'diwan.script';
const TRANSCRIPTION_KEY = 'diwan.showTranscription';

/**
 * How the reader wants the poems shown: classical Arabic letterforms (Amiri) or
 * the Wolofal style, and whether to show the Latin transcription.
 * The choice is kept in the browser and applied to the whole site through a class on <body>.
 */
@Injectable({ providedIn: 'root' })
export class ReadingService {
  private readonly document = inject(DOCUMENT);

  readonly script = signal<ArabicScript>('classic');
  readonly showTranscription = signal(false);

  constructor() {
    this.script.set((this.read(SCRIPT_KEY) as ArabicScript) ?? 'classic');
    this.showTranscription.set(this.read(TRANSCRIPTION_KEY) === '1');

    effect(() => {
      const wolofal = this.script() === 'wolofal';
      this.document.body.classList.toggle('script-wolofal', wolofal);
      this.write(SCRIPT_KEY, wolofal ? 'wolofal' : 'classic');
    });
    effect(() => this.write(TRANSCRIPTION_KEY, this.showTranscription() ? '1' : '0'));
  }

  setScript(script: ArabicScript): void {
    this.script.set(script);
  }

  toggleTranscription(): void {
    this.showTranscription.update((v) => !v);
  }

  private read(key: string): string | null {
    try {
      return this.document.defaultView?.localStorage.getItem(key) ?? null;
    } catch {
      return null; // server-side rendering, or storage blocked
    }
  }

  private write(key: string, value: string): void {
    try {
      this.document.defaultView?.localStorage.setItem(key, value);
    } catch {
      /* nothing to do */
    }
  }
}
