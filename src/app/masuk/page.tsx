'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function MasukPage() {
  const [role, setRole] = useState<'member' | 'staff'>('member');
  const [ktaNumber, setKtaNumber] = useState('');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const handleSimulatedLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Mode Demo Fase 1: Sistem autentikasi database akan aktif pada Fase 2.');
  };

  return (
    <div className="civic-container py-12 sm:py-16 flex items-center justify-center min-h-[75vh]">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xl font-bold text-green-800 hover:text-green-900 focus:outline-none focus:ring-2 focus:ring-green-600 rounded p-1 mb-2"
          >
            <span>⚜️</span>
            <span>Kwarcab Indramayu</span>
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Portal Masuk Terpadu</h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Pilih jalur masuk sesuai peran Kakak dalam Gerakan Pramuka.
          </p>
        </div>

        {/* Role Toggle Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 rounded-lg mb-6" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={role === 'member'}
            onClick={() => {
              setRole('member');
              setMessage(null);
            }}
            className={`py-2 px-3 text-xs sm:text-sm font-semibold rounded-md transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-green-600 ${
              role === 'member'
                ? 'bg-white text-green-800 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            👤 Anggota / KTA
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={role === 'staff'}
            onClick={() => {
              setRole('staff');
              setMessage(null);
            }}
            className={`py-2 px-3 text-xs sm:text-sm font-semibold rounded-md transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-green-600 ${
              role === 'staff'
                ? 'bg-white text-green-800 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            🏢 Staf & Pembina
          </button>
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8">
            {message && (
              <div className="p-3 mb-5 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs leading-relaxed">
                ℹ️ {message}
              </div>
            )}

            <form onSubmit={handleSimulatedLogin} className="space-y-4">
              {role === 'member' ? (
                <>
                  <div>
                    <label htmlFor="kta" className="block text-xs font-semibold text-neutral-700 mb-1">
                      Nomor KTA Pramuka / NISN
                    </label>
                    <input
                      id="kta"
                      type="text"
                      required
                      value={ktaNumber}
                      onChange={(e) => setKtaNumber(e.target.value)}
                      placeholder="09.17.XX.XXXXX"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label htmlFor="pin" className="block text-xs font-semibold text-neutral-700 mb-1">
                      PIN Keamanan (6 Digit)
                    </label>
                    <input
                      id="pin"
                      type="password"
                      maxLength={6}
                      required
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="••••••"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm bg-white tracking-widest font-mono"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="email" className="block text-xs font-semibold text-neutral-700 mb-1">
                      Alamat Pos-el (Email) Resmi
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@pramukaindramayu.or.id"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-xs font-semibold text-neutral-700 mb-1">
                      Kata Sandi
                    </label>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm bg-white"
                    />
                  </div>
                </>
              )}

              <Button type="submit" variant="primary" className="w-full mt-2">
                Masuk ke Portal
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-neutral-100 text-center">
              <p className="text-[11px] text-neutral-500 mb-3 bg-neutral-50 p-2.5 rounded border border-neutral-200 text-left">
                🔒 <strong>Verifikasi Keamanan:</strong> Pastikan alamat web pada bilah peramban Anda adalah domain resmi <em>pramukaindramayu.or.id</em> sebelum memasukkan data kredensial.
              </p>
              <Link
                href="/"
                className="text-xs font-medium text-green-700 hover:text-green-800 hover:underline inline-flex items-center gap-1 min-h-[44px]"
              >
                &larr; Kembali ke Beranda Publik
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
