/**
 * Dijalankan Next sekali saat server start (butuh `experimental.instrumentationHook`).
 * Validasi env di sini membuat konfigurasi produksi yang cacat gagal sebelum
 * menerima permintaan pertama, dengan pesan yang hanya menyebut nama variabel.
 */
export async function register() {
  const { nextRuntime, serverEnv } = await import('@/lib/env');
  if (nextRuntime !== 'nodejs') return;
  serverEnv();
}
