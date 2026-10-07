import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, desc, eq } from 'drizzle-orm';
import { AlertTriangle, Lock, Pencil, RotateCcw, UserX } from 'lucide-react';
import { getDb, schema } from '@/db';
import { ActionButton } from '@/components/dashboard/ConfirmButton';
import { ArchiveForm, PortalAccountForm, VerifyForm } from '@/components/dashboard/members/MemberActions';
import { InfoList, MemberStatusBadge, Notice, Panel, PortalHeader } from '@/components/dashboard/ui';
import { ButtonLink } from '@/components/ui/Button';
import {
  anonymizeMemberAction,
  archiveMemberAction,
  createPortalAccountAction,
  restoreMemberAction,
  verifyMemberAction,
} from '@/features/members/actions';
import { getMember } from '@/features/members/queries';
import { cancelTransferAction, requestTransferAction } from '@/features/members/transfer-actions';
import { transferTargetOptions, transfersForMember } from '@/features/members/transfers';
import { TransferRequestForm } from '@/components/dashboard/members/TransferForms';
import { ConsentPanel } from '@/components/dashboard/consent/ConsentPanel';
import { resetPesertaPasswordAction } from '@/features/users/actions';
import { can, requirePermission } from '@/lib/auth/session';
import { GENDER_LABELS, ageOn, golonganLabel } from '@/lib/domain';
import { formatDate, formatTime } from '@/lib/format';

export const metadata: Metadata = { title: 'Detail anggota' };

const SAVED: Record<string, string> = {
  baru: 'Anggota tersimpan.',
  ubah: 'Perubahan tersimpan.',
  setuju: 'Data disetujui. Anggota kini berstatus Aktif.',
  kembali: 'Data dikembalikan ke pengisi beserta catatan Anda.',
  arsip: 'Anggota diarsipkan.',
  pulih: 'Anggota dipulihkan dan menunggu verifikasi ulang.',
  mutasi: 'Mutasi diterapkan. Anggota sudah berpindah ke gudep tujuan.',
  'mutasi-diajukan': 'Pengajuan mutasi terkirim. Menunggu persetujuan pengurus wilayah tujuan.',
  'mutasi-batal': 'Pengajuan mutasi dibatalkan.',
};

