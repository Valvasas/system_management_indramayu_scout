-- Migrasi kustom (drizzle-kit generate --custom): log audit INSERT-only (1.6).
-- 1) Trigger memblokir UPDATE, DELETE, dan TRUNCATE untuk SEMUA peran (juga di PGlite).
--    Satu-satunya pengecualian: DELETE oleh skrip retensi yang menyalakan
--    `rumah_pramuka.audit_retention = on` di transaksinya. GUC ini bisa diset siapa pun,
--    jadi ia bukan batas keamanan — batasnya adalah REVOKE di bawah.
CREATE OR REPLACE FUNCTION audit_logs_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' AND current_setting('rumah_pramuka.audit_retention', true) = 'on' THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'audit_logs hanya boleh ditambah (%, ditolak)', TG_OP USING ERRCODE = 'insufficient_privilege';
END
$$;
--> statement-breakpoint
CREATE TRIGGER audit_logs_no_update_delete BEFORE UPDATE OR DELETE ON "audit_logs" FOR EACH ROW EXECUTE FUNCTION audit_logs_guard();
--> statement-breakpoint
CREATE TRIGGER audit_logs_no_truncate BEFORE TRUNCATE ON "audit_logs" FOR EACH STATEMENT EXECUTE FUNCTION audit_logs_guard();
--> statement-breakpoint
-- 2) User aplikasi (docker/db-init) hanya boleh SELECT + INSERT pada log audit & jangkarnya.
--    Retensi log dijalankan pemilik skema, bukan user aplikasi. Nama peran lain → REVOKE manual
--    (lihat docs/security/audit-log-policy.md).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rumah_pramuka_app') THEN
    REVOKE UPDATE, DELETE, TRUNCATE ON "audit_logs" FROM rumah_pramuka_app;
    REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON "audit_chain_anchors" FROM rumah_pramuka_app;
  END IF;
END
$$;
