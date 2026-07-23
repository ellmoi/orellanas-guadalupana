import { app } from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.port, () => {
  console.log(`API disponible en http://localhost:${env.port}/api`);
});

/** Facilita cierres ordenados durante desarrollo, pruebas y despliegue. */
function shutdown(signal) {
  console.log(`${signal} recibido. Cerrando servidor…`);
  server.close(() => process.exit(0));
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
