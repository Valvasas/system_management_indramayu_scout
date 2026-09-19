'use server';

import { headers } from 'next/headers';

export type ContactState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  errors?: Partial<Record<'name' | 'email' | 'message', string>>;
};

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 3;
const MIN_FILL_MS = 3000;
const hits = new Map<string, number[]>();

// Rate limit in-memory: cukup untuk satu instance; ganti ke store bersama (Redis) saat multi-instance.
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

const str = (v: FormDataEntryValue | null) => (typeof v === 'string' ? v.trim() : '');

export async function submitContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const h = headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';

  // Honeypot & time-trap: balas seolah sukses agar bot tidak belajar.
  const honeypot = str(formData.get('website'));
  const openedAt = Number(str(formData.get('openedAt')));
  if (honeypot || !openedAt || Date.now() - openedAt < MIN_FILL_MS) {
    return { status: 'success', message: 'Pesan diterima.' };
  }

  if (rateLimited(ip)) {
    return { status: 'error', message: 'Terlalu banyak pengiriman. Coba lagi dalam 10 menit.' };
  }

  const name = str(formData.get('name'));
  const email = str(formData.get('email'));
  const organization = str(formData.get('organization')).slice(0, 150);
  const message = str(formData.get('message'));

  const errors: NonNullable<ContactState['errors']> = {};
  if (name.length < 2 || name.length > 100) errors.name = 'Nama 2-100 karakter.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) errors.email = 'Format pos-el tidak valid.';
  if (message.length < 10 || message.length > 2000) errors.message = 'Pesan 10-2000 karakter.';
  if (Object.keys(errors).length) {
    return { status: 'error', message: 'Periksa kembali isian Anda.', errors };
  }

  const webhook = process.env.CONTACT_WEBHOOK_URL;
  if (!webhook) {
    // Jujur: jangan pura-pura terkirim bila belum ada tujuan pengiriman.
    return {
      status: 'error',
      message: 'Layanan pengiriman pesan belum aktif. Silakan hubungi sekretariat lewat pos-el atau telepon di samping.',
    };
  }

  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, organization, message, receivedAt: new Date().toISOString() }),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(String(res.status));
  } catch {
    return { status: 'error', message: 'Pesan gagal dikirim. Silakan coba lagi nanti.' };
  }

  return { status: 'success', message: 'Pesan Anda telah diterima sekretariat Kwarcab.' };
}
