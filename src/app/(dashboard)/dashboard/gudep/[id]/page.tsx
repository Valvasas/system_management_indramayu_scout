import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink, MapPinOff, Pencil, UserPlus, Users } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { GudepMapCanvas } from '@/components/maps/GudepMapCanvas';
import { InfoList, Notice, Panel, PortalHeader } from '@/components/dashboard/ui';
import { getGudep } from '@/features/gudep/queries';
import { golonganCounts } from '@/features/members/queries';
import { can, requirePermission } from '@/lib/auth/session';
import { GOLONGAN_OPTIONS } from '@/lib/domain';

export const metadata: Metadata = { title: 'Detail gudep' };

export default async function DetailGudepPage({ params, searchParams }: { params: { id: string }; searchParams?: { tersimpan?: string } }) {
  const user = await requirePermission('gudep.read');
  const row = await getGudep(user, params.id);
  if (!row) notFound();
  const { g } = row;
  const golongan = can(user, 'members.read') ? await golonganCounts(user, g.id) : [];
  const hasLocation = g.lat !== null && g.lng !== null;

  return (
    <>
      <PortalHeader
        title={g.name}
        description={`${g.number ? `No. ${g.number} · ` : ''}Kwarran ${row.kwarranName}${g.active ? '' : ' · Nonaktif'}`}
        back={{ href: '/dashboard/gudep', label: 'Kembali ke daftar gudep' }}
        actions={
          <>
            {can(user, 'gudep.update') && (
              <ButtonLink href={`/dashboard/gudep/${g.id}/ubah`} variant="outline">
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Ubah data & lokasi
              </ButtonLink>
            )}
            {can(user, 'members.create') && (
              <ButtonLink href="/dashboard/anggota/baru">
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Tambah anggota
              </ButtonLink>
            )}
          </>
        }
      />
      {searchParams?.tersimpan && <Notice>Data gudep tersimpan.</Notice>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Lokasi" bodyClassName="p-0 sm:p-0">
            {hasLocation ? (
              <>
                <div className="h-80">
                  <GudepMapCanvas
                    points={[
                      {
                        id: g.id,
                        name: g.name,
                        number: g.number,
                        lat: g.lat!,
                        lng: g.lng!,
                        kwarranName: row.kwarranName,
                        activeMembers: row.activeMembers,
                      },
                    ]}
                    label={`Lokasi ${g.name}`}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm text-text-secondary sm:px-6">
                  <span>{g.address ?? 'Alamat belum diisi'}</span>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${g.lat}&mlon=${g.lng}#map=17/${g.lat}/${g.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-touch items-center gap-1.5 font-semibold text-text-accent hover:underline"
                  >
                    Buka di peta besar
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">(tab baru)</span>
                  </a>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-start gap-3 px-5 py-6 sm:px-6">
                <p className="flex items-center gap-2 text-text-secondary">
                  <MapPinOff className="h-5 w-5" aria-hidden="true" />
                  Titik lokasi belum ditandai.
                </p>
                {can(user, 'gudep.update') && (
                  <ButtonLink href={`/dashboard/gudep/${g.id}/ubah`} size="sm">
                    Tandai lokasi sekarang
                  </ButtonLink>
                )}
              </div>
            )}
          </Panel>

          <Panel title="Data gudep">
            <InfoList
              items={[
                { label: 'Pangkalan', value: g.pangkalan },
                { label: 'Jenjang', value: g.jenjang },
                { label: 'Alamat', value: g.address },
                { label: 'Pembina / kontak', value: g.contactName },
                {
                  label: 'Telepon',
                  value: g.contactPhone ? (
                    <a href={`tel:${g.contactPhone.replace(/[^\d+]/g, '')}`} className="text-text-accent underline">
                      {g.contactPhone}
                    </a>
                  ) : null,
                },
                { label: 'Status', value: g.active ? 'Aktif' : 'Nonaktif' },
              ]}
            />
          </Panel>
        </div>

        {can(user, 'members.read') && (
          <Panel
            title="Anggota"
            description={`${row.activeMembers} aktif${row.pendingMembers ? ` · ${row.pendingMembers} menunggu/perlu perbaikan` : ''}`}
          >
            <ul className="divide-y divide-border-subtle">
              {GOLONGAN_OPTIONS.map((o) => (
                <li key={o.value} className="flex items-center justify-between py-2.5">
                  <span className="text-text-secondary">{o.label}</span>
                  <span className="font-semibold text-text-primary">{golongan.find((x) => x.golongan === o.value)?.n ?? 0}</span>
                </li>
              ))}
            </ul>
            <Link
              href={`/dashboard/anggota?gudep=${g.id}`}
              className="mt-4 inline-flex min-h-touch items-center gap-2 font-semibold text-text-accent hover:underline"
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              Lihat daftar anggota gudep ini
            </Link>
          </Panel>
        )}
      </div>
    </>
  );
}
