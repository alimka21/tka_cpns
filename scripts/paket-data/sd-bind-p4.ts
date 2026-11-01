// TKA SD Bahasa Indonesia — Paket 4 (ditulis Claude). 6 bacaan × 5 soal: 18 PG · 6 MCMA · 6 Kategori;
// 10/10 subtopik (3 soal masing-masing); mudah 6 · sedang 16 · sulit 8. 2 gambar SVG baru: poster bazar
// tukar buku & infografis Isi Piringku. Bacaan ±150–200 kata, kalimat pendek (kerangka SD).
// Pembahasan membahas setiap pilihan (kenapa benar / salah).
const FONT = `font-family="Arial, Helvetica, sans-serif"`;
const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" ${FONT}><rect width="${w}" height="${h}" fill="#fff"/>${body}</svg>`;
const text = (x: number, y: number, t: string, o: { size?: number; anchor?: string; weight?: string; fill?: string } = {}) =>
  `<text x="${x}" y="${y}" font-size="${o.size ?? 18}" text-anchor="${o.anchor ?? "middle"}" font-weight="${o.weight ?? "normal"}" fill="${o.fill ?? "#111"}">${t}</text>`;

// ---------- Gambar ----------

// Stimulus poster Pekan Literasi — bazar tukar buku 16–18 November 2026 (Senin–Rabu).
function imgPoster() {
  let s = `<rect x="10" y="10" width="660" height="760" rx="18" fill="#fef3c7" stroke="#b45309" stroke-width="4"/>`;
  s += `<rect x="10" y="10" width="660" height="120" rx="18" fill="#b45309"/><rect x="10" y="100" width="660" height="30" fill="#b45309"/>`;
  s += text(340, 58, "PEKAN LITERASI SD PELITA", { size: 30, weight: "bold", fill: "#fff" });
  s += text(340, 102, "BAZAR TUKAR BUKU", { size: 36, weight: "bold", fill: "#fde68a" });
  // tumpukan buku
  const book = (x: number, y: number, w: number, c: string) => `<rect x="${x}" y="${y}" width="${w}" height="22" rx="3" fill="${c}" stroke="#451a03" stroke-width="1.5"/>`;
  s += book(520, 230, 110, "#2563eb") + book(530, 208, 95, "#dc2626") + book(515, 186, 120, "#16a34a") + book(535, 164, 90, "#9333ea");
  const row = (y: number, label: string, value: string) => text(50, y, label, { anchor: "start", weight: "bold", size: 21 }) + text(205, y, value, { anchor: "start", size: 21 });
  s += row(180, "Hari", ": Senin–Rabu");
  s += row(215, "Tanggal", ": 16–18 November 2026");
  s += row(250, "Waktu", ": pukul 08.00–11.00");
  s += row(285, "Tempat", ": Perpustakaan Sekolah");
  s += `<rect x="40" y="315" width="600" height="190" rx="12" fill="#fff" stroke="#d97706" stroke-width="2"/>`;
  s += text(60, 350, "Cara ikut:", { anchor: "start", weight: "bold", size: 22, fill: "#92400e" });
  s += text(60, 385, "1. Bawa buku bekas yang masih layak dibaca.", { anchor: "start", size: 20 });
  s += text(60, 420, "2. Setiap 2 buku bekas ditukar dengan 1 kupon.", { anchor: "start", size: 20 });
  s += text(60, 455, "3. Tukarkan 1 kupon dengan 1 buku pilihanmu.", { anchor: "start", size: 20 });
  s += text(60, 488, "   Kupon hanya berlaku selama bazar.", { anchor: "start", size: 18, fill: "#57534e" });
  s += text(60, 545, "Kegiatan lain:", { anchor: "start", weight: "bold", size: 22, fill: "#92400e" });
  s += text(60, 580, "• Dongeng bersama Kak Rara — Selasa, pukul 09.00", { anchor: "start", size: 20 });
  s += text(60, 615, "• Lomba mewarnai sampul buku — Rabu, pukul 09.00", { anchor: "start", size: 20 });
  s += `<rect x="40" y="660" width="600" height="80" rx="40" fill="#b45309"/>`;
  s += text(340, 710, "Ayo berbagi buku, berbagi ilmu!", { size: 26, weight: "bold", fill: "#fff" });
  return svg(680, 780, s);
}

// Stimulus infografis Isi Piringku: ½ piring sayur (lebih banyak) + buah; ½ piring makanan pokok (lebih banyak) + lauk.
function imgPiring() {
  const cx = 260, cy = 290, rr = 190;
  const pt = (deg: number, rad = rr) => [cx + rad * Math.cos((deg * Math.PI) / 180), cy + rad * Math.sin((deg * Math.PI) / 180)].map((v) => v.toFixed(1)).join(",");
  // sudut SVG: 0° = kanan, searah jarum jam. Kiri (90°→270°): sayur 120°, buah 60°. Kanan (270°→450°): pokok 120°, lauk 60°.
  const sector = (a1: number, a2: number, fill: string) => `<path d="M${cx},${cy} L${pt(a1)} A${rr},${rr} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${pt(a2)} Z" fill="${fill}" stroke="#fff" stroke-width="4"/>`;
  let s = text(450, 44, "ISI PIRINGKU", { size: 34, weight: "bold", fill: "#166534" }) + text(450, 74, "Porsi dalam satu kali makan", { size: 19, fill: "#374151" });
  s += `<circle cx="${cx}" cy="${cy}" r="${rr + 18}" fill="#e5e7eb" stroke="#9ca3af" stroke-width="3"/>`;
  s += sector(90, 210, "#4ade80") + sector(210, 270, "#fb923c") + sector(270, 390, "#fde047") + sector(390, 450, "#f87171");
  const label = (deg: number, title: string, ex: string, at?: [number, number]) => {
    const [x, y] = at ?? pt(deg, 105).split(",").map(Number);
    return text(x, y - 4, title, { size: 19, weight: "bold" }) + text(x, y + 20, ex, { size: 15 });
  };
  s += label(150, "Sayuran", "bayam, wortel") + label(240, "Buah", "pisang, jeruk") + label(330, "Makanan pokok", "nasi, jagung, ubi") + label(420, "Lauk-pauk", "ikan, telur, tempe", [338, 398]);
  s += text(cx, cy + rr + 50, "Sayuran lebih banyak daripada buah.", { size: 16, fill: "#166534" });
  s += text(cx, cy + rr + 72, "Makanan pokok lebih banyak daripada lauk-pauk.", { size: 16, fill: "#166534" });
  // pesan di kanan
  const tip = (y: number, n: string, t1: string, t2: string) =>
    `<circle cx="540" cy="${y}" r="20" fill="#16a34a"/>` + text(540, y + 7, n, { size: 20, weight: "bold", fill: "#fff" }) +
    text(572, y - 2, t1, { anchor: "start", size: 19, weight: "bold" }) + text(572, y + 22, t2, { anchor: "start", size: 16 });
  s += `<rect x="510" y="115" width="380" height="430" rx="16" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>`;
  s += text(700, 150, "Jangan lupa!", { size: 22, weight: "bold", fill: "#166534" });
  s += tip(200, "1", "Cuci tangan", "pakai sabun sebelum makan.");
  s += tip(290, "2", "Minum air putih", "yang cukup setiap hari.");
  s += tip(380, "3", "Bergerak aktif", "setidaknya 30 menit sehari.");
  s += tip(470, "4", "Batasi gula, garam,", "dan minyak.");
  return svg(900, 580, s);
}

