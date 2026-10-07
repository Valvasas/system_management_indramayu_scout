'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, inArray } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { audit } from '@/lib/auth/audit';
import { gudepScope } from '@/lib/auth/scope';
import { can, requirePermission, type SessionUser } from '@/lib/auth/session';
import { normalizeDate, parseCsv } from '@/lib/csv';
import { GOLONGAN_OPTIONS } from '@/lib/domain';
import { isFile } from '@/lib/storage';
import { findDuplicates } from './queries';
import { MemberSchema, type MemberInput } from './validation';
import { initialMemberStatus } from '@/features/consent/status';

const MAX_ROWS = 1000;
const MAX_BYTES = 2 * 1024 * 1024;

export interface PreviewRow {
  line: number;
  name: string;
  gudep: string;
  ok: boolean;
  duplicate: boolean;
  problems: string[];
}

export type ImportState = {
  step: 'upload' | 'preview' | 'done';
  message?: string;
  error?: boolean;
  csv?: string;
  rows?: PreviewRow[];
  validCount?: number;
  invalidCount?: number;
  duplicateCount?: number;
};

/** Nama kolom yang diterima (huruf kecil, spasi → garis bawah). */
const COLUMNS: Record<string, keyof MemberInput | 'gudepNumber'> = {
  nama_lengkap: 'fullName',
  nama: 'fullName',
  jenis_kelamin: 'gender',
  jk: 'gender',
  tanggal_lahir: 'birthDate',
  tgl_lahir: 'birthDate',
  golongan: 'golongan',
  nomor_gudep: 'gudepNumber',
  no_gudep: 'gudepNumber',
  nomor_kta: 'kta',
  no_kta: 'kta',
  kta: 'kta',
  telepon: 'phone',
  alamat: 'address',
  nama_wali: 'guardianName',
  telepon_wali: 'guardianPhone',
  tanggal_bergabung: 'joinedAt',
  catatan: 'notes',
};

// Kolom tanggal_persetujuan_wali (templat lama) sengaja diabaikan: persetujuan wali hanya lewat kode wali.
const DATE_FIELDS = new Set(['birthDate', 'joinedAt']);

function normalizeGender(v: string) {
  const s = v.trim().toLowerCase();
  if (['l', 'lk', 'laki-laki', 'laki laki', 'pria'].includes(s)) return 'L';
  if (['p', 'pr', 'perempuan', 'wanita'].includes(s)) return 'P';
  return v;
}

function normalizeGolongan(v: string) {
  const s = v.trim().toLowerCase();
  const hit = GOLONGAN_OPTIONS.find((o) => o.value.toLowerCase() === s || o.label.toLowerCase().startsWith(s));
  return hit?.value ?? v.toUpperCase();
}

interface Analysed {
  preview: PreviewRow[];
  valid: MemberInput[];
}

async function analyse(user: SessionUser, csv: string): Promise<Analysed | string> {
  // Baris yang diawali '#' adalah contoh/komentar dan diabaikan.
  const table = parseCsv(csv).filter((row, i) => i === 0 || !row[0]?.startsWith('#'));
  if (table.length < 2) return 'Berkas kosong atau hanya berisi judul kolom.';
  if (table.length - 1 > MAX_ROWS) return `Maksimal ${MAX_ROWS} baris per impor. Pecah berkas menjadi beberapa bagian.`;

  const header = table[0].map((h) => h.toLowerCase().trim().replace(/\s+/g, '_'));
  const mapping = header.map((h) => COLUMNS[h]);
  if (!mapping.includes('fullName') || !mapping.includes('birthDate')) {
    return 'Kolom wajib tidak ditemukan. Gunakan templat: minimal kolom "nama_lengkap" dan "tanggal_lahir".';
  }

  const db = await getDb();
  const gudeps = await db
    .select({ id: schema.gudep.id, number: schema.gudep.number, name: schema.gudep.name })
    .from(schema.gudep)
    .where(gudepScope(user));
  const byNumber = new Map(gudeps.filter((g) => g.number).map((g) => [g.number!.trim(), g]));
  const ownGudep = user.role === 'STAFF_GUDEP' ? gudeps.find((g) => g.id === user.gudepId) : undefined;

  const seenInFile = new Set<string>();
  const preview: PreviewRow[] = [];
  const valid: MemberInput[] = [];

  for (let i = 1; i < table.length; i++) {
    const cells = table[i];
    const raw: Record<string, string> = {};
    mapping.forEach((field, idx) => {
      if (!field) return;
      let v = cells[idx] ?? '';
      if (DATE_FIELDS.has(field)) v = normalizeDate(v) ?? v;
      if (field === 'gender') v = normalizeGender(v);
      if (field === 'golongan') v = normalizeGolongan(v);
      raw[field] = v;
    });

    const problems: string[] = [];
    const gudep = raw.gudepNumber ? byNumber.get(raw.gudepNumber.trim()) : ownGudep;
    if (!gudep)
      problems.push(raw.gudepNumber ? `Nomor gudep "${raw.gudepNumber}" tidak dikenal / di luar wilayah` : 'Nomor gudep wajib diisi');

    const parsed = MemberSchema.safeParse({ ...raw, gudepId: gudep?.id ?? '', confirmDuplicate: 'on' });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === 'gudepId') continue;
        problems.push(`${String(issue.path[0])}: ${issue.message}`);
      }
    }

    let duplicate = false;
    if (parsed.success) {
      const key = `${parsed.data.fullName.toLowerCase().replace(/\s+/g, ' ')}|${parsed.data.birthDate}`;
      const inDb = await findDuplicates(user, parsed.data.fullName, parsed.data.birthDate);
      duplicate = seenInFile.has(key) || inDb.visible.length + inDb.hiddenCount > 0;
      seenInFile.add(key);
    }

    const ok = problems.length === 0 && parsed.success;
    preview.push({
      line: i + 1,
      name: raw.fullName || '(tanpa nama)',
      gudep: gudep?.name ?? raw.gudepNumber ?? '-',
      ok,
      duplicate,
      problems,
    });
    if (ok && !duplicate) valid.push(parsed.data);
  }
  return { preview, valid };
}

