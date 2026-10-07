import { AlertTriangle, Ban, KeyRound } from 'lucide-react';
import { ActionForm, SubmitButton } from '@/components/forms/ActionForm';
import { SelectField, TextAreaField } from '@/components/forms/Fields';
import { Panel } from '@/components/dashboard/ui';
import type { ConsentMethod } from '@/db/schema';
import { memberConsentSummary } from '@/features/consent/consent';
import { recordRevocationAction, requestConsentAction } from '@/features/consent/consent-actions';
import { needsGuardianConsent } from '@/features/consent/status';
import { CONSENT_SCOPE_LABELS, CONSENT_SCOPES } from '@/features/consent/texts';
import { formatDate, formatTime } from '@/lib/format';
import { ConsentBadge } from './ConsentBadge';

const METHOD_LABELS: Record<ConsentMethod, string> = {
  GUARDIAN_CODE: 'Wali, lewat kode sekali pakai',
  STAFF_REVOCATION: 'Pencabutan dicatat pembina',
  LEGACY_MANUAL: 'Tanggal manual lama (belum terverifikasi)',
};

const when = (d: Date) => `${formatDate(d.toISOString())}, ${formatTime(d.toISOString())}`;

/** Status & riwayat persetujuan wali satu anggota. Cakupan anggota sudah dicek halaman (getMember). */
export async function ConsentPanel({
  memberId,
  birthDate,
  canManage,
  sensitive,
}: {
  memberId: string;
  birthDate: string;
  canManage: boolean;
  sensitive: boolean;
}) {
  if (!needsGuardianConsent(birthDate)) {
    return (
      <Panel title="Persetujuan wali">
        <p className="text-sm text-text-secondary">Tidak diperlukan: anggota berusia 18 tahun ke atas memberi persetujuan sendiri.</p>
      </Panel>
    );
  }
  const { statuses, history, openRequest } = await memberConsentSummary(memberId);

  return (
    <Panel
      title="Persetujuan wali"
      description="Diberikan wali sendiri lewat kode sekali pakai. Pembina hanya bisa meminta atau mencatat pencabutan."
    >
      <dl className="divide-y divide-border-subtle">
        {CONSENT_SCOPES.map((scope) => (
          <div key={scope} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
            <dt className="text-sm font-medium text-text-primary">{CONSENT_SCOPE_LABELS[scope]}</dt>
            <dd className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
              <ConsentBadge kind={statuses[scope].kind} />
              {statuses[scope].at && <span>{formatDate(statuses[scope].at!.toISOString())}</span>}
            </dd>
          </div>
        ))}
      </dl>
      {openRequest && (
        <p className="mt-3 text-sm text-text-secondary">
          Kode untuk wali sudah dibuat {openRequest.requestedByName} dan berlaku sampai {formatDate(openRequest.expiresAt.toISOString())}.
        </p>
      )}

      {canManage && (
        <div className="mt-5 space-y-5 border-t border-border-subtle pt-5">
          <ActionForm action={requestConsentAction.bind(null, memberId)} className="space-y-3">
            <SubmitButton variant="secondary" pendingLabel="Membuat kode">
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              {openRequest ? 'Buat kode baru untuk wali' : 'Buat kode untuk wali'}
            </SubmitButton>
          </ActionForm>
          <details className="rounded-xl border border-border-subtle px-4 py-2">
            <summary className="flex min-h-touch cursor-pointer items-center text-sm font-semibold text-text-primary">
              Catat pencabutan atas permintaan wali
            </summary>
            <ActionForm action={recordRevocationAction.bind(null, memberId)} className="pb-3 pt-2">
              <SelectField
                name="scope"
                label="Persetujuan yang dicabut"
                required
                options={CONSENT_SCOPES.map((s) => ({ value: s, label: CONSENT_SCOPE_LABELS[s] }))}
              />
              <TextAreaField name="note" label="Cara wali meminta" hint="Mis. datang langsung ke sanggar, 6 Okt 2026." rows={2} required />
              <SubmitButton variant="secondary" pendingLabel="Mencatat">
                <Ban className="h-4 w-4" aria-hidden="true" />
                Catat pencabutan
              </SubmitButton>
            </ActionForm>
          </details>
        </div>
      )}

      {history.length > 0 && (
        <details className="mt-5">
          <summary className="flex min-h-touch cursor-pointer items-center text-sm font-semibold text-text-primary">
            Riwayat ({history.length})
          </summary>
          <ol className="mt-2 space-y-3 text-sm">
            {history.map((h) => (
              <li key={h.id} className="rounded-lg bg-surface-subtle px-3 py-2">
                <p className="font-medium text-text-primary">
                  {CONSENT_SCOPE_LABELS[h.scope]}: {h.granted ? 'setuju' : 'tidak setuju / dicabut'}
                </p>
                <p className="text-text-secondary">
                  {when(h.decidedAt)} · {METHOD_LABELS[h.method]}
                  {h.method === 'GUARDIAN_CODE' && sensitive && h.guardianName ? ` · ${h.guardianName}` : ''}
                  {h.recordedByName ? ` · ${h.recordedByName}` : ''} · teks {h.textVersion}
                </p>
                {h.note && <p className="text-text-secondary">{h.note}</p>}
                {h.sameNetworkAsRequester && (
                  <p className="mt-1 flex items-start gap-1.5 font-medium text-status-warning-text">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    Dikirim dari jaringan yang sama dengan pembina peminta kode. Pastikan langsung ke wali bila meragukan.
                  </p>
                )}
              </li>
            ))}
          </ol>
        </details>
      )}
    </Panel>
  );
}
