# V5) perplexity 

## Rumah Pramuka Indramayu 

#### Dokumen Rancangan Produk, Desain, dan Arsitektur Teknis 

Status: Dra� Perencanaan 

Nama produk: Rumah Pramuka Indramayu 

Lingkup awal: Kwartir Cabang Gerakan Pramuka Indramayu Bahasa publik: Bahasa Indonesia, English, Basa Sunda 

### 1. Ringkasan Produk 

Rumah Pramuka Indramayu adalah portal digital resmi dan sistem informasi bertahap untuk Kwartir Cabang Gerakan Pramuka Indramayu. 

Pada fase awal, produk berfungsi sebagai website publik yang menyampaikan informasi resmi Kwarcab secara modern, mudah diakses, dan terpercaya. Pada tahap berikutnya, platform berkembang menjadi sistem pengelolaan keanggotaan, kegiatan, struktur organisasi, data Gugus Depan, Kwarran, pembina, pelatih, serta kebutuhan manajerial tingkat Kwarcab. 

Produk ini tidak dirancang sebagai dashboard SaaS generik. Karakternya adalah rumah digital organisasi: tertib, ramah, modern, mudah dipahami oleh pengguna muda hingga dewasa, dan tetap memiliki nuansa Pramuka tanpa berlebihan secara dekoratif. 

### 2. Latar Belakang 

Pengelolaan data anggota dan kegiatan organisasi sering masih mengandalkan spreadsheet, dokumen terpisah, grup percakapan, dan arsip manual. Cara ini memiliki beberapa risiko: 

- Data anggota tersebar di banyak file. 

- Data mudah ganda, tidak sinkron, atau tidak diperbarui. 

- Staff membutuhkan waktu lama untuk mencari data anggota tertentu. 

- Riwayat perpindahan anggota, Gudep, jabatan, dan kegiatan mudah hilang. 

- Informasi publik organisasi tidak terkumpul pada satu sumber resmi. 

- Pengurus di tingkat Kwarcab, Kwarran, dan Gudep memiliki cara kerja serta format data yang berbeda. 

- Data anak berisiko tersebar tanpa pengaturan akses yang memadai. 

- Masyarakat, orang tua, dan anggota kesulitan mencari informasi resmi kegiatan Pramuka di Indramayu. 

Rumah Pramuka Indramayu dirancang untuk menjadi fondasi digital yang menyatukan kebutuhan informasi publik dan administrasi internal secara bertahap. 

3. Visi, Misi, dan Nilai 

### Visi 

Menjadi rumah digital Gerakan Pramuka Indramayu yang profesional, terpercaya, aman, terhubung, dan membantu setiap anggota berkembang. 

### Misi 

1. Menyediakan informasi resmi Kwarcab Indramayu yang jelas, aktual, dan mudah diakses. 

2. Membangun sistem data keanggotaan yang terstruktur, aman, serta dapat dipertanggungjawabkan. 

3. Menghubungkan Kwarcab, Kwarran, Gugus Depan, pembina, pelatih, anggota, dan orang tua/wali dalam satu ekosistem digital. 

4. Memudahkan pengelolaan kegiatan, anggota, pembina, pelatih, dan struktur organisasi. 

5. Mendorong pembaruan data secara mandiri, terverifikasi, dan memiliki jejak perubahan. 

6. Menjaga privasi anggota, terutama peserta didik di bawah umur. 

7. Menyediakan layanan digital yang dapat digunakan anak usia SMP/MTs hingga Pandega, pembina, staff, serta pengurus. 

8. Menjadikan teknologi sebagai alat yang memudahkan kerja organisasi, bukan menambah kerumitan administrasi. 

### Nilai produk 

Professional Trusted Reliable Inclusive Secure Calm Helpful Accountable Human-centered 

### 4. Tujuan Produk 

### Tujuan publik 

Menjadi website resmi Kwarcab Indramayu. 

- Menyediakan berita, pengumuman, agenda, galeri, prestasi, struktur organisasi, dan informasi kontak. 

- Meningkatkan kepercayaan masyarakat terhadap informasi yang diterbitkan oleh Kwarcab. 

- Menjadi arsip digital kegiatan dan pencapaian Pramuka Indramayu. 

- Memudahkan masyarakat menemukan kegiatan atau informasi yang relevan. 

### Tujuan internal jangka panjang 

Mengelola data anggota Pramuka secara terstruktur. 

- Mengelola data Gugus Depan, Kwarran, pembina, pelatih, dan staff. 

- Memudahkan pencarian anggota berdasarkan unit, golongan, wilayah, atau status. Menyediakan sistem verifikasi data. 

- Menyediakan riwayat perpindahan anggota dan jabatan. 

- Membantu monitoring kualitas data organisasi. 

- Mengurangi ketergantungan pada spreadsheet yang tersebar. 

- Menyediakan laporan terstruktur bagi Kwarcab. 

- Menyediakan peta organisasi internal berbasis wilayah. 

- Menjadi sumber data yang dapat dipercaya untuk kegiatan dan pengambilan keputusan. 

## 5. Scope Pengembangan 

### Fase 1 — Website Publik dan Landing Page 

Fase pertama difokuskan pada website publik yang matang, bukan dashboard keanggotaan penuh. 

### Fitur fase 1 

Landing page / Beranda Profil Kwarcab Visi, misi, dan sejarah Struktur organisasi Berita dan pengumuman Agenda kegiatan Galeri dan album kegiatan Prestasi Dokumentasi / publikasi Kontak dan lokasi kantor Halaman kebijakan privasi Halaman aksesibilitas Halaman login PWA dasar Multibahasa: Indonesia, Inggris, Sunda SEO dan metadata Sitemap Favicon dan web manifest Panel admin konten terbatas Workflow draft → review → publish 

Tujuan fase 1 

Membangun wajah resmi Kwarcab Indramayu yang terlihat profesional, mudah digunakan, cepat diakses, dan siap berkembang menjadi rumah digital organisasi. 

### Fase 2 — Fondasi Sistem Internal 

Login dan autentikasi Manajemen akun Role dan scoped permission Struktur Kwarcab, Kwarran, Gudep Data anggota inti Data pembina dan pelatih Pencarian anggota Import data Excel/CSV Export data Excel/CSV Verifikasi data Riwayat perubahan data Audit log Dashboard dasar per role 

### Fase 3 — Operasional Organisasi 

Manajemen kegiatan Pendaftaran peserta Kehadiran Notifikasi Peta internal Laporan Manajemen masa jabatan SKU dan SKK Pengelolaan dokumen Pusat persetujuan data 

### Fase 4 — Ekosistem Digital 

Portal anggota lengkap PWA offline terbatas Push notification Sistem komunikasi organisasi Chat terkontrol Sertifikat Pusat pembelajaran Integrasi layanan pihak ketiga Analitik organisasi 

Fitur chat ditunda dan tidak dimasukkan ke fase awal. Ketika dikembangkan, chat harus dimulai dari komunikasi organisasi dan pembina, bukan direct message bebas antar anggota. 

## 6. Pengguna Sistem 

