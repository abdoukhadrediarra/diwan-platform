import { Component, inject } from '@angular/core';
import { ArabicScript, ReadingService } from '../../core/services/reading.service';

/** Lets the reader choose the classical letterforms or the Wolofal ones. */
@Component({
  selector: 'app-script-toggle',
  template: `
    <div class="script-toggle" role="group" aria-label="Style d'écriture">
      @for (option of options; track option.value) {
        <button type="button" [class.active]="reading.script() === option.value"
                [attr.aria-pressed]="reading.script() === option.value"
                (click)="reading.setScript(option.value)">
          <span class="name">{{ option.label }}</span>
          <span class="sample" [class.wolofal]="option.value === 'wolofal'" lang="ar" dir="rtl">{{ option.sample }}</span>
        </button>
      }
    </div>
  `,
  styles: `
    .script-toggle { display: inline-flex; border: 1px solid var(--rule); border-radius: 6px; overflow: hidden; background: #fff; }
    button { display: flex; align-items: center; gap: .6rem; border: 0; background: none; padding: .5rem .9rem; color: var(--ink); cursor: pointer; }
    button + button { border-left: 1px solid var(--rule); }
    button:hover { background: var(--stone); }
    button.active { background: var(--emerald); color: #fff; }
    .name { font-size: .95rem; font-weight: 600; }
    .sample { font-family: var(--arabic); font-size: 1.3rem; line-height: 1; }
    .sample.wolofal { font-family: "Wolofal", var(--arabic); font-size: 1.6rem; }
  `,
})
export class ScriptToggle {
  protected readonly reading = inject(ReadingService);
  protected readonly options: { value: ArabicScript; label: string; sample: string }[] = [
    { value: 'classic', label: 'Classique', sample: 'عربي' },
    { value: 'wolofal', label: 'Wolofal', sample: 'ولفل' },
  ];
}
