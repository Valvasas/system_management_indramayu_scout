import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createFieldCipher, DEV_KEYRING, encryptedKeyId, FieldDecryptionError, isEncrypted, type Keyring } from '@/lib/security/crypto';
import { EnvError, parseServerEnv } from '@/lib/env';

const ring = (activeId: string, keys: Record<string, Buffer>): Keyring => ({
  activeId,
  keys: new Map(Object.entries(keys)),
  blindKey: randomBytes(32),
  dev: false,
});
const k1 = randomBytes(32);
const k2 = randomBytes(32);

describe('enkripsi kolom (AES-256-GCM, 1.3)', () => {
  const c = createFieldCipher(ring('k1', { k1 }));

  it('round-trip dan format berprefiks keyId', () => {
    const enc = c.encrypt('0812-3456-7890', 'members.phone');
    expect(isEncrypted(enc)).toBe(true);
    expect(encryptedKeyId(enc)).toBe('k1');
    expect(enc).not.toContain('0812');
    expect(c.decrypt(enc, 'members.phone')).toBe('0812-3456-7890');
  });

  it('IV acak: nilai sama menghasilkan ciphertext berbeda', () => {
    expect(c.encrypt('sama', 'members.address')).not.toBe(c.encrypt('sama', 'members.address'));
  });

  it('AAD mengikat ke kolom: ciphertext telepon tidak bisa dipindah ke kolom alamat', () => {
    const enc = c.encrypt('rahasia', 'members.phone');
    expect(() => c.decrypt(enc, 'members.address')).toThrow(FieldDecryptionError);
  });

  it('perubahan satu byte terdeteksi', () => {
    const enc = c.encrypt('Jl. Pramuka 1', 'members.address');
    const body = enc.slice(enc.lastIndexOf(':') + 1);
    const flipped = Buffer.from(body, 'base64url');
    flipped[14] ^= 0x01;
    const tampered = `${enc.slice(0, enc.lastIndexOf(':') + 1)}${flipped.toString('base64url')}`;
    expect(() => c.decrypt(tampered, 'members.address')).toThrow(/autentikasi gagal/);
  });

  it('teks lama (sebelum backfill) dikembalikan apa adanya dan ditandai perlu enkripsi', () => {
    expect(c.decrypt('0812 lama', 'members.phone')).toBe('0812 lama');
    expect(c.needsReencryption('0812 lama')).toBe(true);
  });

  it('rotasi: kunci lama tetap bisa mendekripsi, enkripsi baru memakai kunci aktif', () => {
    const lama = createFieldCipher(ring('k1', { k1 }));
    const baru = createFieldCipher(ring('k2', { k1, k2 }));
    const encLama = lama.encrypt('wali', 'members.guardian_name');
    expect(baru.decrypt(encLama, 'members.guardian_name')).toBe('wali');
    expect(baru.needsReencryption(encLama)).toBe(true);
    const encBaru = baru.encrypt('wali', 'members.guardian_name');
    expect(encryptedKeyId(encBaru)).toBe('k2');
    expect(baru.needsReencryption(encBaru)).toBe(false);
  });

  it('kunci tidak dikenal → galat jelas tanpa nilai', () => {
    const enc = createFieldCipher(ring('k2', { k2 })).encrypt('x', 'a');
    expect(() => c.decrypt(enc, 'a')).toThrow(/kunci tidak dikenal/);
  });

  it('blind index deterministik, terpisah per konteks, tidak memuat nilai asli', () => {
    const a = c.blindIndex('10.0.0.1', 'rate-limit');
    expect(a).toBe(c.blindIndex('10.0.0.1', 'rate-limit'));
    expect(a).not.toBe(c.blindIndex('10.0.0.1', 'lain'));
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    // Kunci HMAC berbeda → indeks berbeda (indeks tidak bisa dihitung tanpa kunci server).
    expect(createFieldCipher(DEV_KEYRING).blindIndex('10.0.0.1', 'rate-limit')).not.toBe(a);
  });
});

