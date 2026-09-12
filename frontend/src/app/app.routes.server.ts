import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Pages are rendered on the server at each request, so a khassida imported into the database
 * is on the website immediately, already readable by search engines. No rebuild needed.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '**', renderMode: RenderMode.Server },
];
