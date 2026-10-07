/**
 * Backup basis data.
 *   npm run db:backup             → buat backup (pg_dump bila DATABASE_URL, PGlite bila kosong)
 *   npm run db:backup -- --verify → buat backup lalu langsung uji pulih
 *
 * PGlite: JANGAN jalankan skrip ini selagi server memakai folder data yang sama (dua proses
 * pada satu folder PGlite bisa merusak data) — pakai tombol di /dashboard/backup.
 * Jadwal & prosedur uji pulih: docs/operations/monitoring.md.
 */
import { runBackup, verifyBackup } from '../src/features/backup/backup';

async function main() {
  const run = await runBackup({ id: null, name: 'Skrip db:backup' });
  if (run.status !== 'SUCCESS') {
    console.error(`Backup GAGAL: ${run.error}`);
    process.exit(1);
  }
  console.log(`Backup ${run.kind}: ${run.fileName} (${run.sizeBytes} byte)\n  sha256 ${run.sha256}`);
  if (process.argv.includes('--verify')) {
    const v = await verifyBackup(run.id);
    console.log(`Uji pulih ${v.ok ? 'LULUS' : 'GAGAL'}: ${v.note}`);
    if (!v.ok) process.exit(1);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
