"use client";
import { useLanguage } from "@/context/LanguageContext";

export default function TentangPage() {
  const { t } = useLanguage();
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-green-800 mb-8">{t("about_title") || "Tentang Kami"}</h1>
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Sejarah Gerakan Pramuka Indramayu</h2>
        <p className="text-neutral-700 leading-relaxed">
          Sejarah panjang Gerakan Pramuka di Kabupaten Indramayu...
        </p>
      </section>
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Visi & Misi</h2>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
          <h3 className="font-bold mb-2">Visi</h3>
          <p className="mb-4 text-neutral-700">Mewujudkan generasi muda Indramayu yang berkarakter...</p>
          <h3 className="font-bold mb-2">Misi</h3>
          <ul className="list-disc pl-5 text-neutral-700">
            <li>Menyelenggarakan kepramukaan yang berkualitas...</li>
          </ul>
        </div>
      </section>
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Nilai-nilai</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-green-50 p-6 rounded-lg border border-green-100">
            <h3 className="font-bold text-green-800 mb-2">Tri Satya</h3>
            <p className="text-sm text-neutral-700">Demi kehormatanku aku berjanji akan bersungguh-sungguh...</p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg border border-green-100">
            <h3 className="font-bold text-green-800 mb-2">Dasa Darma</h3>
            <ol className="list-decimal pl-5 text-sm text-neutral-700">
              <li>Takwa kepada Tuhan Yang Maha Esa...</li>
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}
