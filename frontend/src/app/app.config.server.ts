import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { API_BASE_URL } from './core/api';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // when rendering on the server, call Django directly (absolute URL)
    { provide: API_BASE_URL, useValue: process.env['API_URL'] || 'https://diwan-platform.onrender.com/api/v1' },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