export async function importMembersAction(prev: ImportState, formData: FormData): Promise<ImportState> {
  const user = await requirePermission('members.import');
  if (!can(user, 'members.create')) return { step: 'upload', error: true, message: 'Tidak diizinkan.' };

  const confirming = formData.get('confirm') === '1';
  let csv: string;
  if (confirming) {
    csv = String(formData.get('csv') ?? '');
  } else {
    const file = formData.get('file');
    if (!isFile(file)) return { step: 'upload', error: true, message: 'Pilih berkas CSV terlebih dahulu.' };
    if (file.size > MAX_BYTES) return { step: 'upload', error: true, message: 'Ukuran berkas maksimal 2 MB.' };
    csv = await file.text();
  }
  if (csv.length > MAX_BYTES) return { step: 'upload', error: true, message: 'Ukuran berkas maksimal 2 MB.' };

  const result = await analyse(user, csv);
  if (typeof result === 'string') return { step: 'upload', error: true, message: result };
  const { preview, valid } = result;
  const invalidCount = preview.filter((r) => !r.ok).length;
  const duplicateCount = preview.filter((r) => r.ok && r.duplicate).length;

  if (!confirming) {
    return {
      step: 'preview',
      csv,
      rows: preview,
      validCount: valid.length,
      invalidCount,
      duplicateCount,
      message: valid.length ? undefined : 'Tidak ada baris yang siap disimpan. Perbaiki berkas lalu unggah ulang.',
      error: valid.length === 0,
    };
  }

  if (valid.length === 0) return { ...prev, error: true, message: 'Tidak ada baris yang siap disimpan.' };

  const canVerify = can(user, 'members.verify');
  // Anak (< 18) tidak pernah langsung aktif: verifikasinya menunggu persetujuan wali.
  const verifyNow = (birthDate: string) => initialMemberStatus(canVerify, birthDate) === 'ACTIVE';
  const db = await getDb();
  // KTA yang sudah terpakai di database dikosongkan agar impor tidak gagal seluruhnya.
  const ktas = valid.map((v) => v.kta).filter((k): k is string => !!k);
  const usedKta = new Set(
    ktas.length
      ? (
          await db
            .select({ kta: schema.members.kta })
            .from(schema.members)
            .where(and(inArray(schema.members.kta, ktas)))
        ).map((r) => r.kta)
      : [],
  );

  await db.transaction(async (tx) => {
    const seenKta = new Set<string>();
    for (const v of valid) {
      const { confirmDuplicate: _c, ...row } = v;
      const kta = row.kta && !usedKta.has(row.kta) && !seenKta.has(row.kta) ? row.kta : null;
      if (kta) seenKta.add(kta);
      await tx.insert(schema.members).values({
        ...row,
        kta,
        status: verifyNow(row.birthDate) ? 'ACTIVE' : 'PENDING',
        verifiedById: verifyNow(row.birthDate) ? user.id : null,
        verifiedAt: verifyNow(row.birthDate) ? new Date() : null,
        createdById: user.id,
      });
    }
  });

  await audit(user, { action: 'member.import', summary: `Mengimpor ${valid.length} anggota dari CSV`, entityType: 'member' });
  revalidatePath('/dashboard/anggota');
  return {
    step: 'done',
    message: `${valid.length} anggota tersimpan${canVerify ? ' (dewasa langsung aktif; anak menunggu persetujuan wali)' : ' dan menunggu verifikasi kwarran'}. ${invalidCount + duplicateCount ? `${invalidCount + duplicateCount} baris dilewati.` : ''}`,
  };
}

/** Dipakai halaman unduh templat. */
export async function templateGudepNumber(user: SessionUser): Promise<string> {
  if (user.role !== 'STAFF_GUDEP' || !user.gudepId) return '';
  const db = await getDb();
  const [g] = await db.select({ number: schema.gudep.number }).from(schema.gudep).where(eq(schema.gudep.id, user.gudepId)).limit(1);
  return g?.number ?? '';
}
