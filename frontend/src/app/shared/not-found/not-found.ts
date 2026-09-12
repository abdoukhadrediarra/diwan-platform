import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <section class="section">
      <div class="container measure">
        <h1 class="section-title">{{ heading() }}</h1>
        <p class="section-intro">{{ text() }}</p>
        <p class="mt-4"><a class="btn btn-primary" routerLink="/diwans">Voir les diwans</a></p>
      </div>
    </section>
  `,
})
export class NotFound {
  readonly heading = input('Page introuvable');
  readonly text = input("Cette adresse ne correspond à aucune page du site. Les khassaïdes sont classées par diwan.");
}
