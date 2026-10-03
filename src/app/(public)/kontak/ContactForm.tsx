'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea, fieldAria } from '@/components/ui/Field';
import { submitContact, type ContactState } from './actions';

const initial: ContactState = { status: 'idle' };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" isLoading={pending} loadingLabel="Mengirim pesan">
      Kirim pesan
    </Button>
  );
}

export function ContactForm() {
  const [state, action] = useFormState(submitContact, initial);
  const [openedAt, setOpenedAt] = useState('');

  useEffect(() => setOpenedAt(String(Date.now())), []);

  const err = state.errors ?? {};

  return (
    <form action={action} className="space-y-5">
      {/* Status pengiriman diumumkan ke pembaca layar tanpa memindahkan fokus. */}
      <div aria-live="polite">
        {state.status === 'success' && (
          <p className="flex items-start gap-2 rounded-md border border-status-success-border bg-status-success-surface p-4 text-sm text-status-success-text">
            <Check className="h-5 w-5 shrink-0" aria-hidden="true" />
            {state.message}
          </p>
        )}
        {state.status === 'error' && state.message && (
          <p className="flex items-start gap-2 rounded-md border border-status-danger-border bg-status-danger-surface p-4 text-sm text-status-danger-text">
            <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
            {state.message}
          </p>
        )}
      </div>

      <input type="hidden" name="openedAt" value={openedAt} />
      {/* Honeypot: tersembunyi dari mata dan dari pembaca layar. */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="website">Jangan diisi</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Field id="name" label="Nama lengkap" required error={err.name}>
        <Input
          id="name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={100}
          autoComplete="name"
          {...fieldAria('name', err.name)}
        />
      </Field>

      <Field id="email" label="Alamat pos-el (email)" required error={err.email}>
        <Input
          id="email"
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          {...fieldAria('email', err.email)}
        />
      </Field>

      <Field
        id="organization"
        label="Gugus depan / kwartir ranting"
        hint="Opsional — membantu kami mengarahkan pesan Anda."
      >
        <Input
          id="organization"
          name="organization"
          type="text"
          maxLength={150}
          autoComplete="organization"
          {...fieldAria('organization', undefined, 'Opsional')}
        />
      </Field>

      <Field id="message" label="Isi pesan" required error={err.message}>
        <Textarea
          id="message"
          name="message"
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          {...fieldAria('message', err.message)}
        />
      </Field>

      <p className="text-xs leading-relaxed text-text-secondary">
        Data yang Anda isi hanya dipakai sekretariat kwarcab untuk menanggapi pesan ini dan tidak
        dibagikan ke pihak lain. Lihat{' '}
        <Link href="/kebijakan-privasi" className="text-text-accent underline">
          kebijakan privasi
        </Link>
        . Anggota di bawah 18 tahun sebaiknya mengirim melalui orang tua/wali atau pembina.
      </p>

      <Submit />
    </form>
  );
}
