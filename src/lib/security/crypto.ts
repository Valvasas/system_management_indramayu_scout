/**
 * SERVER-ONLY. Enkripsi kolom sensitif tingkat aplikasi (AES-256-GCM) + blind index (HMAC-SHA256).
 *
 * Format tersimpan: `enc:v1:<keyId>:<base64url(iv 12B | ciphertext | tag 16B)>`
 * - `keyId` memungkinkan rotasi: kunci lama tetap bisa mendekripsi, enkripsi baru selalu
 *   memakai kunci aktif. `npm run db:encrypt-backfill` mengenkripsi ulang data lama.
 * - AAD = nama kolom (mis. `members.phone`): ciphertext tidak bisa dipindah ke kolom lain.
 * - Nilai tanpa prefiks dianggap teks lama (sebelum backfill) dan dikembalikan apa adanya,
 *   sehingga migrasi bisa bertahap tanpa downtime.
 *
 * Kunci dari env (`DATA_ENCRYPTION_KEYS`, `DATA_ENCRYPTION_KEY_ID`, `BLIND_INDEX_KEY`).
 * Tanpa kunci (pengembangan / CI dengan ALLOW_PGLITE=1) dipakai kunci pengembangan yang
 * DIKETAHUI PUBLIK — aman hanya untuk data demo fiktif; produksi menolak start tanpanya.
 *
 * Impor relatif (bukan `@/`) karena modul ini ikut dimuat drizzle-kit lewat src/db/schema.ts.
 */
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from 'node:crypto';
import { serverEnv } from '../env';

const PREFIX = 'enc:v1:';
const IV_BYTES = 12;
const TAG_BYTES = 16;

export interface Keyring {
  activeId: string;
  keys: ReadonlyMap<string, Buffer>;
  blindKey: Buffer;
  /** true = kunci pengembangan bawaan sedang dipakai. */
  dev: boolean;
}

export class FieldDecryptionError extends Error {
  constructor(reason: string) {
    super(`Gagal mendekripsi kolom terenkripsi: ${reason}`);
    this.name = 'FieldDecryptionError';
  }
}

const devKey = (label: string) => createHash('sha256').update(`rumah-pramuka-indramayu:kunci-pengembangan:${label}`).digest();

/** Kunci pengembangan — publik, deterministik. JANGAN untuk data nyata. */
export const DEV_KEYRING: Keyring = {
  activeId: 'dev',
  keys: new Map([['dev', devKey('data')]]),
  blindKey: devKey('blind-index'),
  dev: true,
};

let cachedRing: Keyring | undefined;
let warned = false;

/** Keyring dari env (di-cache). */
export function envKeyring(): Keyring {
  if (cachedRing) return cachedRing;
  const env = serverEnv();
  if (!env.DATA_ENCRYPTION_KEYS) {
    if (env.isProduction && !warned) {
      warned = true;
      console.warn('[crypto] DATA_ENCRYPTION_KEYS kosong: memakai kunci pengembangan publik (hanya untuk data demo).');
    }
    cachedRing = { ...DEV_KEYRING, blindKey: env.BLIND_INDEX_KEY ?? DEV_KEYRING.blindKey };
    return cachedRing;
  }
  const activeId = env.DATA_ENCRYPTION_KEY_ID ?? [...env.DATA_ENCRYPTION_KEYS.keys()][0];
  cachedRing = { activeId, keys: env.DATA_ENCRYPTION_KEYS, blindKey: env.BLIND_INDEX_KEY ?? DEV_KEYRING.blindKey, dev: false };
  return cachedRing;
}

export const isEncrypted = (value: string) => value.startsWith(PREFIX);

/** keyId dari nilai terenkripsi, atau null untuk teks lama. */
export function encryptedKeyId(value: string): string | null {
  if (!isEncrypted(value)) return null;
  const rest = value.slice(PREFIX.length);
  const sep = rest.indexOf(':');
  return sep > 0 ? rest.slice(0, sep) : null;
}

export function createFieldCipher(ring: Keyring) {
  return {
    encrypt(plaintext: string, aad: string): string {
      const key = ring.keys.get(ring.activeId);
      if (!key) throw new Error('Kunci enkripsi aktif tidak ditemukan.');
      const iv = randomBytes(IV_BYTES);
      const cipher = createCipheriv('aes-256-gcm', key, iv);
      cipher.setAAD(Buffer.from(aad, 'utf8'));
      const body = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
      const payload = Buffer.concat([iv, body, cipher.getAuthTag()]).toString('base64url');
      return `${PREFIX}${ring.activeId}:${payload}`;
    },

    decrypt(value: string, aad: string): string {
      if (!isEncrypted(value)) return value; // teks lama, belum di-backfill
      const keyId = encryptedKeyId(value);
      const key = keyId ? ring.keys.get(keyId) : undefined;
      if (!keyId || !key) throw new FieldDecryptionError('kunci tidak dikenal (rotasi belum lengkap?)');
      const raw = Buffer.from(value.slice(PREFIX.length + keyId.length + 1), 'base64url');
      if (raw.length < IV_BYTES + TAG_BYTES) throw new FieldDecryptionError('format rusak');
      try {
        const decipher = createDecipheriv('aes-256-gcm', key, raw.subarray(0, IV_BYTES));
        decipher.setAAD(Buffer.from(aad, 'utf8'));
        decipher.setAuthTag(raw.subarray(raw.length - TAG_BYTES));
        return Buffer.concat([decipher.update(raw.subarray(IV_BYTES, raw.length - TAG_BYTES)), decipher.final()]).toString('utf8');
      } catch {
        throw new FieldDecryptionError('autentikasi gagal (data diubah atau kunci salah)');
      }
    },

    /** Perlu dienkripsi (ulang)? Teks lama, atau terenkripsi dengan kunci non-aktif. */
    needsReencryption(value: string): boolean {
      return encryptedKeyId(value) !== ring.activeId;
    },

    /**
     * Blind index: HMAC deterministik untuk pencarian/penyamaran tanpa menyimpan nilai asli.
     * `context` memisahkan domain (nilai sama di konteks berbeda → indeks berbeda).
     */
    blindIndex(value: string, context: string): string {
      return createHmac('sha256', ring.blindKey).update(`${context}\u0000${value}`).digest('hex');
    },
  };
}

const envCipher = () => createFieldCipher(envKeyring());

export const encryptField = (plaintext: string, aad: string) => envCipher().encrypt(plaintext, aad);
export const decryptField = (value: string, aad: string) => envCipher().decrypt(value, aad);
export const needsReencryption = (value: string) => envCipher().needsReencryption(value);
export const blindIndex = (value: string, context: string) => envCipher().blindIndex(value, context);
