'use client';

import React, { useState, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { submitContact, type ContactState } from './actions';

const initial: ContactState = { status: 'idle' };
const inputClass =
  'w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-700 text-sm bg-white min-h-[44px]';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" className="w-full mt-2" isLoading={pending}>
      Kirim Pesan
    </Button>
  );
}

export function ContactForm() {
  const [state, action] = useFormState(submitContact, initial);
  const [openedAt, setOpenedAt] = useState('');
  useEffect(() => setOpenedAt(String(Date.now())), []);

  const err = state.errors ?? {};
  const field = (id: 'name' | 'email' | 'message') => ({
    'aria-invalid': err[id] ? true : undefined,
    'aria-describedby': err[id] ? `${id}-error` : undefined,
  });

  return (
    <form action={action} className="space-y-4" noValidate={false}>
      <div aria-live="polite">
        {state.status === 'success' && (
          <div className="p-4 mb-2 bg-green-50 border border-green-200 rounded-lg text-green-900 text-sm flex items-start gap-2">
            <Check className="h-5 w-5 shrink-0" aria-hidden="true" />
            <p>{state.message}</p>
          </div>
        )}
        {state.status === 'error' && state.message && (
          <div className="p-4 mb-2 bg-red-50 border border-red-200 rounded-lg text-red-900 text-sm flex items-start gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
            <p>{state.message}</p>
          </div>
        )}
      </div>

      <input type="hidden" name="openedAt" value={openedAt} />
      {/* Honeypot: disembunyikan dari pengguna & pembaca layar */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="website">Jangan diisi</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor="name" className="block text-xs font-semibold text-neutral-700 mb-1">
          Nama Lengkap <span aria-hidden="true">*</span>
        </label>
        <input id="name" name="name" type="text" required minLength={2} maxLength={100} autoComplete="name" className={inputClass} {...field('name')} />
        {err.name && <p id="name-error" className="mt-1 text-xs text-red-800">{err.name}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-xs font-semibold text-neutral-700 mb-1">
          Alamat Pos-el (Email) <span aria-hidden="true">*</span>
        </label>
        <input id="email" name="email" type="email" required maxLength={254} autoComplete="email" className={inputClass} {...field('email')} />
        {err.email && <p id="email-error" className="mt-1 text-xs text-red-800">{err.email}</p>}
      </div>

      <div>
        <label htmlFor="organization" className="block text-xs font-semibold text-neutral-700 mb-1">
          Gugus Depan / Kwartir Ranting
        </label>
        <input id="organization" name="organization" type="text" maxLength={150} autoComplete="organization" className={inputClass} />
      </div>

      <div>
        <label htmlFor="message" className="block text-xs font-semibold text-neutral-700 mb-1">
          Isi Pesan <span aria-hidden="true">*</span>
        </label>
        <textarea id="message" name="message" required minLength={10} maxLength={2000} rows={4} className={`${inputClass} resize-none`} {...field('message')} />
        {err.message && <p id="message-error" className="mt-1 text-xs text-red-800">{err.message}</p>}
      </div>

      <p className="text-xs text-neutral-600 leading-relaxed">
        Data yang Anda isi hanya dipakai untuk menanggapi pesan ini oleh sekretariat Kwarcab dan tidak dibagikan ke pihak lain.
        Lihat <a href="/kebijakan-privasi" className="underline">Kebijakan Privasi</a>. Anak di bawah 18 tahun sebaiknya mengirim melalui orang tua/wali atau pembina.
      </p>

      <Submit />
    </form>
  );
}
