import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import "@/styles/globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { SkipToContent } from "@/components/ui/SkipToContent";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });

export const metadata: Metadata = {
  title: "Rumah Pramuka Indramayu",
  description: "Website Resmi Kwartir Cabang Gerakan Pramuka Indramayu",
  manifest: "/manifest.json",
  openGraph: {
    title: "Rumah Pramuka Indramayu",
    description: "Website Resmi Kwartir Cabang Gerakan Pramuka Indramayu",
    type: "website",
    url: "https://pramukaindramayu.or.id",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} ${dmSans.variable}`}>
      <body className="antialiased font-sans text-neutral-900 bg-neutral-50 flex flex-col min-h-screen">
        <LanguageProvider>
          <SkipToContent />
          <Header />
          <main id="main-content" className="flex-grow">
            {children}
          </main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