|Pengguna|Kebutuhan utama|
|---|---|
|Masyarakat umum|Informasi resmi,berita,agenda,galeri,profil Kwarcab|
|Orang tua/wali|Informasi kegiatan,persetujuan data,informasi anak secara terbatas|
|Anggota Penggalang|Informasi Gudep,kegiatan,pengumuman,profil terbatas|
|Anggota Penegak|Kegiatan,profil,riwayat partisipasi,SKU/SKK bertahap|
|Anggota Pandega|Kegiatan,kepemimpinan,organisasi,program,riwayat|
|Pembina|Data anggota binaan,kegiatan,kehadiran,perkembangan anggota|
|Pelatih|Data pelatihan,peserta,materi,kegiatan,sertifikasi|
|StafGudep|Administrasi anggota,pembaruan data,kegiatan Gudep|
|StafKwarran|Monitoring Gudep,validasi data wilayah,kegiatan wilayah|
|StafKwarcab|Pengelolaan lintas wilayah,laporan,data organisasi,kegiatan|
|Admin website|Berita,agenda,galeri,publikasi,SEO,workflow konten|
|Super admin|Konfigurasi sistem,keamanan,backup,role tertinggi,audit|



## 7. Struktur Organisasi Digital 

### Hierarki utama 

Gerakan Pramuka `└──` Kwartir Nasional `└──` Kwartir Daerah `└──` Kwartir Cabang `└──` Kwartir Ranting `└──` Gugus Depan `├──` Perindukan Siaga `├──` Pasukan Penggalang `├──` Ambalan Penegak `└──` Racana Pandega 

#### Untuk lingkup awal sistem: 

Kwarcab Indramayu `├──` Kwarran tingkat kecamatan `│ ├──` Gudep berbasis sekolah `│ ├──` Gudep berbasis madrasah `│ ├──` Gudep berbasis perguruan tinggi `│ └──` Gudep berbasis komunitas `├──` Pembina `├──` Pelatih `├──` Andalan `├──` Dewan Kerja 

`├──` Majelis Pembimbing `├──` Staff Kwarcab `└──` Anggota Pramuka 

AD/ART Gerakan Pramuka menyebutkan bahwa kwartir adalah satuan organisasi pengelola pada setiap tingkatan wilayah. Kwartir Cabang mengoordinasikan Kwarran dan pangkalan Saka tingkat kabupaten/kota, sementara Kwarran mengoordinasikan Gudep serta pangkalan Saka tingkat kecamatan/distrik. <u>[1]</u> 

### Entitas organisasi 

Kwarcab Kwarran Gudep Pangkalan Sekolah Madrasah Perguruan Tinggi Saka Pusdiklatcab Majelis Pembimbing Dewan Kerja Satuan Pengawas Internal Dewan Kehormatan 

AD/ART juga menjelaskan bahwa Dewan Kerja dibentuk kwartir sebagai wadah kaderisasi kepemimpinan Penegak dan Pandega; Majelis Pembimbing memberikan bimbingan moral serta organisatoris; dan Pusdiklat merupakan bagian integral dari kwartir untuk pendidikan, <u>[1]</u> pelatihan, dan sertifikasi tenaga pendidik. 

## 8. Akun Role , , dan Penugasan 

### Prinsip akun 

Satu orang hanya memiliki satu akun identitas. 

Namun, satu akun dapat memiliki lebih dari satu penugasan organisasi bila memang sesuai keputusan Kwarcab atau struktur organisasi. 

Contoh: 

Satu akun: Rizky Maulana Zein Njen 

Penugasan aktif: 

- Anggota Penegak Gudep SMKN 1 Cikedung 

- Staff administrasi Gudep SMKN 1 Cikedung 

- Panitia kegiatan Kwarcab Indramayu 

Penugasan historis: 

- Panitia Raimuna tahun 2025 

- Staff Kwarran dalam periode tertentu 

### Model akses 

Account `├──` User profile `├──` Member profile `├──` Role `├──` Permission `├──` Organization scope `└──` Organization assignment 

### Role dasar 

Public Visitor Member Penggalang Member Penegak Member Pandega Parent / Guardian Pembina Pelatih Staff Gudep Staff Kwarran Staff Kwarcab Admin Website Admin System Super Admin 

### Permission contoh 

members.read members.create members.update members.verify members.archive members.export members.view_sensitive organizations.read organizations.manage 

events.create events.review events.publish events.manage news.create news.review news.publish news.archive 

gallery.create gallery.review gallery.publish 

roles.manage permissions.manage audit_logs.view backups.manage system.manage 

### Scope organisasi 

Kwarcab scope Kwarran scope Gudep scope Event scope Content scope Personal scope 

#### Contoh: 

Staff Gudep SMKN 1 Cikedung: 

- boleh melihat data anggota Gudep sendiri 

- tidak boleh membuka data Gudep lain 

- tidak boleh mengakses data sensitif tanpa permission tambahan 

Staff Kwarran Cikedung: 

- dapat melihat Gudep dalam wilayah Kwarran Cikedung 

- tidak dapat mengubah data Kwarcab secara langsung 

Staff Kwarcab: 

- memiliki akses lintas wilayah sesuai permission 

- aktivitas sensitif selalu masuk audit log 

### Masa jabatan 

Masa jabatan, pengangkatan, pengakhiran jabatan, penugasan staff, dan struktur pengurus mengikuti keputusan pihak Kwarcab serta ketentuan organisasi dan peraturan yang berlaku. 

Sistem tidak menentukan masa jabatan secara otomatis tanpa dasar. Sistem hanya membantu mencatat: 

Nama jabatan Unit organisasi Tanggal mulai Tanggal selesai Status penugasan Dokumen keputusan 

Pihak yang menetapkan Riwayat perubahan 

AD/ART yang tersedia menyebutkan musyawarah pada tingkat cabang diselenggarakan lima tahun sekali, tingkat ranting tiga tahun sekali, dan tingkat Gugus Depan dua tahun sekali. Sistem sebaiknya menyimpan masa jabatan sebagai data fleksibel agar tetap dapat mengikuti SK, hasil musyawarah, dan peraturan yang berlaku. <u>[1]</u> 

## 9. Lifecycle Keanggotaan 

### Status anggota 

DRAFT PENDING_APPROVAL PENDING_VERIFICATION ACTIVE NEEDS_UPDATE TRANSFER_REQUESTED TRANSFERRED GRADUATED INACTIVE SUSPENDED ARCHIVED DECEASED 

### Penambahan anggota 

Pendaftaran mandiri atau dibuat oleh pembina/staff → data dasar diisi → status menunggu persetujuan → pihak berwenang meninjau → akun diaktifkan 

- → anggota mendapatkan akses sesuai golongan dan unit organisasi 

### Perpindahan anggota 

- Permintaan perpindahan dibuat → Gudep asal meninjau → Gudep tujuan menerima → Kwarran dapat memantau → unit aktif anggota diperbarui 

- → riwayat Gudep sebelumnya disimpan 

- → audit log dibuat 

Pengarsipan anggota 

Anggota yang lulus, pindah, tidak aktif, atau berhenti tidak langsung dihapus. 

#### Kebijakan awal: 

Retensi data default: 5 tahun Pengaturan retensi: dapat dikelola Super Admin Data historis: tetap tersedia secara terbatas Penghapusan data: memerlukan hak khusus dan konfirmasi Penghapusan data sensitif: dicatat pada audit log 

Sesuai prinsip perlindungan data, data harus diproses secara terbatas, sesuai tujuan, akurat, mutakhir, aman, serta dihapus atau dimusnahkan setelah masa retensi berakhir atau berdasarkan kondisi yang berlaku. <u>[2]</u> 

## 10. Login dan Autentikasi 

### Login Penggalang 

Anggota Penggalang menggunakan mekanisme berbeda karena banyak pengguna belum memiliki email pribadi dan berada pada usia anak. 

### Aturan akun Penggalang 

Akun dibuat oleh pembina atau staff Gudep Kode akses dibuat sistem Kode akses hanya dapat digunakan satu orang Akun terkait dengan anggota dan Gudep Akun tidak aktif sebelum diverifikasi Email pribadi tidak wajib Nomor telepon pribadi tidak wajib Kontak wali digunakan bila diperlukan 

