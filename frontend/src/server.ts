import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
// Which addresses this server answers on (Angular refuses others, to prevent host-header attacks).
// Set NG_ALLOWED_HOSTS on the hosting service, e.g. "diwan-web.onrender.com".
const allowedHosts = (process.env['NG_ALLOWED_HOSTS'] ?? 'localhost,127.0.0.1')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean);

const angularApp = new AngularNodeAppEngine({ allowedHosts });

/**
 * Forward /api requests to the Django backend
 */
app.use('/api', async (req, res, next) => {
  const backendBase = (process.env['API_URL'] || 'https://diwan-platform.onrender.com/api/v1').replace(/\/api\/v1\/?$/, '');
  const targetUrl = `${backendBase}${req.originalUrl}`;
  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Accept': req.headers['accept'] || 'application/json',
        'User-Agent': (req.headers['user-agent'] as string) || 'Diwan-Web-Proxy',
      },
    });
    res.status(response.status);
    response.headers.forEach((val, key) => {
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
        res.setHeader(key, val);
      }
    });
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    next(error);
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
