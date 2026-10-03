import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import '@/styles/globals.css';
import { SkipToContent } from '@/components/ui/SkipToContent';
import { site, absoluteUrl } from '@/lib/site';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.organization}`,
    // Judul unik per halaman; layout hanya menyediakan sufiksnya.
    template: `%s | ${site.name}`,
  },
  description: site.description,
  manifest: '/manifest.json',
  applicationName: site.name,
  alternates: { canonical: '/' },
  openGraph: {
    siteName: site.name,
    title: `${site.name} — ${site.organization}`,
    description: site.description,
    type: 'website',
    url: site.url,
    locale: site.locale,
  },
  robots: { index: true, follow: true },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: site.organization,
  alternateName: site.name,
  url: site.url,
  logo: absoluteUrl(site.logo),
  email: site.contact.email,
  telephone: site.contact.phone,
  address: {
    '@type': 'PostalAddress',
    streetAddress: site.contact.address.street,
    addressLocality: site.contact.address.locality,
    addressRegion: site.contact.address.region,
    postalCode: site.contact.address.postalCode,
    addressCountry: site.contact.address.country,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={site.lang} className={`${inter.variable} ${jakarta.variable}`}>
      <body className="antialiased font-sans text-text-primary bg-surface-canvas min-h-screen">
        <SkipToContent />
        {/* Kerangka (header/footer publik atau shell dasbor) ada di layout route group. */}
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </body>
    </html>
  );
}