### Aktivasi Penggalang 

Pembina membuat akun 

- → sistem menghasilkan kode aktivasi sekali pakai 

- → anggota memasukkan kode aktivasi 

- → anggota membuat PIN atau password sederhana yang aman 

- → pembina/wali dapat membantu pemulihan akses 

- → akun aktif setelah proses persetujuan selesai 

Lupa password Penggalang 

#### Jangan mengandalkan email. 

Anggota memilih “Lupa kode akses” 

→ sistem meminta identitas minimum 

→ permintaan dikirim ke pembina atau staff Gudep 

→ pembina melakukan verifikasi 

- → sistem membuat kode reset sekali pakai 

- → kode dikirim melalui mekanisme yang aman 

- → anggota membuat PIN/password baru 

Pembina tidak boleh mengetahui password anggota. Pembina hanya boleh memicu reset dan memberikan kode sekali pakai. 

### Login Penegak, Pandega, Staff, dan Manajerial 

Daftar mandiri → verifikasi email atau nomor kontak → status PENDING_APPROVAL 

→ pihak kwartir atau Gudep meninjau sesuai scope 

- → untuk staff/manajerial diperlukan persetujuan Kwarcab 

→ setelah disetujui akun ACTIVE 

### Login staff dan manajerial 

Untuk role dengan akses data organisasi: 

Email atau username Password kuat Persetujuan Kwarcab Multi-factor authentication untuk admin tinggi Session timeout Audit login Device/session management 

## 11. Data Anggota dan Privasi 

### Prinsip data 

Sistem hanya mengumpulkan data yang dibutuhkan untuk administrasi keanggotaan, komunikasi, keamanan kegiatan, verifikasi, dan pengelolaan organisasi. 

Data anggota anak termasuk data pribadi spesifik menurut UU Pelindungan Data Pribadi. Pemrosesannya harus diselenggarakan khusus dan wajib memperoleh persetujuan dari orang tua dan/atau wali sesuai ketentuan. <u>[2]</u> 

Data yang dikumpulkan 

### Identitas anggota 

|Data|Status|Catatan|
|---|---|---|
|Nomor KTA resmi|Wajib bila tersedia|Mengikuti KTA resmi Gerakan Pramuka|
|Nomor anggota internal|Wajib|ID teknis sistem,tidak dipublikasikan|
|Nama lengkap|Wajib|Untuk administrasi|
|Nama panggilan|Opsional|Untuk komunikasi internal|
|Tanggal lahir|Wajib|Menentukan golongan dan kebutuhan persetujuan|
|Jenis kelamin|Wajib bila diperlukan organisasi|Tidak ditampilkan publik|
|Golongan|Wajib|Penggalang,Penegak,Pandega|
|Tingkatan|Bertahap|Disesuaikan SKU/administrasi|
|Gudep aktif|Wajib|Unit utama anggota|
|Kwarran|Otomatis|Turunan dari Gudep|
|Kwarcab|Otomatis|Turunan dari Kwarran|
|Status keanggotaan|Wajib|Aktif,pindah,arsip,dan lainnya|



### Kontak 

|Data|Status|Akses|
|---|---|---|
|Email anggota|Opsional untuk Penggalang|Terbatas|
|Nomor telepon anggota|Opsional|Role berwenang|
|Nama orang tua/wali|Wajib untuk anggota anak|Terbatas|
|Nomor kontak orang tua/wali|Wajib untuk anggota anak|Terbatas|
|Kontak darurat|Dianjurkan|Role kegiatan/pembina berwenang|
|Preferensi notifikasi|Wajib|Dapat dikelola pengguna/wali|



### Data pembinaan 

Pembina utama Riwayat Gudep Riwayat kegiatan Status SKU Status SKK Riwayat penugasan Status kehadiran Catatan pembinaan terbatas 

Data yang tidak ditampilkan publik 

Terutama untuk Penggalang: 

Nama lengkap anggota Foto wajah anggota Nomor telepon Email Tanggal lahir Alamat rumah Lokasi rumah KTA Data wali Kontak darurat Riwayat pembinaan SKU dan SKK individual Dokumen pribadi 

### Aturan publikasi foto 

Keputusan produk: 

Foto anggota di bawah umur, terutama Penggalang, tidak ditampilkan pada website publik. 

Website publik dapat menampilkan: 

- Foto suasana kegiatan dengan identitas tidak dapat dikenali, bila kebijakan dan persetujuan mengizinkan. 

- Foto dokumentasi tanpa menampilkan wajah anak secara jelas. 

- Foto pembina, staff, panitia dewasa, atau tokoh organisasi sesuai persetujuan. 

- Foto kelompok dengan pertimbangan privasi ketat, bila kelak benar-benar diperlukan dan telah memiliki dasar persetujuan yang jelas. 

Data publik yang boleh dipertimbangkan hanya bersifat agregat, misalnya: 

Jumlah anggota Penggalang Jumlah anggota Penegak Jumlah anggota Pandega Komposisi jenis kelamin dalam angka agregat Jumlah Gudep aktif Jumlah kegiatan 

## 12. Website Publik 

Struktur navigasi 

Beranda Tentang Struktur Organisasi Berita Agenda Galeri Prestasi Dokumen Kontak Masuk 

### Beranda 

Beranda harus menjawab: 

1. Website ini milik siapa? 

2. Apa peran Kwarcab Indramayu? 

3. Apa yang sedang berlangsung? 

4. Informasi apa yang dapat saya lihat? 

5. Ke mana saya harus melanjutkan? 

### Struktur beranda 

Header Hero resmi Tentang singkat Kwarcab Agenda terdekat Berita terbaru Galeri pilihan Prestasi atau capaian organisasi Statistik organisasi agregat Peta lokasi kantor / wilayah Ajakan melihat agenda atau berita Footer resmi 

### Hero section 

Contoh copy Bahasa Indonesia: 

Rumah Digital Gerakan Pramuka Indramayu 

Informasi kegiatan, berita, dan layanan Kwartir Cabang Gerakan Pramuka Indramayu dalam satu tempat. 

#### Contoh CTA: 

Lihat Agenda 

Baca Berita Terbaru 

#### Hindari copy abstrak seperti: 

Empower your scouting journey Unlock your potential The future of digital scouting 

### Halaman berita 

### Kategori 

Kegiatan Pengumuman Prestasi Pelatihan Organisasi Edukasi Kepramukaan Informasi Layanan 

### Workflow berita 

DRAFT → SUBMITTED_FOR_REVIEW → IN_REVIEW → REVISION_REQUIRED → APPROVED → SCHEDULED → PUBLISHED → ARCHIVED 

### Aturan editorial 

Berita dapat dibuat oleh staff kwartir atau Gudep. 

- Berita tidak langsung tampil publik. 

- Semua berita wajib melalui review. 

- Review dilakukan admin Kwarcab atau staff Kwarcab berwenang. 

- Editor dapat meminta revisi. 

- Konten yang disetujui dapat dijadwalkan. 

- Semua revisi memiliki riwayat. 

- Konten yang telah terbit dapat diarsipkan, bukan dihapus tanpa catatan. 

Galeri dan album 

### Struktur galeri 

Kegiatan Kwarcab Kegiatan Kwarran Kegiatan Gudep Pelatihan Perkemahan Prestasi Upacara dan peringatan Dokumentasi historis 

### Metadata album 

