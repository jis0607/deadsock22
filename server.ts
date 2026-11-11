import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupGameBackend } from './serverBackend.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

const server = http.createServer(app);

// Initialize WebSockets and REST routes
setupGameBackend(server, app);

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`DEAD//RECKONING Game Server listening on port ${PORT}`);
  });

  const handleShutdown = (signal: string) => {
    console.log(`[SERVER] Received ${signal}. Shutting down cleanly...`);
    server.close(() => {
      console.log('[SERVER] Closed all active HTTP and WebSocket listeners.');
      process.exit(0);
    });
    setTimeout(() => {
      console.warn('[SERVER] Forcing exit after shutdown timeout.');
      process.exit(1);
    }, 5000);
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

startServer();
