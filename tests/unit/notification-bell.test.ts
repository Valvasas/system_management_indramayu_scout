import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { NotificationBell, NotificationLiveRegion, unreadPhrase } from '@/components/dashboard/notifications/NotificationBell';

describe('lonceng notifikasi (2.1)', () => {
  it('menampilkan ANGKA belum dibaca sebagai teks, bukan hanya warna, dan menuju halaman notifikasi', () => {
    const html = renderToStaticMarkup(React.createElement(NotificationBell, { count: 7, active: false }));
    expect(html).toContain('href="/dashboard/notifikasi"');
    expect(html).toMatch(/>7<\/span>/);
    expect(html).toContain('7 notifikasi belum dibaca');
    expect(html).not.toContain('aria-current');
  });

  it('di atas 99 tampil "99+" tetapi pembaca layar mendengar jumlah sebenarnya', () => {
    const html = renderToStaticMarkup(React.createElement(NotificationBell, { count: 1234, active: true }));
    expect(html).toContain('99+');
    expect(html).toContain('1.234 notifikasi belum dibaca');
    expect(html).toContain('aria-current="page"');
  });

  it('tanpa notifikasi baru: tidak ada lencana angka, label tetap jelas', () => {
    const html = renderToStaticMarkup(React.createElement(NotificationBell, { count: 0, active: false }));
    expect(html).not.toMatch(/>0<\/span>/);
    expect(html).toContain('Tidak ada notifikasi yang belum dibaca');
  });

  it('wilayah aria-live sopan mengumumkan jumlahnya', () => {
    const html = renderToStaticMarkup(React.createElement(NotificationLiveRegion, { count: 2 }));
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain(unreadPhrase(2));
  });
});
