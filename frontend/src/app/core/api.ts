import { InjectionToken } from '@angular/core';
import { Observable, catchError, map, of, startWith } from 'rxjs';

/**
 * Where the Django API lives. In the browser: "/api/v1" on the same site
 * (ng serve proxies it, see proxy.conf.json; in production nginx routes /api to Django).
 * During server-side rendering it is set in app.config.server.ts from the API_URL environment variable.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', { factory: () => '/api/v1' });

/** A value that is loading, ready, or failed (with 404 kept apart, to show "not found"). */
export type Loadable<T> =
  | { state: 'loading' }
  | { state: 'ready'; data: T }
  | { state: 'error'; notFound: boolean };

export function loadable<T>(source: Observable<T>): Observable<Loadable<T>> {
  return source.pipe(
    map((data) => ({ state: 'ready', data }) as Loadable<T>),
    catchError((err) => of({ state: 'error', notFound: err?.status === 404 } as Loadable<T>)),
    startWith({ state: 'loading' } as Loadable<T>),
  );
}
