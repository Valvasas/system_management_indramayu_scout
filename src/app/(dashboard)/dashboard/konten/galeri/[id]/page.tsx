import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ImageUp, Star, Trash2 } from 'lucide-react';
import { AlbumForm, PhotoCaptionForm, PhotoUploadForm } from '@/components/dashboard/content/ContentForms';
import { ActionButton } from '@/components/dashboard/ConfirmButton';
import { Notice, Panel, PortalHeader } from '@/components/dashboard/ui';
import { EmptyState } from '@/components/ui/EmptyState';
import { MediaFrame } from '@/components/ui/MediaFrame';
import { deletePhotoAction, saveAlbumAction, setCoverPhotoAction, updatePhotoAction, uploadPhotosAction } from '@/features/content/gallery';
import { asId, getAlbumAdmin } from '@/features/content/queries';
import { requirePermission } from '@/lib/auth/session';
import { ALBUM_CATEGORIES } from '@/lib/domain';

export const metadata: Metadata = { title: 'Ubah album' };

export default async function AlbumEditorPage({ params, searchParams = {} }: { params: { id: string }; searchParams?: { tersimpan?: string; foto?: string } }) {
  await requirePermission('content.manage');

  if (params.id === 'baru') {
    return (
      <>
        <PortalHeader title="Buat album" back={{ href: '/dashboard/konten/galeri', label: 'Daftar album' }} description="Foto diunggah setelah album tersimpan." />
        <Panel>
          <AlbumForm action={saveAlbumAction.bind(null, null)} categories={ALBUM_CATEGORIES} />
        </Panel>
      </>
    );
  }

  const id = asId(params.id);
  const data = id ? await getAlbumAdmin(id) : null;
  if (!id || !data) notFound();
  const { album, photos } = data;

  return (
    <>
      <PortalHeader title={album.title} back={{ href: '/dashboard/konten/galeri', label: 'Daftar album' }} description={`${photos.length} foto · urutan pertama menjadi sampul album.`} />
      {searchParams.tersimpan && <Notice>Album tersimpan.</Notice>}
      {searchParams.foto === 'dihapus' && <Notice>Foto dihapus.</Notice>}
      {searchParams.foto === 'sampul' && <Notice>Foto dijadikan sampul album.</Notice>}

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel title="Informasi album" className="lg:col-span-3">
          <AlbumForm
            action={saveAlbumAction.bind(null, id)}
            categories={ALBUM_CATEGORIES}
            defaults={{
              title: album.title,
              date: album.date,
              location: album.location,
              organizer: album.organizer,
              category: album.category,
              description: album.description,
              published: album.published,
            }}
          />
        </Panel>
        <Panel title="Tambah foto" className="self-start lg:col-span-2">
          <PhotoUploadForm action={uploadPhotosAction.bind(null, id)} />
        </Panel>
      </div>

      <Panel title="Foto di album ini" className="mt-6">
        {photos.length === 0 ? (
          <EmptyState icon={ImageUp} title="Album masih kosong" description="Unggah foto lewat panel Tambah foto di atas." />
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {photos.map((p, i) => (
              <li key={p.id} className="overflow-hidden rounded-lg border border-border-subtle">
                <MediaFrame src={p.url} alt={p.altText} aspect="4/3" sizes="(max-width: 640px) 100vw, 33vw" />
                <div className="space-y-3 p-4">
                  {i === 0 && <p className="text-sm font-semibold text-text-accent">Sampul album</p>}
                  <PhotoCaptionForm action={updatePhotoAction.bind(null, p.id)} caption={p.caption} altText={p.altText} />
                  <div className="flex flex-wrap gap-2">
                    {i !== 0 && (
                      <ActionButton action={setCoverPhotoAction.bind(null, p.id)} label={`Jadikan foto ${i + 1} sebagai sampul`}>
                        <Star className="h-4 w-4" aria-hidden="true" />
                        Jadikan sampul
                      </ActionButton>
                    )}
                    <ActionButton action={deletePhotoAction.bind(null, p.id)} variant="ghost" confirm="Hapus foto ini?" label={`Hapus foto ${i + 1}`}>
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Hapus
                    </ActionButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
