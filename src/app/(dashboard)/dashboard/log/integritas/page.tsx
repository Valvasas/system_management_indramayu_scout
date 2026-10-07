import type { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';
import { getDb } from '@/db';
import { Button } from '@/components/ui/Button';
import { InfoList, Notice, Panel, PortalHeader } from '@/components/dashboard/ui';
import { audit } from '@/lib/auth/audit';
import { verifyAuditChain } from '@/lib/auth/audit-chain';
import { requirePermission } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Integritas log audit' };

const REASONS = {
  'isi-berubah': 'isi entri tidak cocok dengan hash-nya (diubah atau dipalsukan)',
  'rantai-terputus': 'entri sebelumnya hilang atau urutan diubah',
  'awal-tidak-dikenal': 'awal rantai terpotong tanpa jangkar retensi yang sah',
} as const;

/** Khusus Super Admin. Pemeriksaan berjalan hanya saat diminta (tombol), lalu dicatat di log. */
export default async function AuditIntegrityPage({ searchParams = {} }: { searchParams?: { periksa?: string } }) {
  const user = await requirePermission('audit.verify');
  const run = searchParams.periksa === '1';
  const report = run ? await verifyAuditChain(await getDb()) : null;
  if (report) {
    await audit(user, {
      action: 'audit.verified',
      summary: report.ok ? `Verifikasi log: utuh (${report.checked} entri)` : `Verifikasi log: RUSAK di entri #${report.broken?.id}`,
    });
  }

  return (
    <>
      <PortalHeader
        title="Integritas log audit"
        back={{ href: '/dashboard/log', label: 'Log aktivitas' }}
        description="Setiap entri log terkunci dengan hash entri sebelumnya. Pemeriksaan ini menghitung ulang seluruh rantai untuk mendeteksi entri yang diubah, dihapus, atau disisipkan."
      />

      {report?.ok && (
        <Notice>Rantai utuh: {report.checked.toLocaleString('id-ID')} entri terverifikasi, tidak ada yang diubah atau dihapus.</Notice>
      )}
      {report && !report.ok && report.broken && (
        <Notice tone="warning">
          Rantai rusak di entri #{report.broken.id}: {REASONS[report.broken.reason]}. Laporkan ke penanggung jawab keamanan dan bandingkan
          dengan backup terakhir.
        </Notice>
      )}

      <Panel title="Pemeriksaan" id="periksa">
        <form
          method="get"
          action="/dashboard/log/integritas"
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="max-w-prose text-sm text-text-secondary">
            Pemeriksaan membaca semua entri berantai. Pada log besar butuh beberapa detik. Hasilnya ikut tercatat di log.
          </p>
          <input type="hidden" name="periksa" value="1" />
          <Button type="submit" className="shrink-0">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Periksa sekarang
          </Button>
        </form>
        {report && (
          <div className="mt-6 border-t border-border-subtle pt-5">
            <InfoList
              items={[
                { label: 'Entri berantai diperiksa', value: report.checked.toLocaleString('id-ID') },
                { label: 'Entri lama (sebelum rantai, tidak terlindungi)', value: report.legacy.toLocaleString('id-ID') },
                { label: 'Entri terakhir', value: report.headId ? `#${report.headId}` : '—' },
                {
                  label: 'Kepala rantai (hash entri terakhir)',
                  value: <code className="break-all font-mono text-xs">{report.headHash ?? '—'}</code>,
                },
              ]}
            />
          </div>
        )}
      </Panel>

      <Panel title="Cara memakai kepala rantai" className="mt-6">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-text-secondary">
          <li>Seminggu sekali, catat nomor entri terakhir dan kepala rantai di luar sistem (mis. buku agenda sekretariat).</li>
          <li>
            Rantai mendeteksi perubahan di tengah, tetapi tidak bisa membuktikan bahwa entri <em>terbaru</em> tidak dipotong. Catatan di
            luar sistem itulah pembandingnya: entri yang pernah tercatat harus selalu ada dengan hash yang sama.
          </li>
          <li>Rotasi kunci BLIND_INDEX_KEY membuat entri lama tidak bisa diverifikasi lagi. Catat kepala rantai sebelum rotasi.</li>
        </ol>
      </Panel>
    </>
  );
}
