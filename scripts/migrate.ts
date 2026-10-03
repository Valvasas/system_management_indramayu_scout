/**
 * Jalankan migrasi SQL di folder `drizzle/` terhadap database.
 *   npm run db:migrate
 * Dengan DATABASE_URL → PostgreSQL. Tanpa itu → PGlite lokal (.data/pglite).
 */
import path from 'node:path';

async function main() {
  const migrationsFolder = path.join(process.cwd(), 'drizzle');
  const url = process.env.DATABASE_URL;

  if (url) {
    const { Pool } = await import('pg');
    const { drizzle } = await import('drizzle-orm/node-postgres');
    const { migrate } = await import('drizzle-orm/node-postgres/migrator');
    const pool = new Pool({ connectionString: url, max: 1 });
    await migrate(drizzle(pool), { migrationsFolder });
    await pool.end();
  } else {
    const { getDb } = await import('../src/db');
    await getDb(); // PGlite bermigrasi otomatis saat koneksi pertama
  }
  console.log('Migrasi selesai.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
