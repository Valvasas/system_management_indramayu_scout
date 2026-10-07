-- Migrasi kustom: user aplikasi boleh MEMBACA jurnal migrasi Drizzle (tidak bisa menulis).
-- Dibutuhkan pg_dump dari tombol backup portal; tanpa jurnal itu, hasil restore akan
-- mencoba menjalankan ulang semua migrasi. Ditemukan saat uji di PostgreSQL 16 sungguhan.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rumah_pramuka_app')
     AND EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'drizzle') THEN
    GRANT USAGE ON SCHEMA drizzle TO rumah_pramuka_app;
    GRANT SELECT ON ALL TABLES IN SCHEMA drizzle TO rumah_pramuka_app;
    GRANT SELECT ON ALL SEQUENCES IN SCHEMA drizzle TO rumah_pramuka_app;
  END IF;
END
$$;
