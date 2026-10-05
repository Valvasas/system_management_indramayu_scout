import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';

/** Kerangka situs publik: navbar, konten, footer. Dasbor memakai shell sendiri. */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="atas" className="flex min-h-screen flex-col">
      <Header />
      <main id="main-content" className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}