Judul album Tanggal kegiatan Lokasi Penyelenggara Deskripsi Cover image Status publikasi Kategori Alt text Caption Persetujuan publikasi bila diperlukan 

### Multibahasa 

#### Website publik mendukung: 

id = Bahasa Indonesia en = English su = Basa Sunda 

### Aturan bahasa 

- Bahasa Indonesia menjadi bahasa utama. 

- Bahasa Inggris digunakan untuk akses publik yang lebih luas. 

- Bahasa Sunda digunakan untuk karakter lokal dan kedekatan budaya. 

- Konten administratif/legal tetap menggunakan Bahasa Indonesia sebagai sumber utama. 

- Jika terjemahan belum tersedia, sistem menampilkan Bahasa Indonesia dengan indikator yang jujur. 

- Jangan menggunakan terjemahan mesin langsung ke publik tanpa review manusia. 

URL bahasa 

/id /en /su 

Contoh: 

/id/berita/kegiatan-pramuka-indramayu /en/news/scouting-activity-indramayu /su/berita/kagiatan-pramuka-indramayu 

## 13. Branding dan Identitas Visual 

### Karakter visual 

Calm Civic Reliable Warm Structured Professional Grounded Inclusive Scouting-oriented 

### Arah desain 

Calm civic system with scouting character. 

Desain harus terasa seperti institusi pendidikan dan organisasi masyarakat yang terpercaya, bukan startup SaaS, aplikasi AI, atau dashboard finansial. 

### Yang harus dihindari 

Gradient ungu-biru dekoratif Glassmorphism berlebihan Emoji dekoratif Ilustrasi robot Kartu pada setiap blok Rounded-2xl atau rounded-3xl sebagai default Dashboard KPI palsu Donut chart dekoratif Terlalu banyak ikon Hero generik Copy abstrak Animasi berlebihan Auto-play carousel Parallax besar 

Teks terlalu kecil Terlalu banyak font 

### Prinsip desain 

1. Clarity before decoration 

Kejelasan lebih penting daripada efek visual. 

2. One primary action 

Satu konteks visual memiliki satu aksi utama. 

3. Whitespace creates trust 

Ruang kosong membantu informasi terasa tertata dan terpercaya. 

4. Color is semantic 

Warna dipakai berdasarkan fungsi, bukan dekorasi. 

5. Privacy is visible 

Status data, persetujuan, dan akses harus dapat dipahami pengguna. 

6. Motion explains change 

Animasi hanya digunakan untuk orientasi, feedback, kausalitas, atau fokus. 

7. Accessible by default 

Aksesibilitas harus menjadi standar awal. 

## 14. Design Tokens 

### Lokasi token 

src/styles/tokens.css 

### Tokens awal 

- :root { /* Primitive palette */ --green-50: #f3f8f4; --green-100: #ddeee2; --green-500: #2f7d52; --green-600: #246b45; --green-700: #185437; 

   - --neutral-50: #fbfaf7; 

   - --neutral-100: #f1f3f0; --neutral-200: #dce3dd; --neutral-500: #68756e; --neutral-700: #3e4a44; --neutral-900: #17211d; 

--amber-100: #fff1cc; 

- --amber-700: #9a5b00; 

--red-100: #fde8e7; --red-700: #b42318; 

--blue-100: #e5f1fa; --blue-700: #1e5b85; 

/* Semantic colors */ --color-surface-base: var(--neutral-50); --color-surface-raised: #ffffff; --color-surface-subtle: var(--neutral-100); 

--color-text-primary: var(--neutral-900); --color-text-secondary: var(--neutral-700); --color-text-muted: var(--neutral-500); --color-text-on-action: #ffffff; 

--color-action-primary: var(--green-600); --color-action-primary-hover: var(--green-700); --color-action-secondary: var(--green-100); 

--color-border-subtle: var(--neutral-200); --color-border-strong: #aebbb3; --color-focus-ring: #2878b8; 

--color-status-success: var(--green-600); --color-status-warning: var(--amber-700); --color-status-danger: var(--red-700); --color-status-info: var(--blue-700); 

/* Typography */ --font-sans: "Inter", "Noto Sans", system-ui, sans-serif; --font-display: "DM Sans", "Inter", system-ui, sans-serif; 

--text-xs: 0.75rem; --text-sm: 0.875rem; --text-base: 1rem; --text-lg: 1.125rem; --text-xl: 1.25rem; --text-2xl: 1.5rem; --text-3xl: 2rem; --text-4xl: 2.5rem; 

--weight-regular: 400; --weight-medium: 500; --weight-semibold: 600; --weight-bold: 700; 

--leading-tight: 1.2; --leading-normal: 1.5; --leading-relaxed: 1.7; 

/* Spacing */ --space-1: 0.25rem; --space-2: 0.5rem; --space-3: 0.75rem; --space-4: 1rem; 

--space-5: 1.25rem; --space-6: 1.5rem; --space-8: 2rem; --space-10: 2.5rem; --space-12: 3rem; --space-16: 4rem; --space-20: 5rem; /* Shape */ --radius-sm: 0.375rem; --radius-md: 0.625rem; --radius-lg: 0.875rem; --radius-xl: 1.25rem; --radius-pill: 999px; --radius-control: var(--radius-md); --radius-card: var(--radius-lg); --radius-dialog: var(--radius-xl); 

/* Shadows */ --shadow-sm: 0 1px 2px rgb(23 33 29 / 0.06); --shadow-md: 0 8px 24px rgb(23 33 29 / 0.09); --shadow-dialog: 0 20px 60px rgb(23 33 29 / 0.16); 

/* Motion */ --duration-fast: 120ms; --duration-normal: 200ms; --duration-slow: 320ms; 

--ease-standard: cubic-bezier(0.2, 0, 0, 1); --ease-emphasized: cubic-bezier(0.2, 0.8, 0.2, 1); 

} 

### Aturan token 

Tidak ada hardcoded hex pada komponen. Tidak ada hardcoded spacing pada komponen. Tidak ada hardcoded radius pada komponen. Tidak ada hardcoded shadow pada komponen. Tidak ada hardcoded motion duration pada komponen. Nama token harus menjelaskan fungsi, bukan nama warna literal. Token baru wajib memiliki alasan dan dokumentasi. 

## 15. Tipografi dan Aksesibilitas 

### Font 

#### Rekomendasi utama: 

Primary font: Inter Fallback: Noto Sans 

Display font terbatas: DM Sans 

### Skala typography 

|Peran|Ukuran|Weight|Penggunaan|
|---|---|---|---|
|Display|40–48px|600–700|Hero atau pesan utama|
|H1|30–36px|600–700|Judul halaman|
|H2|24–28px|600|Judul section|
|H3|18–20px|600|Judul card atau kelompok|
|Body|16px|400|Isi utama|
|Small body|14px|400|Metadata dan deskripsi singkat|
|Label|12–14px|500–600|Form,status,tag|



### Standar aksesibilitas 

Target desain dan implementasi adalah WCAG 2.2 level AA. 

WCAG 2.2 mencakup panduan aksesibilitas untuk pengguna dengan keterbatasan penglihatan, pendengaran, mobilitas, bahasa, pembelajaran, kognitif, serta neurologis. <u>[3]</u> 

Aturan awal: 

Teks normal minimum contrast 4.5:1. Teks besar minimum contrast 3:1. Komponen UI penting minimum contrast 3:1. Semua input harus memiliki label. Semua tombol icon-only harus memiliki accessible label. Semua fungsi inti harus dapat digunakan dengan keyboard. Focus-visible harus jelas. Status tidak boleh dibedakan hanya berdasarkan warna. Layout harus dapat direflow pada layar kecil. Tidak ada keyboard trap. 