export default async function DetailAnggotaPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { tersimpan?: string; anonim?: string };
}) {
  const user = await requirePermission('members.read');
  const row = await getMember(user, params.id);
  if (!row) notFound();
  const { m, gudep } = row;
  const sensitive = can(user, 'members.view_sensitive');
  const db = await getDb();

  const [history, registrations, transfers, targets] = await Promise.all([
    db
      .select()
      .from(schema.auditLogs)
      .where(and(eq(schema.auditLogs.entityType, 'member'), eq(schema.auditLogs.entityId, m.id)))
      .orderBy(desc(schema.auditLogs.at))
      .limit(15),
    db
      .select({ title: schema.events.title, dateStart: schema.events.dateStart })
      .from(schema.eventRegistrations)
      .innerJoin(schema.events, eq(schema.events.id, schema.eventRegistrations.eventId))
      .where(eq(schema.eventRegistrations.memberId, m.id))
      .orderBy(desc(schema.events.dateStart))
      .limit(10),
    transfersForMember(m.id),
    can(user, 'members.update') ? transferTargetOptions(m.gudepId) : Promise.resolve([]),
  ]);
  const openTransfer = transfers.find((t) => t.t.status === 'REQUESTED');

  // Melihat data sensitif anggota lintas wilayah tercatat (kebijakan audit).
  if (sensitive && (user.role === 'ADMIN_KWARCAB' || user.role === 'SUPER_ADMIN')) {
    const { audit } = await import('@/lib/auth/audit');
    await audit(user, {
      action: 'member.view_sensitive',
      summary: `Melihat data lengkap ${m.fullName}`,
      entityType: 'member',
      entityId: m.id,
    });
  }

  const archived = m.status === 'ARCHIVED';
  const canVerify = can(user, 'members.verify') && (m.status === 'PENDING' || m.status === 'NEEDS_FIX');

  return (
    <>
      <PortalHeader
        title={m.fullName}
        back={{ href: '/dashboard/anggota', label: 'Kembali ke daftar anggota' }}
        description={
          <span className="flex flex-wrap items-center gap-3">
            <MemberStatusBadge status={m.status} />
            <span>
              {golonganLabel(m.golongan)} · {gudep.name}
            </span>
          </span>
        }
        actions={
          can(user, 'members.update') && !archived ? (
            <ButtonLink href={`/dashboard/anggota/${m.id}/ubah`} variant="outline">
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Ubah data
            </ButtonLink>
          ) : undefined
        }
      />
      {searchParams?.tersimpan && SAVED[searchParams.tersimpan] && <Notice>{SAVED[searchParams.tersimpan]}</Notice>}
      {searchParams?.anonim === 'ok' && (
        <Notice>Identitas anggota dihapus. Riwayat gudep, kegiatan, dan statistik tetap tersimpan tanpa nama.</Notice>
      )}
      {searchParams?.anonim === 'belum-nonaktif' && (
        <Notice tone="warning">Hanya anggota nonaktif (diarsipkan) yang dapat dianonimkan.</Notice>
      )}

      {m.status === 'NEEDS_FIX' && m.reviewNote && (
        <div
          role="note"
          className="mb-6 flex gap-3 rounded-lg border border-status-warning-border bg-status-warning-surface p-4 text-status-warning-text"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Catatan verifikator</p>
            <p className="mt-0.5 whitespace-pre-line">{m.reviewNote}</p>
            {can(user, 'members.update') && (
              <Link href={`/dashboard/anggota/${m.id}/ubah`} className="mt-2 inline-flex min-h-touch items-center font-semibold underline">
                Perbaiki data sekarang
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {canVerify && (
            <Panel title="Verifikasi data" description="Cocokkan dengan dokumen gudep sebelum memutuskan." className="border-border-brand">
              <VerifyForm action={verifyMemberAction.bind(null, m.id)} currentKta={m.kta} />
            </Panel>
          )}

          <Panel title="Identitas">
            <InfoList
              items={[
                { label: 'Nama lengkap', value: m.fullName },
                { label: 'Nomor KTA', value: m.kta },
                { label: 'Jenis kelamin', value: GENDER_LABELS[m.gender] },
                { label: 'Tanggal lahir', value: `${formatDate(m.birthDate)} (${ageOn(m.birthDate)} tahun)` },
                { label: 'Golongan', value: golonganLabel(m.golongan) },
                { label: 'Bergabung', value: m.joinedAt ? formatDate(m.joinedAt) : null },
              ]}
            />
          </Panel>

          <Panel title="Gudep">
            <InfoList
              items={[
                {
                  label: 'Gugus depan',
                  value: can(user, 'gudep.read') ? (
                    <Link href={`/dashboard/gudep/${gudep.id}`} className="text-text-accent underline">
                      {gudep.name}
                    </Link>
                  ) : (
                    gudep.name
                  ),
                },
                { label: 'Nomor gudep', value: gudep.number },
                { label: 'Kwarran', value: row.kwarranName },
                { label: 'Pembina / kontak', value: gudep.contactName },
              ]}
            />
          </Panel>

          <Panel title="Orang tua/wali & kontak" description="Data sangat sensitif — jangan dibagikan di luar keperluan kegiatan.">
            {sensitive ? (
              <InfoList
                items={[
                  { label: 'Nama orang tua/wali', value: m.guardianName },
                  {
                    label: 'Telepon orang tua/wali',
                    value: m.guardianPhone ? (
                      <a href={`tel:${m.guardianPhone.replace(/[^\d+]/g, '')}`} className="text-text-accent underline">
                        {m.guardianPhone}
                      </a>
                    ) : null,
                  },
                  { label: 'Telepon anggota', value: m.phone },
                  { label: 'Alamat', value: m.address },
                ]}
              />
            ) : (
              <p className="flex items-center gap-2 text-text-secondary">
                <Lock className="h-4 w-4" aria-hidden="true" />
                Anda tidak berwenang melihat data ini.
              </p>
            )}
          </Panel>

          <ConsentPanel
            memberId={m.id}
            birthDate={m.birthDate}
            canManage={can(user, 'members.update') && !archived}
            sensitive={sensitive}
          />

          {m.notes && (
            <Panel title="Catatan internal">
              <p className="whitespace-pre-line text-text-secondary">{m.notes}</p>
            </Panel>
          )}
        </div>

        <div className="space-y-6">
          <Panel title="Status verifikasi">
            <InfoList
              columns={1}
              items={[
                { label: 'Status', value: <MemberStatusBadge status={m.status} /> },
                { label: 'Diverifikasi oleh', value: row.verifiedByName },
                { label: 'Tanggal verifikasi', value: m.verifiedAt ? formatDate(m.verifiedAt.toISOString()) : null },
                { label: 'Terakhir diubah', value: `${formatDate(m.updatedAt.toISOString())}, ${formatTime(m.updatedAt.toISOString())}` },
              ]}
            />
          </Panel>

          {can(user, 'members.anonymize') && archived && !m.anonymizedAt && (
            <Panel title="Hapus identitas (anonimkan)">
              <p className="text-sm text-text-secondary">
                Atas permintaan anggota atau wali (hak subjek data). Nama, KTA, tanggal lahir (kecuali tahun), kontak, alamat, data wali,
                catatan, dan akun portal dihapus. Riwayat gudep, kegiatan, dan statistik golongan tetap ada tanpa nama.
              </p>
              <div className="mt-4">
                <ActionButton
                  action={anonymizeMemberAction.bind(null, m.id)}
                  variant="danger"
                  size="md"
                  confirm="Hapus identitas anggota ini secara permanen? Tindakan ini tidak dapat dibatalkan."
                >
                  <UserX className="h-4 w-4" aria-hidden="true" />
                  Anonimkan sekarang
                </ActionButton>
              </div>
            </Panel>
          )}
          {m.anonymizedAt && (
            <Panel title="Data dianonimkan">
              <p className="text-sm text-text-secondary">Identitas dihapus pada {formatDate(m.anonymizedAt.toISOString())}.</p>
            </Panel>
          )}

          {can(user, 'users.create_peserta') && !archived && (
            <Panel title="Akun portal peserta">
              {row.portalUsername ? (
                <>
                  <p className="text-text-secondary">
                    Nama pengguna: <span className="font-semibold text-text-primary">{row.portalUsername}</span>
                    {!row.portalActive && ' (nonaktif)'}
                  </p>
                  <div className="mt-4">
                    <PortalAccountForm action={resetPesertaPasswordAction.bind(null, m.id)} reset />
                  </div>
                </>
              ) : m.status === 'ACTIVE' ? (
                <>
                  <p className="mb-4 text-sm text-text-secondary">
                    Peserta dapat melihat kegiatan, mendaftar, dan membaca pengumuman gudep.
                  </p>
                  <PortalAccountForm action={createPortalAccountAction.bind(null, m.id)} />
                </>
              ) : (
                <p className="text-sm text-text-secondary">Akun dapat dibuat setelah data diverifikasi (status Aktif).</p>
              )}
            </Panel>
          )}

          <Panel title="Gudep & mutasi">
            <p className="text-sm text-text-secondary">
              Saat ini: <span className="font-semibold text-text-primary">{gudep.name}</span>
            </p>
            {openTransfer ? (
              <div className="mt-4 rounded-2xl border border-status-info-border bg-status-info-surface p-4 text-sm text-status-info-text">
                <p className="font-semibold">Mutasi menunggu persetujuan</p>
                <p className="mt-1">
                  Ke {openTransfer.toName} · diajukan {openTransfer.t.requestedByName}
                </p>
                <div className="mt-3">
                  <ActionButton
                    action={cancelTransferAction.bind(null, openTransfer.t.id)}
                    variant="outline"
                    confirm="Batalkan pengajuan mutasi ini?"
                  >
                    Batalkan pengajuan
                  </ActionButton>
                </div>
              </div>
            ) : (
              can(user, 'members.update') &&
              !archived && (
                <details className="group mt-4">
                  <summary className="inline-flex min-h-touch cursor-pointer list-none items-center gap-2 rounded-pill border border-border-strong px-4 text-sm font-semibold text-text-primary hover:bg-surface-subtle [&::-webkit-details-marker]:hidden">
                    Ajukan mutasi ke gudep lain
                  </summary>
                  <div className="mt-4">
                    <TransferRequestForm
                      action={requestTransferAction.bind(null, m.id)}
                      options={targets.map((g) => ({ value: g.id, label: `${g.name} — ${g.kwarranName}` }))}
                    />
                  </div>
                </details>
              )
            )}
            {transfers.length > 0 && (
              <ol className="mt-5 space-y-3 border-t border-border-subtle pt-4 text-sm">
                {transfers.map(({ t, fromName, toName }) => (
                  <li key={t.id}>
                    <p className="text-text-primary">
                      {fromName} → {toName}
                    </p>
                    <p className="text-text-secondary">
                      {{ REQUESTED: 'Menunggu', APPROVED: 'Disetujui', REJECTED: 'Ditolak', CANCELLED: 'Dibatalkan' }[t.status]} ·{' '}
                      {formatDate((t.decidedAt ?? t.createdAt).toISOString())}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          <Panel title="Kegiatan diikuti">
            {registrations.length === 0 ? (
              <p className="text-sm text-text-secondary">Belum ada pendaftaran kegiatan.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {registrations.map((r) => (
                  <li key={r.title + r.dateStart.toISOString()}>
                    <p className="font-medium text-text-primary">{r.title}</p>
                    <p className="text-text-secondary">{formatDate(r.dateStart.toISOString())}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Riwayat perubahan">
            {history.length === 0 ? (
              <p className="text-sm text-text-secondary">Belum ada riwayat.</p>
            ) : (
              <ol className="space-y-3 text-sm">
                {history.map((h) => (
                  <li key={h.id}>
                    <p className="text-text-primary">{h.summary}</p>
                    <p className="text-text-secondary">
                      {h.actorName} · {formatDate(h.at.toISOString())}, {formatTime(h.at.toISOString())}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          {can(user, 'members.archive') && !m.anonymizedAt && (
            <Panel
              title={archived ? 'Pulihkan anggota' : 'Arsipkan anggota'}
              description={archived ? 'Data kembali ke antrean verifikasi.' : 'Data tidak dihapus; disembunyikan dari daftar aktif.'}
            >
              {archived ? (
                <ActionButton action={restoreMemberAction.bind(null, m.id)} confirm={`Pulihkan ${m.fullName} dari arsip?`}>
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Pulihkan
                </ActionButton>
              ) : (
                <ArchiveForm action={archiveMemberAction.bind(null, m.id)} />
              )}
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
