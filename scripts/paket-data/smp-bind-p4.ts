// TKA SMP Bahasa Indonesia — Paket 4 (ditulis Claude). 30 soal: 18 PG · 6 MCMA · 6 Kategori;
// 11/11 subtopik; mudah 6 · sedang 15 · sulit 9. 6 stimulus × 5 soal (teks informasi tunggal & jamak,
// infografis, poster, cerpen, puisi). 3 gambar SVG baru: infografis hemat air, diagram batang bank
// sampah, poster festival literasi. Pembahasan membahas setiap pilihan.
const FONT = `font-family="Arial, Helvetica, sans-serif"`;
const svg = (w: number, h: number, body: string, bg = "#fff") =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" ${FONT}><rect width="${w}" height="${h}" fill="${bg}"/>${body}</svg>`;
const text = (x: number, y: number, t: string, o: { size?: number; anchor?: string; weight?: string; fill?: string; italic?: boolean } = {}) =>
  `<text x="${x}" y="${y}" font-size="${o.size ?? 18}" text-anchor="${o.anchor ?? "middle"}" font-weight="${o.weight ?? "normal"}" fill="${o.fill ?? "#111"}"${o.italic ? ` font-style="italic"` : ""}>${t}</text>`;
const rect = (x: number, y: number, w: number, h: number, fill: string, o: { rx?: number; stroke?: string } = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx ?? 0}" fill="${fill}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="2"` : ""}/>`;
const line = (x1: number, y1: number, x2: number, y2: number, stroke = "#111", w = 2) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${w}"/>`;

// ---------- Gambar ----------

// Infografis hemat air: 150 L/orang/hari = mandi 60 + cuci pakaian 30 + kloset 30 + cuci piring 15 + lain-lain 15.
function imgAir() {
  let s = rect(0, 0, 760, 120, "#0e7490");
  s += text(380, 62, "AYO HEMAT AIR!", { size: 42, weight: "bold", fill: "#fff" });
  s += text(380, 98, "Setiap tetes berharga · Peringatan Hari Air Sedunia, 22 Maret", { size: 18, fill: "#e0f2fe" });
  s += rect(40, 140, 680, 70, "#e0f2fe", { rx: 12 });
  s += text(380, 183, "Rata-rata satu orang di perkotaan memakai ±150 liter air setiap hari.", { size: 20, weight: "bold", fill: "#0c4a6e" });
  s += text(40, 255, "Ke mana air kita pergi? (per orang per hari)", { size: 22, weight: "bold", anchor: "start", fill: "#0c4a6e" });
  const uses: [string, number][] = [
    ["Mandi", 60],
    ["Mencuci pakaian", 30],
    ["Menyiram kloset", 30],
    ["Mencuci piring", 15],
    ["Minum, memasak, dll.", 15],
  ];
  uses.forEach(([label, l], i) => {
    const y = 280 + i * 52;
    s += text(40, y + 23, label, { size: 18, anchor: "start" });
    s += rect(260, y, l * 6, 32, i === 0 ? "#0369a1" : "#38bdf8", { rx: 4 });
    s += text(260 + l * 6 + 12, y + 23, `${l} liter`, { size: 18, weight: "bold", anchor: "start" });
  });
  s += text(40, 585, "5 Langkah Hemat Air", { size: 22, weight: "bold", anchor: "start", fill: "#0c4a6e" });
  const steps: [string, string][] = [
    ["Matikan keran saat menyikat gigi.", "Hemat hingga 6 liter air setiap menit."],
    ["Mandi dengan pancuran paling lama 5 menit.", "Mandi lebih singkat, air yang terpakai lebih sedikit."],
    ["Segera perbaiki keran yang bocor.", "Keran yang menetes dapat membuang 20 liter air sehari."],
    ["Pakai air bekas mencuci sayur untuk menyiram tanaman.", "Air tidak langsung terbuang ke selokan."],
    ["Nyalakan mesin cuci hanya saat cucian sudah penuh.", "Mesin cuci lebih jarang dijalankan."],
  ];
  steps.forEach(([a, b], i) => {
    const y = 625 + i * 58;
    s += `<circle cx="62" cy="${y - 6}" r="17" fill="#0e7490"/>` + text(62, y + 1, String(i + 1), { size: 18, weight: "bold", fill: "#fff" });
    s += text(95, y - 2, a, { size: 19, weight: "bold", anchor: "start" });
    s += text(95, y + 20, b, { size: 16, anchor: "start", fill: "#475569" });
  });
  s += rect(40, 905, 680, 78, "#fef9c3", { rx: 12 });
  s += text(60, 936, "Tahukah kamu? Air bekas mencuci sayur, buah, atau beras termasuk air kelabu.", { size: 17, anchor: "start" });
  s += text(60, 962, "Air kelabu masih dapat dipakai lagi untuk menyiram tanaman atau mengepel lantai.", { size: 17, anchor: "start" });
  return svg(760, 1005, s);
}

// Diagram batang bank sampah Juli–Desember: 40, 55, 70, 65, 90, 50 kg (Oktober turun — bahan soal keakuratan).
function imgBankSampah() {
  const data: [string, number][] = [["Jul", 40], ["Agu", 55], ["Sep", 70], ["Okt", 65], ["Nov", 90], ["Des", 50]];
  const x0 = 90, y0 = 380, h = 300; // 100 kg = 300 px
  let s = text(370, 36, "Sampah Terkumpul di Bank Sampah Tunas Hijau", { size: 22, weight: "bold" });
  for (let v = 0; v <= 100; v += 20) {
    const y = y0 - (v / 100) * h;
    s += line(x0, y, 660, y, v === 0 ? "#111" : "#d1d5db", v === 0 ? 2 : 1) + text(x0 - 12, y + 6, String(v), { size: 16, anchor: "end" });
  }
  s += line(x0, y0, x0, y0 - h - 10);
  data.forEach(([m, v], i) => {
    const x = x0 + 30 + i * 92, bh = (v / 100) * h;
    s += rect(x, y0 - bh, 56, bh, v === 90 ? "#15803d" : "#4ade80");
    s += text(x + 28, y0 - bh - 8, String(v), { size: 16, weight: "bold" });
    s += text(x + 28, y0 + 26, m, { size: 17 });
  });
  s += text(375, y0 + 58, "Bulan", { size: 17 });
  s += `<text x="28" y="${y0 - h / 2}" font-size="17" text-anchor="middle" transform="rotate(-90 28 ${y0 - h / 2})">Berat sampah (kg)</text>`;
  return svg(700, 460, s);
}