WCAG 2.2 menyatakan teks normal perlu memiliki rasio kontras minimum 4.5:1 dan teks besar minimum 3:1; elemen UI penting juga memerlukan kontras nonteks yang memadai. <u>[3]</u> 

## 16. Motion dan Animasi 

### Prinsip motion 

Animasi digunakan hanya untuk: 

Orientation Feedback 

Causality Focus 

### Motion pattern 

|Komponen|Pattern|Durasi|Fungsi|
|---|---|---|---|
|Tombol|Background/border berubah,press kecil|120ms|Feedback|
|Navigasi|Underline atau surface subtle|120–160ms|Orientasi|
|Dropdown|Fade+translate4–8px|160–200ms|Menjelaskan kemunculan|
|Dialog|Fade backdrop+scale kecil|220–280ms|Fokus|
|Toast|Slide pendek+fade|180–240ms|Feedback|
|Accordion|Height transition sederhana|180–240ms|Menjelaskan relasi|
|Galeri|Crossfade ringan|180–240ms|Transisi konten|
|Skeleton loading|Static atau shimmer lembut|Tidak dominan|Indikasi proses|
|Status berubah|Highlight sementara|180–240ms|Kausalitas|



### Aturan motion 

Tidak ada parallax besar. Tidak ada animasi angka berputar tanpa alasan. Tidak ada card masuk satu per satu secara berlebihan. Tidak ada hover yang menggeser layout. Tidak ada animate-on-scroll berlebihan. Tidak ada carousel otomatis untuk informasi penting. Tidak ada video autoplay dengan audio. Tidak ada animasi lebih dari 500 ms untuk interaksi biasa. 

### Reduced motion 

@media (prefers-reduced-motion: reduce) { *, 

*::before, 

*::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; transition-duration: 1ms !important; 

} } 

## 17. PWA 

### Tujuan 

Rumah Pramuka Indramayu harus dapat dipasang sebagai aplikasi web di perangkat desktop dan smartphone tanpa perlu membuat aplikasi native pada fase awal. 

### Fitur PWA fase 1 

Web manifest App name Short name Favicon Application icon Theme color Background color Install prompt yang tidak memaksa Offline fallback page Cache asset statis Cache halaman publik tertentu Update notification 

### Fitur PWA lanjutan 

Offline access terbatas Draft form lokal Queue perubahan saat offline Sinkronisasi saat koneksi kembali Push notification Mode lapangan untuk staff Presensi kegiatan 

## 18. Peta dan Geospasial 

### Tujuan peta 

Peta digunakan untuk membantu staff memahami sebaran organisasi dan data agregat, bukan untuk melacak anggota secara individual. 

### Tech stack peta 

Map library: Leaflet Map data: OpenStreetMap Database spatial: PostgreSQL + PostGIS Geospatial query: PostGIS 

PostGIS memperluas PostgreSQL agar dapat menyimpan, mengindeks, dan menjalankan query terhadap objek geospasial. Teknologi ini sesuai untuk data lokasi Gudep, sekolah, kegiatan, Kwarran, dan wilayah organisasi. <u>[4] [5]</u> 

### Peta publik 

Boleh menampilkan: 

Lokasi kantor Kwarcab Lokasi kegiatan publik Wilayah layanan Lokasi sekretariat Gudep yang sudah diizinkan tampil 

#### Tidak boleh menampilkan: 

Nama anggota Foto anggota Nomor telepon Lokasi rumah Posisi real-time Data wali Data anak 

### Peta internal 

#### Dapat menampilkan: 

Kwarran Gudep Pangkalan Sekolah Status pembaruan data Jumlah anggota secara agregat Jumlah pembina Jumlah kegiatan Status Gudep aktif 

#### Contoh tampilan marker: 

Gudep SMKN 1 Cikedung Penggalang: 42 Penegak: 78 Pandega: 12 Data terakhir diverifikasi: 20 Agustus 2026 

Status: Perlu pembaruan 

### Catatan penggunaan OpenStreetMap 

OpenStreetMap cocok untuk tahap pengembangan dan traffic rendah, tetapi tile server publik memiliki kebijakan penggunaan. Jangan bergantung pada tile publik untuk trafik besar tanpa mematuhi kebijakan atau berpindah ke provider tile yang sesuai. <u>[6] [7]</u> 

## 19. Dashboard Masa Depan 

### Dashboard anggota 

Berita relevan Agenda terdekat Status pendaftaran kegiatan Profil anggota Informasi Gudep Pembina Riwayat kegiatan Status SKU/SKK bertahap Notifikasi Pengaturan privasi Pusat bantuan 

### Fokus utama 

Ketika anggota membuka dashboard, ia harus langsung tahu informasi kegiatan atau pengumuman yang paling relevan saat ini. 

### Dashboard pembina 

Daftar anggota binaan Filter golongan Kehadiran Agenda latihan Status data anggota Pengumuman Perkembangan SKU/SKK Catatan pembinaan terbatas Template kegiatan Mode lapangan 

Dashboard staff Gudep 

Daftar anggota Tambah anggota Import Excel/CSV Export Excel/CSV sesuai permission Deteksi data ganda Verifikasi data Status data belum lengkap Data pembina/pelatih Kegiatan Gudep Pengajuan perpindahan Riwayat perubahan Arsip anggota 

### Fitur unggulan 

#### Smart Member Registry 

Pencarian berdasarkan nama, KTA, Gudep, golongan, dan status. Filter tanpa rumus spreadsheet. Deteksi data duplikat. Preview import Excel sebelum disimpan. Mapping kolom Excel. Tanda data belum lengkap. Mode review perubahan massal. Riwayat perubahan per anggota. Status verifikasi. Export terbatas. 

### Dashboard staff Kwarran 

Daftar Gudep dalam wilayah Status pembaruan data Data menunggu verifikasi Kegiatan wilayah Peta Gudep Laporan wilayah Status pembina Pengajuan perpindahan lintas Gudep 

### Dashboard staff Kwarcab 

Ringkasan Kwarran Peta organisasi Pencarian lintas wilayah Manajemen struktur organisasi Manajemen penugasan Laporan agregat Review data 

Audit log Manajemen notifikasi Manajemen konten Data quality inbox 

## 20. Import dan Export Spreadsheet 

### Tujuan 

Spreadsheet tetap dapat digunakan sebagai format pertukaran data, tetapi bukan menjadi pusat pengelolaan data utama. 

### Import 

#### Format awal: 

CSV XLSX 

#### Proses: 

Upload file → pilih jenis data → mapping kolom → validasi format 

- → deteksi data duplikat 

- → preview perubahan 

- → konfirmasi import 

- → data masuk status draft atau pending verification 

→ audit log dibuat 

### Export 

#### Format awal: 

XLSX CSV 

#### Aturan: 

Export hanya berdasarkan permission. Export data sensitif memerlukan role khusus. Export diberi watermark atau metadata bila perlu. Export dicatat dalam audit log. Export besar diproses melalui background job. Link download bersifat sementara. File export otomatis kedaluwarsa. 

### Backup manual Super Admin 

Super Admin dapat membuat export backup terstruktur untuk disimpan di perangkat atau hard drive organisasi. 

Namun, backup lokal tidak boleh menjadi satu-satunya backup. 

### Aturan peringatan backup 

Sistem mencatat backup terakhir. Jika backup manual belum dilakukan dalam periode yang ditentukan, Super Admin melihat peringatan pada dashboard. 

Contoh: “ Backup manual terakhir dilakukan 35 hari lalu. Buat dan simpan salinan backup terenkripsi sebelum melanjutkan.” 

