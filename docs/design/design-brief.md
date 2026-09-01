# Design Brief

Dokumen ini merupakan panduan desain utama untuk portal digital Kwartir Cabang Gerakan Pramuka Indramayu.

## Karakter Visual
Desain portal ini harus mencerminkan nilai-nilai:
- Calm
- Civic
- Reliable
- Warm
- Structured
- Professional
- Grounded
- Inclusive
- Scouting-oriented

## Arah Desain
**"Calm civic system with scouting character."**
- Desain harus terasa seperti institusi pendidikan dan organisasi masyarakat yang terpercaya.
- BUKAN startup SaaS, aplikasi AI, atau dashboard finansial. Pendekatan visual harus mengedepankan fungsionalitas dan kejelasan bagi masyarakat umum.

## Yang Harus Dihindari
Berikut adalah elemen-elemen desain yang DILARANG penggunaannya:
- **Gradient ungu-biru dekoratif**: Terlalu identik dengan produk web3 atau AI, tidak sesuai dengan karakter sipil/pramuka.
- **Glassmorphism berlebihan**: Mengurangi readability dan terasa terlalu modern-trendy.
- **Emoji dekoratif**: Kurang profesional untuk konteks institusi resmi.
- **Ilustrasi robot**: Tidak relevan dengan organisasi kepramukaan.
- **Kartu pada setiap blok**: Membuat tampilan menjadi terlalu kotak-kotak dan kaku (hindari efek "dashboard-heavy").
- **Rounded-2xl/3xl sebagai default**: Membuat UI terlihat terlalu playful atau kekanak-kanakan.
- **Dashboard KPI palsu**: Menampilkan grafik atau data yang tidak memiliki nilai fungsional bagi pengguna publik.
- **Donut chart dekoratif**: Hanya memakan ruang jika tidak digunakan untuk menyampaikan informasi yang nyata.
- **Terlalu banyak ikon**: Membuat kognisi pengguna cepat lelah; gunakan ikon hanya ketika membantu pemahaman.
- **Hero generik**: Ilustrasi vector generik tanpa makna yang spesifik terhadap kepramukaan Indramayu.
- **Copy abstrak**: (contoh: "Empower your scouting journey") Gunakan bahasa yang langsung dan deskriptif.
- **Animasi berlebihan**: Mengganggu fokus pengguna pada konten utama.
- **Auto-play carousel**: Menyembunyikan informasi dan sulit diakses (accessibility issue).
- **Parallax besar**: Memperberat performa rendering tanpa nilai tambah yang signifikan.
- **Teks terlalu kecil**: Melanggar standar aksesibilitas dan menyulitkan pembaca.
- **Terlalu banyak font**: Mengurangi konsistensi visual.

## 7 Prinsip Desain
1. **Clarity before decoration** — Kejelasan lebih penting dari efek visual. Setiap elemen visual harus memiliki tujuan komunikasi, bukan sekadar pemanis.
2. **One primary action** — Satu konteks visual = satu aksi utama. Jangan membebani satu layar dengan banyak tombol call-to-action (CTA) bersaing.
3. **Whitespace creates trust** — Ruang kosong (negative space) membantu informasi terasa tertata, mudah dibaca, dan menunjukkan profesionalisme.
4. **Color is semantic** — Warna berdasarkan fungsi, bukan dekorasi. Setiap warna yang digunakan harus mewakili status, aksi, atau bagian identitas tertentu secara konsisten.
5. **Privacy is visible** — Status data, persetujuan, dan akses harus dapat dipahami pengguna secara eksplisit dan transparan.
6. **Motion explains change** — Animasi hanya digunakan untuk orientasi, memberikan umpan balik (feedback), menunjukkan hubungan sebab-akibat (kausalitas), atau memusatkan fokus pengguna.
7. **Accessible by default** — Aksesibilitas adalah standar awal, bukan fitur tambahan. Desain harus inklusif untuk semua pengguna.

## Palet Warna
Gunakan palet warna yang didefinisikan dalam design tokens:
- **Hijau** (`green-500`: #2f7d52, `green-600`: #246b45) — Warna utama, merepresentasikan identitas Pramuka.
- **Neutral** (`neutral-50`: #fbfaf7 hingga `neutral-900`: #17211d) — Digunakan untuk background permukaan dan warna teks utama/pendukung.
- **Amber** (`amber-700`: #9a5b00) — Digunakan untuk peringatan (warning).
- **Red** (`red-700`: #b42318) — Digunakan untuk indikasi bahaya/error (danger).
- **Blue** (`blue-700`: #1e5b85) — Digunakan untuk informasi (info).

### Penggunaan Semantic Color:
- **Surface**: `base` (#fbfaf7), `raised` (#fff), `subtle` (#f1f3f0)
- **Text**: `primary`, `secondary`, `muted`, `on-action`
- **Action**: `primary` (green-600), `primary-hover` (green-700), `secondary` (green-100)
- **Border**: `subtle`, `strong`
- **Status**: `success`, `warning`, `danger`, `info`

## Font
Tipografi dibuat sederhana namun memiliki keterbacaan tinggi:
- **Primary**: Inter (Fallback: Noto Sans) - Digunakan untuk teks body, UI, dan konten umum.
- **Display** (terbatas): DM Sans - Hanya digunakan untuk heading utama atau angka besar.
- **JANGAN** gunakan lebih dari 2 font family.

## Referensi Karakter
- Harus terlihat dan terasa mirip dengan website pemerintah modern atau institusi pendidikan terkemuka.
- BUKAN portofolio Dribbble showcase yang over-designed.
- BUKAN template dashboard komersial.
