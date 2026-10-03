import React from 'react';
import { FileSearch } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { Section } from '../ui/Section';
import { DocumentTable } from './DocumentTable';
import { getDocuments } from '@/lib/repositories';

const LIMIT = 5;

/** Pusat dokumen di beranda: lima berkas terbaru, sisanya di /dokumen. */
export const DocumentCenter = async () => {
  const documents = (await getDocuments()).slice(0, LIMIT);

  return (
    <Section
      id="dokumen"
      title="Pusat dokumen"
      description="Surat keputusan, petunjuk teknis, dan formulir resmi."
      surface="base"
      action={{ label: 'Semua dokumen', href: '/dokumen' }}
    >
      {documents.length === 0 ? (
        <EmptyState
          icon={FileSearch}
          title="Belum ada dokumen"
          description="Dokumen resmi akan tersedia di sini setelah diunggah sekretariat."
        />
      ) : (
        <DocumentTable documents={documents} caption="Dokumen resmi terbaru" />
      )}
    </Section>
  );
};