Peringatan harus dapat ditunda dengan alasan, tetapi tidak boleh hilang tanpa catatan. 

## 21. Keamanan Sistem 

### Prinsip keamanan 

Security by design Privacy by default Least privilege Defense in depth Auditability Data minimization Secure backup Controlled access 

### Authentication 

Password di-hash menggunakan Argon2id atau bcrypt. Password tidak pernah disimpan dalam bentuk asli. Session menggunakan secure httpOnly cookie. HTTPS wajib di production. Rate limit login. Reset password menggunakan token sekali pakai. Session timeout untuk staff/admin. Multi-factor authentication untuk admin tinggi. Login dan reset password masuk audit log. 

### JWT 

JWT boleh digunakan untuk kebutuhan tertentu, tetapi jangan menyimpan token sensitif pada <mark>localStorage</mark> sebagai default. 

#### Rekomendasi: 

Session utama: secure httpOnly cookie JWT: bila diperlukan oleh Auth.js atau integrasi service Refresh/token rotation: mengikuti kebutuhan auth provider 

### Authorization 

Setiap request internal harus memeriksa: 

Apakah user login? Apakah user memiliki role sesuai? Apakah user memiliki permission? Apakah scope organisasi sesuai? Apakah data ini sensitif? Apakah aksi wajib masuk audit log? 

Permission tidak boleh hanya diperiksa di frontend. 

### Rate limit 

|Aksi|Aturan awal|
|---|---|
|Login|5–10percobaan per periode per akun/IP|
|Reset password|3–5permintaan per jam|
|Registrasi|Dibatasi dan wajib approval|
|Upload|Batas ukuran,tipe file,dan frekuensi|
|Export|Berdasarkan role dan batas jumlah|
|Pencarian|Rate limit untuk mencegah scraping|
|API internal|Rate limit sesuai endpoint|
|Notifikasi|Pembatasan per pengirim dan audience|



### File upload 

### File dokumen 

Format: PDF, DOCX, XLSX Ukuran maksimum: 10 MB 

File gambar 

Format: JPG, PNG, WebP Ukuran maksimum: 5 MB 

### Aturan file 

Validasi MIME type di server. Validasi ekstensi. Nama file diubah menjadi UUID. Simpan file publik dan privat pada storage berbeda. Gunakan signed URL untuk file privat. Catat pemilik upload. Catat konteks file. Blok file executable. Sanitasi SVG atau jangan izinkan SVG dari user. Hapus EXIF lokasi dari foto publik. Scan malware jika infrastruktur mendukung. 

### Encryption 

|Data|Perlindungan|
|---|---|
|Password|Hashing satu arah|
|Trafic|TLS/HTTPS|
|Session|Secure httpOnly cookie|
|Backup|Encryption at rest|
|File privat|Private bucket+signed URL|
|Token reset|One-time token+expiry|
|Secrets|Environment variable/secrets manager|
|Data sangat sensitif|Field-level encryption bila diperlukan|



### Audit log 

#### Aksi berikut wajib dicatat: 

Login sukses Login gagal Reset password Perubahan role Perubahan permission Perubahan penugasan Perubahan data anggota Akses data sensitif Export data Import data 

Upload file Download file privat Perubahan status anggota Persetujuan wali Publikasi berita Penghapusan konten Pengaturan backup Penghapusan data 

### Backup 

Backup database otomatis: harian Retensi backup: minimum 30 hari Backup file: object storage versioning atau replication Uji restore: minimum setiap 3 bulan Backup manual Super Admin: dapat dibuat berkala Peringatan backup: muncul bila backup manual belum dilakukan sesuai kebijakan 

## 22. Tech Stack 

### Stack utama 

|Area|Teknologi|Keputusan|
|---|---|---|
|Framework|Next.js+TypeScript|Digunakan|
|Routing|Next.js App Router|Digunakan|
|Styling|Tailwind CSS+CSS Variables|Digunakan|
|Design system|CSS design tokens|Wajib|
|UI primitive|shadcn/ui+Radix UI|Digunakan secara terbatas|
|Form|React Hook Form+Zod|Digunakan|
|Validation|Zod|Digunakan di client dan server|
|Database|PostgreSQL|Digunakan|
|Geospatial|PostGIS|Digunakan|
|ORM|Prisma|Digunakan pada fase awal|
|Authentication|Auth.js+custom approval logic|Digunakan|
|Authorization|RBAC+scoped permission|Wajib|
|Data table|TanStack Table|Direkomendasikan|
|Maps|Leaflet+OpenStreetMap|Digunakan|
|Object storage|Cloudflare R2/S3-compatible storage|Direkomendasikan|
|Realtime|Supabase Realtime/Pusher/Ably/WebSocket|Fase lanjutan|



|Area|Teknologi|Keputusan|
|---|---|---|
|Queue|Redis+BullMQ|Saat import/export/notifikasi membesar|
|Push notification|Firebase Cloud Messaging|Fase lanjutan|
|Email|Resend/SMTP organisasi|Digunakan|
|Error monitoring|Sentry|Direkomendasikan|
|Unit testing|Vitest|Digunakan|
|Component testing|React Testing Library|Digunakan|
|End-to-end testing|Playwright|Digunakan|
|CI/CD|GitHub Actions|Digunakan|
|PWA|Service worker/<br>next-pwaterkontrol|Digunakan bertahap|



Next.js merupakan framework React untuk aplikasi web full-stack, sehingga cocok sebagai fondasi tunggal untuk website publik dan dashboard internal. <u>[8] [9]</u> 

### Prinsip shadcn/ui dan Radix UI 

Radix UI: Behavior dan accessibility primitive. 

shadcn/ui: Source code komponen awal yang dapat dimiliki dan dimodifikasi. 

Tailwind CSS: Implementasi layout dan styling. 

CSS variables/tokens: Sumber kebenaran semua keputusan desain. 

#### Aturan: 

Tidak menginstal semua komponen shadcn/ui. Tidak memakai theme default mentah. Tidak memakai warna default. Tidak memakai dashboard template. Tidak membuat card di setiap section. Tidak menambah komponen tanpa kebutuhan produk nyata. 

### Prisma dan PostGIS 

- Prisma digunakan untuk: - CRUD umum 

- Relasi database 

- Migration standar 

- Type safety 

PostGIS digunakan untuk: 

- Data lokasi 

- Titik lokasi Gudep 

- Lokasi kegiatan 

- Area Kwarran 

- Query geospasial 

Raw SQL terdokumentasi digunakan bila query PostGIS kompleks. 

## 23. Arsitektur Aplikasi 

### Modular monolith 

Mulai dari modular monolith, bukan microservices. 

Browser / PWA | v Next.js Application `├──` Public Website `├──` Authentication `├──` Content Management `├──` Member Management `├──` Organization Management `├──` Permission Management `├──` Event Management `├──` Gallery Management `├──` Map Module `├──` Notification Module `├──` Audit Module `└──` Reporting Module | v PostgreSQL + PostGIS | `├──` Object Storage `├──` Email Provider `├──` Push Notification Provider `├──` Map Provider `├──` Error Monitoring `└──` Backup Storage 

### Struktur repository 

project-root/ `├──` docs/ `│ ├──` product/ `│ ├──` design/ `│ ├──` organization/ `│ ├──` security/ `│ ├──` architecture/ 

