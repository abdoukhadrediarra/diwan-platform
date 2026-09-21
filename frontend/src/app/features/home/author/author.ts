import { Component } from '@angular/core';
import { BaytView } from '../../../shared/bayt/bayt';
import { FEATURED_BAYT } from '../../../core/data/corpus-stats';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-author',
  imports: [BaytView, TranslatePipe],
  templateUrl: './author.html',
  styleUrl: './author.scss',
})
export class Author {
  protected readonly bayt = FEATURED_BAYT;
  protected readonly timeline = [
    { year: '1853', key: 'timeline.1853' },
    { year: '1881', key: 'timeline.1881' },
    { year: '1888', key: 'timeline.1888' },
    { year: '1895', key: 'timeline.1895' },
    { year: '1902', key: 'timeline.1902' },
    { year: '1903', key: 'timeline.1903' },
    { year: '1907', key: 'timeline.1907' },
    { year: '1912', key: 'timeline.1912' },
    { year: '1927', key: 'timeline.1927' },
  ];
}