// Poster Festival Literasi Pelajar: jadwal & ketentuan lomba resensi.
function imgPoster() {
  let s = rect(0, 0, 720, 1000, "#fff7ed");
  s += rect(0, 0, 720, 70, "#9a3412");
  s += text(360, 32, "PERPUSTAKAAN DAERAH KABUPATEN LEMBAH HIJAU", { size: 18, weight: "bold", fill: "#fff" });
  s += text(360, 56, "mempersembahkan", { size: 15, fill: "#fed7aa", italic: true });
  s += text(360, 130, "FESTIVAL LITERASI", { size: 44, weight: "bold", fill: "#9a3412" });
  s += text(360, 180, "PELAJAR 2026", { size: 40, weight: "bold", fill: "#c2410c" });
  s += text(360, 218, "“Membaca Membuka Jendela Dunia”", { size: 20, italic: true, fill: "#7c2d12" });
  s += rect(60, 240, 600, 96, "#ffedd5", { rx: 12, stroke: "#fdba74" });
  s += text(360, 272, "Sabtu–Minggu, 21–22 November 2026 · Pukul 08.00–16.00 WIB", { size: 18, weight: "bold" });
  s += text(360, 300, "Aula Perpustakaan Daerah", { size: 18 });
  s += text(360, 324, "Jalan Merdeka No. 10, Lembah Hijau", { size: 16, fill: "#57534e" });
  s += text(60, 380, "RANGKAIAN ACARA", { size: 21, weight: "bold", anchor: "start", fill: "#9a3412" });
  const acara: [string, string][] = [
    ["Sabtu–Minggu", "Bazar buku murah (diskon hingga 50%)"],
    ["Sabtu, 09.00", "Lomba resensi buku SMP: presentasi 10 finalis"],
    ["Minggu, 10.00", "Bincang penulis bersama Kak Laila Anggraini"],
    ["Minggu, 13.00", "Lokakarya membuat zine (kuota 30 peserta)"],
    ["Minggu, 15.00", "Pengumuman pemenang lomba resensi"],
  ];
  acara.forEach(([w, a], i) => {
    const y = 395 + i * 44;
    s += rect(60, y, 600, 38, i % 2 ? "#fff7ed" : "#ffedd5");
    s += text(74, y + 26, w, { size: 17, weight: "bold", anchor: "start", fill: "#7c2d12" });
    s += text(230, y + 26, a, { size: 17, anchor: "start" });
  });
  s += text(60, 655, "KETENTUAN LOMBA RESENSI", { size: 21, weight: "bold", anchor: "start", fill: "#9a3412" });
  const aturan = [
    "• Peserta siswa SMP/MTs kelas VII–IX di Kabupaten Lembah Hijau.",
    "• Buku yang diresensi terbit tahun 2020–2026.",
    "• Panjang resensi 500–800 kata.",
    "• Naskah dikirim melalui formulir daring",
    "   paling lambat 14 November 2026.",
  ];
  // Baris lanjutan (diawali spasi) diberi indentasi lewat x, karena SVG mengabaikan spasi di awal teks.
  aturan.forEach((a, i) => (s += text(a.startsWith(" ") ? 84 : 70, 692 + i * 30, a.trim(), { size: 17, anchor: "start" })));
  s += rect(60, 852, 600, 56, "#fde68a", { rx: 10 });
  s += text(360, 886, "Lokakarya: daftar dahulu di meja informasi perpustakaan. Tempat terbatas!", { size: 16, weight: "bold" });
  s += rect(0, 930, 720, 70, "#9a3412");
  s += text(360, 973, "GRATIS DAN TERBUKA UNTUK UMUM", { size: 24, weight: "bold", fill: "#fff" });
  return svg(720, 1000, s);
}

// ---------- Stimulus ----------

const stimuli = [
  {
    code: "SMP-BIND-P4-AIR",
    title: "Ayo Hemat Air!",
    content: "Perhatikan infografis berikut! Infografis ini dipasang di papan informasi sebuah SMP pada peringatan Hari Air Sedunia.",
    gambar: "infografis-air",
  },
  {
    code: "SMP-BIND-P4-BANKSAMPAH",
    title: "Bank Sampah Tunas Hijau",
    content: `Sejak bulan Juli tahun lalu, SMP Negeri 2 Lembah Hijau mengelola bank sampah. Bank sampah adalah tempat mengumpulkan sampah yang sudah dipilah. Sampah itu ditimbang dan dicatat seperti tabungan. Setiap siswa memiliki buku tabungan sampah.

Sampah yang diterima hanya sampah anorganik kering, yaitu botol plastik, kertas, dan kaleng. Sampah harus bersih dan sudah dipilah menurut jenisnya. Petugas menimbang sampah setiap Rabu pada jam istirahat kedua. Harga setiap jenis sampah berbeda. Kaleng dihargai paling mahal, sedangkan kertas paling murah.

Setiap akhir bulan, sampah dijual kepada pengepul. Pengepul membeli barang bekas dari banyak tempat, lalu menjualnya lagi ke pabrik daur ulang. Hasil penjualan sampah masuk ke tabungan siswa. Tabungan dapat diambil pada akhir semester. Banyak siswa memakai tabungannya untuk membeli buku dan alat tulis.

Jumlah sampah yang terkumpul terus naik sejak bulan Juli hingga mencapai puncaknya pada bulan November. Pada bulan itu, sekolah mengadakan lomba kelas terbersih. Namun, pada bulan Desember jumlahnya turun karena siswa menghadapi penilaian akhir semester dan libur sekolah dimulai pada pertengahan bulan.

Pembina bank sampah, Pak Hendra, berharap program ini tidak hanya menambah tabungan siswa. "Yang terpenting, siswa terbiasa memilah sampah sejak dari rumah," katanya.

Diagram berikut menunjukkan berat sampah yang terkumpul setiap bulan.`,
    gambar: "diagram-bank-sampah",
  },
  {
    code: "SMP-BIND-P4-FESTIVAL",
    title: "Festival Literasi Pelajar 2026",
    content: "Perhatikan poster berikut!",
    gambar: "poster-festival",
  },
  {
    code: "SMP-BIND-P4-SARAPAN",
    title: "Sarapan Sebelum Sekolah",
    content: `**Teks 1: Sarapan, Bekal Otak di Pagi Hari**

Setelah tidur semalaman, tubuh kita tidak mendapat asupan makanan selama 8–10 jam. Karena itu, pada pagi hari tubuh membutuhkan energi baru. Sarapan menyediakan energi tersebut. Otak memakai energi itu untuk berpikir dan berkonsentrasi. Siswa yang melewatkan sarapan lebih mudah mengantuk, lemas, dan sulit memusatkan perhatian di kelas.

Sarapan sebaiknya dilakukan sebelum pukul 09.00. Sarapan yang sehat memenuhi 15–30 persen kebutuhan gizi harian. Menu sarapan sebaiknya mengandung karbohidrat, protein, serta sayur atau buah. Contohnya, nasi dengan telur dan tumis sayur atau roti isi dengan pisang. Gorengan, mi instan, atau minuman manis saja belum cukup karena kandungan gizinya tidak seimbang.

**Teks 2: Sarapan Bersama di SMP Harapan Bangsa**

Setiap Senin dan Kamis pukul 06.45, suasana kelas di SMP Harapan Bangsa tampak berbeda. Siswa duduk melingkar dan membuka bekal dari rumah. Wali kelas ikut sarapan sambil mencatat menu bekal setiap siswa. Kegiatan ini disebut program Sarapan Bersama.

Program ini dimulai setelah OSIS melakukan survei. Hasilnya, 4 dari 10 siswa jarang sarapan. Alasan terbanyak adalah tidak sempat karena harus berangkat terlalu pagi. Alasan lainnya adalah tidak merasa lapar dan tidak tersedia makanan di rumah.

Setelah tiga bulan berjalan, para guru melaporkan bahwa siswa lebih jarang mengantuk pada jam pelajaran pertama. Meskipun begitu, masih ada kekurangan. Catatan wali kelas menunjukkan sebagian bekal hanya berisi mi instan atau gorengan. Sekolah berencana mengundang orang tua untuk sosialisasi menu bekal sehat.`,
  },
  {
    code: "SMP-BIND-P4-SEPATU",
    title: "Sepatu Biru",
    content: `Lintasan tanah di belakang sekolah masih basah oleh sisa hujan. Nara mengikat tali sepatunya kuat-kuat. Ujung sepatu kanannya menganga seperti mulut ikan yang kehabisan napas. Lusa, ia akan berlari di lomba tingkat kabupaten.

Sepatu itu dibelikan Bapak dua tahun lalu, sehari setelah Nara menang lomba lari antarkelas. Waktu itu, Bapak pulang dari pasar membawa kotak berwarna biru. "Kaki yang cepat butuh teman yang kuat," kata Bapak sambil menepuk kepala Nara. Sejak itu, sepatu biru itu selalu menemani Nara berlatih setiap sore.

Kini, Bapak tidak lagi berjualan di pasar. Lapaknya tergusur pembangunan jalan. Bapak menjual sayur dengan sepeda dari kampung ke kampung. Nara tahu uang mereka hanya cukup untuk makan dan membayar sekolah adiknya.

"Nar, sepatumu kenapa?" tanya Pak Damar, pelatihnya, sore itu.

Nara menyembunyikan kaki kanannya di balik kaki kiri. "Tidak apa-apa, Pak. Masih kuat."

Pak Damar diam sebentar. Matanya menatap ujung sepatu yang menganga itu.

Malamnya, Nara menjahit sepatunya dengan benang nilon milik Ibu. Jarinya tertusuk jarum dua kali. Ia meringis, tetapi terus menjahit. Jahitannya tidak rapi, tetapi ujung sepatu itu kembali tertutup.

Pagi hari lomba, langit cerah tanpa awan. Sebelum berangkat, Pak Damar menyerahkan sebuah kantong plastik. Isinya sepasang sepatu lari baru. "Dari teman-teman timmu. Mereka patungan," katanya.

Nara tertegun. Ia memandang sepatu baru itu, lalu sepatu birunya yang penuh jahitan. Tenggorokannya terasa tersumbat.

Di garis start, Nara memakai sepatu baru. Sepatu biru dari Bapak ia simpan di dalam tas, dekat dengan punggungnya. Ketika pistol tanda mulai berbunyi, ia melesat seperti anak panah yang lepas dari busurnya.`,
  },
  {
    code: "SMP-BIND-P4-DERMAGA",
    title: "Subuh di Dermaga",
    content: `**Subuh di Dermaga**

Subuh masih menggigil di ujung dermaga,
lampu perahu berkedip satu-satu.
Ayah mendorong sampan ke pelukan ombak,
jala tergulung di bahunya yang kukuh.

Laut bernyanyi dengan suara serak,
angin asin menampar pipi yang legam.
Di antara gelap dan biru yang luas,
Ayah menebar harap bersama jala yang tenggelam.

Matahari tinggi, sampan kembali ke pantai,
ikan perak menggelepar di dasar perahu.
Senyum Ayah lebih terang dari siang,
menghapus lelah yang menempel sejak subuh.`,
  },
];