// ---------- Stimulus ----------

const stimuli = [
  {
    code: "SD-BIND-P4-POSTER",
    title: "Poster Bazar Tukar Buku",
    content: "Perhatikan poster berikut!",
    gambar: "poster-buku",
  },
  {
    code: "SD-BIND-P4-GUNUNG",
    title: "Mengenal Gunung Api",
    content: `Indonesia memiliki banyak gunung api. Jumlahnya lebih dari seratus. Gunung api adalah gunung yang dapat meletus. Di dalam perut bumi terdapat batuan cair yang sangat panas. Batuan cair itu disebut magma.

Magma dapat naik ke permukaan bumi. Magma yang keluar dari kawah disebut lava. Lava mengalir menuruni lereng gunung. Lava sangat panas dan dapat membakar apa saja.

Sebelum meletus, gunung api biasanya memberi tanda. Suhu di sekitar kawah menjadi lebih panas. Sumber air di lereng gunung mengering. Hewan-hewan turun dari gunung. Kadang terasa gempa kecil. Petugas pengamat gunung terus memantau tanda-tanda itu. Jika berbahaya, warga diminta mengungsi.

Letusan gunung api memang membahayakan. Namun, gunung api juga membawa manfaat. Abu letusan membuat tanah di sekitarnya menjadi subur. Sayuran dan buah tumbuh dengan baik. Gunung api juga menghasilkan pasir dan batu untuk bangunan. Pemandangan gunung yang indah menarik wisatawan.

Kita perlu waspada dan mengikuti arahan petugas. Dengan begitu, kita tetap aman tinggal di dekat gunung api.`,
  },
  {
    code: "SD-BIND-P4-PIRING",
    title: "Isi Piringku",
    content: "Perhatikan infografis berikut!",
    gambar: "isi-piringku",
  },
  {
    code: "SD-BIND-P4-LARI",
    title: "Juara Sejati",
    content: `Hari itu ada lomba lari di sekolahku. Aku sudah berlatih setiap sore. Aku ingin sekali menjadi juara. Teman-teman bersorak di pinggir lapangan.

Peluit berbunyi. Aku berlari sekencang-kencangnya. Aku berada di depan bersama Doni. Garis finis sudah terlihat. Tiba-tiba, Doni tersandung dan jatuh. Lututnya berdarah. Ia meringis kesakitan.

Aku bingung. Jika aku berhenti, aku pasti kalah. Namun, aku tidak tega melihat Doni. Aku pun berhenti dan membantunya berdiri. Kami berjalan pelan menuju garis finis. Pelari lain menyusul kami satu per satu.

Kami tiba paling akhir. Aku menunduk lesu. Kakiku terasa seberat batu. Aku gagal menjadi juara.

Ternyata, Pak Guru menghampiri kami. Ia menepuk bahuku. "Hari ini kamu memang tidak juara lomba lari. Namun, kamu juara di hati kami," katanya. Teman-teman bertepuk tangan. Doni tersenyum dan berterima kasih.

Sepulang sekolah, Ibu memberiku sebuah pita kertas berwarna emas. Ibu menulis kata "Juara Sejati" di atasnya. Aku menempel pita itu di dinding kamar. Hatiku hangat setiap kali melihatnya.`,
  },
  {
    code: "SD-BIND-P4-GURU",
    title: "Guruku",
    content: `Pagi-pagi engkau sudah menanti
di depan kelas dengan senyum berseri
kapur putih menari di papan hitam
menuliskan ilmu tak pernah padam

Engkau sabar mengajari kami
membaca, menulis, dan berhitung lagi
walau kami kadang nakal dan lupa
senyummu tetap hangat menyapa

Guruku, engkau pelita di jalanku
menerangi gelap dengan ilmumu
akan kuingat semua pesanmu
belajar giat untuk masa depanku`,
  },
  {
    code: "SD-BIND-P4-LANDAK",
    title: "Duri Lala",
    content: `Namaku Lala. Aku seekor anak landak. Tubuhku penuh duri yang tajam. Aku tinggal di tepi hutan bersama Ibu.

Aku ingin bermain bersama Kelinci dan Tupai. Namun, mereka selalu menjauh. Aku hanya bisa memandangi mereka dari jauh. "Durimu tajam, Lala. Nanti kami tertusuk," kata Kelinci. Hatiku menciut. Aku pulang dan menangis di pelukan Ibu. "Mengapa aku harus punya duri, Bu?" tanyaku.

Ibu mengelus kepalaku. "Durimu bukan untuk melukai, Nak. Durimu untuk melindungi," jawab Ibu.

Suatu sore, Kelinci dan Tupai bermain di padang rumput. Tiba-tiba, seekor rubah datang mengendap-endap. Kelinci dan Tupai ketakutan. Mereka tidak sempat lari. Aku segera berlari ke depan mereka. Aku menggulung tubuhku seperti bola berduri. Rubah mencoba menerkam, tetapi moncongnya tertusuk duriku. Rubah itu pun lari terbirit-birit.

Kelinci dan Tupai memelukku dengan hati-hati. "Terima kasih, Lala. Ternyata durimu sangat berguna," kata Tupai.

Sejak hari itu, mereka mengajakku bermain setiap hari. Kami bermain petak umpet di semak-semak. Aku tidak lagi malu dengan duriku.`,
  },
];

