import { Component, input } from '@angular/core';
import { Bayt } from '../../core/models/corpus.model';

/** One bayt: hemistichs side by side (right to left), and optionally its Latin transcription underneath. */
@Component({
  selector: 'app-bayt',
  templateUrl: './bayt.html',
  styleUrl: './bayt.scss',
})
export class BaytView {
  readonly bayt = input.required<Bayt>();
  readonly showTranscription = input(true);
}