`│ ├──` operations/ `│ └──` testing/ `├──` public/ `│ ├──` brand/ `│ ├──` icons/ `│ └──` images/ `├──` src/ `│ ├──` app/ `│ │ ├──` (public)/ `│ │ ├──` (auth)/ `│ │ ├──` (member)/ `│ │ ├──` (staff)/ `│ │ └──` (admin)/ `│ ├──` components/ `│ │ ├──` ui/ `│ │ ├──` public/ `│ │ ├──` dashboard/ `│ │ └──` shared/ `│ ├──` features/ `│ │ ├──` auth/ `│ │ ├──` public-site/ `│ │ ├──` news/ `│ │ ├──` gallery/ `│ │ ├──` events/ `│ │ ├──` members/ `│ │ ├──` organizations/ `│ │ ├──` assignments/ `│ │ ├──` permissions/ `│ │ ├──` consent/ `│ │ ├──` map/ `│ │ ├──` notifications/ `│ │ ├──` reports/ `│ │ └──` audit/ `│ ├──` lib/ `│ │ ├──` auth/ `│ │ ├──` permissions/ `│ │ ├──` validation/ `│ │ ├──` logger/ `│ │ └──` security/ `│ ├──` services/ `│ ├──` styles/ `│ │ ├──` tokens.css `│ │ ├──` globals.css `│ │ └──` utilities.css `│ └──` types/ `├──` prisma/ `│ ├──` schema.prisma `│ └──` migrations/ `├──` skills/ `│ └──` frontend-craft/ `│ └──` SKILL.md `└──` README.md 

## 24. Content Management 

### Role konten 

|Role|Hak konten|
|---|---|
|Contributor Gudep|Membuat dra�berita/galeri dari Gudep|
|Contributor Kwarran|Membuat dra�berita/galeri dari Kwarran|
|Editor Kwarcab|Review dan meminta revisi|
|Publisher Kwarcab|Menyetujui dan menerbitkan|
|Admin Website|Mengelola seluruh konten dan konfigurasi publik|
|Super Admin|Akses sistem tingkat tertinggi|



### Aturan publikasi 

Gudep dan Kwarran dapat membuat konten. Konten tidak langsung tampil publik. 

Admin atau staff Kwarcab melakukan review. 

Konten yang belum disetujui hanya dapat dilihat pembuat dan reviewer. Konten publik harus memiliki bahasa utama Indonesia. Terjemahan Inggris dan Sunda diperiksa sebelum diterbitkan. 

## 25. Notifikasi 

### Tingkat prioritas 

|Prioritas|Contoh|Push popup HP|In-app|
|---|---|---|---|
|Critical|Keamanan akun,perubahan akses,kegiatan dibatalkan|Ya|Ya|
|High|Persetujuan data,verifikasi,tugas stafpenting|Ya bila diizinkan|Ya|
|Normal|Pengumuman resmi,agenda,update Gudep|Tidak otomatis|Ya|
|Low|Aktivitas umum,informasi non-mendesak|Tidak|Ya|



### Penerima prioritas tinggi 

Super Admin Admin Website Admin Kwarcab Staff Kwarcab Staff Kwarran Staff Gudep Pembina Pelatih 

Pimpinan sesuai permission Orang tua/wali sesuai konteks anak 

### Preferensi notifikasi 

#### Pengguna dapat mengatur: 

In-app notification Email notification Push notification Jenis kegiatan Pengumuman Persetujuan Keamanan akun Pembaruan data 

Notifikasi keamanan akun tidak boleh sepenuhnya dimatikan. 

## 26. Testing 

### Strategi testing 

|Jenis test|Contoh|
|---|---|
|Unit test|Permission helper,validasi KTA,status anggota|
|Integration test|StafGudep hanya melihat anggota Gudep sendiri|
|End-to-end test|Login→cari anggota→ubah data→audit log muncul|
|Accessibility test|Keyboard,focus,label input,contrast|
|Responsive test|360px, 768px, 1024px, 1440px|
|Visual regression|Button,form,dialog,halaman berita,galeri|
|Security test|Akses URL langsung tanpa permission|
|Performance test|Upload,import Excel,filter anggota,peta|
|Backup restore test|Restore database dan file|



### Skenario keamanan wajib 

Staff Gudep A mencoba membuka data Gudep B dari URL langsung. → Sistem harus menolak. 

- → Data tidak boleh dikirim ke browser. 

- → Percobaan dapat dicatat bila diperlukan. 

User mencoba export seluruh data anggota tanpa permission. → Sistem harus menolak. 

→ Export tidak dibuat. 

→ Aktivitas dicatat. 

User mengubah data anggota. 

→ Sistem menyimpan perubahan. 

- → Sistem menyimpan siapa yang mengubah. 

- → Sistem menyimpan waktu perubahan. 

- → Sistem menyimpan data lama dan baru bila field sensitif. 

## - 27. Non Functional Requirements 

# Non-Functional Requirements 

## Performance 

- Landing page harus cepat pada koneksi seluler. 

- Gambar wajib dioptimasi. 

- Halaman publik menggunakan caching aman. 

- Daftar data internal memakai pagination. 

- Filter besar diproses di server. 

- Export besar menggunakan background job. 

- Peta tidak memuat seluruh data anggota sekaligus. 

## Reliability 

- Sistem memberi pesan error yang jelas. 

- Data tidak hilang tanpa pemberitahuan. 

- Backup dilakukan otomatis. 

- Restore backup diuji berkala. 

- Draft berita tidak boleh otomatis terpublikasi. 

## Security 

- HTTPS wajib. 

- Password di-hash. 

- Permission diperiksa di server. 

- Audit log aktif. 

- File privat menggunakan akses terkontrol. 

- Admin tinggi memakai MFA. 

- Rate limit berlaku untuk endpoint penting. 

## Privacy 

- Data publik dan internal dipisahkan. 

- Foto Penggalang tidak tampil publik. 

- Data anak diproses dengan perlindungan khusus. 

- Persetujuan wali dicatat. 

- Data sensitif hanya tersedia bagi role berwenang. 

## Accessibility 

- Target WCAG 2.2 AA. 

- Keyboard navigation tersedia. 

- Focus state terlihat. 

- Contrast memenuhi standar. 

- Motion mendukung reduced motion. 

- Teks dapat diperbesar tanpa fungsi hilang. 

## Maintainability 

- Semua visual memakai token. 

- Migration database terdokumentasi. 

- Role dan permission terdokumentasi. 

- Tidak ada hardcoded permission logic tersebar. 

- Fitur memiliki acceptance criteria. 

## 28. Skill untuk Claude Code 

Buat file: 

skills/frontend-craft/SKILL.md 

--- 

name: frontend-craft description: Menjaga kualitas UI Rumah Pramuka Indramayu agar konsisten dengan design 

--- 

# Frontend Craft Rules 

## Sebelum mengubah UI 

1. Baca docs/product/product-vision.md. 

2. Baca docs/design/design-brief.md. 

3. Baca docs/design/visual-principles.md. 

4. Baca docs/design/motion-guidelines.md. 

5. Baca docs/security/data-classification.md. 

6. Baca docs/security/authorization-model.md. 

7. Baca src/styles/tokens.css. 

8. Periksa komponen yang sudah tersedia sebelum membuat yang baru. 

## Larangan 

- Tidak ada gradient dekoratif tanpa fungsi. 

- Tidak ada emoji sebagai dekorasi. 

- Tidak ada glassmorphism berlebihan. 

- Tidak ada card untuk semua blok. 

- Tidak ada hardcoded warna. 

- Tidak ada hardcoded spacing. 

- Tidak ada hardcoded radius. 

- Tidak ada hardcoded shadow. 

- Tidak ada hardcoded duration. 

- Tidak ada lebih dari satu CTA primary dalam satu konteks. 

