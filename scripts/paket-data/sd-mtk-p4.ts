// TKA SD Matematika — Paket 4 (ditulis Claude). 30 soal: 18 PG · 6 MCMA · 6 Kategori;
// 4/4 subtopik; L1 6 · L2 16 · L3 8. 3 gambar SVG baru: jaring-jaring kubus, dinding gudang,
// diagram batang tiket. Pembahasan membahas setiap pilihan (kenapa benar / kenapa salah).
const r = String.raw;
const FONT = `font-family="Arial, Helvetica, sans-serif"`;
const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" ${FONT}><rect width="${w}" height="${h}" fill="#fff"/>${body}</svg>`;
const text = (x: number, y: number, t: string, o: { size?: number; anchor?: string; weight?: string; fill?: string } = {}) =>
  `<text x="${x}" y="${y}" font-size="${o.size ?? 18}" text-anchor="${o.anchor ?? "middle"}" font-weight="${o.weight ?? "normal"}" fill="${o.fill ?? "#111"}">${t}</text>`;
const line = (x1: number, y1: number, x2: number, y2: number, o: { stroke?: string; w?: number; dash?: boolean } = {}) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.stroke ?? "#111"}" stroke-width="${o.w ?? 2}"${o.dash ? ` stroke-dasharray="6 5"` : ""}/>`;

// ---------- Gambar ----------

// Soal 16 — lima rangkaian enam persegi; (1), (3), (5) jaring-jaring kubus.
function imgJaring() {
  const nets: [number, number][][] = [
    [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]], // salib 1-4-1
    [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]], // 2 × 3 (bukan)
    [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2]], // tangga 2-2-2
    [[0, 0], [1, 0], [0, 1], [1, 1], [2, 1], [3, 1]], // ada blok 2 × 2 (bukan)
    [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [3, 2]], // 1-4-1 berseberangan
  ];
  const c = 34;
  let s = "";
  nets.forEach((cells, i) => {
    const ox = 22 + i * 170, oy = 30;
    for (const [x, y] of cells) s += `<rect x="${ox + x * c}" y="${oy + y * c}" width="${c}" height="${c}" fill="#dbeafe" stroke="#1e3a8a" stroke-width="2"/>`;
    s += text(ox + 68, 170, `(${i + 1})`, { size: 20, weight: "bold" });
  });
  return svg(860, 190, s);
}

// Stimulus dinding gudang — persegi panjang 8 m × 3 m + segitiga (alas 8 m, tinggi 3 m, sisi miring 5 m), pintu 1 m × 2 m.
function imgDinding() {
  const u = 40, x0 = 90, base = 280; // 1 m = 40 px
  const L = x0, R = x0 + 8 * u, top = base - 3 * u, peak = top - 3 * u, mid = x0 + 4 * u;
  let s = `<path d="M${L},${base} L${R},${base} L${R},${top} L${mid},${peak} L${L},${top} Z" fill="#fde68a" stroke="#92400e" stroke-width="3"/>`;
  s += line(L, top, R, top, { stroke: "#92400e", w: 2 });
  s += `<rect x="${mid - u / 2}" y="${base - 2 * u}" width="${u}" height="${2 * u}" fill="#a16207" stroke="#451a03" stroke-width="2"/><circle cx="${mid + 12}" cy="${base - u}" r="3" fill="#fde68a"/>`;
  s += line(mid, top, mid, peak, { dash: true, stroke: "#1d4ed8" }) + `<path d="M${mid},${top} h10 v-10 h-10" fill="none" stroke="#1d4ed8" stroke-width="1.5"/>`;
  s += text(mid - 10, top - 55, "3 m", { anchor: "end", fill: "#1d4ed8", weight: "bold" });
  s += text((L + R) / 2, base + 30, "8 m", { weight: "bold" });
  s += text(R + 12, (base + top) / 2 + 6, "3 m", { anchor: "start", weight: "bold" });
  s += text((R + mid) / 2 + 22, (top + peak) / 2 - 4, "5 m", { anchor: "start", weight: "bold" });
  s += text(mid + u / 2 + 8, base - 2 * u - 8, "pintu 1 m × 2 m", { anchor: "start", size: 15 });
  return svg(520, 320, s);
}

// Stimulus diagram batang tiket — kelas I–VI: 25, 30, 45, 40, 55, 35 (garis bantu tiap 5).
function imgTiket() {
  const data: [string, number][] = [["I", 25], ["II", 30], ["III", 45], ["IV", 40], ["V", 55], ["VI", 35]];
  const x0 = 80, y0 = 360, h = 5; // 1 tiket = 5 px
  let s = text(340, 30, "Banyak Tiket Pentas Seni yang Terjual", { size: 19, weight: "bold" });
  for (let v = 0; v <= 60; v += 5) {
    s += line(x0, y0 - v * h, 620, y0 - v * h, { stroke: v % 10 === 0 ? "#9ca3af" : "#e5e7eb", w: 1 });
    s += text(x0 - 10, y0 - v * h + 5, String(v), { anchor: "end", size: 14 });
  }
  data.forEach(([k, v], i) => {
    const x = x0 + 25 + i * 88;
    s += `<rect x="${x}" y="${y0 - v * h}" width="52" height="${v * h}" fill="#2563eb"/>`;
    s += text(x + 26, y0 + 24, k, { size: 16, weight: "bold" });
  });
  s += line(x0, y0, 620, y0, { w: 2 }) + line(x0, 50, x0, y0, { w: 2 });
  s += text(350, y0 + 52, "Kelas", { size: 16 });
  s += `<text x="24" y="${y0 - 150}" font-size="16" text-anchor="middle" transform="rotate(-90 24 ${y0 - 150})">Banyak tiket</text>`;
  return svg(650, 430, s);
}

// ---------- Stimulus ----------

