import { Component, inject } from '@angular/core';
import { BaytView } from '../../../shared/bayt/bayt';
import { FEATURED_BAYT } from '../../../core/data/corpus-stats';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-author',
  imports: [BaytView],
  templateUrl: './author.html',
  styleUrl: './author.scss',
})
export class Author {
  protected readonly i18n = inject(LanguageService);
  protected readonly bayt = FEATURED_BAYT;

  /** The caption around the poem's name, split so the Arabic name keeps its own direction. */
  protected get captionParts(): [string, string] {
    const [before, after = ''] = this.i18n.t('verse.caption').split('{name}');
    return [before, after.replace('{n}', String(this.bayt.diwan))];
  }

  protected readonly bioKeys = ['bio.1', 'bio.2', 'bio.3', 'bio.4', 'bio.5'];
  protected readonly years = ['1853', '1881', '1888', '1895', '1902', '1903', '1907', '1912', '1927'];
}
