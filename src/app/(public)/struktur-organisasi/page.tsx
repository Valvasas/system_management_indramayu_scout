import type { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/Section';
import { getKwarran, getOrganizationByDepartment } from '@/lib/repositories';

export const metadata: Metadata = {
  title: 'Struktur Organisasi',
  description:
    'Susunan pengurus Kwartir Cabang Gerakan Pramuka Indramayu dan daftar kwartir ranting se-Kabupaten Indramayu.',
  alternates: { canonical: '/struktur-organisasi' },
};

export default async function StrukturOrganisasiPage() {
  const departments = await getOrganizationByDepartment();
  const kwarrans = await getKwarran();

  return (
    <div className="civic-container py-12">
      <PageHeader
        title="Struktur organisasi"
        description="Susunan pengurus Kwartir Cabang masa bakti 2026–2031 dan sebaran kwartir ranting di seluruh kecamatan."
      />

      <section aria-labelledby="pengurus-title" className="mb-12">
        <h2 id="pengurus-title" className="font-display text-2xl font-bold text-text-primary">
          Susunan pengurus kwarcab
        </h2>
        <ul className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {departments.map(({ department, members }) => (
            <li key={department}>
              <Card className="h-full">
                <CardContent>
                  <h3 className="font-display text-lg font-bold text-text-accent">{department}</h3>
                  <ul className="mt-3 space-y-3">
                    {members.map((member) => (
                      <li key={member.id}>
                        <p className="font-medium text-text-primary">{member.name}</p>
                        <p className="text-sm text-text-secondary">{member.role}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="kwarran-title">
        <h2 id="kwarran-title" className="font-display text-2xl font-bold text-text-primary">
          {kwarrans.length} kwartir ranting
        </h2>
        <p className="mt-2 max-w-prose text-text-secondary">
          Setiap kwartir ranting membina gugus depan di wilayah kecamatannya.
        </p>
        {/* 2 kolom di ponsel agar nama kecamatan tidak terpotong (P3-8). */}
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {kwarrans.map((k) => (
            <li
              key={k.id}
              className="rounded-md border border-border-subtle bg-surface-subtle px-4 py-3"
            >
              <p className="text-sm font-medium text-text-primary">{k.name}</p>
              <p className="text-xs text-text-secondary">
                {k.code} · {k.gudepCount} gudep
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
