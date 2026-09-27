import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
    title: 'Diwan | Les khassaïdes de Cheikh Ahmadou Bamba',
  },
  {
    path: 'diwans',
    loadComponent: () => import('./features/diwans/diwan-list/diwan-list').then((m) => m.DiwanList),
    title: 'Les diwans | Diwan',
  },
  {
    path: 'diwans/:diwan',
    loadComponent: () => import('./features/diwans/diwan-detail/diwan-detail').then((m) => m.DiwanDetailPage),
  },
  {
    path: 'diwans/:diwan/:poem',
    loadComponent: () => import('./features/poem/poem-page/poem-page').then((m) => m.PoemPage),
  },
  {
    path: 'favoris',
    loadComponent: () => import('./features/favorites/favorites').then((m) => m.FavoritesPage),
    title: 'Mes favoris | Diwan',
  },
  {
    path: 'recherche',
    loadComponent: () => import('./features/search/search').then((m) => m.SearchPage),
    title: 'Recherche | Diwan',
  },
  {
    path: '**',
    loadComponent: () => import('./shared/not-found/not-found').then((m) => m.NotFound),
    title: 'Page introuvable | Diwan',
  },
];
