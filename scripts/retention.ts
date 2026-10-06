/**
 * Retensi data terjadwal (UU PDP: data tidak disimpan lebih lama dari perlu).
 *   npm run db:retention               → hapus data yang melewati masa simpan
 *   npm run db:retention -- --dry-run  → hitung saja
 *
 * Jalankan dengan DATABASE_URL PEMILIK SKEMA (bukan user aplikasi) agar log audit lama ikut
 * terhapus; dengan user aplikasi bagian log dilewati ("tidak-diizinkan"). Jadwal: harian.
 * Lihat docs/operations/retention.md.
 */
import { getDb } from '../src/db';
import { serverEnv } from '../src/lib/env';
import { policyFromEnv, runRetention } from '../src/features/retention/retention';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const policy = policyFromEnv(serverEnv());
  const report = await runRetention(await getDb(), policy, { dryRun });
  console.log(`Retensi${dryRun ? ' (dry run — tidak ada yang dihapus)' : ''}:`);
  console.log(
    `  kebijakan: kode ${policy.accessCodesDays} hr · reset ${policy.resetRequestsDays} hr · kontak ${policy.contactMessagesDays} hr · log ${policy.auditLogMonths} bln`,
  );
  for (const [k, v] of Object.entries(report)) console.log(`  ${k}: ${v}`);
  if (report.auditLogs === 'tidak-diizinkan') console.log('  catatan: log audit dilewati — jalankan dengan user pemilik skema.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
