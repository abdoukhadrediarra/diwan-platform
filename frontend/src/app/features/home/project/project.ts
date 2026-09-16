import { Component, inject } from '@angular/core';

import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-project',
  templateUrl: './project.html',
  styleUrl: './project.scss',
})
export class Project {
  protected readonly i18n = inject(LanguageService);
  protected readonly offers = [
    { title: 'Une page pour chaque poème', text: 'Le texte entièrement vocalisé, bayt par bayt, sous le nom que lui a donné son auteur.' },
    { title: 'La transcription en caractères latins', text: 'Pour lire et réciter les khassaïdes sans lire l’écriture arabe.' },
    { title: 'Des PDF à télécharger', text: 'Chaque poème, chaque diwan et le corpus entier, prêts à imprimer ou à partager.' },
    { title: 'Une recherche dans tout le corpus', text: 'D’abord dans les noms des poèmes, ensuite dans les vers eux-mêmes.' },
    { title: 'Des classements utiles', text: 'Par diwan, par mois de l’année hégirienne, par événement et par jour.' },
  ];

  protected readonly steps = [
    { title: 'Saisie', text: 'Le texte des sept diwans est saisi vers par vers, à partir des recueils imprimés.' },
    { title: 'Normalisation', text: 'Tous les poèmes suivent le même format : un bayt par ligne, ses hémistiches séparés.' },
    { title: 'Vocalisation', text: 'Chaque mot reçoit sa vocalisation complète, puis chaque poème est relu à la main.' },
    { title: 'Publication', text: 'Les poèmes relus entrent dans la base de données et paraissent sur le site et l’application.' },
  ];
}