// ---------- Soal ----------

type Row = {
  kode_stimulus: string;
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

const MCMA = "\n\n(Jawaban benar lebih dari satu.)";

const rows: Row[] = [
  // ---- Poster Bazar Tukar Buku ----
  {
    kode_stimulus: "SD-BIND-P4-POSTER",
    kode_subdomain: "SD-BIND-D1-S4",
    bentuk_soal: "pg",
    pertanyaan: "Di mana bazar tukar buku diadakan?",
    opsi_a: "Di halaman sekolah.",
    opsi_b: "Di perpustakaan sekolah.",
    opsi_c: "Di ruang kelas.",
    opsi_d: "Di toko buku.",
    opsi_e: "Di aula desa.",
    kunci: "B",
    pembahasan: `Poster menuliskan "Tempat: Perpustakaan Sekolah". Informasi ini tersurat (tertulis langsung) pada poster.

Cek setiap pilihan:
- **A, C, E** — salah, halaman sekolah, ruang kelas, dan aula desa tidak disebut pada poster.
- **B** — benar, sesuai keterangan tempat.
- **D** — salah, bazar ini bukan di toko; buku tidak dibeli, tetapi ditukar.`,
    tingkat_kesulitan: "mudah",
  },
  {
    kode_stimulus: "SD-BIND-P4-POSTER",
    kode_subdomain: "SD-BIND-D1-S3",
    bentuk_soal: "pgk_kategori",
    kategori: "Sesuai/Tidak Sesuai",
    pertanyaan: "Nisa mencatat ringkasan isi poster. Tentukan **Sesuai** atau **Tidak Sesuai** setiap catatan Nisa dengan poster!",
    opsi_a: "Tanggal bazar: 16–18 November 2026.",
    opsi_b: "Waktu bazar: pukul 08.00–12.00.",
    opsi_c: "Dongeng bersama Kak Rara: hari Selasa.",
    opsi_d: "Lomba mewarnai sampul buku: hari Senin.",
    kunci: "S,TS,S,TS",
    pembahasan: `- **Sesuai** — poster menuliskan tanggal 16–18 November 2026.
- **Tidak Sesuai** — bazar berlangsung pukul 08.00–**11.00**, bukan sampai 12.00.
- **Sesuai** — dongeng bersama Kak Rara diadakan hari Selasa, pukul 09.00.
- **Tidak Sesuai** — lomba mewarnai sampul buku diadakan hari **Rabu**, bukan Senin.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P4-POSTER",
    kode_subdomain: "SD-BIND-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: "Kata \"kupon\" pada poster bermakna ....",
    opsi_a: "uang untuk membeli buku",
    opsi_b: "lembar tanda yang dapat ditukar dengan barang",
    opsi_c: "karcis masuk perpustakaan",
    opsi_d: "hadiah lomba mewarnai",
    opsi_e: "buku bekas yang masih layak dibaca",
    kunci: "B",
    pembahasan: `Pada poster, kupon didapat dari menukar 2 buku bekas, lalu "1 kupon" ditukar dengan "1 buku pilihanmu". Jadi, kupon adalah lembar tanda yang dapat ditukar dengan barang.

Cek setiap pilihan:
- **A** — salah, bazar ini tidak memakai uang; buku ditukar, bukan dibeli.
- **B** — benar.
- **C** — salah, poster tidak menyebut karcis masuk.
- **D** — salah, kupon didapat dari menyerahkan buku bekas, bukan dari lomba.
- **E** — salah, buku bekas adalah barang yang ditukar **menjadi** kupon, bukan kupon itu sendiri.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P4-POSTER",
    kode_subdomain: "SD-BIND-D3-S2",
    bentuk_soal: "pg",
    pertanyaan: "Beni membawa 5 buku bekas yang masih layak dibaca ke bazar. Berdasarkan poster, berapa buku pilihan paling banyak yang dapat Beni bawa pulang?",
    opsi_a: "1 buku",
    opsi_b: "2 buku",
    opsi_c: "3 buku",
    opsi_d: "5 buku",
    opsi_e: "10 buku",
    kunci: "B",
    pembahasan: `Menurut poster, setiap 2 buku bekas ditukar dengan 1 kupon, dan 1 kupon ditukar dengan 1 buku.

5 buku bekas = 2 buku + 2 buku + 1 buku. Empat buku pertama menjadi 2 kupon. Satu buku sisa belum cukup untuk 1 kupon. Jadi, Beni mendapat **2 kupon** dan dapat membawa pulang **2 buku**.

Cek setiap pilihan:
- **A. 1 buku** — salah, 4 buku bekas sudah cukup untuk 2 kupon.
- **B. 2 buku** — benar.
- **C. 3 buku** — salah, kupon ketiga butuh 6 buku bekas; buku sisa (1 buku) tidak bisa dibulatkan menjadi 1 kupon.
- **D. 5 buku** — salah, ini seperti tukar satu-satu, padahal aturannya 2 buku untuk 1 kupon.
- **E. 10 buku** — salah, aturannya terbalik (1 buku menjadi 2 kupon).`,
    tingkat_kesulitan: "sulit",
  },
  {
    kode_stimulus: "SD-BIND-P4-POSTER",
    kode_subdomain: "SD-BIND-D3-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Apa saja manfaat kegiatan pada poster bagi siswa dalam kehidupan sehari-hari?${MCMA}`,
    opsi_a: "Buku yang sudah selesai dibaca dapat bermanfaat bagi orang lain.",
    opsi_b: "Siswa mendapat bacaan baru tanpa harus membeli.",
    opsi_c: "Siswa makin gemar membaca.",
    opsi_d: "Siswa dapat menjual buku untuk mendapat uang.",
    opsi_e: "Siswa boleh tidak masuk kelas selama tiga hari.",
    kunci: "A,B,C",
    pembahasan: `Kegiatan ini bernama Pekan Literasi dan bertema "berbagi buku, berbagi ilmu". Siswa menukar buku lama dengan buku lain.

- **A** — benar, buku bekas yang ditukar akan dibaca siswa lain.
- **B** — benar, buku baru didapat dari menukar kupon, bukan membeli.
- **C** — benar, tujuan pekan literasi adalah menumbuhkan kegemaran membaca, didukung dongeng dan lomba bertema buku.
- **D** — salah, tidak ada jual beli dan tidak ada uang dalam bazar ini.
- **E** — salah, bazar hanya pukul 08.00–11.00 di perpustakaan; poster tidak menyebut siswa boleh tidak masuk kelas.`,
    tingkat_kesulitan: "sedang",
  },
  // ---- Mengenal Gunung Api ----
  {
    kode_stimulus: "SD-BIND-P4-GUNUNG",
    kode_subdomain: "SD-BIND-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: "Kata \"magma\" dalam teks bermakna ....",
    opsi_a: "batuan cair yang keluar dari kawah",
    opsi_b: "batuan cair yang sangat panas di dalam perut bumi",
    opsi_c: "abu yang membuat tanah subur",
    opsi_d: "lubang di puncak gunung",
    opsi_e: "pasir dan batu untuk bangunan",
    kunci: "B",
    pembahasan: `Paragraf pertama menjelaskan: "Di dalam perut bumi terdapat batuan cair yang sangat panas. Batuan cair itu disebut magma."

Cek setiap pilihan:
- **A** — salah, batuan cair yang sudah keluar dari kawah disebut **lava**, bukan magma. Bedanya ada pada tempatnya: magma di dalam bumi, lava di luar.
- **B** — benar.
- **C** — salah, ini abu letusan.
- **D** — salah, lubang di puncak gunung disebut kawah.
- **E** — salah, pasir dan batu adalah hasil gunung api, bukan magma.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P4-GUNUNG",
    kode_subdomain: "SD-BIND-D1-S4",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Menurut teks, apa saja tanda-tanda gunung api akan meletus?${MCMA}`,
    opsi_a: "Suhu di sekitar kawah menjadi lebih panas.",
    opsi_b: "Sumber air di lereng gunung mengering.",
    opsi_c: "Hewan-hewan turun dari gunung.",
    opsi_d: "Tanah di sekitar gunung menjadi subur.",
    opsi_e: "Banyak wisatawan datang ke gunung.",
    kunci: "A,B,C",
    pembahasan: `Paragraf ketiga menyebutkan tanda-tanda sebelum meletus: suhu sekitar kawah lebih panas, sumber air mengering, hewan turun dari gunung, dan kadang terasa gempa kecil.

- **A, B, C** — benar, ketiganya tertulis di paragraf ketiga.
- **D** — salah, tanah subur adalah **akibat** abu letusan (paragraf keempat), bukan tanda sebelum meletus.
- **E** — salah, wisatawan datang karena pemandangan indah (manfaat), bukan tanda letusan.`,
    tingkat_kesulitan: "mudah",
  },
  {
    kode_stimulus: "SD-BIND-P4-GUNUNG",
    kode_subdomain: "SD-BIND-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: "Ide pokok paragraf keempat teks tersebut adalah ....",
    opsi_a: "Abu letusan membuat tanah menjadi subur.",
    opsi_b: "Gunung api menghasilkan pasir dan batu.",
    opsi_c: "Selain membahayakan, gunung api juga membawa manfaat.",
    opsi_d: "Warga diminta mengungsi jika gunung berbahaya.",
    opsi_e: "Pemandangan gunung menarik wisatawan.",
    kunci: "C",
    pembahasan: `Ide pokok adalah gagasan yang menjadi inti satu paragraf; kalimat lain menjelaskannya. Paragraf keempat dibuka dengan "Letusan gunung api memang membahayakan. Namun, gunung api juga membawa manfaat." Kalimat-kalimat sesudahnya merinci manfaat itu.

Cek setiap pilihan:
- **A, B, E** — salah, ketiganya rincian manfaat (gagasan pendukung), bukan inti paragraf.
- **C** — benar, merangkum seluruh isi paragraf.
- **D** — salah, ini isi paragraf ketiga.`,
    tingkat_kesulitan: "sulit",
  },
  {
    kode_stimulus: "SD-BIND-P4-GUNUNG",
    kode_subdomain: "SD-BIND-D1-S3",
    bentuk_soal: "pg",
    pertanyaan: `Perhatikan kejadian berikut!
1) Lava mengalir menuruni lereng gunung.
2) Magma naik ke permukaan bumi.
3) Magma keluar dari kawah dan disebut lava.

Urutan kejadian yang sesuai dengan teks adalah ....`,
    opsi_a: "1) – 2) – 3)",
    opsi_b: "2) – 3) – 1)",
    opsi_c: "2) – 1) – 3)",
    opsi_d: "3) – 2) – 1)",
    opsi_e: "3) – 1) – 2)",
    kunci: "B",
    pembahasan: `Paragraf kedua menceritakan urutannya: magma naik ke permukaan bumi (2), keluar dari kawah dan disebut lava (3), lalu lava mengalir menuruni lereng (1).

Cek setiap pilihan:
- **A** — salah, lava tidak mungkin mengalir sebelum magma naik dan keluar.
- **B** — benar.
- **C** — salah, magma harus keluar dari kawah dulu sebelum menjadi lava yang mengalir.
- **D, E** — salah, magma harus naik dulu sebelum bisa keluar dari kawah.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P4-GUNUNG",
    kode_subdomain: "SD-BIND-D2-S2",
    bentuk_soal: "pgk_kategori",
    kategori: "Sesuai/Tidak Sesuai",
    pertanyaan: "Tentukan **Sesuai** atau **Tidak Sesuai** setiap pernyataan tentang perubahan di sekitar gunung api berikut dengan teks!",
    opsi_a: "Sebelum meletus, sumber air di lereng gunung mengering.",
    opsi_b: "Setelah letusan, abu membuat tanah di sekitar gunung menjadi tandus.",
    opsi_c: "Magma berubah sebutan menjadi lava setelah keluar dari kawah.",
    opsi_d: "Sebelum meletus, suhu di sekitar kawah menjadi lebih dingin.",
    kunci: "S,TS,S,TS",
    pembahasan: `- **Sesuai** — paragraf ketiga: "Sumber air di lereng gunung mengering."
- **Tidak Sesuai** — abu letusan justru membuat tanah **subur**. Tandus adalah lawan kata subur.
- **Sesuai** — paragraf kedua: "Magma yang keluar dari kawah disebut lava."
- **Tidak Sesuai** — suhu di sekitar kawah menjadi lebih **panas**, bukan lebih dingin.`,
    tingkat_kesulitan: "sulit",
  },
  // ---- Infografis Isi Piringku ----
  {
    kode_stimulus: "SD-BIND-P4-PIRING",
    kode_subdomain: "SD-BIND-D1-S2",
    bentuk_soal: "pg",
    pertanyaan: "Bagian piring yang berisi bayam dan wortel adalah ....",
    opsi_a: "makanan pokok",
    opsi_b: "lauk-pauk",
    opsi_c: "sayuran",
    opsi_d: "buah",
    opsi_e: "minuman",
    kunci: "C",
    pembahasan: `Pada infografis, bayam dan wortel ditulis sebagai contoh pada bagian **Sayuran**.

Cek setiap pilihan:
- **A** — salah, contoh makanan pokok adalah nasi, jagung, dan ubi.
- **B** — salah, contoh lauk-pauk adalah ikan, telur, dan tempe.
- **C** — benar.
- **D** — salah, contoh buah adalah pisang dan jeruk. Wortel berwarna oranye seperti jeruk, tetapi termasuk sayuran.
- **E** — salah, minuman tidak menjadi bagian piring; infografis hanya mengingatkan minum air putih.`,
    tingkat_kesulitan: "mudah",
  },
  {
    kode_stimulus: "SD-BIND-P4-PIRING",
    kode_subdomain: "SD-BIND-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: "Berdasarkan infografis, yang dimaksud dengan \"makanan pokok\" adalah ....",
    opsi_a: "makanan utama yang mengenyangkan, seperti nasi, jagung, dan ubi",
    opsi_b: "makanan pendamping nasi, seperti ikan, telur, dan tempe",
    opsi_c: "makanan ringan yang dimakan di antara waktu makan",
    opsi_d: "makanan yang paling sedikit di piring",
    opsi_e: "makanan yang manis dan segar, seperti pisang dan jeruk",
    kunci: "A",
    pembahasan: `Contoh makanan pokok pada infografis adalah nasi, jagung, dan ubi. Makanan pokok adalah makanan utama yang mengenyangkan dan dimakan setiap hari.

Cek setiap pilihan:
- **A** — benar.
- **B** — salah, ini pengertian lauk-pauk.
- **C** — salah, makanan ringan tidak ada pada infografis.
- **D** — salah, makanan pokok justru lebih banyak daripada lauk-pauk.
- **E** — salah, ini contoh buah.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P4-PIRING",
    kode_subdomain: "SD-BIND-D1-S3",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Rani menyusun ringkasan isi infografis. Ringkasan manakah yang sesuai?${MCMA}`,
    opsi_a: "Setengah piring berisi sayuran dan buah.",
    opsi_b: "Bagian sayuran lebih banyak daripada bagian buah.",
    opsi_c: "Bagian lauk-pauk lebih banyak daripada makanan pokok.",
    opsi_d: "Gula, garam, dan minyak perlu dibatasi.",
    opsi_e: "Air putih cukup diminum ketika haus saja.",
    kunci: "A,B,D",
    pembahasan: `Baca gambar piring dan catatan di bawahnya, lalu kotak "Jangan lupa!".

- **A** — benar, sisi kiri piring (setengah piring) berisi sayuran dan buah.
- **B** — benar, tertulis "Sayuran lebih banyak daripada buah", dan bagian hijau lebih lebar daripada bagian oranye.
- **C** — salah, tertulis "Makanan pokok lebih banyak daripada lauk-pauk". Pernyataan ini terbalik.
- **D** — benar, pesan nomor 4: "Batasi gula, garam, dan minyak."
- **E** — salah, pesan nomor 2 meminta minum air putih yang cukup **setiap hari**, bukan hanya saat haus.`,
    tingkat_kesulitan: "sulit",
  },
  {
    kode_stimulus: "SD-BIND-P4-PIRING",
    kode_subdomain: "SD-BIND-D3-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Sesuai/Tidak Sesuai",
    pertanyaan: "Tentukan **Sesuai** atau **Tidak Sesuai** setiap kebiasaan berikut dengan pesan infografis!",
    opsi_a: "Membawa bekal nasi, telur, sayur, dan potongan buah ke sekolah.",
    opsi_b: "Minum minuman manis setiap kali haus.",
    opsi_c: "Bermain lompat tali atau bersepeda setiap sore.",
    kunci: "S,TS,S",
    pembahasan: `- **Sesuai** — bekal itu berisi keempat kelompok makanan: makanan pokok (nasi), lauk-pauk (telur), sayuran, dan buah.
- **Tidak Sesuai** — infografis meminta membatasi gula dan minum air putih. Minuman manis setiap kali haus bertentangan dengan kedua pesan itu.
- **Sesuai** — lompat tali dan bersepeda adalah cara bergerak aktif, sesuai pesan nomor 3.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P4-PIRING",
    kode_subdomain: "SD-BIND-D3-S2",
    bentuk_soal: "pg",
    pertanyaan: "Piring makan siang Dimas hanya berisi nasi sepiring penuh dan sepotong ayam goreng. Saran yang paling sesuai dengan infografis adalah ....",
    opsi_a: "Tambahkan nasi agar Dimas lebih kenyang.",
    opsi_b: "Ganti ayam goreng dengan dua potong ayam goreng.",
    opsi_c: "Kurangi nasi, lalu isi setengah piring dengan sayuran dan buah.",
    opsi_d: "Ganti nasi dengan jagung, tetapi tetap tanpa sayuran.",
    opsi_e: "Tambahkan minuman manis agar makan lebih segar.",
    kunci: "C",
    pembahasan: `Piring Dimas tidak sesuai karena sayuran dan buah tidak ada, sedangkan nasi memenuhi seluruh piring. Menurut infografis, setengah piring seharusnya sayuran dan buah.

Cek setiap pilihan:
- **A** — salah, nasi sudah terlalu banyak.
- **B** — salah, lauk ditambah tetapi sayuran dan buah tetap tidak ada; ayam goreng juga banyak mengandung minyak yang perlu dibatasi.
- **C** — benar, porsi nasi dikurangi dan setengah piring diisi sayuran serta buah.
- **D** — salah, jagung memang makanan pokok, tetapi masalah utamanya (tidak ada sayuran dan buah) belum diperbaiki.
- **E** — salah, bertentangan dengan pesan membatasi gula.`,
    tingkat_kesulitan: "sedang",
  },
  // ---- Juara Sejati ----
  {
    kode_stimulus: "SD-BIND-P4-LARI",
    kode_subdomain: "SD-BIND-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: "Perubahan perasaan tokoh aku dari saat tiba paling akhir hingga akhir cerita adalah ....",
    opsi_a: "senang menjadi kecewa",
    opsi_b: "lesu dan kecewa menjadi bahagia dan bangga",
    opsi_c: "takut menjadi berani",
    opsi_d: "marah menjadi sabar",
    opsi_e: "bangga menjadi menyesal",
    kunci: "B",
    pembahasan: `Saat tiba paling akhir, tokoh aku "menunduk lesu" dan merasa "gagal menjadi juara". Setelah dipuji Pak Guru dan diberi pita "Juara Sejati" oleh Ibu, "hatiku hangat setiap kali melihatnya".

Cek setiap pilihan:
- **A** — salah, urutannya terbalik; cerita berakhir bahagia.
- **B** — benar.
- **C** — salah, tokoh aku tidak digambarkan takut.
- **D** — salah, tokoh aku tidak marah kepada siapa pun.
- **E** — salah, tokoh aku tidak menyesal telah menolong Doni.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P4-LARI",
    kode_subdomain: "SD-BIND-D2-S3",
    bentuk_soal: "pg",
    pertanyaan: "Makna ungkapan \"kakiku terasa seberat batu\" dalam cerita tersebut adalah ....",
    opsi_a: "kaki tokoh aku terluka parah",
    opsi_b: "tokoh aku menginjak batu besar",
    opsi_c: "tokoh aku merasa lesu dan tidak bersemangat melangkah",
    opsi_d: "kaki tokoh aku menjadi sangat kuat",
    opsi_e: "tokoh aku membawa batu di kakinya",
    kunci: "C",
    pembahasan: `Kaki tidak benar-benar menjadi batu. Ungkapan ini muncul setelah tokoh aku tiba paling akhir dan "menunduk lesu". Kaki yang terasa berat menggambarkan perasaan sedih, lesu, dan tidak bersemangat.

Cek setiap pilihan:
- **A** — salah, yang terluka adalah lutut Doni, bukan kaki tokoh aku.
- **B, E** — salah, memaknai ungkapan secara harfiah; tidak ada batu dalam cerita.
- **C** — benar.
- **D** — salah, "berat" di sini bukan berarti kuat.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P4-LARI",
    kode_subdomain: "SD-BIND-D2-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Sesuai/Tidak Sesuai",
    pertanyaan: "Tentukan **Sesuai** atau **Tidak Sesuai** setiap pernyataan tentang watak tokoh aku berikut dengan isi cerita!",
    opsi_a: "Tokoh aku rajin berlatih.",
    opsi_b: "Tokoh aku peduli kepada teman yang kesusahan.",
    opsi_c: "Tokoh aku hanya mementingkan kemenangan.",
    opsi_d: "Tokoh aku mudah menyerah.",
    kunci: "S,S,TS,TS",
    pembahasan: `- **Sesuai** — "Aku sudah berlatih setiap sore."
- **Sesuai** — tokoh aku berhenti berlari untuk membantu Doni yang jatuh.
- **Tidak Sesuai** — tokoh aku memang ingin juara, tetapi ia rela kalah demi menolong Doni. Jadi, ia tidak hanya mementingkan kemenangan.
- **Tidak Sesuai** — tokoh aku berlatih setiap sore dan berlari sekencang-kencangnya. Ia berhenti karena menolong teman, bukan karena menyerah.`,
    tingkat_kesulitan: "sulit",
  },
  {
    kode_stimulus: "SD-BIND-P4-LARI",
    kode_subdomain: "SD-BIND-D3-S3",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Perasaan apa saja yang mungkin muncul pada pembaca ketika Pak Guru berkata, "Namun, kamu juara di hati kami"?${MCMA}`,
    opsi_a: "Terharu.",
    opsi_b: "Ikut bangga kepada tokoh aku.",
    opsi_c: "Senang.",
    opsi_d: "Marah kepada Pak Guru.",
    opsi_e: "Takut.",
    kunci: "A,B,C",
    pembahasan: `Sebelumnya tokoh aku merasa gagal. Ucapan Pak Guru menghargai kebaikannya menolong Doni, dan teman-teman bertepuk tangan.

- **A, B, C** — benar, pembaca wajar terharu, ikut bangga, dan senang karena kebaikan tokoh aku dihargai.
- **D** — salah, Pak Guru justru memuji; tidak ada alasan marah.
- **E** — salah, tidak ada bagian yang menakutkan.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P4-LARI",
    kode_subdomain: "SD-BIND-D1-S2",
    bentuk_soal: "pg",
    pertanyaan: `Perhatikan ciri-ciri berikut!
- Terbuat dari kertas berwarna emas.
- Bertuliskan "Juara Sejati".
- Ditempel di dinding kamar.

Benda yang dimaksud adalah ....`,
    opsi_a: "medali",
    opsi_b: "piala",
    opsi_c: "pita",
    opsi_d: "sertifikat",
    opsi_e: "bendera",
    kunci: "C",
    pembahasan: `Paragraf terakhir: Ibu memberi "sebuah pita kertas berwarna emas" dan menulis "Juara Sejati" di atasnya. Tokoh aku menempel pita itu di dinding kamar.

Cek setiap pilihan:
- **A, B** — salah, medali dan piala biasanya hadiah juara lomba; tokoh aku tidak menerimanya.
- **C** — benar.
- **D, E** — salah, sertifikat dan bendera tidak disebut dalam cerita.`,
    tingkat_kesulitan: "mudah",
  },
  // ---- Puisi Guruku ----
  {
    kode_stimulus: "SD-BIND-P4-GURU",
    kode_subdomain: "SD-BIND-D2-S3",
    bentuk_soal: "pg",
    pertanyaan: "Makna larik \"Guruku, engkau pelita di jalanku\" adalah ....",
    opsi_a: "guru membawa lampu ketika berjalan",
    opsi_b: "guru memberi ilmu yang menuntun hidupku",
    opsi_c: "guru menyalakan lampu di kelas",
    opsi_d: "guru mengantar murid pulang pada malam hari",
    opsi_e: "guru memperbaiki jalan menuju sekolah",
    kunci: "B",
    pembahasan: `Pelita adalah lampu yang menerangi kegelapan. Larik berikutnya, "menerangi gelap dengan ilmumu", menunjukkan bahwa yang dimaksud adalah ilmu guru yang membuat murid tahu arah dan tidak "gelap" (tidak tahu).

Cek setiap pilihan:
- **A, C, D, E** — salah, semuanya memaknai "pelita" dan "jalan" secara harfiah (lampu sungguhan, jalan sungguhan).
- **B** — benar.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P4-GURU",
    kode_subdomain: "SD-BIND-D1-S2",
    bentuk_soal: "pg",
    pertanyaan: "Benda yang dipakai guru untuk menuliskan ilmu pada bait pertama adalah ....",
    opsi_a: "pensil",
    opsi_b: "spidol",
    opsi_c: "kapur",
    opsi_d: "pulpen",
    opsi_e: "kuas",
    kunci: "C",
    pembahasan: `Bait pertama berbunyi "kapur putih menari di papan hitam / menuliskan ilmu tak pernah padam". Benda yang dipakai menulis adalah **kapur**.

Cek setiap pilihan:
- **A, B, D, E** — salah, pensil, spidol, pulpen, dan kuas tidak disebut dalam puisi. Spidol dipakai pada papan putih, sedangkan puisi menyebut papan hitam.
- **C** — benar.`,
    tingkat_kesulitan: "mudah",
  },
  {
    kode_stimulus: "SD-BIND-P4-GURU",
    kode_subdomain: "SD-BIND-D3-S3",
    bentuk_soal: "pg",
    pertanyaan: "Perasaan penyair terhadap gurunya yang paling terasa dalam puisi tersebut adalah ....",
    opsi_a: "takut dan cemas",
    opsi_b: "kesal dan marah",
    opsi_c: "hormat dan berterima kasih",
    opsi_d: "bosan dan malas",
    opsi_e: "sedih dan kecewa",
    kunci: "C",
    pembahasan: `Penyair memuji guru yang sabar, tetap tersenyum walau murid nakal, dan menyebut guru sebagai "pelita di jalanku". Penyair juga berjanji mengingat pesan guru. Semua itu menunjukkan rasa hormat dan terima kasih.

Cek setiap pilihan:
- **A, B, D, E** — salah, tidak ada larik yang menunjukkan takut, kesal, bosan, atau kecewa kepada guru. Kata "nakal dan lupa" menggambarkan murid, bukan perasaan penyair kepada guru.
- **C** — benar.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P4-GURU",
    kode_subdomain: "SD-BIND-D2-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Pesan apa saja yang dapat diambil dari puisi tersebut?${MCMA}`,
    opsi_a: "Kita patut menghormati dan menyayangi guru.",
    opsi_b: "Kita perlu belajar dengan giat.",
    opsi_c: "Kita sebaiknya mengingat nasihat guru.",
    opsi_d: "Guru harus selalu marah agar murid patuh.",
    opsi_e: "Belajar cukup dilakukan di sekolah saja.",
    kunci: "A,B,C",
    pembahasan: `- **A** — benar, seluruh puisi memuji kebaikan dan kesabaran guru.
- **B** — benar, larik terakhir: "belajar giat untuk masa depanku".
- **C** — benar, "akan kuingat semua pesanmu".
- **D** — salah, puisi justru menggambarkan guru yang tetap tersenyum walau murid nakal.
- **E** — salah, puisi tidak membatasi belajar hanya di sekolah.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P4-GURU",
    kode_subdomain: "SD-BIND-D3-S2",
    bentuk_soal: "pgk_kategori",
    kategori: "Sesuai/Tidak Sesuai",
    pertanyaan: "Tentukan **Sesuai** atau **Tidak Sesuai** setiap pernyataan berikut dengan isi puisi!",
    opsi_a: "Guru sudah menunggu murid di depan kelas pada pagi hari.",
    opsi_b: "Guru sering marah ketika murid nakal.",
    opsi_c: "Guru mengajari murid membaca, menulis, dan berhitung.",
    opsi_d: "Penyair berjanji belajar giat untuk masa depannya.",
    kunci: "S,TS,S,S",
    pembahasan: `- **Sesuai** — bait pertama: "Pagi-pagi engkau sudah menanti / di depan kelas".
- **Tidak Sesuai** — bait kedua: "walau kami kadang nakal dan lupa / senyummu tetap hangat menyapa". Guru tetap tersenyum, tidak marah.
- **Sesuai** — bait kedua: "membaca, menulis, dan berhitung lagi".
- **Sesuai** — bait ketiga: "belajar giat untuk masa depanku".`,
    tingkat_kesulitan: "sulit",
  },
  // ---- Duri Lala ----
  {
    kode_stimulus: "SD-BIND-P4-LANDAK",
    kode_subdomain: "SD-BIND-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: "Perubahan sikap Kelinci dan Tupai terhadap Lala dari awal hingga akhir cerita adalah ....",
    opsi_a: "akrab menjadi menjauh",
    opsi_b: "menjauhi Lala menjadi mengajaknya bermain setiap hari",
    opsi_c: "takut kepada rubah menjadi takut kepada Lala",
    opsi_d: "mengejek Lala menjadi memarahinya",
    opsi_e: "tidak berubah sama sekali",
    kunci: "B",
    pembahasan: `Di awal, Kelinci dan Tupai "selalu menjauh" karena takut tertusuk duri Lala. Setelah Lala melindungi mereka dari rubah, "mereka mengajakku bermain setiap hari".

Cek setiap pilihan:
- **A** — salah, urutannya terbalik.
- **B** — benar.
- **C** — salah, di akhir mereka tidak lagi takut kepada Lala; mereka justru memeluknya.
- **D** — salah, mereka tidak mengejek maupun memarahi Lala.
- **E** — salah, sikap mereka jelas berubah.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P4-LANDAK",
    kode_subdomain: "SD-BIND-D2-S3",
    bentuk_soal: "pg",
    pertanyaan: "Makna ungkapan \"hatiku menciut\" dalam cerita tersebut adalah ....",
    opsi_a: "Lala merasa sedih dan kecil hati",
    opsi_b: "Lala merasa sangat marah",
    opsi_c: "tubuh Lala menjadi kecil",
    opsi_d: "Lala sedang sakit dada",
    opsi_e: "Lala merasa berani",
    kunci: "A",
    pembahasan: `Hati tidak benar-benar mengecil. Ungkapan ini muncul setelah Kelinci menolak bermain karena takut duri Lala, lalu Lala "pulang dan menangis". Hati yang menciut berarti merasa sedih dan kecil hati (tidak percaya diri).

Cek setiap pilihan:
- **A** — benar.
- **B** — salah, Lala menangis, bukan marah.
- **C, D** — salah, memaknai ungkapan secara harfiah.
- **E** — salah, berlawanan dengan perasaan Lala saat itu.`,
    tingkat_kesulitan: "sulit",
  },
  {
    kode_stimulus: "SD-BIND-P4-LANDAK",
    kode_subdomain: "SD-BIND-D3-S3",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Perasaan apa saja yang mungkin muncul pada pembaca ketika rubah datang hingga rubah lari terbirit-birit?${MCMA}`,
    opsi_a: "Cemas akan keselamatan Kelinci dan Tupai.",
    opsi_b: "Tegang menunggu apa yang akan terjadi.",
    opsi_c: "Lega ketika rubah pergi.",
    opsi_d: "Bosan karena tidak ada kejadian penting.",
    opsi_e: "Kesal kepada Lala.",
    kunci: "A,B,C",
    pembahasan: `Rubah datang mengendap-endap dan Kelinci serta Tupai tidak sempat lari, sehingga pembaca cemas dan tegang. Lala melindungi mereka sampai rubah lari, sehingga pembaca merasa lega.

- **A, B, C** — benar.
- **D** — salah, bagian ini justru bagian paling menegangkan dalam cerita.
- **E** — salah, Lala bertindak berani menolong temannya; tidak ada alasan kesal kepadanya.`,
    tingkat_kesulitan: "sulit",
  },
  {
    kode_stimulus: "SD-BIND-P4-LANDAK",
    kode_subdomain: "SD-BIND-D3-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Sesuai/Tidak Sesuai",
    pertanyaan: "Cerita tersebut dapat dihubungkan dengan kehidupan sehari-hari. Tentukan **Sesuai** atau **Tidak Sesuai** setiap tindakan berikut dengan pelajaran dari cerita!",
    opsi_a: "Tidak menjauhi teman hanya karena ia berbeda dari kita.",
    opsi_b: "Mengejek teman karena bentuk tubuhnya.",
    opsi_c: "Menggunakan kelebihan diri untuk membantu teman.",
    kunci: "S,TS,S",
    pembahasan: `- **Sesuai** — Kelinci dan Tupai semula menjauhi Lala karena durinya, lalu menyadari duri itu berguna. Pelajarannya: jangan menjauhi teman karena perbedaan.
- **Tidak Sesuai** — cerita mengajarkan menghargai keadaan setiap teman, bukan mengejeknya.
- **Sesuai** — Lala memakai durinya untuk melindungi teman dari rubah.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P4-LANDAK",
    kode_subdomain: "SD-BIND-D1-S4",
    bentuk_soal: "pg",
    pertanyaan: "Mengapa Kelinci dan Tupai selalu menjauh dari Lala pada awal cerita?",
    opsi_a: "Lala suka berbohong.",
    opsi_b: "Mereka takut tertusuk duri Lala.",
    opsi_c: "Lala tinggal terlalu jauh.",
    opsi_d: "Mereka tidak suka bermain petak umpet.",
    opsi_e: "Ibu Lala melarang mereka bermain.",
    kunci: "B",
    pembahasan: `Paragraf kedua: "Durimu tajam, Lala. Nanti kami tertusuk," kata Kelinci. Alasan ini tertulis langsung dalam cerita.

Cek setiap pilihan:
- **A, C, E** — salah, tidak disebutkan dalam cerita.
- **B** — benar.
- **D** — salah, di akhir cerita mereka justru bermain petak umpet bersama Lala.`,
    tingkat_kesulitan: "mudah",
  },
];

export default {
  title: "TKA SD Bahasa Indonesia — Paket 4",
  description: "30 soal dari 6 bacaan: poster bazar tukar buku, infografis Isi Piringku, teks informasi tentang gunung api, cerita tentang lomba lari dan anak landak, serta puisi tentang guru. Dilengkapi gambar dan pembahasan setiap pilihan jawaban.",
  jenjang: "SD",
  subjectCode: "SD-BIND",
  durationMinutes: 75,
  isPremium: true,
  isFullSimulation: true,
  createdByEmail: "kpbgalimka@gmail.com",
  stimuli,
  rows,
  images: {
    "poster-buku": { title: "Poster Pekan Literasi — bazar tukar buku", svg: imgPoster() },
    "isi-piringku": { title: "Infografis Isi Piringku", svg: imgPiring() },
  },
};
