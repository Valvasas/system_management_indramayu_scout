import { defineConfig } from 'drizzle-kit';

/** Hanya untuk `drizzle-kit generate`: menghasilkan SQL migrasi di folder `drizzle/`. */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
});