// ---------- Soal ----------

type Row = {
  kode_stimulus?: string;
  kode_subdomain: string;
  bentuk_soal: string;
  pertanyaan: string;
  opsi_a: string;
  opsi_b: string;
  opsi_c: string;
  opsi_d?: string;
  opsi_e?: string;
  kunci: string;
  kategori?: string;
  pembahasan: string;
  tingkat_kesulitan: string;
};

const MCMA = "\n\nPilihlah **semua** jawaban yang benar!";

const rows: Row[] = [
  // ---- Stimulus 1: Infografis hemat air ----
  {
    // 1
    kode_stimulus: "SMP-BIND-P4-AIR",
    kode_subdomain: "SMP-BIND-D1-S3",
    bentuk_soal: "pg",
    pertanyaan: "Menurut infografis tersebut, kegiatan yang paling banyak memakai air setiap hari adalah ....",
    opsi_a: "mencuci pakaian",
    opsi_b: "menyiram kloset",
    opsi_c: "mandi",
    opsi_d: "mencuci piring",
    opsi_e: "minum dan memasak",
    kunci: "C",
    pembahasan: `Bagian "Ke mana air kita pergi?" menunjukkan mandi memakai **60 liter** per orang per hari, paling banyak dibandingkan kegiatan lain.

- **A** dan **B** — salah, masing-masing hanya 30 liter.
- **C** — benar, 60 liter (batang paling panjang).
- **D** — salah, mencuci piring 15 liter.
- **E** — salah, minum, memasak, dan lain-lain hanya 15 liter.`,
    tingkat_kesulitan: "mudah",
  },
  {
    // 2
    kode_stimulus: "SMP-BIND-P4-AIR",
    kode_subdomain: "SMP-BIND-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: "Istilah **air kelabu** dalam infografis tersebut bermakna ....",
    opsi_a: "air hujan yang ditampung dari atap rumah",
    opsi_b: "air bekas kegiatan rumah tangga yang tidak terlalu kotor dan masih dapat dipakai lagi",
    opsi_c: "air keran yang berwarna keruh karena pipanya bocor",
    opsi_d: "air limbah pabrik yang mengandung zat berbahaya",
    opsi_e: "air sumur yang belum dimasak",
    kunci: "B",
    pembahasan: `Makna istilah dapat disimpulkan dari konteksnya. Infografis menyebut contoh air kelabu, yaitu air bekas mencuci sayur, buah, atau beras, dan menjelaskan bahwa air itu **masih dapat dipakai lagi** untuk menyiram tanaman atau mengepel.

- **A** — salah, air hujan bukan air bekas pakai.
- **B** — benar, sesuai contoh dan keterangan dalam infografis.
- **C** — salah, infografis tidak mengaitkan air kelabu dengan pipa bocor.
- **D** — salah, limbah pabrik berbahaya tidak dapat dipakai untuk menyiram tanaman di rumah.
- **E** — salah, air sumur belum pernah dipakai, jadi bukan air bekas.`,
    tingkat_kesulitan: "sedang",
  },
  {
    // 3
    kode_stimulus: "SMP-BIND-P4-AIR",
    kode_subdomain: "SMP-BIND-D2-S2",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Tentukan **Benar** atau **Salah** setiap pernyataan tentang hubungan informasi dalam infografis berikut!",
    opsi_a: "Memperbaiki keran yang bocor penting dilakukan karena keran yang menetes dapat membuang 20 liter air sehari.",
    opsi_b: "Menyalakan mesin cuci hanya saat cucian penuh menghemat air karena mesin cuci menjadi lebih jarang dijalankan.",
    opsi_c: "Mematikan keran saat menyikat gigi menghemat air karena pemakaian air untuk menyiram kloset ikut berkurang.",
    opsi_d: "Langkah hemat air saat mencuci piring paling berpengaruh karena mencuci piring memakai air lebih banyak daripada menyiram kloset.",
    kunci: "B,B,S,S",
    pembahasan: `- **Benar** — langkah 3 menyebut keran yang menetes dapat membuang 20 liter air sehari. Itu alasan logis untuk segera memperbaikinya.
- **Benar** — langkah 5 menjelaskan bahwa mesin cuci menjadi lebih jarang dijalankan, sehingga air yang terpakai berkurang.
- **Salah** — mematikan keran saat menyikat gigi menghemat air **keran** (hingga 6 liter per menit). Kegiatan itu tidak berhubungan dengan air untuk menyiram kloset.
- **Salah** — menurut infografis, mencuci piring memakai 15 liter, lebih **sedikit** daripada menyiram kloset (30 liter). Alasan dalam pernyataan itu tidak sesuai data.`,
    tingkat_kesulitan: "sulit",
  },
  {
    // 4
    kode_stimulus: "SMP-BIND-P4-AIR",
    kode_subdomain: "SMP-BIND-D3-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: "Kebiasaan siswa manakah yang sesuai dengan pesan infografis tersebut?" + MCMA,
    opsi_a: "Dito menampung air bekas mencuci sayur untuk menyiram pot bunga di teras.",
    opsi_b: "Sinta membiarkan keran tetap mengalir saat menyikat gigi supaya lebih cepat.",
    opsi_c: "Raka melaporkan keran toilet sekolah yang terus menetes kepada penjaga sekolah.",
    opsi_d: "Laras menyalakan mesin cuci untuk mencuci satu kaus setiap kali selesai dipakai.",
    opsi_e: "Bima mandi dengan pancuran selama 4 menit.",
    kunci: "A,C,E",
    pembahasan: `- **A** — benar, sesuai langkah 4 (memakai air bekas mencuci sayur untuk menyiram tanaman).
- **B** — salah, bertentangan dengan langkah 1 (matikan keran saat menyikat gigi).
- **C** — benar, sesuai langkah 3. Keran yang menetes harus segera diperbaiki, dan melaporkannya adalah langkah awal.
- **D** — salah, bertentangan dengan langkah 5. Mesin cuci dinyalakan hanya saat cucian sudah penuh.
- **E** — benar, 4 menit tidak lebih dari batas 5 menit pada langkah 2.`,
    tingkat_kesulitan: "sedang",
  },
  {
    // 5
    kode_stimulus: "SMP-BIND-P4-AIR",
    kode_subdomain: "SMP-BIND-D1-S4",
    bentuk_soal: "pg",
    pertanyaan: `Rina menyusun kerangka isi infografis tersebut.

I. Fakta pemakaian air setiap orang per hari
II. ....
III. Langkah-langkah menghemat air
IV. Pengetahuan tentang air kelabu

Isi yang tepat untuk bagian II adalah ....`,
    opsi_a: "Sejarah peringatan Hari Air Sedunia",
    opsi_b: "Rincian pemakaian air untuk berbagai kegiatan rumah tangga",
    opsi_c: "Cara memperbaiki keran yang bocor",
    opsi_d: "Daftar harga air bersih di perkotaan",
    opsi_e: "Akibat kekurangan air bagi kesehatan",
    kunci: "B",
    pembahasan: `Urutan bagian infografis: fakta 150 liter per hari, lalu bagian "Ke mana air kita pergi?" yang merinci pemakaian air untuk mandi, mencuci, dan sebagainya, lalu 5 langkah hemat air, dan terakhir kotak "Tahukah kamu?".

- **A** — salah, infografis hanya menyebut tanggal Hari Air Sedunia, tidak menceritakan sejarahnya.
- **B** — benar, bagian kedua infografis berisi rincian pemakaian air.
- **C** — salah, infografis tidak menjelaskan cara memperbaiki keran.
- **D** — salah, harga air tidak dibahas.
- **E** — salah, akibat kekurangan air tidak dibahas.`,
    tingkat_kesulitan: "mudah",
  },

  // ---- Stimulus 2: Bank sampah ----
  {
    // 6
    kode_stimulus: "SMP-BIND-P4-BANKSAMPAH",
    kode_subdomain: "SMP-BIND-D1-S3",
    bentuk_soal: "pg",
    pertanyaan: "Kapan petugas bank sampah menimbang sampah yang disetor siswa?",
    opsi_a: "Setiap akhir bulan",
    opsi_b: "Setiap Rabu pada jam istirahat kedua",
    opsi_c: "Setiap akhir semester",
    opsi_d: "Setiap Senin sebelum pelajaran dimulai",
    opsi_e: "Setiap hari pada jam istirahat pertama",
    kunci: "B",
    pembahasan: `Paragraf kedua menyebutkan, "Petugas menimbang sampah setiap Rabu pada jam istirahat kedua."

- **A** — salah, akhir bulan adalah waktu sampah dijual kepada pengepul.
- **B** — benar.
- **C** — salah, akhir semester adalah waktu tabungan dapat diambil.
- **D** dan **E** — salah, tidak disebutkan dalam teks.`,
    tingkat_kesulitan: "mudah",
  },
  {
    // 7
    kode_stimulus: "SMP-BIND-P4-BANKSAMPAH",
    kode_subdomain: "SMP-BIND-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: "Ide pokok paragraf kedua teks tersebut adalah ....",
    opsi_a: "setiap siswa memiliki buku tabungan sampah",
    opsi_b: "sampah dijual kepada pengepul setiap akhir bulan",
    opsi_c: "ketentuan sampah yang dapat disetor ke bank sampah",
    opsi_d: "kaleng dihargai paling mahal oleh bank sampah",
    opsi_e: "jumlah sampah mencapai puncaknya pada bulan November",
    kunci: "C",
    pembahasan: `Paragraf kedua dibuka dengan kalimat utama tentang sampah yang diterima (hanya sampah anorganik kering). Kalimat-kalimat berikutnya menjelaskan ketentuannya: harus bersih dan dipilah, waktu penimbangan, dan harga tiap jenis.

- **A** — salah, informasi itu ada di paragraf pertama.
- **B** — salah, informasi itu ada di paragraf ketiga.
- **C** — benar, merangkum seluruh isi paragraf kedua.
- **D** — salah, itu hanya rincian (gagasan pendukung), bukan ide pokok.
- **E** — salah, informasi itu ada di paragraf keempat.`,
    tingkat_kesulitan: "sedang",
  },
  {
    // 8
    kode_stimulus: "SMP-BIND-P4-BANKSAMPAH",
    kode_subdomain: "SMP-BIND-D3-S2",
    bentuk_soal: "pgk_kategori",
    kategori: "Sesuai/Tidak Sesuai",
    pertanyaan: "Bandingkan isi teks dengan diagram. Tentukan **Sesuai** atau **Tidak Sesuai** setiap pernyataan berikut!",
    opsi_a: "Teks menyebut jumlah sampah mencapai puncaknya pada bulan November, dan diagram menunjukkan November sebagai bulan dengan sampah terbanyak.",
    opsi_b: "Teks menyebut jumlah sampah terus naik sejak Juli hingga November, dan diagram menunjukkan kenaikan pada setiap bulan dalam rentang itu.",
    opsi_c: "Penurunan jumlah sampah pada bulan Desember dalam diagram dijelaskan penyebabnya di dalam teks.",
    opsi_d: "Menurut diagram, sampah yang terkumpul pada bulan Desember adalah yang paling sedikit selama enam bulan.",
    kunci: "S,TS,S,TS",
    pembahasan: `- **Sesuai** — November 90 kg, batang tertinggi pada diagram.
- **Tidak Sesuai** — diagram menunjukkan sampah **turun** dari September (70 kg) ke Oktober (65 kg). Jadi, pernyataan teks bahwa jumlahnya "terus naik" tidak akurat.
- **Sesuai** — teks menjelaskan bahwa pada Desember siswa menghadapi penilaian akhir semester dan libur dimulai pada pertengahan bulan.
- **Tidak Sesuai** — Desember 50 kg, sedangkan Juli hanya 40 kg. Bulan dengan sampah paling sedikit adalah Juli.`,
    tingkat_kesulitan: "sulit",
  },
  {
    // 9
    kode_stimulus: "SMP-BIND-P4-BANKSAMPAH",
    kode_subdomain: "SMP-BIND-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: "Hubungan antara lomba kelas terbersih dan jumlah sampah pada bulan November yang paling logis adalah ....",
    opsi_a: "Lomba kelas terbersih membuat siswa membuang sampah ke sungai sehingga sampah di sekolah berkurang.",
    opsi_b: "Lomba kelas terbersih mendorong siswa mengumpulkan dan menyetorkan lebih banyak sampah sehingga jumlahnya paling tinggi.",
    opsi_c: "Lomba kelas terbersih diadakan karena sampah di bank sampah sudah terlalu banyak.",
    opsi_d: "Lomba kelas terbersih tidak berhubungan dengan jumlah sampah yang terkumpul.",
    opsi_e: "Lomba kelas terbersih menyebabkan harga kaleng menjadi paling mahal.",
    kunci: "B",
    pembahasan: `Teks menyebut sampah mencapai puncaknya pada November, lalu menjelaskan, "Pada bulan itu, sekolah mengadakan lomba kelas terbersih." Hubungannya sebab-akibat: siswa giat membersihkan kelas dan mengumpulkan sampah, lalu sampah itu disetor ke bank sampah.

- **A** — salah, tidak ada informasi tentang membuang sampah ke sungai, dan jumlah sampah justru naik.
- **B** — benar, hubungan sebab-akibat yang logis.
- **C** — salah, urutan sebab-akibatnya terbalik dan tidak didukung teks.
- **D** — salah, penulis sengaja menyebut lomba itu untuk menjelaskan puncak November.
- **E** — salah, harga kaleng tidak dikaitkan dengan lomba.`,
    tingkat_kesulitan: "sulit",
  },
  {
    // 10
    kode_stimulus: "SMP-BIND-P4-BANKSAMPAH",
    kode_subdomain: "SMP-BIND-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: "Istilah **pengepul** dalam teks tersebut bermakna ....",
    opsi_a: "petugas yang menimbang sampah di sekolah",
    opsi_b: "siswa yang paling banyak menabung sampah",
    opsi_c: "orang yang membeli barang bekas dari banyak tempat untuk dijual lagi",
    opsi_d: "pabrik yang mengolah sampah menjadi barang baru",
    opsi_e: "guru yang membina kegiatan bank sampah",
    kunci: "C",
    pembahasan: `Paragraf ketiga menjelaskan, "Pengepul membeli barang bekas dari banyak tempat, lalu menjualnya lagi ke pabrik daur ulang."

- **A** — salah, penimbangan dilakukan petugas bank sampah.
- **B** — salah, tidak ada istilah khusus untuk siswa penabung terbanyak.
- **C** — benar, sesuai penjelasan dalam teks.
- **D** — salah, pabrik daur ulang adalah pembeli dari pengepul, bukan pengepul itu sendiri.
- **E** — salah, pembina bank sampah adalah Pak Hendra.`,
    tingkat_kesulitan: "mudah",
  },

  // ---- Stimulus 3: Poster festival literasi ----
  {
    // 11
    kode_stimulus: "SMP-BIND-P4-FESTIVAL",
    kode_subdomain: "SMP-BIND-D1-S3",
    bentuk_soal: "pg",
    pertanyaan: "Kapan acara bincang penulis diadakan?",
    opsi_a: "Sabtu, 21 November 2026, pukul 09.00 WIB",
    opsi_b: "Minggu, 22 November 2026, pukul 10.00 WIB",
    opsi_c: "Minggu, 22 November 2026, pukul 13.00 WIB",
    opsi_d: "Sabtu, 14 November 2026, pukul 10.00 WIB",
    opsi_e: "Minggu, 22 November 2026, pukul 15.00 WIB",
    kunci: "B",
    pembahasan: `Tabel rangkaian acara mencantumkan "Minggu, 10.00 — Bincang penulis". Festival berlangsung Sabtu–Minggu, 21–22 November 2026, jadi hari Minggu jatuh pada 22 November.

- **A** — salah, itu jadwal presentasi finalis lomba resensi.
- **B** — benar.
- **C** — salah, pukul 13.00 adalah jadwal lokakarya zine.
- **D** — salah, 14 November adalah batas pengiriman naskah resensi.
- **E** — salah, pukul 15.00 adalah pengumuman pemenang.`,
    tingkat_kesulitan: "mudah",
  },
  {
    // 12
    kode_stimulus: "SMP-BIND-P4-FESTIVAL",
    kode_subdomain: "SMP-BIND-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: "Istilah **lokakarya** pada poster tersebut bermakna ....",
    opsi_a: "pameran karya yang sudah jadi",
    opsi_b: "lomba menulis yang dinilai juri",
    opsi_c: "pertemuan untuk belajar dan mempraktikkan suatu keterampilan secara bersama-sama",
    opsi_d: "penjualan buku dengan harga murah",
    opsi_e: "wawancara dengan seorang penulis terkenal",
    kunci: "C",
    pembahasan: `Pada poster, lokakarya diikuti kata "membuat zine", diberi kuota peserta, dan peserta harus mendaftar. Jadi, lokakarya adalah kegiatan belajar sambil praktik membuat sesuatu bersama-sama.

- **A** — salah, pameran hanya memajang karya, peserta tidak membuat apa pun.
- **B** — salah, kegiatan lomba pada poster adalah lomba resensi.
- **C** — benar.
- **D** — salah, itu bazar buku.
- **E** — salah, itu lebih dekat dengan bincang penulis.`,
    tingkat_kesulitan: "sedang",
  },
  {
    // 13
    kode_stimulus: "SMP-BIND-P4-FESTIVAL",
    kode_subdomain: "SMP-BIND-D3-S2",
    bentuk_soal: "pgk_kategori",
    kategori: "Sesuai/Tidak Sesuai",
    pertanyaan: "Tentukan **Sesuai** atau **Tidak Sesuai** setiap keikutsertaan berikut dengan ketentuan pada poster!",
    opsi_a: "Tia, siswa kelas VIII sebuah SMP di Kabupaten Lembah Hijau, mengirim resensi novel terbitan 2022 sepanjang 650 kata pada 10 November 2026.",
    opsi_b: "Andi mengirim resensi buku terbitan tahun 2018 karena buku itu sangat ia sukai.",
    opsi_c: "Fajar, siswa kelas X SMA, mendaftar sebagai peserta lomba resensi.",
    opsi_d: "Nina mendaftar di meja informasi perpustakaan, lalu mengikuti lokakarya zine pada Minggu pukul 13.00.",
    kunci: "S,TS,TS,S",
    pembahasan: `- **Sesuai** — Tia memenuhi semua ketentuan: kelas VIII di Kabupaten Lembah Hijau, buku terbit 2022 (dalam rentang 2020–2026), 650 kata (di antara 500–800 kata), dan dikirim sebelum 14 November 2026.
- **Tidak Sesuai** — buku yang diresensi harus terbit tahun 2020–2026, sedangkan 2018 di luar rentang itu.
- **Tidak Sesuai** — peserta harus siswa SMP/MTs kelas VII–IX, sedangkan Fajar siswa SMA.
- **Sesuai** — poster meminta peserta lokakarya mendaftar dahulu di meja informasi, dan lokakarya diadakan Minggu pukul 13.00.`,
    tingkat_kesulitan: "sedang",
  },
  {
    // 14
    kode_stimulus: "SMP-BIND-P4-FESTIVAL",
    kode_subdomain: "SMP-BIND-D2-S3",
    bentuk_soal: "pg",
    pertanyaan: "Pada hari Minggu pukul 12.30, sudah ada 30 orang yang mendaftar lokakarya zine. Bayu baru tiba di perpustakaan dan ingin mendaftar lokakarya tersebut. Peristiwa yang paling mungkin terjadi adalah ....",
    opsi_a: "Bayu menjadi peserta ke-31 lokakarya zine.",
    opsi_b: "Bayu otomatis menjadi finalis lomba resensi.",
    opsi_c: "Bayu tidak dapat mengikuti lokakarya karena kuota sudah penuh, tetapi masih dapat menikmati acara lain, seperti bazar buku.",
    opsi_d: "Lokakarya zine dibatalkan karena pesertanya terlalu banyak.",
    opsi_e: "Bayu harus membayar biaya tambahan agar dapat mengikuti lokakarya.",
    kunci: "C",
    pembahasan: `Poster menyebut kuota lokakarya 30 peserta dan "Tempat terbatas!". Jika 30 orang sudah mendaftar, kuota penuh. Namun, festival terbuka untuk umum dan bazar buku berlangsung pada hari Sabtu dan Minggu.

- **A** — salah, melebihi kuota 30 peserta.
- **B** — salah, finalis lomba resensi ditentukan dari naskah yang dikirim sebelum 14 November.
- **C** — benar, prediksi yang paling sesuai dengan informasi poster.
- **D** — salah, kuota penuh tidak berarti acara dibatalkan.
- **E** — salah, festival gratis dan tidak ada informasi biaya tambahan.`,
    tingkat_kesulitan: "sulit",
  },
  {
    // 15
    kode_stimulus: "SMP-BIND-P4-FESTIVAL",
    kode_subdomain: "SMP-BIND-D1-S3",
    bentuk_soal: "pgk_mcma",
    pertanyaan: "Acara manakah yang diadakan **khusus** pada hari Minggu, 22 November 2026?" + MCMA,
    opsi_a: "Presentasi finalis lomba resensi",
    opsi_b: "Bincang penulis bersama Kak Laila Anggraini",
    opsi_c: "Lokakarya membuat zine",
    opsi_d: "Pengumuman pemenang lomba resensi",
    opsi_e: "Batas akhir pengiriman naskah resensi",
    kunci: "B,C,D",
    pembahasan: `Tabel rangkaian acara mencantumkan tiga acara yang hanya ada pada hari Minggu: bincang penulis (10.00), lokakarya zine (13.00), dan pengumuman pemenang (15.00).

- **A** — salah, presentasi finalis diadakan Sabtu pukul 09.00.
- **B**, **C**, dan **D** — benar.
- **E** — salah, batas pengiriman naskah adalah 14 November 2026, sebelum festival dimulai.`,
    tingkat_kesulitan: "sedang",
  },

  // ---- Stimulus 4: Teks jamak sarapan ----
  {
    // 16
    kode_stimulus: "SMP-BIND-P4-SARAPAN",
    kode_subdomain: "SMP-BIND-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: "Gagasan yang sama-sama terdapat dalam Teks 1 dan Teks 2 adalah ....",
    opsi_a: "OSIS perlu melakukan survei tentang kebiasaan sarapan siswa.",
    opsi_b: "Sarapan membantu siswa tetap segar dan berkonsentrasi saat belajar.",
    opsi_c: "Menu sarapan harus memenuhi 15–30 persen kebutuhan gizi harian.",
    opsi_d: "Orang tua perlu diundang untuk sosialisasi menu bekal sehat.",
    opsi_e: "Siswa sebaiknya sarapan bersama wali kelas setiap hari.",
    kunci: "B",
    pembahasan: `Teks 1 menjelaskan bahwa sarapan memberi energi bagi otak untuk berkonsentrasi dan siswa yang tidak sarapan mudah mengantuk. Teks 2 melaporkan bahwa setelah program Sarapan Bersama, siswa lebih jarang mengantuk pada jam pertama. Kedua teks sama-sama menunjukkan manfaat sarapan bagi kesiapan belajar.

- **A** — salah, survei OSIS hanya ada di Teks 2.
- **B** — benar.
- **C** — salah, angka 15–30 persen hanya ada di Teks 1.
- **D** — salah, rencana sosialisasi hanya ada di Teks 2.
- **E** — salah, program di Teks 2 hanya setiap Senin dan Kamis, dan Teks 1 tidak membahasnya.`,
    tingkat_kesulitan: "sedang",
  },
  {
    // 17
    kode_stimulus: "SMP-BIND-P4-SARAPAN",
    kode_subdomain: "SMP-BIND-D3-S2",
    bentuk_soal: "pg",
    pertanyaan: "Berdasarkan Teks 1, bagian Teks 2 yang menunjukkan bahwa program Sarapan Bersama masih perlu diperbaiki adalah ....",
    opsi_a: "Program dilaksanakan setiap Senin dan Kamis pukul 06.45.",
    opsi_b: "Wali kelas ikut sarapan bersama siswa.",
    opsi_c: "Siswa lebih jarang mengantuk pada jam pelajaran pertama.",
    opsi_d: "Sebagian bekal siswa hanya berisi mi instan atau gorengan.",
    opsi_e: "Siswa duduk melingkar saat membuka bekal.",
    kunci: "D",
    pembahasan: `Teks 1 menyatakan gorengan atau mi instan saja belum cukup karena gizinya tidak seimbang. Jadi, bekal berisi mi instan atau gorengan saja belum sesuai dengan sarapan sehat menurut Teks 1.

- **A** — salah, pukul 06.45 justru sesuai saran sarapan sebelum pukul 09.00.
- **B** — salah, keikutsertaan wali kelas tidak bertentangan dengan Teks 1.
- **C** — salah, itu hasil positif program, sesuai manfaat sarapan dalam Teks 1.
- **D** — benar.
- **E** — salah, posisi duduk tidak dibahas dalam Teks 1.`,
    tingkat_kesulitan: "sulit",
  },
  {
    // 18
    kode_stimulus: "SMP-BIND-P4-SARAPAN",
    kode_subdomain: "SMP-BIND-D2-S2",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Tentukan **Benar** atau **Salah** setiap pernyataan tentang hubungan informasi dalam dan antarteks berikut!",
    opsi_a: "Siswa yang lebih jarang mengantuk pada jam pertama (Teks 2) sejalan dengan manfaat sarapan bagi konsentrasi (Teks 1).",
    opsi_b: "Waktu program Sarapan Bersama sesuai dengan saran waktu sarapan dalam Teks 1.",
    opsi_c: "Alasan terbanyak siswa jarang sarapan adalah tidak tersedia makanan di rumah.",
    opsi_d: "Program Sarapan Bersama sudah membuat semua bekal siswa memenuhi syarat sarapan sehat menurut Teks 1.",
    kunci: "B,B,S,S",
    pembahasan: `- **Benar** — Teks 1 menjelaskan bahwa sarapan memberi energi untuk berkonsentrasi. Hasil di Teks 2 sejalan dengan penjelasan itu.
- **Benar** — program dimulai pukul 06.45, sebelum pukul 09.00 seperti saran Teks 1.
- **Salah** — Teks 2 menyebut alasan terbanyak adalah **tidak sempat** karena berangkat terlalu pagi. Tidak tersedia makanan hanya alasan lain.
- **Salah** — catatan wali kelas menunjukkan sebagian bekal masih berisi mi instan atau gorengan saja.`,
    tingkat_kesulitan: "sedang",
  },
  {
    // 19
    kode_stimulus: "SMP-BIND-P4-SARAPAN",
    kode_subdomain: "SMP-BIND-D1-S4",
    bentuk_soal: "pgk_mcma",
    pertanyaan: "Dimas menyusun bagan berisi bagian-bagian penting Teks 2. Informasi manakah yang tepat dimasukkan ke dalam bagan?" + MCMA,
    opsi_a: "Waktu kegiatan: setiap Senin dan Kamis pukul 06.45",
    opsi_b: "Dasar program: survei OSIS, 4 dari 10 siswa jarang sarapan",
    opsi_c: "Alasan terbanyak tidak sarapan: tidak tersedia makanan di rumah",
    opsi_d: "Hasil program: siswa lebih jarang mengantuk pada jam pertama",
    opsi_e: "Rencana sekolah: membuka kantin sarapan gratis",
    kunci: "A,B,D",
    pembahasan: `- **A** — benar, sesuai paragraf pertama Teks 2.
- **B** — benar, sesuai paragraf kedua.
- **C** — salah, alasan terbanyak adalah tidak sempat karena berangkat terlalu pagi.
- **D** — benar, sesuai paragraf ketiga.
- **E** — salah, rencana sekolah adalah mengundang orang tua untuk sosialisasi menu bekal sehat, bukan membuka kantin gratis.`,
    tingkat_kesulitan: "sedang",
  },
  {
    // 20
    kode_stimulus: "SMP-BIND-P4-SARAPAN",
    kode_subdomain: "SMP-BIND-D3-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: "Tindakan sehari-hari manakah yang relevan dengan isi kedua teks?" + MCMA,
    opsi_a: "Menyiapkan bekal nasi, telur, dan tumis sayur sejak malam hari.",
    opsi_b: "Mengganti sarapan dengan segelas minuman manis agar tidak terlambat.",
    opsi_c: "Bangun lebih pagi supaya sempat sarapan sebelum berangkat sekolah.",
    opsi_d: "Menunda sarapan sampai pukul 10.00 di kantin sekolah.",
    opsi_e: "Menambahkan sebuah pisang ke dalam kotak bekal.",
    kunci: "A,C,E",
    pembahasan: `- **A** — benar, menunya lengkap (karbohidrat, protein, sayur) sesuai Teks 1. Menyiapkannya sejak malam juga mengatasi alasan "tidak sempat" pada Teks 2.
- **B** — salah, Teks 1 menyebut minuman manis saja belum cukup.
- **C** — benar, mengatasi alasan terbanyak siswa jarang sarapan, yaitu tidak sempat.
- **D** — salah, Teks 1 menyarankan sarapan sebelum pukul 09.00.
- **E** — benar, buah termasuk unsur sarapan sehat menurut Teks 1.`,
    tingkat_kesulitan: "sedang",
  },

  // ---- Stimulus 5: Cerpen ----
  {
    // 21
    kode_stimulus: "SMP-BIND-P4-SEPATU",
    kode_subdomain: "SMP-BIND-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: "Watak tokoh Nara yang paling tepat berdasarkan cerita adalah ....",
    opsi_a: "gigih dan tidak suka mengeluhkan kesulitannya kepada orang lain",
    opsi_b: "pemalu dan tidak mau berteman dengan anggota tim",
    opsi_c: "manja dan selalu meminta bantuan orang lain",
    opsi_d: "sombong karena pernah menang lomba lari antarkelas",
    opsi_e: "mudah putus asa ketika menghadapi masalah",
    kunci: "A",
    pembahasan: `Nara menyembunyikan sepatunya yang rusak dan berkata "Masih kuat" (tidak mengeluh). Ia juga memahami kesulitan keuangan keluarganya, lalu menjahit sepatunya sendiri walaupun jarinya tertusuk jarum (gigih).

- **A** — benar.
- **B** — salah, tidak ada bukti Nara menjauhi timnya. Teman-temannya justru peduli kepadanya.
- **C** — salah, Nara tidak meminta bantuan. Ia memperbaiki sepatunya sendiri.
- **D** — salah, tidak ada sikap sombong dalam cerita.
- **E** — salah, Nara terus menjahit dan tetap berlomba.`,
    tingkat_kesulitan: "sedang",
  },
  {
    // 22
    kode_stimulus: "SMP-BIND-P4-SEPATU",
    kode_subdomain: "SMP-BIND-D2-S4",
    bentuk_soal: "pg",
    pertanyaan: `Makna majas dalam kalimat "Ujung sepatu kanannya menganga seperti mulut ikan yang kehabisan napas" adalah ....`,
    opsi_a: "sepatu Nara berbau amis seperti ikan",
    opsi_b: "ujung sepatu Nara sobek dan terbuka lebar",
    opsi_c: "Nara kehabisan napas setelah berlatih lari",
    opsi_d: "sepatu Nara basah terkena air hujan",
    opsi_e: "Nara memakai sepatu yang terlalu kecil",
    kunci: "B",
    pembahasan: `Kalimat itu memakai majas perbandingan (simile) dengan kata "seperti". Ujung sepatu dibandingkan dengan mulut ikan yang terus terbuka saat kehabisan napas. Artinya, ujung sepatu itu sobek dan terbuka lebar. Hal ini dikuatkan oleh kalimat berikutnya: Nara menjahit sepatunya agar ujungnya "kembali tertutup".

- **A** — salah, perbandingannya tentang bentuk mulut ikan, bukan bau.
- **B** — benar.
- **C** — salah, yang dibandingkan adalah sepatu, bukan napas Nara.
- **D** — salah, majas itu tidak membahas sepatu yang basah.
- **E** — salah, cerita tidak menyebut ukuran sepatu.`,
    tingkat_kesulitan: "sedang",
  },
  {
    // 23
    kode_stimulus: "SMP-BIND-P4-SEPATU",
    kode_subdomain: "SMP-BIND-D1-S2",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Tentukan **Benar** atau **Salah** setiap pernyataan tentang latar cerita berikut!",
    opsi_a: `Kata "lintasan tanah" dan "garis start" menunjukkan latar tempat Nara berlatih dan berlomba lari.`,
    opsi_b: "Peristiwa Bapak membelikan sepatu biru terjadi dua tahun sebelum lomba tingkat kabupaten.",
    opsi_c: "Nara menjahit sepatunya pada pagi hari lomba.",
    opsi_d: `Kalimat "Lintasan tanah di belakang sekolah masih basah oleh sisa hujan" menggambarkan suasana pada hari lomba.`,
    kunci: "B,B,S,S",
    pembahasan: `- **Benar** — lintasan tanah di belakang sekolah adalah tempat berlatih, sedangkan garis start adalah tempat lomba dimulai.
- **Benar** — cerita menyebut sepatu itu dibelikan "dua tahun lalu". Peristiwa ini disampaikan lewat kilas balik.
- **Salah** — Nara menjahit sepatunya pada **malam** hari setelah ditanya Pak Damar, bukan pada pagi hari lomba.
- **Salah** — lintasan yang basah adalah latar saat Nara berlatih, yaitu dua hari sebelum lomba ("Lusa, ia akan berlari"). Pada hari lomba, "langit cerah tanpa awan".`,
    tingkat_kesulitan: "sedang",
  },
  {
    // 24
    kode_stimulus: "SMP-BIND-P4-SEPATU",
    kode_subdomain: "SMP-BIND-D3-S3",
    bentuk_soal: "pgk_mcma",
    pertanyaan: "Bagian cerita manakah yang dapat menimbulkan rasa haru pada pembaca?" + MCMA,
    opsi_a: "Teman-teman tim Nara patungan membelikannya sepatu lari baru.",
    opsi_b: "Nara menyimpan sepatu biru dari Bapak di dalam tas, dekat dengan punggungnya.",
    opsi_c: "Lintasan tanah di belakang sekolah masih basah oleh sisa hujan.",
    opsi_d: "Nara terus menjahit sepatunya walaupun jarinya tertusuk jarum dua kali.",
    opsi_e: "Pistol tanda mulai lomba berbunyi.",
    kunci: "A,B,D",
    pembahasan: `Rasa haru muncul dari peristiwa yang menunjukkan kepedulian, pengorbanan, atau kasih sayang.

- **A** — benar, kepedulian teman-teman kepada Nara yang sedang kesulitan.
- **B** — benar, Nara tetap menghargai pemberian Bapak dengan membawanya sebagai penyemangat.
- **C** — salah, hanya gambaran latar dan tidak memuat peristiwa yang menyentuh perasaan.
- **D** — benar, perjuangan Nara yang tidak ingin membebani keluarganya.
- **E** — salah, bagian ini lebih menimbulkan rasa tegang atau semangat, bukan haru.`,
    tingkat_kesulitan: "sulit",
  },
  {
    // 25
    kode_stimulus: "SMP-BIND-P4-SEPATU",
    kode_subdomain: "SMP-BIND-D2-S3",
    bentuk_soal: "pg",
    pertanyaan: "Peristiwa yang paling mungkin terjadi setelah akhir cerita adalah ....",
    opsi_a: "Nara berhenti di tengah lintasan untuk mengganti sepatunya dengan sepatu biru.",
    opsi_b: "Nara berlari sekuat tenaga untuk membalas kebaikan Bapak dan teman-temannya.",
    opsi_c: "Nara menjual sepatu barunya untuk membantu Bapak.",
    opsi_d: "Pak Damar melarang Nara mengikuti lomba.",
    opsi_e: "Nara pulang sebelum lomba selesai.",
    kunci: "B",
    pembahasan: `Cerita berakhir saat lomba dimulai dan Nara "melesat seperti anak panah". Ia membawa sepatu Bapak sebagai penyemangat dan memakai sepatu pemberian teman-temannya. Kelanjutan yang paling logis adalah Nara berlari dengan sungguh-sungguh.

- **A** — salah, Nara sengaja memakai sepatu baru dan menyimpan sepatu biru di tas.
- **B** — benar.
- **C** — salah, tidak ada petunjuk ke arah itu, dan sepatu itu hadiah dari teman-temannya.
- **D** — salah, Pak Damar justru mendukung Nara, dan lomba sudah dimulai.
- **E** — salah, bertentangan dengan semangat Nara pada akhir cerita.`,
    tingkat_kesulitan: "sulit",
  },

  // ---- Stimulus 6: Puisi ----
  {
    // 26
    kode_stimulus: "SMP-BIND-P4-DERMAGA",
    kode_subdomain: "SMP-BIND-D2-S4",
    bentuk_soal: "pgk_mcma",
    pertanyaan: "Larik manakah yang menggunakan majas personifikasi?" + MCMA,
    opsi_a: "Subuh masih menggigil di ujung dermaga",
    opsi_b: "jala tergulung di bahunya yang kukuh",
    opsi_c: "Laut bernyanyi dengan suara serak",
    opsi_d: "ikan perak menggelepar di dasar perahu",
    opsi_e: "angin asin menampar pipi yang legam",
    kunci: "A,C,E",
    pembahasan: `Personifikasi memberikan sifat atau perbuatan manusia kepada benda mati atau alam.

- **A** — benar, subuh (waktu) digambarkan "menggigil" seperti manusia.
- **B** — salah, jala memang dapat tergulung, dan bahu yang kukuh adalah bahu Ayah (manusia).
- **C** — benar, laut digambarkan "bernyanyi" seperti manusia.
- **D** — salah, ikan memang menggelepar. Itu perbuatan ikan sendiri, bukan sifat manusia.
- **E** — benar, angin digambarkan "menampar" seperti manusia.`,
    tingkat_kesulitan: "sulit",
  },
  {
    // 27
    kode_stimulus: "SMP-BIND-P4-DERMAGA",
    kode_subdomain: "SMP-BIND-D2-S4",
    bentuk_soal: "pg",
    pertanyaan: `Larik "lampu perahu berkedip satu-satu" menggunakan citraan ....`,
    opsi_a: "pendengaran",
    opsi_b: "penciuman",
    opsi_c: "penglihatan",
    opsi_d: "perabaan",
    opsi_e: "pengecapan",
    kunci: "C",
    pembahasan: `Citraan adalah gambaran yang seolah-olah dapat ditangkap pancaindra. Lampu yang "berkedip satu-satu" hanya dapat dilihat dengan mata, sehingga larik itu memakai citraan **penglihatan**.

- **A** — salah, tidak ada bunyi dalam larik itu (bandingkan dengan "Laut bernyanyi dengan suara serak").
- **B** — salah, tidak ada bau yang digambarkan.
- **C** — benar.
- **D** — salah, tidak ada sentuhan (bandingkan dengan "angin ... menampar pipi").
- **E** — salah, tidak ada rasa di lidah.`,
    tingkat_kesulitan: "sedang",
  },
  {
    // 28
    kode_stimulus: "SMP-BIND-P4-DERMAGA",
    kode_subdomain: "SMP-BIND-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: "Nilai kehidupan yang paling menonjol dalam puisi tersebut adalah ....",
    opsi_a: "kerja keras dan ketabahan seorang ayah menghadapi kerasnya laut demi keluarga",
    opsi_b: "keindahan pemandangan laut pada waktu subuh",
    opsi_c: "pentingnya memakai lampu pada perahu saat melaut",
    opsi_d: "kegembiraan anak-anak bermain di pantai",
    opsi_e: "bahaya melaut ketika angin bertiup kencang",
    kunci: "A",
    pembahasan: `Puisi menggambarkan Ayah yang melaut sejak subuh menembus dingin, ombak, dan angin, lalu pulang membawa ikan dengan senyum yang "menghapus lelah". Nilai yang menonjol adalah kerja keras dan ketabahan seorang ayah demi keluarga.

- **A** — benar.
- **B** — salah, pemandangan laut hanya latar, bukan nilai yang ingin disampaikan.
- **C** — salah, lampu perahu hanya bagian dari gambaran suasana.
- **D** — salah, tidak ada anak-anak yang bermain dalam puisi.
- **E** — salah, puisi tidak memperingatkan bahaya melaut. Ayah justru pulang dengan selamat.`,
    tingkat_kesulitan: "sulit",
  },
  {
    // 29
    kode_stimulus: "SMP-BIND-P4-DERMAGA",
    kode_subdomain: "SMP-BIND-D1-S2",
    bentuk_soal: "pg",
    pertanyaan: "Kata dermaga, sampan, dan jala menunjukkan bahwa latar tempat puisi tersebut adalah ....",
    opsi_a: "pasar ikan di tengah kota",
    opsi_b: "danau di pegunungan",
    opsi_c: "pantai di perkampungan nelayan",
    opsi_d: "sawah di tepi sungai",
    opsi_e: "pelabuhan kapal pesiar",
    kunci: "C",
    pembahasan: `Dermaga (tempat perahu bersandar), sampan (perahu kecil), dan jala (alat menangkap ikan) adalah kosakata kehidupan nelayan di tepi laut. Puisi juga menyebut ombak, laut, angin asin, dan pantai.

- **A** — salah, tidak ada kosakata tentang pasar atau kota.
- **B** — salah, angin asin dan ombak menunjukkan laut, bukan danau.
- **C** — benar.
- **D** — salah, tidak ada kosakata pertanian.
- **E** — salah, yang digambarkan adalah sampan nelayan, bukan kapal pesiar.`,
    tingkat_kesulitan: "mudah",
  },
  {
    // 30
    kode_stimulus: "SMP-BIND-P4-DERMAGA",
    kode_subdomain: "SMP-BIND-D3-S3",
    bentuk_soal: "pgk_kategori",
    kategori: "Sesuai/Tidak Sesuai",
    pertanyaan: "Tentukan **Sesuai** atau **Tidak Sesuai** setiap respons pembaca berikut terhadap puisi tersebut!",
    opsi_a: "Pembaca merasa kagum pada keteguhan Ayah yang melaut sejak subuh dalam cuaca dingin.",
    opsi_b: "Pembaca ikut merasa lega dan bahagia ketika Ayah pulang membawa hasil tangkapan.",
    opsi_c: "Pembaca merasa geli karena Ayah digambarkan takut pada ombak.",
    kunci: "S,S,TS",
    pembahasan: `- **Sesuai** — bait pertama dan kedua menggambarkan Ayah tetap melaut walaupun subuh "menggigil" dan angin "menampar pipi". Gambaran ini menimbulkan rasa kagum.
- **Sesuai** — bait ketiga menggambarkan ikan di dasar perahu dan senyum Ayah "lebih terang dari siang". Gambaran ini menimbulkan rasa lega dan bahagia.
- **Tidak Sesuai** — Ayah justru mendorong sampan "ke pelukan ombak" dengan bahu yang kukuh. Tidak ada gambaran Ayah takut, dan tidak ada bagian yang lucu.`,
    tingkat_kesulitan: "sedang",
  },
];

export default {
  title: "TKA SMP Bahasa Indonesia — Paket 4",
  description: "30 soal dari 6 bacaan: infografis hemat air, teks dan diagram bank sampah sekolah, poster festival literasi, dua teks tentang sarapan, cerpen \"Sepatu Biru\", dan puisi \"Subuh di Dermaga\". Mencakup pemahaman tersurat, inferensi, majas dan citraan, serta evaluasi antarteks. Dilengkapi pembahasan setiap pilihan jawaban.",
  jenjang: "SMP",
  subjectCode: "SMP-BIND",
  durationMinutes: 75,
  isPremium: true,
  isFullSimulation: true,
  createdByEmail: "kpbgalimka@gmail.com",
  stimuli,
  rows,
  images: {
    "infografis-air": { title: "Infografis Ayo Hemat Air", svg: imgAir() },
    "diagram-bank-sampah": { title: "Diagram batang sampah terkumpul di bank sampah", svg: imgBankSampah() },
    "poster-festival": { title: "Poster Festival Literasi Pelajar 2026", svg: imgPoster() },
  },
};
