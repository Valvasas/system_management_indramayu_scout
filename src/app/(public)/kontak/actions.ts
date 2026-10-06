'use server';

import { z } from 'zod';
import { getDb, schema } from '@/db';
import { serverEnv } from '@/lib/env';
import { clientIp } from '@/lib/security/request';
import { createRateLimiter } from '@/lib/security/rate-limit';

export type ContactState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  errors?: Partial<Record<'name' | 'email' | 'message', string>>;
};

const MIN_FILL_MS = 3000;
// Rate limit bersama (tabel rate_limits). Fail-open: bila DB mati, penyimpanan pesan toh gagal.
const perIp = createRateLimiter(3, 10 * 60_000, { scope: 'kontak-ip', failClosed: false });

const str = (v: FormDataEntryValue | null) => (typeof v === 'string' ? v.trim() : '');

const ContactSchema = z.object({
  name: z.string().trim().min(2, 'Nama 2-100 karakter.').max(100, 'Nama 2-100 karakter.'),
  email: z.string().trim().max(254, 'Format pos-el tidak valid.').email('Format pos-el tidak valid.'),
  organization: z
    .string()
    .trim()
    .transform((v) => v.slice(0, 150)),
  message: z.string().trim().min(10, 'Pesan 10-2000 karakter.').max(2000, 'Pesan 10-2000 karakter.'),
});

export async function submitContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  // Honeypot & time-trap: balas seolah sukses agar bot tidak belajar.
  const honeypot = str(formData.get('website'));
  const openedAt = Number(str(formData.get('openedAt')));
  if (honeypot || !openedAt || Date.now() - openedAt < MIN_FILL_MS) {
    return { status: 'success', message: 'Pesan diterima.' };
  }

  if (await perIp.limited(clientIp())) {
    return { status: 'error', message: 'Terlalu banyak pengiriman. Coba lagi dalam 10 menit.' };
  }

  const parsed = ContactSchema.safeParse({
    name: str(formData.get('name')),
    email: str(formData.get('email')),
    organization: str(formData.get('organization')),
    message: str(formData.get('message')),
  });
  if (!parsed.success) {
    const errors: NonNullable<ContactState['errors']> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if ((key === 'name' || key === 'email' || key === 'message') && !errors[key]) errors[key] = issue.message;
    }
    return { status: 'error', message: 'Periksa kembali isian Anda.', errors };
  }
  const { name, email, organization, message } = parsed.data;

  // Pesan tersimpan di database dan dibaca pengurus di Portal → Pesan masuk.
  try {
    const db = await getDb();
    await db.insert(schema.contactMessages).values({ name, email, organization: organization || null, message });
  } catch {
    return { status: 'error', message: 'Pesan gagal disimpan. Silakan coba lagi nanti atau hubungi sekretariat lewat telepon.' };
  }

  // Opsional: teruskan juga ke webhook (mis. grup WhatsApp/Telegram sekretariat).
  const webhook = serverEnv().CONTACT_WEBHOOK_URL;
  if (webhook) {
    fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, organization, message, receivedAt: new Date().toISOString() }),
      cache: 'no-store',
    }).catch(() => undefined);
  }

  return { status: 'success', message: 'Pesan Anda telah diterima sekretariat Kwarcab.' };
}
