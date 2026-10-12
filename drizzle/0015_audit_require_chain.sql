-- Migrasi kustom (drizzle-kit generate --custom): setiap entri log audit BARU wajib berantai.
-- Sebelumnya baris ber-hash NULL dengan id di bawah entri berantai pertama selalu dihitung
-- "entri lama" dan dilewati verifikasi, sehingga user aplikasi (punya INSERT) bisa menyisipkan
-- entri palsu yang tak terdeteksi. NOT VALID: baris lama (sebelum rantai aktif) tetap sah.
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_chained" CHECK ("hash" IS NOT NULL AND "prev_hash" IS NOT NULL) NOT VALID;
