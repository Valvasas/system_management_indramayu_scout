/**
 * Kolom teks terenkripsi (AES-256-GCM) yang transparan bagi kode aplikasi:
 * nilai dienkripsi saat ditulis dan didekripsi saat dibaca lewat Drizzle.
 * Tipe SQL tetap `text`, jadi tidak ada perubahan DDL; data lama (teks biasa) tetap terbaca
 * sampai `npm run db:encrypt-backfill` dijalankan.
 *
 * Konsekuensi: kolom ini TIDAK bisa dipakai di WHERE/ORDER BY/LIKE (ciphertext acak per
 * penulisan). Bila kelak butuh pencarian, tambah kolom blind index (`blindIndex()`).
 */
import { customType } from 'drizzle-orm/pg-core';
import { decryptField, encryptField } from '../lib/security/crypto';

export const encryptedText = (name: string, aad: string) =>
  customType<{ data: string; driverData: string }>({
    dataType: () => 'text',
    toDriver: (value) => encryptField(value, aad),
    fromDriver: (value) => decryptField(value, aad),
  })(name);

/** Kolom yang dienkripsi — dipakai skrip backfill. Tambahkan di sini setiap kolom baru. */
export const ENCRYPTED_COLUMNS = [
  { table: 'members', column: 'phone', aad: 'members.phone' },
  { table: 'members', column: 'address', aad: 'members.address' },
  { table: 'members', column: 'guardian_name', aad: 'members.guardian_name' },
  { table: 'members', column: 'guardian_phone', aad: 'members.guardian_phone' },
] as const;

export const aadFor = (table: string, column: string) => {
  const found = ENCRYPTED_COLUMNS.find((c) => c.table === table && c.column === column);
  if (!found) throw new Error(`Kolom ${table}.${column} tidak terdaftar sebagai kolom terenkripsi.`);
  return found.aad;
};
