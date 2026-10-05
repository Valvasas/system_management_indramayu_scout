'use client';

import React from 'react';
import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { AlertCircle, CheckCircle2, Copy, FileCheck2, Upload } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { importMembersAction, type ImportState } from '@/features/members/import';

const Submit: React.FC<{ children: React.ReactNode; variant?: 'primary' | 'outline' }> = ({ children, variant = 'primary' }) => {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} isLoading={pending} loadingLabel="Memproses">
      {children}
    </Button>
  );
};

/** Alur impor: 1) unggah → 2) pratinjau & periksa → 3) simpan. Tidak ada yang tersimpan sebelum langkah 3. */
export const ImportFlow: React.FC = () => {
  const [state, action] = useFormState<ImportState, FormData>(importMembersAction, { step: 'upload' });

  if (state.step === 'done') {
    return (
      <div role="status" className="rounded-lg border border-status-success-border bg-status-success-surface p-6 text-status-success-text">
        <p className="flex items-center gap-2 font-semibold">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          Impor selesai
        </p>
        <p className="mt-1">{state.message}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <ButtonLink href="/dashboard/anggota">Lihat daftar anggota</ButtonLink>
          <ButtonLink href="/dashboard/anggota/impor" variant="outline">
            Impor berkas lain
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {state.message && (
        <p role={state.error ? 'alert' : 'status'} className="flex items-start gap-2 rounded-lg border border-status-danger-border bg-status-danger-surface px-4 py-3 text-sm font-medium text-status-danger-text">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {state.message}
        </p>
      )}

      {state.step === 'upload' && (
        <form action={action} className="space-y-4 rounded-2xl border border-border-subtle bg-surface-base p-5 sm:p-6">
          <div>
            <label htmlFor="file" className="block font-medium text-text-primary">
              Berkas CSV
            </label>
            <p id="file-hint" className="text-sm text-text-secondary">
              Dari Excel: File → Simpan Sebagai → <strong>CSV (dipisahkan koma/titik koma)</strong>. Maksimal 1.000 baris.
            </p>
            <input
              id="file"
              name="file"
              type="file"
              accept=".csv,text/csv"
              required
              aria-describedby="file-hint"
              className="mt-2 block w-full rounded-lg border border-border-strong bg-surface-base text-base text-text-secondary file:mr-4 file:min-h-touch file:cursor-pointer file:border-0 file:border-r file:border-border-subtle file:bg-surface-subtle file:px-4 file:font-semibold file:text-text-primary"
            />
          </div>
          <Submit>
            <FileCheck2 className="h-4 w-4" aria-hidden="true" />
            Periksa berkas
          </Submit>
        </form>
      )}

      {state.step === 'preview' && state.rows && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-status-success-border bg-status-success-surface p-4 text-status-success-text">
              <p className="font-display text-2xl font-semibold">{state.validCount}</p>
              <p className="text-sm font-medium">baris siap disimpan</p>
            </div>
            <div className="rounded-lg border border-status-danger-border bg-status-danger-surface p-4 text-status-danger-text">
              <p className="font-display text-2xl font-semibold">{state.invalidCount}</p>
              <p className="text-sm font-medium">baris berisi kesalahan (dilewati)</p>
            </div>
            <div className="rounded-lg border border-status-warning-border bg-status-warning-surface p-4 text-status-warning-text">
              <p className="font-display text-2xl font-semibold">{state.duplicateCount}</p>
              <p className="text-sm font-medium">kemungkinan data ganda (dilewati)</p>
            </div>
          </div>

          <div className="max-h-[28rem] overflow-auto rounded-2xl border border-border-subtle bg-surface-base" role="region" aria-label="Pratinjau baris impor" tabIndex={0}>
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-surface-canvas">
                <tr className="border-b border-border-subtle text-text-secondary">
                  <th scope="col" className="px-4 py-2 font-semibold">Baris</th>
                  <th scope="col" className="px-4 py-2 font-semibold">Nama</th>
                  <th scope="col" className="px-4 py-2 font-semibold">Gudep</th>
                  <th scope="col" className="px-4 py-2 font-semibold">Hasil pemeriksaan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {state.rows.map((r) => (
                  <tr key={r.line}>
                    <td className="px-4 py-2 text-text-secondary">{r.line}</td>
                    <td className="px-4 py-2 font-medium text-text-primary">{r.name}</td>
                    <td className="px-4 py-2 text-text-secondary">{r.gudep}</td>
                    <td className="px-4 py-2">
                      {!r.ok ? (
                        <>
                          <Badge tone="danger" icon={AlertCircle}>Perlu diperbaiki</Badge>
                          <ul className="mt-1 list-disc pl-5 text-status-danger-text">
                            {r.problems.map((p) => (
                              <li key={p}>{p}</li>
                            ))}
                          </ul>
                        </>
                      ) : r.duplicate ? (
                        <Badge tone="warning" icon={Copy}>Kemungkinan ganda</Badge>
                      ) : (
                        <Badge tone="success" icon={CheckCircle2}>Siap</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {state.validCount ? (
              <form action={action}>
                <input type="hidden" name="confirm" value="1" />
                <input type="hidden" name="csv" value={state.csv} />
                <Submit>
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  Simpan {state.validCount} anggota
                </Submit>
              </form>
            ) : null}
            <Link href="/dashboard/anggota/impor" className="inline-flex min-h-touch items-center rounded-lg px-3 font-semibold text-text-accent hover:underline">
              Unggah berkas lain
            </Link>
          </div>
          <p className="text-sm text-text-secondary">
            Baris yang dilewati tidak disimpan. Perbaiki di Excel lalu impor ulang, atau tambahkan satu per satu. Data ganda perlu diperiksa manual
            lewat menu Tambah anggota.
          </p>
        </>
      )}
    </div>
  );
};
