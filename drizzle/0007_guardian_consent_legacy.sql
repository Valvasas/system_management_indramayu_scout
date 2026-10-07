-- Migrasi data kustom (drizzle-kit generate --custom): tanggal persetujuan wali yang dulu
-- diketik staf dipindah ke riwayat persetujuan sebagai LEGACY_MANUAL (belum terverifikasi).
-- Kolom members.guardian_consent_at TIDAK dihapus (data lama tetap ada). Idempoten.
INSERT INTO "guardian_consents" ("member_id", "scope", "granted", "text_version", "method", "note", "decided_at")
SELECT m."id", 'DATA', true, 'manual-sebelum-2026-10', 'LEGACY_MANUAL',
       'Tanggal persetujuan diketik staf sebelum alur kode wali (belum terverifikasi).',
       (m."guardian_consent_at"::timestamp AT TIME ZONE 'Asia/Jakarta')
FROM "members" m
WHERE m."guardian_consent_at" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "guardian_consents" c WHERE c."member_id" = m."id" AND c."method" = 'LEGACY_MANUAL'
  );
