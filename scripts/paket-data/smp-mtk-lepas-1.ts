// Soal lepas SMP Matematika (ditulis Claude) — 5 soal khusus bank soal (bankOnly, tanpa paket).
// 4/4 topik: Bilangan Real, Persamaan & Pertidaksamaan Linear, Objek Geometri (jaring-jaring),
// Pengukuran (luas permukaan prisma), Data (perbandingan dua kelompok).
// 3 PG · 1 MCMA · 1 Kategori; mudah 1 · sedang 2 · sulit 2; L1 1 · L2 2 · L3 2. 1 gambar SVG baru (tenda prisma).
const r = String.raw;
const FONT = `font-family="Arial, Helvetica, sans-serif"`;
const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" ${FONT}><rect width="${w}" height="${h}" fill="#fff"/>${body}</svg>`;
const text = (x: number, y: number, t: string, o: { size?: number; anchor?: string; weight?: string } = {}) =>
  `<text x="${x}" y="${y}" font-size="${o.size ?? 18}" text-anchor="${o.anchor ?? "middle"}" font-weight="${o.weight ?? "normal"}" fill="#111">${t}</text>`;
const line = (x1: number, y1: number, x2: number, y2: number, o: { stroke?: string; w?: number; dash?: boolean } = {}) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.stroke ?? "#111"}" stroke-width="${o.w ?? 2.5}"${o.dash ? ` stroke-dasharray="7 6"` : ""}/>`;

// Tenda prisma segitiga: segitiga depan alas 4 m, tinggi 1,5 m; panjang tenda 5 m; tanpa alas.
function tenda() {
  const F = { l: [90, 360], r: [290, 360], t: [190, 210] }; // depan
  const d = [230, -110]; // geser ke belakang
  const B = { l: [F.l[0] + d[0], F.l[1] + d[1]], r: [F.r[0] + d[0], F.r[1] + d[1]], t: [F.t[0] + d[0], F.t[1] + d[1]] };
  const pts = (...p: number[][]) => p.map(([x, y]) => `${x},${y}`).join(" ");
  let s = `<polygon points="${pts(F.t, B.t, B.r, F.r)}" fill="#fdba74" stroke="none"/>`; // sisi miring kanan
  s += `<polygon points="${pts(F.l, F.r, F.t)}" fill="#fb923c" stroke="none"/>`; // segitiga depan
  s += line(B.l[0], B.l[1], B.r[0], B.r[1], { dash: true, w: 1.5, stroke: "#6b7280" }) + line(B.l[0], B.l[1], F.l[0], F.l[1], { dash: true, w: 1.5, stroke: "#6b7280" }) + line(B.l[0], B.l[1], B.t[0], B.t[1], { dash: true, w: 1.5, stroke: "#6b7280" });
  s += line(F.l[0], F.l[1], F.r[0], F.r[1]) + line(F.r[0], F.r[1], F.t[0], F.t[1]) + line(F.t[0], F.t[1], F.l[0], F.l[1]);
  s += line(F.t[0], F.t[1], B.t[0], B.t[1]) + line(F.r[0], F.r[1], B.r[0], B.r[1]) + line(B.r[0], B.r[1], B.t[0], B.t[1]);
  // ukuran
  s += line(F.t[0], F.t[1], F.t[0], F.l[1], { dash: true, w: 1.8, stroke: "#1d4ed8" });
  s += `<rect x="${F.t[0]}" y="${F.l[1] - 14}" width="14" height="14" fill="none" stroke="#1d4ed8" stroke-width="1.5"/>`;
  s += `<rect x="${F.t[0] - 64}" y="281" width="58" height="26" rx="4" fill="#fff" fill-opacity="0.9"/>`;
  s += text(F.t[0] - 9, 300, "1,5 m", { size: 19, weight: "bold", anchor: "end" });
  s += text((F.l[0] + F.r[0]) / 2, F.l[1] + 32, "4 m", { size: 19, weight: "bold" });
  s += text((F.r[0] + B.r[0]) / 2 + 22, (F.r[1] + B.r[1]) / 2 + 26, "5 m", { size: 19, weight: "bold", anchor: "start" });
  return svg(600, 420, s);
}

type Row = {
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
  level_kognitif: string;
  gambar?: string;
  bankOnly: true;
};

const MCMA = "\n\nPilihlah **semua** jawaban yang benar!";