- Tidak ada icon-only button tanpa accessible label. 

- Tidak ada status yang dibedakan hanya dengan warna. 

- Tidak ada data anggota anak pada halaman publik. 

- Tidak ada permission yang hanya diperiksa di frontend. 

## Verifikasi sebelum selesai 

- Cek loading state. 

- Cek empty state. 

- Cek error state. 

- Cek success state. 

- Cek focus state. 

- Cek keyboard navigation. 

- Cek mobile pada 360px. 

- Cek tablet pada 768px. 

- Cek desktop pada 1440px. 

- Cek prefers-reduced-motion. 

- Cek contrast WCAG AA. 

- Cek apakah token baru benar-benar diperlukan. 

- Laporkan perubahan yang menyentuh data sensitif. 

## 29. Prompt Claude Code 

### Prompt audit proyek 

Baca dokumen berikut sebelum melakukan perubahan: 

- docs/product/product-vision.md 

- docs/product/mvp-scope.md 

- docs/design/design-brief.md 

- docs/design/visual-principles.md 

- docs/design/accessibility-checklist.md 

- docs/security/data-classification.md 

- docs/security/authorization-model.md 

- src/styles/tokens.css 

Jangan membuat halaman atau komponen baru terlebih dahulu. 

Audit repository dan temukan: 

1. Hardcoded color. 

2. Hardcoded spacing. 

3. Hardcoded font size. 

4. Hardcoded radius. 

5. Hardcoded shadow. 

6. Hardcoded motion duration. 

7. Komponen duplikat. 

8. State loading, empty, error, success, disabled, dan focus yang hilang. 

9. Masalah responsive. 

10. Potensi data exposure. 

11. Permission check yang hanya ada di frontend. 

12. Komponen yang tidak sesuai design system. 

Berikan laporan critical, high, medium, dan low. Berikan rencana perbaikan bertahap. Jangan menambah library baru tanpa menjelaskan alasannya. 

Prompt implementasi landing page 

Bangun landing page Rumah Pramuka Indramayu berdasarkan dokumen desain proyek. 

Karakter: 

- profesional, 

- terpercaya, 

- tenang, 

- modern, 

- human-centered, 

- memiliki karakter Pramuka yang subtle, 

- mudah digunakan anak hingga orang tua. 

Jangan gunakan: 

- gradient ungu-biru, 

- glassmorphism, 

- emoji dekoratif, 

- ilustrasi robot, 

- dashboard KPI palsu, 

- card untuk setiap section, 

- rounded-2xl atau rounded-3xl sebagai default, 

- lebih dari satu CTA primary dalam satu viewport. 

Gunakan: 

- tokens.css, 

- semantic HTML, 

- responsive layout, 

- whitespace sebagai alat hierarchy, 

- struktur heading yang benar, 

- focus-visible, 

- prefers-reduced-motion, 

- gambar dan galeri dengan alt text. 

Halaman harus memiliki: 

- Header, 

- Hero, 

- Tentang singkat, 

- Agenda, 

- Berita, 

- Galeri, 

- Prestasi, 

- Lokasi, 

- Footer. 

Pastikan Bahasa Indonesia menjadi bahasa utama dan struktur siap untuk i18n Indonesia 

## 30. Checklist Sebelum Development 

Produk 

- [ ] Nama produk menggunakan Rumah Pramuka Indramayu. 

- [ ] Scope fase 1 disetujui. 

- [ ] MVP tidak mencakup dashboard penuh. 

- [ ] Chat ditunda. 

- [ ] Peta internal ditunda sampai fase sistem data. 

- [ ] Stakeholder Kwarcab sudah ditentukan. 

- [ ] Product owner sudah ditentukan. 

### Konten 

- [ ] Logo resmi tersedia. 

- [ ] Favicon tersedia. 

- [ ] Foto kegiatan yang dapat digunakan sudah dikurasi. 

- [ ] Informasi struktur organisasi tersedia. 

- [ ] Kontak resmi tersedia. 

- [ ] Agenda awal tersedia. 

- [ ] Berita awal tersedia. 

- [ ] Prestasi awal tersedia. 

- [ ] Terjemahan Indonesia, Inggris, dan Sunda memiliki reviewer. 

### Desain 

- [ ] Design brief dibuat. 

- [ ] Visual principles dibuat. 

- [ ] Tokens CSS dibuat. 

- [ ] Wireframe grayscale dibuat. 

- [ ] Komponen dasar dibuat. 

- [ ] Aturan galeri dibuat. 

- [ ] Aturan foto anak dibuat. 

- [ ] Aturan motion dibuat. 

- [ ] Accessibility checklist dibuat. 

### Keamanan 

- [ ] Data classification dibuat. 

- [ ] Permission matrix dibuat. 

- [ ] Consent policy dibuat. 

- [ ] Backup policy dibuat. 

- [ ] File upload policy dibuat. 

- [ ] Audit log policy dibuat. 

- [ ] Incident response dibuat. 

- [ ] Super Admin ditentukan. 

- [ ] Kebijakan retensi 5 tahun dikonfigurasi. 

### Teknis 

- [ ] Repository dibuat. 

- [ ] Branch strategy dibuat. 

- [ ] Environment development dibuat. 

- [ ] Environment staging dibuat. 

- [ ] Environment production dibuat. 

- [ ] Database PostgreSQL disiapkan. 

- [ ] PostGIS disiapkan. 

- [ ] Object storage disiapkan. 

- [ ] CI/CD disiapkan. 

- [ ] Error monitoring disiapkan. 

- [ ] Backup otomatis disiapkan. 

## 31. Kesimpulan 

Rumah Pramuka Indramayu bukan sekadar landing page organisasi. Fase pertama memang berfokus pada website publik yang modern dan profesional, tetapi seluruh keputusan desain dan teknisnya harus menjadi fondasi bagi sistem keanggotaan Kwarcab di masa depan. 

#### Sistem ini harus memiliki karakter berikut: 

Bukan template SaaS. Bukan dashboard penuh angka dekoratif. Bukan website organisasi yang statis dan sulit diperbarui. Bukan spreadsheet yang dipindahkan ke browser. 

Sistem ini harus menjadi: 

Rumah informasi resmi Kwarcab. Pusat dokumentasi kegiatan. Fondasi data keanggotaan yang aman. Alat kerja staff yang terstruktur. Sistem yang menghormati privasi anak. Platform yang dapat berkembang tanpa mengorbankan kualitas desain. 

Yang paling penting untuk fase berikutnya adalah menyusun tiga dokumen operasional sebelum coding besar dimulai: 

1. MVP Scope dan sitemap fase 1 

2. Design brief dan visual principles 

3. Content inventory, yaitu da�ar nyata logo, berita, foto, agenda, struktur organisasi, kontak, dan dokumen Kwarcab yang akan dimasukkan ke website. 

⁂ 

1. <u>https://pramuka.or.id/files/document/AD-ART-GP-2019.pdf</u> 

2. <u>https://jdih.komdigi.go.id/produk_hukum/view/id/832/t/undangundang+nomor+27+tahun+2022</u> 

3. <u>https://www.w3.org/TR/WCAG22/</u> 

4. <u>https://www.postgresql.org/�p/postgis/</u> 

5. <u>https://postgis.net/docs/</u> 

6. <u>https://wiki.openstreetmap.org/wiki/DE:Tile_usage_policy</u> 

7. <u>http://openstreetmap.github.io/owg-website/policies/tiles/</u> 

8. <u>https://nextjs.org/docs</u> 

9. <u>https://nextjs.org/docs/app/getting-started</u> 

