/**
 * Pengingat masa jabatan berakhir (2.4): pengurus Kwarcab & penugasan staf yang berakhir dalam
 * ≤ 30 hari dikirimi notifikasi portal. Aman dijalankan berulang (dedupe per penerima).
 *   npx tsx scripts/term-reminders.ts
 * Jadwal: harian (mis. 07.00 WIB), sama seperti db:retention.
 */
import { getDb } from '../src/db';
import { sendTermReminders } from '../src/features/terms/reminders';

async function main() {
  const report = await sendTermReminders(new Date(), await getDb());
  console.log('Pengingat masa jabatan:');
  console.log(`  pengurus dalam jendela 30 hari: ${report.boardDue}`);
  console.log(`  penugasan staf dalam jendela 30 hari: ${report.staffDue}`);
  console.log(`  notifikasi baru terkirim: ${report.sent}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