const rows: Row[] = [
  {
    // 1 — Bilangan Real (notasi ilmiah, operasi bilangan berpangkat)
    kode_subdomain: "SMP-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Jarak rata-rata Bumi ke Matahari adalah $1{,}5 \times 10^{8}$ km. Cahaya merambat dengan kecepatan $3 \times 10^{5}$ km per detik. Waktu yang diperlukan cahaya Matahari untuk sampai ke Bumi adalah ....`,
    opsi_a: "50 detik",
    opsi_b: "8 menit 20 detik",
    opsi_c: "83 menit 20 detik",
    opsi_d: "8 jam 20 menit",
    kunci: "B",
    pembahasan: r`Waktu $=$ jarak $\div$ kecepatan:

$\dfrac{1{,}5 \times 10^{8}}{3 \times 10^{5}} = \dfrac{1{,}5}{3} \times 10^{8-5} = 0{,}5 \times 10^{3} = 500$ detik.

$500$ detik $= 8 \times 60 + 20$, yaitu **8 menit 20 detik**.

Cek setiap pilihan:
- **A.** 50 detik — salah, pangkatnya dihitung $10^{2}$ (kurang satu), padahal $8 - 5 = 3$.
- **B.** 8 menit 20 detik — benar.
- **C.** 83 menit 20 detik — salah, ini $5.000$ detik. Pangkatnya dihitung $10^{4}$, padahal $8 - 5 = 3$.
- **D.** 8 jam 20 menit — salah, hasil 500 dianggap dalam **menit**. Satuan hasil bagi km dengan km/detik adalah **detik**.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
    bankOnly: true,
  },
  {
    // 2 — Persamaan linear satu variabel (model kontekstual)
    kode_subdomain: "SMP-MTK-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: "Tarif parkir sepeda motor di sebuah pusat perbelanjaan adalah Rp5.000,00 untuk 2 jam pertama dan Rp3.000,00 untuk setiap jam berikutnya. Pak Dodi membayar Rp20.000,00. Lama Pak Dodi memarkir sepeda motornya adalah ....",
    opsi_a: "4 jam",
    opsi_b: "5 jam",
    opsi_c: "6 jam",
    opsi_d: "7 jam",
    kunci: "D",
    pembahasan: r`Misalkan lama parkir $t$ jam ($t > 2$). Biaya $= 5.000 + 3.000(t - 2)$.

$5.000 + 3.000(t - 2) = 20.000$
$3.000(t - 2) = 15.000$
$t - 2 = 5$
$t = 7$ jam.

Cek: 2 jam pertama Rp5.000, ditambah 5 jam berikutnya $5 \times 3.000 = 15.000$, total Rp20.000. ✔

- **A.** 4 jam — salah, seluruh biaya dibagi Rp5.000 seolah-olah tarifnya Rp5.000 per jam: $20.000 \div 5.000 = 4$.
- **B.** 5 jam — salah, itu banyak jam **setelah** 2 jam pertama. 2 jam pertama belum ditambahkan.
- **C.** 6 jam — salah, tarif Rp5.000 dianggap hanya untuk 1 jam pertama: $5.000 + 3.000(t - 1) = 20.000$, sehingga $t = 6$.
- **D.** 7 jam — benar.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
    bankOnly: true,
  },
  {
    // 3 — Objek Geometri (jaring-jaring bangun ruang)
    kode_subdomain: "SMP-MTK-D3-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Tentukan **Benar** atau **Salah** setiap pernyataan tentang jaring-jaring bangun ruang berikut!",
    opsi_a: "Jaring-jaring limas segi empat terdiri atas 1 persegi dan 4 segitiga.",
    opsi_b: "Jaring-jaring tabung terdiri atas 2 lingkaran dan 1 persegi panjang.",
    opsi_c: "Jaring-jaring prisma segitiga terdiri atas 3 segitiga dan 2 persegi panjang.",
    opsi_d: "Jaring-jaring kerucut terdiri atas 1 lingkaran dan 1 juring lingkaran.",
    kunci: "B,B,S,B",
    pembahasan: `Jaring-jaring adalah rangkaian sisi bangun ruang yang dibuka menjadi bangun datar.

- **Benar** — limas segi empat (beralas persegi) punya 1 alas persegi dan 4 sisi tegak berbentuk segitiga.
- **Benar** — tabung punya 2 lingkaran (alas dan tutup) dan selimut yang jika dibuka berbentuk persegi panjang.
- **Salah** — prisma segitiga punya **2 segitiga** (alas dan tutup) dan **3 persegi panjang** (sisi tegak). Jumlahnya tertukar.
- **Benar** — kerucut punya 1 alas lingkaran dan selimut yang jika dibuka berbentuk juring lingkaran.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
    bankOnly: true,
  },
  {
    // 4 — Pengukuran (luas daerah gabungan pada permukaan prisma, Pythagoras)
    kode_subdomain: "SMP-MTK-D3-S3",
    bentuk_soal: "pg",
    pertanyaan: "Gambar berikut adalah tenda berbentuk prisma segitiga. Segitiga bagian depan berbentuk segitiga sama kaki dengan panjang alas 4 m dan tinggi 1,5 m. Panjang tenda 5 m. Tenda dibuat dari kain, termasuk bagian depan dan belakang, tetapi **tidak memakai alas**. Luas kain minimal yang diperlukan adalah ....",
    gambar: "tenda",
    opsi_a: "25 m²",
    opsi_b: "26 m²",
    opsi_c: "31 m²",
    opsi_d: "51 m²",
    kunci: "C",
    pembahasan: r`Kain menutup 2 sisi miring (persegi panjang) dan 2 segitiga (depan dan belakang).

**Panjang sisi miring segitiga.** Tinggi segitiga membagi alas menjadi dua bagian 2 m. Dengan Teorema Pythagoras: $\sqrt{2^2 + 1{,}5^2} = \sqrt{4 + 2{,}25} = \sqrt{6{,}25} = 2{,}5$ m.

- 2 sisi miring: $2 \times (2{,}5 \times 5) = 25$ m²
- 2 segitiga: $2 \times \left(\dfrac{1}{2} \times 4 \times 1{,}5\right) = 6$ m²
- Total: $25 + 6 = 31$ m²

Cek setiap pilihan:
- **A.** 25 m² — salah, segitiga depan dan belakang lupa dihitung.
- **B.** 26 m² — salah, sisi miring dianggap 2 m (setengah alas), padahal sisi miring adalah sisi terpanjang segitiga siku-siku: $2 \times (2 \times 5) + 6 = 26$.
- **C.** 31 m² — benar.
- **D.** 51 m² — salah, alas tenda $4 \times 5 = 20$ m² ikut dihitung, padahal tenda tidak memakai alas.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
    bankOnly: true,
  },
  {
    // 5 — Data (perbandingan ukuran pemusatan & penyebaran dua kelompok)
    kode_subdomain: "SMP-MTK-D4-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Nilai ulangan lima siswa dari dua kelompok belajar adalah sebagai berikut.

| Kelompok | Nilai |
|---|---|
| A | 60, 70, 70, 80, 90 |
| B | 65, 70, 75, 75, 80 |

Manakah pernyataan berikut yang benar?` + MCMA,
    opsi_a: "Rata-rata nilai kelompok A lebih tinggi daripada kelompok B.",
    opsi_b: "Median nilai kelompok B lebih tinggi daripada kelompok A.",
    opsi_c: "Jangkauan nilai kelompok A dua kali jangkauan nilai kelompok B.",
    opsi_d: "Modus nilai kedua kelompok sama.",
    opsi_e: "Jika nilai 90 pada kelompok A diganti menjadi 60, median kelompok A berubah.",
    kunci: "A,B,C",
    pembahasan: r`**Kelompok A** (60, 70, 70, 80, 90): rata-rata $= \dfrac{370}{5} = 74$, median $= 70$, modus $= 70$, jangkauan $= 90 - 60 = 30$.

**Kelompok B** (65, 70, 75, 75, 80): rata-rata $= \dfrac{365}{5} = 73$, median $= 75$, modus $= 75$, jangkauan $= 80 - 65 = 15$.

- **A** — benar, $74 > 73$.
- **B** — benar, $75 > 70$. Rata-rata dan median bisa memberi kesimpulan berbeda: rata-rata A lebih tinggi karena terangkat nilai 90.
- **C** — benar, $30 = 2 \times 15$. Nilai kelompok B lebih seragam.
- **D** — salah, modus A adalah 70, sedangkan modus B adalah 75.
- **E** — salah, setelah diurutkan, data baru menjadi 60, 60, 70, 70, 80. Data ke-3 tetap 70, jadi mediannya tidak berubah. Yang berubah adalah rata-ratanya (menjadi 68).`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
    bankOnly: true,
  },
];

export default {
  title: "Soal lepas SMP Matematika (bank soal)",
  description: "",
  jenjang: "SMP",
  subjectCode: "SMP-MTK",
  durationMinutes: 75,
  isPremium: true,
  createdByEmail: "kpbgalimka@gmail.com",
  stimuli: [],
  rows,
  images: {
    tenda: { title: "Tenda berbentuk prisma segitiga", svg: tenda() },
  },
};
