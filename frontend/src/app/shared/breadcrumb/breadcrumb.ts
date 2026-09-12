import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface Crumb { label: string; link?: string; arabic?: boolean; }

@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLink],
  template: `
    <nav class="crumbs" aria-label="Fil d'Ariane">
      <ol>
        @for (c of items(); track $index; let last = $last) {
          <li>
            @if (c.link && !last) {
              <a [routerLink]="c.link" [class.ar]="c.arabic" [attr.lang]="c.arabic ? 'ar' : null">{{ c.label }}</a>
            } @else {
              <span [class.ar]="c.arabic" [attr.lang]="c.arabic ? 'ar' : null" aria-current="page">{{ c.label }}</span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
  styles: `
    .crumbs ol { display: flex; flex-wrap: wrap; gap: .25rem .6rem; list-style: none; margin: 0; padding: 0; font-size: .95rem; color: var(--muted); }
    .crumbs li + li::before { content: "/"; margin-right: .6rem; color: var(--rule); }
    .crumbs a { color: var(--muted); text-underline-offset: .25em; }
    .crumbs a:hover { color: var(--emerald); }
    .crumbs .ar { font-size: 1.1em; }
  `,
})
export class Breadcrumb {
  readonly items = input.required<Crumb[]>();
}
