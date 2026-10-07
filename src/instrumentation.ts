/**
 * Dijalankan Next sekali saat server start (butuh `experimental.instrumentationHook`).
 * Validasi env di sini membuat konfigurasi produksi yang cacat gagal sebelum
 * menerima permintaan pertama, dengan pesan yang hanya menyebut nama variabel.
 *
 * Pengecualian aturan "process.env hanya di env.ts": Next meng-inline NEXT_RUNTIME per
 * kompilasi, dan hanya referensi LITERAL di blok `if` yang membuat cabang Node (zod,
 * node:crypto) dibuang dari bundel edge.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { serverEnv } = await import('@/lib/env');
    serverEnv();
    // Sentry opsional (hanya bila SENTRY_DSN diisi), data pribadi disamarkan: src/lib/monitoring.ts.
    const { installErrorForwarding } = await import('@/lib/monitoring');
    installErrorForwarding();
  }
}
