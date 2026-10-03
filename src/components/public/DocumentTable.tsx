import React from 'react';
import { Download, FileText, Lock } from 'lucide-react';
import { CategoryBadge } from '../ui/Badge';
import { buttonStyles } from '../ui/Button';
import type { DocumentEntry } from '@/lib/repositories';
import { formatDate } from '@/lib/format';

/** Tombol unduh ghost. Berkas yang URL-nya tidak lolos allowlist tidak pernah jadi tautan (P1-7). */
const DownloadAction: React.FC<{ doc: DocumentEntry; className?: string }> = ({ doc, className }) =>
  doc.available ? (
    <a
      href={doc.url}
      download
      {...(doc.isExternal ? { rel: 'noopener noreferrer' } : {})}
      className={buttonStyles('ghost', 'sm', `text-text-accent ${className ?? ''}`)}
      aria-label={`Unduh ${doc.title}, format ${doc.type}, ukuran ${doc.size}`}
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      Unduh
    </a>
  ) : (
    <span
      className={`inline-flex min-h-touch items-center gap-1.5 px-3 text-sm text-text-secondary ${className ?? ''}`}
    >
      <Lock className="h-4 w-4" aria-hidden="true" />
      Belum tersedia
    </span>
  );

const FileMeta: React.FC<{ doc: DocumentEntry }> = ({ doc }) => (
  <span className="text-sm text-text-secondary">
    {doc.type.toUpperCase()} · {doc.size}
  </span>
);

export interface DocumentTableProps {
  documents: DocumentEntry[];
  /** Keterangan tabel untuk pembaca layar. */
  caption: string;
}

/**
 * Tabel dokumen minimalis: Judul, Kategori, Tanggal, Unduh.
 * Di bawah `md` berubah jadi daftar bertumpuk agar tidak perlu gulir horizontal.
 */
export const DocumentTable: React.FC<DocumentTableProps> = ({ documents, caption }) => (
  <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-base shadow-sm">
    {/* Desktop/tablet */}
    <table className="hidden w-full text-left md:table">
      <caption className="sr-only">{caption}</caption>
      <thead className="border-b border-border-subtle bg-surface-canvas">
        <tr className="text-sm text-text-secondary">
          <th scope="col" className="px-6 py-3 font-semibold">Judul dokumen</th>
          <th scope="col" className="px-6 py-3 font-semibold">Kategori</th>
          <th scope="col" className="px-6 py-3 font-semibold">Tanggal</th>
          <th scope="col" className="px-6 py-3 text-right font-semibold">
            <span className="sr-only">Aksi</span>
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border-subtle">
        {documents.map((doc) => (
          <tr key={doc.id} className="transition-colors hover:bg-surface-canvas">
            <td className="px-6 py-4">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-text-muted" aria-hidden="true" />
                <div>
                  <p className="font-medium text-text-primary">{doc.title}</p>
                  <FileMeta doc={doc} />
                </div>
              </div>
            </td>
            <td className="px-6 py-4">
              <CategoryBadge>{doc.category}</CategoryBadge>
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-text-secondary">
              <time dateTime={doc.date}>{formatDate(doc.date)}</time>
            </td>
            <td className="px-6 py-4 text-right">
              <DownloadAction doc={doc} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* Ponsel */}
    <ul className="divide-y divide-border-subtle md:hidden" aria-label={caption}>
      {documents.map((doc) => (
        <li key={doc.id} className="p-4">
          <p className="font-medium text-text-primary">{doc.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
            <CategoryBadge>{doc.category}</CategoryBadge>
            <time dateTime={doc.date} className="text-sm text-text-secondary">
              {formatDate(doc.date)}
            </time>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <FileMeta doc={doc} />
            <DownloadAction doc={doc} className="-mr-3" />
          </div>
        </li>
      ))}
    </ul>
  </div>
);
