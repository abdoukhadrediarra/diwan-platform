import { Component } from '@angular/core';
import { BaytView } from '../../../shared/bayt/bayt';
import { FEATURED_BAYT } from '../../../core/data/corpus-stats';

@Component({
  selector: 'app-author',
  imports: [BaytView],
  templateUrl: './author.html',
  styleUrl: './author.scss',
})
export class Author {
  protected readonly bayt = FEATURED_BAYT;
  protected readonly timeline = [
    { year: '1853', text: 'Naissance à Mbacké, dans le royaume du Baol.' },
    { year: '1881', text: 'Mort de son père. Il reprend son école à Mbacké Cayor.' },
    { year: '1888', text: 'Fondation de Touba, au cœur de la forêt de Mbaffar.' },
    { year: '1895', text: 'Arrestation et exil au Gabon, à Mayumba puis à Lambaréné.' },
    { year: '1902', text: 'Retour au Sénégal, accueilli par ses disciples à Dakar.' },
    { year: '1903', text: 'Nouvel exil, en Mauritanie, pendant quatre ans.' },
    { year: '1907', text: 'Résidence surveillée à Thiéyène.' },
    { year: '1912', text: 'Installation à Diourbel, où il vit ses dernières années.' },
    { year: '1927', text: 'Décès à Diourbel. Il repose à Touba, près de la grande mosquée.' },
  ];
}
