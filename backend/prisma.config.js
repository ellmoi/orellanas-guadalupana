import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

/**
 * Prisma centraliza aquí la ruta del esquema, las migraciones y el seed.
 * Las credenciales continúan viniendo del archivo .env ignorado por Git.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
