'use client';

import React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { AlertCircle, CheckCircle2, Loader2, MessageSquareText } from 'lucide-react';
import { Field, Textarea, fieldAria } from '@/components/ui/Field';
import type { AttendanceStatus } from '@/db/schema';
import { ATTENDANCE_LABELS, ATTENDANCE_NOTE_MAX, ATTENDANCE_STATUSES } from '@/features/attendance/labels';
import type { FormState } from '@/lib/forms';
import { cn } from '@/lib/utils';
import { ATTENDANCE_VISUALS } from './AttendanceStatusBadge';

const PRESSED: Record<AttendanceStatus, string> = {
  PRESENT: 'border-status-success-text bg-status-success-surface text-status-success-text',
  EXCUSED: 'border-status-info-text bg-status-info-surface text-status-info-text',
  ABSENT: 'border-status-danger-text bg-status-danger-surface text-status-danger-text',
};

const StatusButtons: React.FC<{ current: AttendanceStatus | null; memberName: string }> = ({ current, memberName }) => {
  const { pending, data } = useFormStatus();
  const sending = pending ? data?.get('status') : null;
  return (
    <div className="grid grid-cols-3 gap-2">
      {ATTENDANCE_STATUSES.map((status) => {
        const pressed = current === status;
        const Icon = sending === status ? Loader2 : ATTENDANCE_VISUALS[status].icon;
        return (
          <button
            key={status}
            type="submit"
            name="status"
            value={status}
            aria-pressed={pressed}
            aria-label={`${ATTENDANCE_LABELS[status]}: ${memberName}`}
            disabled={pending}
            className={cn(
              'inline-flex min-h-touch w-full items-center justify-center gap-1.5 rounded-pill border px-3 text-sm transition-colors disabled:opacity-60',
              pressed
                ? cn('font-bold ring-2 ring-inset ring-current', PRESSED[status])
                : 'border-border-strong bg-surface-base font-semibold text-text-primary hover:bg-surface-subtle',
            )}
          >
            <Icon className={cn('h-4 w-4 shrink-0', sending === status && 'animate-spin')} aria-hidden="true" />
            {ATTENDANCE_LABELS[status]}
          </button>
        );
      })}
    </div>
  );
};

/**
 * Tiga tombol besar Hadir / Izin / Alpa untuk satu pendaftar (ramah ponsel).
 * Formulir Server Action biasa: tetap berfungsi sebelum/tanpa JavaScript. Status yang tercatat
 * ditandai `aria-pressed` + latar & tebal huruf; teks status juga tampil di lencana baris.
 */
export const AttendanceControls: React.FC<{
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  memberId: string;
  memberName: string;
  current: AttendanceStatus | null;
  note: string | null;
}> = ({ action, memberId, memberName, current, note }) => {
  const [state, formAction] = useFormState(action, { status: 'idle' } as FormState);
  const noteId = `note-${memberId}`;
  const noteError = state.errors?.note;
  return (
    <form action={formAction} className="space-y-2">
      <fieldset>
        <legend className="sr-only">Status kehadiran {memberName}</legend>
        <StatusButtons current={current} memberName={memberName} />
      </fieldset>

      <details open={Boolean(noteError)}>
        <summary className="inline-flex min-h-touch cursor-pointer list-none items-center [&::-webkit-details-marker]:hidden gap-1.5 rounded-lg px-1 text-sm font-medium text-text-secondary hover:text-text-primary">
          <MessageSquareText className="h-4 w-4" aria-hidden="true" />
          {note ? 'Ubah catatan' : 'Tambah catatan (opsional)'}
        </summary>
        <Field
          id={noteId}
          label={`Catatan untuk ${memberName}`}
          hint={`Maksimal ${ATTENDANCE_NOTE_MAX} karakter. Tersimpan saat Anda menekan Hadir, Izin, atau Alpa.`}
          error={noteError}
          className="pt-1"
        >
          <Textarea
            id={noteId}
            name="note"
            rows={2}
            maxLength={ATTENDANCE_NOTE_MAX}
            defaultValue={note ?? ''}
            {...fieldAria(noteId, noteError, 'hint')}
          />
        </Field>
      </details>

      {state.message && (
        <p
          role={state.status === 'error' ? 'alert' : 'status'}
          className={cn(
            'flex items-start gap-1.5 text-sm font-medium',
            state.status === 'error' ? 'text-status-danger-text' : 'text-status-success-text',
          )}
        >
          {state.status === 'error' ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          {state.message}
        </p>
      )}
    </form>
  );
};
