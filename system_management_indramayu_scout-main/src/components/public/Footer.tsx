import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center mb-4">
              <img src="/logo-pramuka.png" alt="Logo Pramuka" className="h-10 w-auto mr-3 bg-white p-1 rounded" />
              <div>
                <h3 className="text-white font-bold text-sm">Kwarcab Indramayu</h3>
              </div>
            </div>
            <p className="text-sm mb-4">
              Pusat informasi resmi kegiatan, publikasi, dan layanan Kwartir Cabang Gerakan Pramuka Indramayu.
            </p>
            <address className="not-italic text-sm">
              Jl. Pramuka / Simpang Lima<br />
              Indramayu, Jawa Barat
            </address>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Tautan Cepat</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/tentang" className="hover:text-white transition-colors focus:outline-none focus:underline min-h-[44px] inline-flex items-center">Tentang Kami</Link></li>
              <li><Link href="/berita" className="hover:text-white transition-colors focus:outline-none focus:underline min-h-[44px] inline-flex items-center">Berita Terkini</Link></li>
              <li><Link href="/agenda" className="hover:text-white transition-colors focus:outline-none focus:underline min-h-[44px] inline-flex items-center">Agenda Kegiatan</Link></li>
              <li><Link href="/dokumen" className="hover:text-white transition-colors focus:outline-none focus:underline min-h-[44px] inline-flex items-center">Dokumen Resmi</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Informasi</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/kebijakan-privasi" className="hover:text-white transition-colors focus:outline-none focus:underline min-h-[44px] inline-flex items-center">Kebijakan Privasi</Link></li>
              <li><Link href="/aksesibilitas" className="hover:text-white transition-colors focus:outline-none focus:underline min-h-[44px] inline-flex items-center">Aksesibilitas</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Hubungi Kami</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <span className="sr-only">Telepon</span>
                <span className="min-h-[44px] flex items-center">(0234) 123456</span>
              </li>
              <li className="flex items-center">
                <span className="sr-only">Email</span>
                <span className="min-h-[44px] flex items-center">info@pramukaindramayu.or.id</span>
              </li>
              <li className="flex items-center">
                <span className="min-h-[44px] flex items-center text-gray-400">Jam Operasional: 08:00 - 16:00 WIB</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-sm text-center md:flex md:justify-between">
          <p>&copy; {new Date().getFullYear()} Kwartir Cabang Gerakan Pramuka Indramayu. Hak Cipta Dilindungi.</p>
          <div className="mt-4 md:mt-0 flex justify-center space-x-6">
            <a href="#" className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white rounded p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
              <span className="sr-only">Instagram</span>
              IG
            </a>
            <a href="#" className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white rounded p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
              <span className="sr-only">Facebook</span>
              FB
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
