import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { MFA_SETUP_PATH } from '@/lib/auth/session';

/** Pengingat masa tenggang MFA untuk peran yang wajib MFA. Ikon + teks, bukan warna saja. */
export function MfaGraceNotice({ daysLeft }: { daysLeft: number }) {
  return (
    <div
      role="status"
      className="mb-6 flex flex-col gap-3 rounded-xl border border-status-warning-border bg-status-warning-surface px-4 py-3 text-sm text-status-warning-text sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="flex items-start gap-2 font-medium">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          Peran Anda wajib memakai verifikasi dua langkah (MFA). Aktifkan dalam {daysLeft} hari lagi; setelah itu portal terkunci sampai MFA
          aktif.
        </span>
      </p>
      <Link
        href={MFA_SETUP_PATH}
        className="inline-flex min-h-touch shrink-0 items-center justify-center rounded-pill border border-status-warning-border bg-surface-base px-4 font-semibold text-text-primary hover:bg-surface-subtle"
      >
        Aktifkan MFA
      </Link>
    </div>
  );
}
