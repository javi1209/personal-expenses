import { createRequire } from 'node:module';
import process from 'node:process';
import { MongoMemoryServer } from 'mongodb-memory-server';

const API_PORT = Number.parseInt(process.env.E2E_API_PORT ?? '5000', 10);
const JWT_SECRET = process.env.JWT_SECRET ?? 'e2e-jwt-secret-with-32-characters-min';
const CORS_ORIGIN = process.env.CORS_ORIGIN
  ?? 'http://127.0.0.1:4173,http://localhost:4173,http://127.0.0.1:5173,http://localhost:5173';

process.env.NODE_ENV = 'test';
process.env.PORT = String(API_PORT);
process.env.JWT_SECRET = JWT_SECRET;
process.env.CORS_ORIGIN = CORS_ORIGIN;
process.env.RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX ?? '10000';
process.env.RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS ?? '60000';

const require = createRequire(import.meta.url);

let mongoServer = null;
let stopServer = null;
let isShuttingDown = false;

const shutdown = async (reason, code = 0) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[e2e-backend] cerrando (${reason})...`);

  try {
    if (typeof stopServer === 'function') {
      await stopServer();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[e2e-backend] error cerrando server: ${message}`);
  }

  try {
    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[e2e-backend] error cerrando mongo: ${message}`);
  }

  process.exit(code);
};

const main = async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();

  const serverModule = require('../server/index.cjs');
  stopServer = serverModule.stopServer;

  await serverModule.startServer({
    mongoUri: process.env.MONGODB_URI,
    port: API_PORT,
    continueOnDbError: false,
  });

  console.log('[e2e-backend] listo para pruebas E2E');
};

process.on('SIGINT', () => {
  void shutdown('SIGINT', 0);
});
process.on('SIGTERM', () => {
  void shutdown('SIGTERM', 0);
});
process.on('uncaughtException', (error) => {
  console.error('[e2e-backend] uncaughtException:', error);
  void shutdown('uncaughtException', 1);
});
process.on('unhandledRejection', (error) => {
  console.error('[e2e-backend] unhandledRejection:', error);
  void shutdown('unhandledRejection', 1);
});

main()
  .then(() => {
    // Mantiene el proceso vivo para que Playwright lo gestione.
  })
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[e2e-backend] error al iniciar: ${message}`);
    void shutdown('startup-error', 1);
  });