const stimuli = [
  {
    code: "SD-MTK-P4-KUE",
    title: "Bolu Kukus untuk Pentas Seni",
    content: r`Ibu Lina membuat bolu kukus untuk dijual saat pentas seni sekolah. Resep untuk **24 buah** bolu kukus adalah sebagai berikut.

| Bahan | Banyak | Harga bahan |
|---|---|---|
| Tepung terigu | $\dfrac{3}{4}$ kg | Rp12.000,00 per kg |
| Gula pasir | $\dfrac{1}{2}$ kg | Rp16.000,00 per kg |
| Telur | 6 butir | Rp2.000,00 per butir |`,
  },
  {
    code: "SD-MTK-P4-DINDING",
    title: "Dinding Depan Gudang",
    content: "Pak Ahmad akan mengecat dinding depan gudangnya. Bentuk dan ukuran dinding tampak pada gambar. Pintu tidak ikut dicat.",
    gambar: "dinding",
  },
  {
    code: "SD-MTK-P4-TIKET",
    title: "Tiket Pentas Seni",
    content: "Setiap kelas di SD Pelita menjual tiket pentas seni seharga Rp5.000,00 per lembar. Banyak tiket yang terjual setiap kelas disajikan dalam diagram batang berikut.",
    gambar: "diagram-tiket",
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
  level_kognitif: string;
  gambar?: string;
};

const MCMA = "\n\n(Jawaban benar lebih dari satu.)";

const rows: Row[] = [
  // ---- Bilangan (soal tunggal) ----
  {
    // 1
    kode_subdomain: "SD-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Hasil dari $125 \times 8 : 4 + 50$ adalah ....`,
    opsi_a: "250",
    opsi_b: "300",
    opsi_c: "1.000",
    opsi_d: "1.050",
    opsi_e: "6.500",
    kunci: "B",
    pembahasan: r`Aturan urutan operasi: perkalian dan pembagian dikerjakan lebih dahulu dari kiri ke kanan, baru kemudian penjumlahan.

1. $125 \times 8 = 1.000$
2. $1.000 : 4 = 250$
3. $250 + 50 = 300$

Cek setiap pilihan:
- **A. 250** — salah, ini hasil sebelum ditambah 50 (langkah terakhir terlupa).
- **B. 300** — benar, sesuai urutan operasi di atas.
- **C. 1.000** — salah, hanya hasil perkalian; pembagian dan penjumlahan belum dikerjakan.
- **D. 1.050** — salah, pembagian dengan 4 terlewat ($1.000 + 50$).
- **E. 6.500** — salah, didapat bila penjumlahan dikerjakan lebih dulu: $125 \times (8 : 4 + 50) = 125 \times 52$. Tanpa tanda kurung, penjumlahan tidak boleh didahulukan.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 2
    kode_subdomain: "SD-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Bentuk paling sederhana dari $\dfrac{18}{24}$ adalah ....`,
    opsi_a: r`$\dfrac{9}{12}$`,
    opsi_b: r`$\dfrac{6}{8}$`,
    opsi_c: r`$\dfrac{3}{4}$`,
    opsi_d: r`$\dfrac{2}{3}$`,
    opsi_e: r`$\dfrac{4}{3}$`,
    kunci: "C",
    pembahasan: r`Bagi pembilang dan penyebut dengan FPB-nya. FPB dari 18 dan 24 adalah 6, sehingga $\dfrac{18 : 6}{24 : 6} = \dfrac{3}{4}$. Pecahan $\dfrac{3}{4}$ tidak dapat disederhanakan lagi karena 3 dan 4 tidak memiliki faktor persekutuan selain 1.

Cek setiap pilihan:
- **A.** $\dfrac{9}{12}$ — senilai dengan $\dfrac{18}{24}$ (dibagi 2), tetapi belum paling sederhana karena 9 dan 12 masih bisa dibagi 3.
- **B.** $\dfrac{6}{8}$ — senilai (dibagi 3), tetapi 6 dan 8 masih bisa dibagi 2.
- **C.** $\dfrac{3}{4}$ — benar, bentuk paling sederhana.
- **D.** $\dfrac{2}{3}$ — tidak senilai: $\dfrac{2}{3} = \dfrac{16}{24}$, bukan $\dfrac{18}{24}$.
- **E.** $\dfrac{4}{3}$ — pembilang dan penyebut tertukar; nilainya lebih dari 1, padahal $\dfrac{18}{24}$ kurang dari 1.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 3
    kode_subdomain: "SD-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Kakak memiliki pita sepanjang $3\dfrac{1}{2}$ m. Ia memakai $1\dfrac{3}{4}$ m untuk menghias kado. Panjang pita yang tersisa adalah ....`,
    opsi_a: r`$1\dfrac{1}{4}$ m`,
    opsi_b: r`$1\dfrac{1}{2}$ m`,
    opsi_c: r`$1\dfrac{3}{4}$ m`,
    opsi_d: r`$2\dfrac{1}{4}$ m`,
    opsi_e: r`$5\dfrac{1}{4}$ m`,
    kunci: "C",
    pembahasan: r`Ubah ke pecahan biasa dengan penyebut sama:

$3\dfrac{1}{2} = \dfrac{7}{2} = \dfrac{14}{4}$ dan $1\dfrac{3}{4} = \dfrac{7}{4}$.

Sisa pita $= \dfrac{14}{4} - \dfrac{7}{4} = \dfrac{7}{4} = 1\dfrac{3}{4}$ m.

Cek setiap pilihan:
- **A.** $1\dfrac{1}{4}$ m — salah. Periksa dengan penjumlahan: $1\dfrac{1}{4} + 1\dfrac{3}{4} = 3$ m, bukan $3\dfrac{1}{2}$ m.
- **B.** $1\dfrac{1}{2}$ m — salah. Periksa: $1\dfrac{1}{2} + 1\dfrac{3}{4} = 3\dfrac{1}{4}$ m, masih kurang $\dfrac{1}{4}$ m dari panjang semula.
- **C.** $1\dfrac{3}{4}$ m — benar.
- **D.** $2\dfrac{1}{4}$ m — salah, bilangan bulat dan pecahan dikurangkan terpisah ($3 - 1 = 2$, lalu $\dfrac{3}{4} - \dfrac{1}{2} = \dfrac{1}{4}$). Karena $\dfrac{1}{2}$ lebih kecil dari $\dfrac{3}{4}$, cara ini keliru; harus "meminjam" 1 dari bilangan bulat.
- **E.** $5\dfrac{1}{4}$ m — salah, kedua panjang dijumlahkan, padahal yang ditanya sisa.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 4
    kode_subdomain: "SD-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: "Di kelas V terdapat 40 siswa. Sebanyak 35% siswa mengikuti ekstrakurikuler pramuka. Banyak siswa yang **tidak** mengikuti pramuka adalah ....",
    opsi_a: "5 siswa",
    opsi_b: "14 siswa",
    opsi_c: "26 siswa",
    opsi_d: "35 siswa",
    opsi_e: "65 siswa",
    kunci: "C",
    pembahasan: r`Siswa yang ikut pramuka $= 35\% \times 40 = \dfrac{35}{100} \times 40 = 14$ siswa. Siswa yang tidak ikut $= 40 - 14 = 26$ siswa.

Cara lain: yang tidak ikut $= 100\% - 35\% = 65\%$, dan $65\% \times 40 = 26$ siswa.

Cek setiap pilihan:
- **A. 5 siswa** — salah, berasal dari $40 - 35$; persen tidak boleh dikurangkan langsung dari banyak siswa.
- **B. 14 siswa** — salah, ini banyak siswa yang **ikut** pramuka, bukan yang tidak ikut.
- **C. 26 siswa** — benar.
- **D. 35 siswa** — salah, 35 adalah besar persennya, bukan banyak siswa.
- **E. 65 siswa** — salah, 65 adalah persen siswa yang tidak ikut; banyak siswa tidak mungkin melebihi 40.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 5
    kode_subdomain: "SD-MTK-D1-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Tentukan **Benar** atau **Salah** setiap perbandingan bilangan berikut!",
    opsi_a: r`$0{,}6 > \dfrac{3}{5}$`,
    opsi_b: r`$\dfrac{1}{4} < 30\%$`,
    opsi_c: r`$2{,}5 = \dfrac{5}{2}$`,
    opsi_d: r`$\dfrac{7}{8} < 0{,}8$`,
    kunci: "S,B,B,S",
    pembahasan: r`Ubah semua bilangan ke bentuk desimal agar mudah dibandingkan.

- $\dfrac{3}{5} = \dfrac{6}{10} = 0{,}6$. Jadi $0{,}6 = \dfrac{3}{5}$, **tidak lebih besar** — pernyataan **Salah**.
- $\dfrac{1}{4} = 0{,}25$ dan $30\% = 0{,}30$. Karena $0{,}25 < 0{,}30$, pernyataan **Benar**.
- $\dfrac{5}{2} = 5 : 2 = 2{,}5$. Pernyataan **Benar**.
- $\dfrac{7}{8} = 0{,}875$. Karena $0{,}875 > 0{,}8$, pernyataan $\dfrac{7}{8} < 0{,}8$ **Salah**. Kesalahan umum: melihat angka 7 dan 8 lalu mengira $\dfrac{7}{8}$ "sekitar 0,78".`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 6
    kode_subdomain: "SD-MTK-D1-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Manakah bilangan yang merupakan kelipatan persekutuan dari 4 dan 6?${MCMA}`,
    opsi_a: "12",
    opsi_b: "18",
    opsi_c: "24",
    opsi_d: "30",
    opsi_e: "36",
    kunci: "A,C,E",
    pembahasan: r`Kelipatan persekutuan 4 dan 6 adalah bilangan yang habis dibagi 4 **dan** habis dibagi 6. KPK dari 4 dan 6 adalah 12, sehingga kelipatan persekutuannya adalah kelipatan 12: 12, 24, 36, 48, ....

Cek setiap pilihan:
- **A. 12** — benar, $12 : 4 = 3$ dan $12 : 6 = 2$.
- **B. 18** — salah, $18 : 6 = 3$ tetapi $18 : 4 = 4$ sisa 2. Kelipatan 6 saja belum cukup.
- **C. 24** — benar, $24 : 4 = 6$ dan $24 : 6 = 4$.
- **D. 30** — salah, 30 kelipatan 6 tetapi tidak habis dibagi 4.
- **E. 36** — benar, $36 : 4 = 9$ dan $36 : 6 = 6$.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 7
    kode_subdomain: "SD-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: "Di sebuah terminal, bus jurusan A berangkat setiap 15 menit dan bus jurusan B berangkat setiap 20 menit. Kedua bus berangkat bersamaan pukul 06.00. Banyaknya kedua bus berangkat bersamaan dari pukul 06.00 sampai pukul 09.00 (termasuk pukul 06.00 dan 09.00) adalah ....",
    opsi_a: "3 kali",
    opsi_b: "4 kali",
    opsi_c: "5 kali",
    opsi_d: "9 kali",
    opsi_e: "12 kali",
    kunci: "B",
    pembahasan: r`Kedua bus berangkat bersamaan setiap KPK dari 15 dan 20 menit.

$15 = 3 \times 5$ dan $20 = 2^2 \times 5$, sehingga KPK $= 2^2 \times 3 \times 5 = 60$ menit = 1 jam.

Waktu berangkat bersamaan: 06.00, 07.00, 08.00, dan 09.00, yaitu **4 kali**.

Cek setiap pilihan:
- **A. 3 kali** — salah, pukul 06.00 tidak ikut dihitung (180 menit : 60 = 3), padahal soal meminta termasuk pukul 06.00.
- **B. 4 kali** — benar.
- **C. 5 kali** — salah, tidak ada keberangkatan bersama di luar keempat waktu tersebut.
- **D. 9 kali** — salah, ini banyak keberangkatan bus B saja dalam 3 jam ($180 : 20$).
- **E. 12 kali** — salah, ini banyak keberangkatan bus A saja dalam 3 jam ($180 : 15$).`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  // ---- Stimulus: Bolu Kukus ----
  {
    // 8
    kode_stimulus: "SD-MTK-P4-KUE",
    kode_subdomain: "SD-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: "Ibu Lina ingin membuat 48 buah bolu kukus. Banyak telur yang diperlukan adalah ....",
    opsi_a: "6 butir",
    opsi_b: "8 butir",
    opsi_c: "12 butir",
    opsi_d: "18 butir",
    opsi_e: "24 butir",
    kunci: "C",
    pembahasan: r`48 bolu $= 48 : 24 = 2$ kali resep. Telur yang diperlukan $= 2 \times 6 = 12$ butir.

Cek setiap pilihan:
- **A. 6 butir** — salah, ini telur untuk satu resep (24 bolu) saja.
- **B. 8 butir** — salah, tidak sesuai perhitungan; hanya menambah 2 butir.
- **C. 12 butir** — benar.
- **D. 18 butir** — salah, ini telur untuk 3 resep (72 bolu).
- **E. 24 butir** — salah, angka 24 adalah banyak bolu dalam satu resep, bukan banyak telur.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 9
    kode_stimulus: "SD-MTK-P4-KUE",
    kode_subdomain: "SD-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: "Untuk membuat 72 buah bolu kukus, tepung terigu yang diperlukan adalah ....",
    opsi_a: r`$1\dfrac{1}{2}$ kg`,
    opsi_b: r`$2\dfrac{1}{4}$ kg`,
    opsi_c: r`$2\dfrac{1}{2}$ kg`,
    opsi_d: r`$2\dfrac{3}{4}$ kg`,
    opsi_e: r`$3\dfrac{3}{4}$ kg`,
    kunci: "B",
    pembahasan: r`72 bolu $= 72 : 24 = 3$ kali resep.

Tepung $= 3 \times \dfrac{3}{4} = \dfrac{9}{4} = 2\dfrac{1}{4}$ kg.

Cek setiap pilihan:
- **A.** $1\dfrac{1}{2}$ kg — salah, ini tepung untuk 2 resep (48 bolu).
- **B.** $2\dfrac{1}{4}$ kg — benar.
- **C.** $2\dfrac{1}{2}$ kg — salah, muncul bila $\dfrac{9}{4}$ dibulatkan menjadi $\dfrac{10}{4}$.
- **D.** $2\dfrac{3}{4}$ kg — salah, muncul bila $3 \times \dfrac{3}{4}$ dianggap $2 + \dfrac{3}{4}$.
- **E.** $3\dfrac{3}{4}$ kg — salah, muncul bila bilangan 3 hanya ditambahkan ($3 + \dfrac{3}{4}$), bukan dikalikan.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 10
    kode_stimulus: "SD-MTK-P4-KUE",
    kode_subdomain: "SD-MTK-D1-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: r`Di dapur Ibu Lina tersedia 2 kg tepung terigu, $1\dfrac{1}{2}$ kg gula pasir, dan 15 butir telur. Ia tidak membeli bahan lagi.

Manakah pernyataan yang benar?${MCMA}`,
    opsi_a: "Tepung terigu cukup untuk membuat 2 kali resep.",
    opsi_b: "Gula pasir cukup untuk membuat 3 kali resep.",
    opsi_c: "Telur cukup untuk membuat 3 kali resep.",
    opsi_d: "Bolu kukus paling banyak yang dapat dibuat adalah 48 buah.",
    opsi_e: r`Setelah membuat bolu sebanyak-banyaknya, tepung terigu tersisa $\dfrac{1}{4}$ kg.`,
    kunci: "A,B,D",
    pembahasan: r`Hitung kebutuhan setiap bahan untuk 2 dan 3 kali resep.

| Bahan | 2 resep | 3 resep | Tersedia |
|---|---|---|---|
| Tepung | $1\dfrac{1}{2}$ kg | $2\dfrac{1}{4}$ kg | 2 kg |
| Gula | 1 kg | $1\dfrac{1}{2}$ kg | $1\dfrac{1}{2}$ kg |
| Telur | 12 butir | 18 butir | 15 butir |

Cek setiap pilihan:
- **A** — benar, 2 resep butuh $1\dfrac{1}{2}$ kg tepung, kurang dari 2 kg.
- **B** — benar, 3 resep butuh tepat $1\dfrac{1}{2}$ kg gula.
- **C** — salah, 3 resep butuh 18 butir telur, padahal hanya ada 15 butir.
- **D** — benar, tepung dan telur hanya cukup untuk 2 resep. Bahan yang paling sedikit mencukupi menentukan banyak resep, jadi paling banyak $2 \times 24 = 48$ bolu.
- **E** — salah, setelah 2 resep sisa tepung $2 - 1\dfrac{1}{2} = \dfrac{1}{2}$ kg, bukan $\dfrac{1}{4}$ kg.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  {
    // 11
    kode_stimulus: "SD-MTK-P4-KUE",
    kode_subdomain: "SD-MTK-D1-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Tentukan **Benar** atau **Salah** setiap pernyataan tentang biaya bahan untuk **satu kali resep** berikut!",
    opsi_a: "Biaya tepung terigu adalah Rp9.000,00.",
    opsi_b: "Biaya telur lebih murah daripada biaya gula pasir.",
    opsi_c: "Biaya seluruh bahan adalah Rp29.000,00.",
    opsi_d: "Jika 24 bolu dijual Rp2.000,00 per buah, keuntungannya Rp19.000,00.",
    kunci: "B,S,B,B",
    pembahasan: r`Biaya setiap bahan untuk satu resep:
- Tepung $= \dfrac{3}{4} \times 12.000 = 9.000$
- Gula $= \dfrac{1}{2} \times 16.000 = 8.000$
- Telur $= 6 \times 2.000 = 12.000$

Penilaian setiap pernyataan:
- **Benar** — biaya tepung Rp9.000,00.
- **Salah** — biaya telur (Rp12.000,00) justru lebih **mahal** daripada gula (Rp8.000,00). Harga gula per kg memang paling mahal, tetapi yang dipakai hanya $\dfrac{1}{2}$ kg.
- **Benar** — $9.000 + 8.000 + 12.000 = 29.000$.
- **Benar** — hasil penjualan $24 \times 2.000 = 48.000$, keuntungan $48.000 - 29.000 = 19.000$.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  // ---- Objek geometri ----
  {
    // 12
    kode_subdomain: "SD-MTK-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: `Sebuah bangun datar memiliki ciri-ciri berikut.
- Memiliki dua pasang sisi yang sama panjang dan letaknya berdekatan.
- Kedua diagonalnya saling tegak lurus.
- Hanya satu diagonal yang membagi dua diagonal lainnya sama panjang.

Bangun datar tersebut adalah ....`,
    opsi_a: "persegi",
    opsi_b: "belah ketupat",
    opsi_c: "layang-layang",
    opsi_d: "jajargenjang",
    opsi_e: "trapesium",
    kunci: "C",
    pembahasan: `Ciri "dua pasang sisi sama panjang yang berdekatan" dan "hanya satu diagonal membagi dua diagonal lain" adalah ciri khas layang-layang.

Cek setiap pilihan:
- **A. persegi** — salah, keempat sisinya sama panjang dan kedua diagonalnya saling membagi dua sama panjang.
- **B. belah ketupat** — salah, diagonalnya memang tegak lurus, tetapi keempat sisinya sama panjang dan kedua diagonal saling membagi dua sama panjang.
- **C. layang-layang** — benar, memenuhi ketiga ciri.
- **D. jajargenjang** — salah, sisi yang sama panjang letaknya berhadapan, bukan berdekatan, dan diagonalnya umumnya tidak tegak lurus.
- **E. trapesium** — salah, ciri utamanya sepasang sisi sejajar; diagonalnya tidak saling tegak lurus.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 13
    kode_subdomain: "SD-MTK-D2-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Manakah bangun datar yang kedua diagonalnya **selalu sama panjang**?${MCMA}`,
    opsi_a: "Persegi",
    opsi_b: "Persegi panjang",
    opsi_c: "Trapesium sama kaki",
    opsi_d: "Belah ketupat",
    opsi_e: "Layang-layang",
    kunci: "A,B,C",
    pembahasan: `Cek setiap pilihan:
- **A. Persegi** — benar, kedua diagonal persegi sama panjang dan saling tegak lurus.
- **B. Persegi panjang** — benar, kedua diagonalnya sama panjang (tetapi tidak tegak lurus).
- **C. Trapesium sama kaki** — benar, bangun ini simetris terhadap garis tengahnya, sehingga diagonal kiri dan kanan saling bercermin dan sama panjang.
- **D. Belah ketupat** — salah, diagonalnya tegak lurus tetapi umumnya tidak sama panjang (satu panjang, satu pendek). Hanya bila belah ketupat itu persegi, diagonalnya sama panjang.
- **E. Layang-layang** — salah, diagonalnya tegak lurus tetapi panjangnya berbeda.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 14
    kode_subdomain: "SD-MTK-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: "Sebuah segitiga memiliki dua sudut yang besarnya 40° dan 50°. Jenis segitiga tersebut berdasarkan besar sudutnya adalah ....",
    opsi_a: "segitiga lancip",
    opsi_b: "segitiga siku-siku",
    opsi_c: "segitiga tumpul",
    opsi_d: "segitiga sama sisi",
    opsi_e: "segitiga sama kaki",
    kunci: "B",
    pembahasan: r`Jumlah ketiga sudut segitiga adalah 180°. Sudut ketiga $= 180° - 40° - 50° = 90°$. Segitiga yang memiliki satu sudut 90° disebut segitiga siku-siku.

Cek setiap pilihan:
- **A. segitiga lancip** — salah, segitiga lancip ketiga sudutnya kurang dari 90°. Dua sudut yang diketahui memang lancip, tetapi sudut ketiganya 90°.
- **B. segitiga siku-siku** — benar.
- **C. segitiga tumpul** — salah, tidak ada sudut yang lebih dari 90°.
- **D. segitiga sama sisi** — salah, segitiga sama sisi ketiga sudutnya 60°.
- **E. segitiga sama kaki** — salah, segitiga sama kaki memiliki dua sudut sama besar, sedangkan sudutnya 40°, 50°, dan 90° (semuanya berbeda). Lagi pula, sama kaki adalah jenis berdasarkan sisi, bukan sudut.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 15
    kode_subdomain: "SD-MTK-D2-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Tentukan **Benar** atau **Salah** setiap pernyataan tentang kubus dan balok berikut!",
    opsi_a: "Kubus memiliki 6 sisi berbentuk persegi yang sama besar.",
    opsi_b: "Rusuk-rusuk balok yang sejajar sama panjang.",
    opsi_c: "Kubus memiliki 8 rusuk.",
    opsi_d: "Balok yang semua rusuknya sama panjang disebut kubus.",
    kunci: "B,B,S,B",
    pembahasan: `- **Benar** — semua sisi kubus berbentuk persegi yang sama besar, jumlahnya 6.
- **Benar** — balok memiliki 12 rusuk yang terbagi menjadi 3 kelompok (panjang, lebar, tinggi); setiap kelompok berisi 4 rusuk sejajar yang sama panjang.
- **Salah** — kubus memiliki **12** rusuk. Angka 8 adalah banyak titik sudut kubus.
- **Benar** — bila panjang, lebar, dan tinggi balok sama, semua sisinya menjadi persegi, sehingga bangun itu adalah kubus.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 16
    kode_subdomain: "SD-MTK-D2-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Perhatikan lima rangkaian persegi berikut!

Rangkaian manakah yang merupakan jaring-jaring kubus?${MCMA}`,
    opsi_a: "Rangkaian (1)",
    opsi_b: "Rangkaian (2)",
    opsi_c: "Rangkaian (3)",
    opsi_d: "Rangkaian (4)",
    opsi_e: "Rangkaian (5)",
    kunci: "A,C,E",
    gambar: "jaring-kubus",
    pembahasan: `Bayangkan setiap rangkaian dilipat. Jaring-jaring kubus harus menutup keenam sisi tanpa ada sisi yang bertumpuk. Ciri yang mudah dipakai: **tidak boleh ada empat persegi yang membentuk kotak 2 × 2**, dan tidak boleh ada lebih dari empat persegi berjajar dalam satu baris.

Cek setiap rangkaian:
- **(1)** — benar. Empat persegi berjajar membentuk sisi depan, kanan, belakang, dan kiri; satu persegi di atas menjadi tutup dan satu di bawah menjadi alas.
- **(2)** — salah. Rangkaian 2 × 3 membuat beberapa persegi bertumpuk saat dilipat, sehingga ada sisi kubus yang tidak tertutup.
- **(3)** — benar. Bentuk "tangga" 2–2–2 dapat dilipat menjadi kubus; setiap pasang persegi menutup sisi yang berbeda.
- **(4)** — salah. Ada empat persegi yang membentuk kotak 2 × 2 di kiri; saat dilipat, dua persegi akan bertumpuk.
- **(5)** — benar. Sama seperti (1), ada empat persegi berjajar, dan dua persegi lainnya berada di sisi yang berseberangan sebagai tutup dan alas.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  {
    // 17
    kode_subdomain: "SD-MTK-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: "Rudi memiliki 50 kubus kecil yang sama besar. Ia ingin menyusun sebuah kubus besar yang sebesar mungkin dari kubus-kubus kecil itu (kubus besar harus padat, tidak berongga). Ukuran rusuk kubus besar dan sisa kubus kecil adalah ....",
    opsi_a: "rusuk 3 kubus kecil, sisa 23 kubus kecil",
    opsi_b: "rusuk 3 kubus kecil, sisa 41 kubus kecil",
    opsi_c: "rusuk 4 kubus kecil, sisa 2 kubus kecil",
    opsi_d: "rusuk 5 kubus kecil, sisa 25 kubus kecil",
    opsi_e: "rusuk 7 kubus kecil, sisa 1 kubus kecil",
    kunci: "A",
    pembahasan: r`Kubus besar dengan rusuk $n$ kubus kecil membutuhkan $n \times n \times n$ kubus kecil.

- Rusuk 3: $3 \times 3 \times 3 = 27$ kubus (cukup, karena $27 \le 50$).
- Rusuk 4: $4 \times 4 \times 4 = 64$ kubus (tidak cukup, karena $64 > 50$).

Jadi, kubus terbesar memiliki rusuk 3 kubus kecil, dan sisa kubus kecil $50 - 27 = 23$.

Cek setiap pilihan:
- **A** — benar.
- **B** — salah, sisa 41 didapat bila kubus besar dianggap hanya butuh $3 \times 3 = 9$ kubus (satu lapis saja).
- **C** — salah, rusuk 4 butuh 64 kubus kecil, lebih dari 50; bila dihitung $4 \times 4 \times 3 = 48$, bangunnya balok, bukan kubus.
- **D** — salah, $5 \times 5 = 25$ adalah luas satu lapis, bukan isi kubus; kubus rusuk 5 butuh 125 kubus kecil.
- **E** — salah, $7 \times 7 = 49$ hanya membentuk persegi datar satu lapis, bukan kubus.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  // ---- Stimulus: Dinding Gudang ----
  {
    // 18
    kode_stimulus: "SD-MTK-P4-DINDING",
    kode_subdomain: "SD-MTK-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: "Luas seluruh dinding depan gudang (termasuk pintu) adalah ....",
    opsi_a: "24 m²",
    opsi_b: "34 m²",
    opsi_c: "36 m²",
    opsi_d: "44 m²",
    opsi_e: "48 m²",
    kunci: "C",
    pembahasan: r`Dinding terdiri atas persegi panjang dan segitiga.

- Luas persegi panjang $= 8 \times 3 = 24$ m²
- Luas segitiga $= \dfrac{\text{alas} \times \text{tinggi}}{2} = \dfrac{8 \times 3}{2} = 12$ m²
- Luas seluruh dinding $= 24 + 12 = 36$ m²

Cek setiap pilihan:
- **A. 24 m²** — salah, hanya luas persegi panjang; bagian segitiga terlupa.
- **B. 34 m²** — salah, luas pintu sudah dikurangkan; soal meminta luas seluruh dinding **termasuk** pintu.
- **C. 36 m²** — benar.
- **D. 44 m²** — salah, tinggi segitiga diganti sisi miring 5 m: $\dfrac{8 \times 5}{2} = 20$, lalu $24 + 20 = 44$. Tinggi segitiga adalah garis putus-putus 3 m yang tegak lurus alas, bukan sisi miring.
- **E. 48 m²** — salah, luas segitiga dihitung $8 \times 3 = 24$ m² tanpa dibagi 2.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 19
    kode_stimulus: "SD-MTK-P4-DINDING",
    kode_subdomain: "SD-MTK-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: "Satu kaleng cat cukup untuk mengecat 7 m² dinding. Cat hanya dijual per kaleng. Banyak kaleng cat paling sedikit yang harus dibeli Pak Ahmad adalah ....",
    opsi_a: "3 kaleng",
    opsi_b: "4 kaleng",
    opsi_c: "5 kaleng",
    opsi_d: "6 kaleng",
    opsi_e: "7 kaleng",
    kunci: "C",
    pembahasan: r`Luas seluruh dinding 36 m² dan luas pintu $1 \times 2 = 2$ m². Bagian yang dicat $= 36 - 2 = 34$ m².

$34 : 7 = 4$ sisa 6. Empat kaleng hanya cukup untuk $4 \times 7 = 28$ m², masih kurang 6 m², sehingga perlu 1 kaleng lagi. Jadi, paling sedikit **5 kaleng** ($5 \times 7 = 35$ m² $\ge 34$ m²).

Cek setiap pilihan:
- **A. 3 kaleng** — salah, hanya cukup untuk 21 m².
- **B. 4 kaleng** — salah, hasil $34 : 7$ dibulatkan ke bawah. Cat 28 m² belum menutup 34 m².
- **C. 5 kaleng** — benar.
- **D. 6 kaleng** — salah, muncul bila pintu ikut dicat: $36 : 7 = 5$ sisa 1, dibulatkan menjadi 6 kaleng.
- **E. 7 kaleng** — salah, angka 7 adalah luas yang dapat dicat satu kaleng, bukan banyak kaleng.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  {
    // 20
    kode_stimulus: "SD-MTK-P4-DINDING",
    kode_subdomain: "SD-MTK-D2-S2",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Tentukan **Benar** atau **Salah** setiap pernyataan berikut berdasarkan gambar!",
    opsi_a: "Keliling bentuk dinding depan gudang adalah 24 m.",
    opsi_b: "Luas bagian dinding yang berbentuk segitiga adalah 24 m².",
    opsi_c: "Luas dinding yang dicat adalah 34 m².",
    opsi_d: "Lebar dinding 8 m sama dengan 800 cm.",
    kunci: "B,S,B,B",
    pembahasan: r`- **Benar** — keliling adalah jumlah panjang sisi luar: alas 8 m + dua sisi tegak $3 + 3$ m + dua sisi miring $5 + 5$ m $= 24$ m. Garis putus-putus (tinggi segitiga) dan garis atas persegi panjang berada di dalam bangun, sehingga tidak dihitung.
- **Salah** — luas segitiga $= \dfrac{8 \times 3}{2} = 12$ m²; nilai 24 m² muncul bila lupa dibagi 2.
- **Benar** — $36 - 2 = 34$ m² (luas dinding dikurangi luas pintu).
- **Benar** — 1 m = 100 cm, sehingga 8 m = 800 cm.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  // ---- Pengukuran (soal tunggal) ----
  {
    // 21
    kode_subdomain: "SD-MTK-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: "2 jam 15 menit = ... menit.",
    opsi_a: "75",
    opsi_b: "120",
    opsi_c: "135",
    opsi_d: "150",
    opsi_e: "215",
    kunci: "C",
    pembahasan: r`1 jam = 60 menit, sehingga 2 jam $= 2 \times 60 = 120$ menit. Jadi, 2 jam 15 menit $= 120 + 15 = 135$ menit.

Cek setiap pilihan:
- **A. 75** — salah, hanya menghitung 1 jam ($60 + 15$).
- **B. 120** — salah, 15 menit belum ditambahkan.
- **C. 135** — benar.
- **D. 150** — salah, 15 menit dianggap 30 menit.
- **E. 215** — salah, angka 2 dan 15 hanya ditulis berdampingan; satuan jam belum diubah ke menit.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 22
    kode_subdomain: "SD-MTK-D2-S2",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Manakah taksiran ukuran yang masuk akal?${MCMA}`,
    opsi_a: "Tinggi pintu kelas sekitar 2 m.",
    opsi_b: "Berat seekor kucing dewasa sekitar 4 kg.",
    opsi_c: "Isi satu gelas air minum sekitar 250 ml.",
    opsi_d: "Panjang sebatang pensil sekitar 15 m.",
    opsi_e: "Berat sebuah buku tulis sekitar 2 kg.",
    kunci: "A,B,C",
    pembahasan: `Bandingkan setiap taksiran dengan benda di sekitar kita.

- **A** — benar, pintu sedikit lebih tinggi daripada orang dewasa (sekitar 1,6–1,8 m), jadi sekitar 2 m masuk akal.
- **B** — benar, kucing dewasa umumnya beratnya 3–5 kg.
- **C** — benar, satu gelas air minum berisi sekitar 200–250 ml (seperempat liter).
- **D** — salah, 15 m lebih panjang dari ruang kelas. Panjang pensil sekitar 15 **cm**; satuannya keliru.
- **E** — salah, 2 kg setara dengan dua kantong gula 1 kg. Buku tulis jauh lebih ringan, sekitar 100 **g**.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 23
    kode_subdomain: "SD-MTK-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: "Dimas bersepeda ke rumah nenek dengan kecepatan rata-rata 12 km/jam. Ia tiba setelah bersepeda selama 45 menit. Jarak rumah Dimas ke rumah nenek adalah ....",
    opsi_a: "6 km",
    opsi_b: "9 km",
    opsi_c: "12 km",
    opsi_d: "16 km",
    opsi_e: "540 km",
    kunci: "B",
    pembahasan: r`Jarak = kecepatan × waktu. Satuan waktu harus disamakan dengan satuan kecepatan (jam).

45 menit $= \dfrac{45}{60}$ jam $= \dfrac{3}{4}$ jam.

Jarak $= 12 \times \dfrac{3}{4} = 9$ km.

Cek setiap pilihan:
- **A. 6 km** — salah, waktu dianggap setengah jam (30 menit).
- **B. 9 km** — benar.
- **C. 12 km** — salah, ini jarak bila bersepeda tepat 1 jam.
- **D. 16 km** — salah, muncul bila kecepatan dibagi waktu ($12 : \dfrac{3}{4} = 16$), padahal jarak diperoleh dari perkalian.
- **E. 540 km** — salah, $12 \times 45$ tanpa mengubah menit ke jam; hasilnya tidak masuk akal untuk bersepeda 45 menit.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 24
    kode_subdomain: "SD-MTK-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: r`Kolam ikan berbentuk balok berukuran panjang 2 m, lebar 1 m, dan dalam 0,8 m. Kolam itu diisi air sebanyak $\dfrac{3}{4}$ bagian. Volume air di dalam kolam adalah ....

Ingat: 1 m³ = 1.000 liter.`,
    opsi_a: "120 liter",
    opsi_b: "400 liter",
    opsi_c: "1.200 liter",
    opsi_d: "1.600 liter",
    opsi_e: "12.000 liter",
    kunci: "C",
    pembahasan: r`Volume kolam penuh $= 2 \times 1 \times 0{,}8 = 1{,}6$ m³.

Volume air $= \dfrac{3}{4} \times 1{,}6 = 1{,}2$ m³ $= 1{,}2 \times 1.000 = 1.200$ liter.

Cek setiap pilihan:
- **A. 120 liter** — salah, kesalahan mengubah satuan (dikalikan 100, bukan 1.000).
- **B. 400 liter** — salah, ini volume $\dfrac{1}{4}$ bagian, yaitu bagian kolam yang **kosong**.
- **C. 1.200 liter** — benar.
- **D. 1.600 liter** — salah, ini volume kolam bila terisi penuh.
- **E. 12.000 liter** — salah, kesalahan mengubah satuan (dikalikan 10.000).`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  // ---- Stimulus: Tiket Pentas Seni ----
  {
    // 25
    kode_stimulus: "SD-MTK-P4-TIKET",
    kode_subdomain: "SD-MTK-D3-S1",
    bentuk_soal: "pg",
    pertanyaan: "Kelas yang menjual tiket paling banyak adalah ....",
    opsi_a: "kelas I",
    opsi_b: "kelas III",
    opsi_c: "kelas IV",
    opsi_d: "kelas V",
    opsi_e: "kelas VI",
    kunci: "D",
    pembahasan: `Batang tertinggi menunjukkan tiket terbanyak. Batang kelas V mencapai garis 55, paling tinggi di antara semua batang.

Cek setiap pilihan:
- **A. kelas I** — salah, batangnya justru paling rendah (25 tiket).
- **B. kelas III** — salah, 45 tiket; tinggi tetapi masih di bawah kelas V.
- **C. kelas IV** — salah, 40 tiket.
- **D. kelas V** — benar, 55 tiket.
- **E. kelas VI** — salah, 35 tiket; kelas terakhir belum tentu terbanyak.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 26
    kode_stimulus: "SD-MTK-P4-TIKET",
    kode_subdomain: "SD-MTK-D3-S1",
    bentuk_soal: "pg",
    pertanyaan: "Selisih banyak tiket yang dijual kelas terbanyak dan kelas tersedikit adalah ....",
    opsi_a: "10 tiket",
    opsi_b: "20 tiket",
    opsi_c: "25 tiket",
    opsi_d: "30 tiket",
    opsi_e: "55 tiket",
    kunci: "D",
    pembahasan: r`Terbanyak kelas V (55 tiket), tersedikit kelas I (25 tiket). Selisih $= 55 - 25 = 30$ tiket.

Cek setiap pilihan:
- **A. 10 tiket** — salah, ini selisih kelas V dan kelas III ($55 - 45$).
- **B. 20 tiket** — salah, ini selisih kelas V dan kelas VI ($55 - 35$).
- **C. 25 tiket** — salah, ini banyak tiket kelas I, bukan selisihnya.
- **D. 30 tiket** — benar.
- **E. 55 tiket** — salah, ini banyak tiket kelas V saja.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 27
    kode_stimulus: "SD-MTK-P4-TIKET",
    kode_subdomain: "SD-MTK-D3-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Manakah pernyataan yang sesuai dengan diagram?${MCMA}`,
    opsi_a: "Kelas III menjual 45 tiket.",
    opsi_b: "Jumlah tiket kelas IV dan kelas VI adalah 75 tiket.",
    opsi_c: "Kelas II menjual tiket dua kali lebih banyak daripada kelas I.",
    opsi_d: "Banyak tiket yang terjual seluruhnya adalah 230 tiket.",
    opsi_e: "Kelas VI menjual lebih banyak tiket daripada kelas IV.",
    kunci: "A,B,D",
    pembahasan: r`Data dari diagram: I = 25, II = 30, III = 45, IV = 40, V = 55, VI = 35.

- **A** — benar, puncak batang kelas III tepat di garis 45 (di antara garis 40 dan 50).
- **B** — benar, $40 + 35 = 75$.
- **C** — salah, dua kali tiket kelas I adalah $2 \times 25 = 50$, sedangkan kelas II hanya 30.
- **D** — benar, $25 + 30 + 45 + 40 + 55 + 35 = 230$.
- **E** — salah, kelas VI (35) lebih sedikit daripada kelas IV (40).`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 28
    kode_stimulus: "SD-MTK-P4-TIKET",
    kode_subdomain: "SD-MTK-D3-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Tentukan **Benar** atau **Salah** setiap pernyataan berikut!",
    opsi_a: "Uang hasil penjualan seluruh tiket adalah Rp1.150.000,00.",
    opsi_b: "Rata-rata tiket yang terjual setiap kelas lebih dari 40 tiket.",
    opsi_c: "Kelas IV, V, dan VI bersama-sama menjual 30 tiket lebih banyak daripada kelas I, II, dan III bersama-sama.",
    kunci: "B,S,B",
    pembahasan: r`Jumlah seluruh tiket 230.

- **Benar** — $230 \times 5.000 = 1.150.000$.
- **Salah** — rata-rata $= 230 : 6 \approx 38{,}3$ tiket, **kurang** dari 40. Walaupun beberapa kelas menjual lebih dari 40 tiket, kelas I, II, dan VI menurunkan rata-rata.
- **Benar** — kelas I–III: $25 + 30 + 45 = 100$; kelas IV–VI: $40 + 55 + 35 = 130$. Selisihnya $130 - 100 = 30$ tiket.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  {
    // 29
    kode_stimulus: "SD-MTK-P4-TIKET",
    kode_subdomain: "SD-MTK-D3-S1",
    bentuk_soal: "pg",
    pertanyaan: "Panitia menargetkan 300 tiket terjual. Kekurangan tiket akan dijual oleh kelas V dan kelas VI dengan banyak yang sama. Setiap kelas tersebut masih harus menjual ... tiket lagi.",
    opsi_a: "15",
    opsi_b: "30",
    opsi_c: "35",
    opsi_d: "40",
    opsi_e: "70",
    kunci: "C",
    pembahasan: r`Kekurangan tiket $= 300 - 230 = 70$ tiket. Dibagi rata untuk 2 kelas: $70 : 2 = 35$ tiket per kelas.

Cek setiap pilihan:
- **A. 15** — salah, tidak sesuai perhitungan; $2 \times 15 = 30$ belum menutup kekurangan 70 tiket.
- **B. 30** — salah, ini selisih tiket kelas terbanyak dan tersedikit (soal lain), bukan kekurangan target.
- **C. 35** — benar, $35 + 35 = 70$ menutup seluruh kekurangan.
- **D. 40** — salah, $2 \times 40 = 80$, melebihi kekurangan.
- **E. 70** — salah, ini seluruh kekurangan; belum dibagi untuk dua kelas.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  // ---- Data (soal tunggal) ----
  {
    // 30
    kode_subdomain: "SD-MTK-D3-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: `Data ukuran sepatu 12 siswa kelas VI adalah sebagai berikut.

33, 34, 34, 35, 33, 34, 36, 34, 35, 33, 34, 32

Tentukan **Benar** atau **Salah** setiap pernyataan berikut!`,
    opsi_a: "Ukuran sepatu yang paling banyak dipakai (modus) adalah 34.",
    opsi_b: "Banyak siswa yang ukuran sepatunya lebih dari 34 adalah 3 siswa.",
    opsi_c: "Ukuran sepatu 33 dipakai oleh 4 siswa.",
    opsi_d: "Ukuran sepatu terkecil 32 dan terbesar 36.",
    kunci: "B,B,S,B",
    pembahasan: `Buat tabel frekuensi terlebih dahulu agar tidak salah hitung.

| Ukuran | 32 | 33 | 34 | 35 | 36 |
|---|---|---|---|---|---|
| Banyak siswa | 1 | 3 | 5 | 2 | 1 |

Periksa jumlahnya: 1 + 3 + 5 + 2 + 1 = 12 siswa.

- **Benar** — ukuran 34 dipakai 5 siswa, paling banyak.
- **Benar** — lebih dari 34 berarti ukuran 35 dan 36: 2 + 1 = 3 siswa. Ukuran 34 sendiri tidak termasuk.
- **Salah** — ukuran 33 dipakai 3 siswa, bukan 4.
- **Benar** — data terkecil 32 dan terbesar 36.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
];

export default {
  title: "TKA SD Matematika — Paket 4",
  description: "30 soal: pecahan, persen, KPK dan FPB, bangun datar, jaring-jaring kubus, luas dan volume, waktu dan kecepatan, serta membaca diagram batang. Dilengkapi gambar dan pembahasan setiap pilihan jawaban.",
  jenjang: "SD",
  subjectCode: "SD-MTK",
  durationMinutes: 75,
  isPremium: true,
  isFullSimulation: true,
  createdByEmail: "kpbgalimka@gmail.com",
  stimuli,
  rows,
  images: {
    "jaring-kubus": { title: "Lima rangkaian enam persegi (jaring-jaring kubus)", svg: imgJaring() },
    dinding: { title: "Dinding depan gudang dengan pintu", svg: imgDinding() },
    "diagram-tiket": { title: "Diagram batang tiket pentas seni per kelas", svg: imgTiket() },
  },
};