describe('kunci enkripsi dari env', () => {
  const b64 = (b: Buffer) => b.toString('base64');
  const base = { NODE_ENV: 'production', DATABASE_URL: 'postgresql://u:p@h/db' };

  it('produksi tanpa kunci gagal cepat', () => {
    try {
      parseServerEnv(base);
      throw new Error('harus gagal');
    } catch (e) {
      expect(e).toBeInstanceOf(EnvError);
      expect((e as EnvError).issues.map((i) => i.variable).sort()).toEqual(['BLIND_INDEX_KEY', 'DATA_ENCRYPTION_KEYS']);
    }
  });

  it('daftar kunci valid + id aktif', () => {
    const env = parseServerEnv({
      ...base,
      DATA_ENCRYPTION_KEYS: `k1:${b64(k1)},k2:${b64(k2)}`,
      DATA_ENCRYPTION_KEY_ID: 'k2',
      BLIND_INDEX_KEY: b64(randomBytes(32)),
    });
    expect([...env.DATA_ENCRYPTION_KEYS!.keys()]).toEqual(['k1', 'k2']);
    expect(env.DATA_ENCRYPTION_KEYS!.get('k2')!.equals(k2)).toBe(true);
  });

  it('kunci cacat, id ganda, atau id aktif tak ada ditolak tanpa membocorkan kunci', () => {
    const secret = b64(randomBytes(16)); // 16 byte: terlalu pendek
    for (const bad of [
      { DATA_ENCRYPTION_KEYS: `k1:${secret}` },
      { DATA_ENCRYPTION_KEYS: `k1:${b64(k1)},k1:${b64(k2)}` },
      { DATA_ENCRYPTION_KEYS: `k1:${b64(k1)},k2:${b64(k2)}` }, // dua kunci tanpa id aktif
      { DATA_ENCRYPTION_KEYS: `k1:${b64(k1)}`, DATA_ENCRYPTION_KEY_ID: 'k9' },
    ]) {
      try {
        parseServerEnv({ ...base, BLIND_INDEX_KEY: b64(randomBytes(32)), ...bad });
        throw new Error('harus gagal');
      } catch (e) {
        expect(e).toBeInstanceOf(EnvError);
        expect((e as Error).message).not.toContain(secret);
        expect((e as Error).message).not.toContain(b64(k1));
      }
    }
  });
});

describe('kunci pengembangan publik tidak pernah dipakai untuk basis data sungguhan', () => {
  const pg = 'postgresql://u:p@h/db';
  const issuesOf = (src: Record<string, string>) => {
    try {
      parseServerEnv(src);
      return [];
    } catch (e) {
      return (e as EnvError).issues.map((i) => i.variable).sort();
    }
  };

  it('skrip tsx (NODE_ENV kosong) dengan DATABASE_URL tanpa kunci → ditolak', () => {
    expect(issuesOf({ DATABASE_URL: pg })).toEqual(['BLIND_INDEX_KEY', 'DATA_ENCRYPTION_KEYS']);
  });

  it('ALLOW_PGLITE=1 yang tertinggal di produksi tidak melonggarkan kewajiban kunci', () => {
    expect(issuesOf({ NODE_ENV: 'production', DATABASE_URL: pg, ALLOW_PGLITE: '1' })).toEqual(['BLIND_INDEX_KEY', 'DATA_ENCRYPTION_KEYS']);
  });

  it('ALLOW_DEV_KEYS hanya untuk PostgreSQL lokal, ditolak di produksi', () => {
    expect(issuesOf({ DATABASE_URL: pg, ALLOW_DEV_KEYS: '1' })).toEqual([]);
    expect(issuesOf({ NODE_ENV: 'production', DATABASE_URL: pg, ALLOW_DEV_KEYS: '1' })).toContain('ALLOW_DEV_KEYS');
  });

  it('PGlite tanpa DATABASE_URL tetap boleh memakai kunci pengembangan (dev & CI)', () => {
    expect(issuesOf({})).toEqual([]);
    expect(issuesOf({ NODE_ENV: 'production', ALLOW_PGLITE: '1' })).toEqual([]);
  });
});
