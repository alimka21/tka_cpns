// TKA SD Matematika — Paket 5 (ditulis Claude). 30 soal: 18 PG · 6 MCMA · 6 Kategori;
// 4/4 subtopik; L1 7 · L2 15 · L3 8. 3 gambar SVG baru: arsiran kue (pecahan), bangun pada
// kertas berpetak, dua gelas ukur. Pembahasan membahas setiap pilihan (kenapa benar / salah).
const r = String.raw;
const FONT = `font-family="Arial, Helvetica, sans-serif"`;
const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" ${FONT}><rect width="${w}" height="${h}" fill="#fff"/>${body}</svg>`;
const text = (x: number, y: number, t: string, o: { size?: number; anchor?: string; weight?: string; fill?: string } = {}) =>
  `<text x="${x}" y="${y}" font-size="${o.size ?? 18}" text-anchor="${o.anchor ?? "middle"}" font-weight="${o.weight ?? "normal"}" fill="${o.fill ?? "#111"}">${t}</text>`;
const line = (x1: number, y1: number, x2: number, y2: number, o: { stroke?: string; w?: number } = {}) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.stroke ?? "#111"}" stroke-width="${o.w ?? 2}"/>`;
const HATCH = `<defs><pattern id="arsir" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#fde68a"/><line x1="0" y1="0" x2="0" y2="10" stroke="#b45309" stroke-width="4"/></pattern></defs>`;

// ---------- Gambar ----------

// Stimulus kue lapis: A 4 bagian (3 diarsir), B 8 bagian (6 diarsir), C 6 bagian (2 diarsir).
function imgKue() {
  const W = 220, H = 120;
  const cake = (ox: number, cols: number, rows: number, shaded: number, label: string) => {
    let s = "";
    let k = 0;
    for (let rr = 0; rr < rows; rr++)
      for (let c = 0; c < cols; c++) {
        const fill = k++ < shaded ? "url(#arsir)" : "#fff7ed";
        s += `<rect x="${ox + (c * W) / cols}" y="${50 + (rr * H) / rows}" width="${W / cols}" height="${H / rows}" fill="${fill}" stroke="#7c2d12" stroke-width="2"/>`;
      }
    s += `<rect x="${ox}" y="50" width="${W}" height="${H}" fill="none" stroke="#7c2d12" stroke-width="3"/>`;
    return s + text(ox + W / 2, 30, label, { weight: "bold", size: 20 });
  };
  let s = HATCH + cake(20, 4, 1, 3, "Kue A") + cake(280, 4, 2, 6, "Kue B") + cake(540, 3, 2, 2, "Kue C");
  s += `<rect x="250" y="200" width="34" height="22" fill="url(#arsir)" stroke="#7c2d12" stroke-width="2"/>` + text(294, 217, "= bagian yang sudah dimakan", { anchor: "start", size: 17 });
  return svg(780, 240, s);
}

// Stimulus kertas berpetak (1 petak = 1 cm): P jajargenjang alas 4 tinggi 3; Q segitiga siku-siku alas 4 tinggi 4.
function imgPetak() {
  const c = 40, ox = 20, oy = 20, cols = 14, rows = 7;
  const X = (x: number) => ox + x * c, Y = (y: number) => oy + y * c;
  let s = "";
  for (let i = 0; i <= cols; i++) s += line(X(i), Y(0), X(i), Y(rows), { stroke: "#cbd5e1", w: 1 });
  for (let j = 0; j <= rows; j++) s += line(X(0), Y(j), X(cols), Y(j), { stroke: "#cbd5e1", w: 1 });
  s += `<polygon points="${X(1)},${Y(6)} ${X(5)},${Y(6)} ${X(7)},${Y(3)} ${X(3)},${Y(3)}" fill="#bfdbfe" fill-opacity="0.8" stroke="#1d4ed8" stroke-width="3"/>`;
  s += `<polygon points="${X(9)},${Y(6)} ${X(13)},${Y(6)} ${X(9)},${Y(2)}" fill="#bbf7d0" fill-opacity="0.8" stroke="#15803d" stroke-width="3"/>`;
  s += text(X(4), Y(4.8), "P", { size: 28, weight: "bold", fill: "#1d4ed8" }) + text(X(10.2), Y(5), "Q", { size: 28, weight: "bold", fill: "#15803d" });
  s += text(X(7), Y(rows) + 32, "1 petak = 1 cm × 1 cm", { size: 17 });
  return svg(600, 340, s);
}

// Stimulus dua gelas ukur: A 0–1.000 ml berisi 750 ml jus; B 0–500 ml berisi 400 ml sirup (garis tiap 50 ml).
function imgGelas() {
  const k = 0.3, base = 360; // 1 ml = 0,3 px
  const glass = (ox: number, max: number, fill: number, color: string, label: string, isi: string) => {
    const w = 110, top = base - max * k;
    let s = `<rect x="${ox}" y="${base - fill * k}" width="${w}" height="${fill * k}" fill="${color}" fill-opacity="0.75"/>`;
    s += `<path d="M${ox},${top - 15} L${ox},${base} L${ox + w},${base} L${ox + w},${top - 15}" fill="none" stroke="#334155" stroke-width="3"/>`;
    for (let v = 50; v <= max; v += 50) {
      const y = base - v * k, major = v % 100 === 0;
      s += line(ox + w - (major ? 26 : 14), y, ox + w, y, { stroke: "#111", w: major ? 2 : 1.5 });
      if (major) s += text(ox + w + 8, y + 5, String(v).replace(/(\d)(\d{3})$/, "$1.$2"), { anchor: "start", size: 14 });
    }
    s += text(ox + w + 8, base - max * k - 22, "ml", { anchor: "start", size: 14, weight: "bold" });
    return s + text(ox + w / 2, base + 30, label, { weight: "bold", size: 19 }) + text(ox + w / 2, base + 54, isi, { size: 16 });
  };
  return svg(520, 430, glass(50, 1000, 750, "#fb923c", "Gelas A", "jus jeruk") + glass(320, 500, 400, "#e11d48", "Gelas B", "sirup"));
}

// ---------- Stimulus ----------

const stimuli = [
  {
    code: "SD-MTK-P5-KUE",
    title: "Kue Lapis Ibu",
    content: "Ibu membuat tiga loyang kue lapis yang sama besar. Setiap kue dipotong menjadi beberapa bagian yang sama besar. Bagian yang diarsir adalah bagian yang sudah dimakan.",
    gambar: "kue-lapis",
  },
  {
    code: "SD-MTK-P5-PETAK",
    title: "Bangun pada Kertas Berpetak",
    content: "Dua bangun datar, P dan Q, digambar pada kertas berpetak. Setiap petak berbentuk persegi dengan sisi 1 cm.",
    gambar: "kertas-petak",
  },
  {
    code: "SD-MTK-P5-GELAS",
    title: "Dua Gelas Ukur",
    content: "Kakak menyiapkan minuman untuk tamu. Jus jeruk dan sirup diukur dengan dua gelas ukur seperti pada gambar.",
    gambar: "gelas-ukur",
  },
  {
    code: "SD-MTK-P5-SEKOLAH",
    title: "Cara Pergi ke Sekolah",
    content: r`Wali kelas V mendata cara 32 siswa pergi ke sekolah. Hasilnya disajikan dalam tabel berikut.

| Cara pergi ke sekolah | Banyak siswa |
|---|---|
| Jalan kaki | 9 |
| Naik sepeda | 7 |
| Diantar sepeda motor | 11 |
| Naik angkot | 5 |`,
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
};

const MCMA = "\n\n(Jawaban benar lebih dari satu.)";

const rows: Row[] = [
  // ---- Bilangan (soal tunggal) ----
  {
    // 1
    kode_subdomain: "SD-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Hasil dari $4.506 - 1.879$ adalah ....`,
    opsi_a: "2.627",
    opsi_b: "2.637",
    opsi_c: "2.727",
    opsi_d: "3.373",
    opsi_e: "6.385",
    kunci: "A",
    pembahasan: r`Kurangkan bersusun dari satuan, lalu "pinjam" dari tempat di sebelah kirinya bila angkanya kurang.

- Satuan: 6 kurang dari 9, pinjam 1 puluhan → $16 - 9 = 7$.
- Puluhan: 0 sudah dipinjam sehingga kurang lagi, pinjam 1 ratusan → $10 - 1 - 7 = 2$.
- Ratusan: 5 tinggal 4, kurang dari 8, pinjam 1 ribuan → $14 - 8 = 6$.
- Ribuan: 4 tinggal 3 → $3 - 1 = 2$.

Hasilnya **2.627**. Periksa: $2.627 + 1.879 = 4.506$ ✓.

Cek setiap pilihan:
- **A. 2.627** — benar.
- **B. 2.637** — salah, angka puluhan yang sudah dipinjam satuan tidak dikurangi 1 ($10 - 7 = 3$).
- **C. 2.727** — salah, angka ratusan yang sudah dipinjam puluhan tidak dikurangi 1 ($15 - 8 = 7$).
- **D. 3.373** — salah, setiap kolom dihitung "angka besar dikurangi angka kecil" tanpa meminjam.
- **E. 6.385** — salah, ini hasil penjumlahan, bukan pengurangan.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 2
    kode_subdomain: "SD-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: "Bentuk pecahan paling sederhana dari 75% adalah ....",
    opsi_a: r`$\dfrac{75}{100}$`,
    opsi_b: r`$\dfrac{3}{4}$`,
    opsi_c: r`$\dfrac{7}{5}$`,
    opsi_d: r`$\dfrac{15}{25}$`,
    opsi_e: r`$\dfrac{1}{4}$`,
    kunci: "B",
    pembahasan: r`Persen berarti per seratus: $75\% = \dfrac{75}{100}$. FPB dari 75 dan 100 adalah 25, sehingga $\dfrac{75 : 25}{100 : 25} = \dfrac{3}{4}$.

Cek setiap pilihan:
- **A.** $\dfrac{75}{100}$ — nilainya sama, tetapi **belum paling sederhana**.
- **B.** $\dfrac{3}{4}$ — benar.
- **C.** $\dfrac{7}{5}$ — salah, angka 7 dan 5 hanya diambil dari tulisan "75"; nilainya lebih dari 1.
- **D.** $\dfrac{15}{25}$ — salah, $\dfrac{15}{25} = \dfrac{3}{5} = 60\%$.
- **E.** $\dfrac{1}{4}$ — salah, ini $25\%$, yaitu sisa dari $100\% - 75\%$.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 3
    kode_subdomain: "SD-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: "Rina les piano setiap 3 hari sekali, sedangkan Sari berenang setiap 4 hari sekali. Pada tanggal 1 Maret, Rina les piano dan Sari berenang pada hari yang sama. Mereka akan melakukan kegiatan masing-masing pada hari yang sama lagi untuk pertama kalinya pada tanggal ....",
    opsi_a: "5 Maret",
    opsi_b: "8 Maret",
    opsi_c: "12 Maret",
    opsi_d: "13 Maret",
    opsi_e: "25 Maret",
    kunci: "D",
    pembahasan: r`Kegiatan bersamaan berulang setiap KPK dari 3 dan 4, yaitu 12 hari. Jadi, kegiatan bersamaan berikutnya 12 hari setelah 1 Maret: $1 + 12 = 13$ Maret.

Periksa dengan daftar: Rina 1, 4, 7, 10, **13**; Sari 1, 5, 9, **13**.

Cek setiap pilihan:
- **A. 5 Maret** — salah, ini hanya jadwal Sari berikutnya ($1 + 4$).
- **B. 8 Maret** — salah, $1 + 3 + 4$; hari kegiatan dijumlahkan, bukan dicari KPK-nya.
- **C. 12 Maret** — salah, KPK 12 dianggap langsung sebagai tanggal, padahal harus dihitung **dari** tanggal 1.
- **D. 13 Maret** — benar.
- **E. 25 Maret** — salah, memakai $3 \times 4 \times 2 = 24$ hari; 24 memang kelipatan persekutuan, tetapi bukan yang pertama.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 4
    kode_subdomain: "SD-MTK-D1-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Tentukan **Benar** atau **Salah** setiap pernyataan berikut!",
    opsi_a: r`Faktorisasi prima dari 60 adalah $2^2 \times 3 \times 5$.`,
    opsi_b: "KPK dari 8 dan 12 adalah 24.",
    opsi_c: "FPB dari 18 dan 27 adalah 3.",
    opsi_d: "Bilangan 1 termasuk bilangan prima.",
    kunci: "B,B,S,S",
    pembahasan: r`- **Benar** — $60 = 2 \times 30 = 2 \times 2 \times 15 = 2 \times 2 \times 3 \times 5 = 2^2 \times 3 \times 5$.
- **Benar** — $8 = 2^3$ dan $12 = 2^2 \times 3$. KPK diambil faktor dengan pangkat terbesar: $2^3 \times 3 = 24$. Periksa: 24 habis dibagi 8 dan 12.
- **Salah** — $18 = 2 \times 3^2$ dan $27 = 3^3$. FPB diambil faktor yang sama dengan pangkat terkecil: $3^2 = 9$. Angka 3 memang faktor persekutuan, tetapi bukan yang **terbesar**.
- **Salah** — bilangan prima memiliki tepat dua faktor (1 dan dirinya sendiri). Bilangan 1 hanya memiliki satu faktor, sehingga bukan bilangan prima.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 5
    kode_subdomain: "SD-MTK-D1-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: r`Manakah hasil operasi hitung yang nilainya sama dengan $\dfrac{1}{2}$?${MCMA}`,
    opsi_a: r`$\dfrac{1}{4} + \dfrac{1}{4}$`,
    opsi_b: r`$\dfrac{3}{4} - \dfrac{1}{4}$`,
    opsi_c: r`$\dfrac{1}{2} \times 2$`,
    opsi_d: r`$\dfrac{1}{3} + \dfrac{1}{6}$`,
    opsi_e: r`$\dfrac{1}{2} : 2$`,
    kunci: "A,B,D",
    pembahasan: r`Hitung setiap pilihan.

- **A** — benar, $\dfrac{1}{4} + \dfrac{1}{4} = \dfrac{2}{4} = \dfrac{1}{2}$.
- **B** — benar, $\dfrac{3}{4} - \dfrac{1}{4} = \dfrac{2}{4} = \dfrac{1}{2}$.
- **C** — salah, $\dfrac{1}{2} \times 2 = \dfrac{2}{2} = 1$.
- **D** — benar, samakan penyebut: $\dfrac{2}{6} + \dfrac{1}{6} = \dfrac{3}{6} = \dfrac{1}{2}$. Jangan menjumlah penyebut ($\dfrac{2}{9}$).
- **E** — salah, $\dfrac{1}{2} : 2 = \dfrac{1}{2 \times 2} = \dfrac{1}{4}$. Membagi dengan 2 membuat nilainya lebih kecil.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 6
    kode_subdomain: "SD-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: "Ayah membeli 3 kg beras seharga Rp13.500,00 per kg dan 2 liter minyak goreng seharga Rp18.000,00 per liter. Ayah membayar dengan uang Rp100.000,00. Uang kembalian yang diterima Ayah adalah ....",
    opsi_a: "Rp23.500,00",
    opsi_b: "Rp59.500,00",
    opsi_c: "Rp64.000,00",
    opsi_d: "Rp68.500,00",
    opsi_e: "Rp76.500,00",
    kunci: "A",
    pembahasan: r`- Harga beras $= 3 \times 13.500 = 40.500$
- Harga minyak $= 2 \times 18.000 = 36.000$
- Total belanja $= 40.500 + 36.000 = 76.500$
- Kembalian $= 100.000 - 76.500 = 23.500$

Cek setiap pilihan:
- **A. Rp23.500,00** — benar.
- **B. Rp59.500,00** — salah, hanya beras yang dikurangkan ($100.000 - 40.500$); minyak terlupa.
- **C. Rp64.000,00** — salah, hanya minyak yang dikurangkan ($100.000 - 36.000$).
- **D. Rp68.500,00** — salah, harga per kg dan per liter tidak dikalikan banyaknya ($100.000 - 13.500 - 18.000$).
- **E. Rp76.500,00** — salah, ini total belanja, bukan kembalian.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 7
    kode_subdomain: "SD-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Harga sebuah sepeda Rp1.200.000,00 dan mendapat potongan harga 25%. Andi membayar $\dfrac{2}{3}$ dari harga setelah potongan dengan uang tabungannya. Sisanya dicicil 3 kali dengan besar yang sama. Besar setiap cicilan adalah ....`,
    opsi_a: "Rp100.000,00",
    opsi_b: "Rp200.000,00",
    opsi_c: "Rp300.000,00",
    opsi_d: "Rp600.000,00",
    opsi_e: "Rp900.000,00",
    kunci: "A",
    pembahasan: r`1. Potongan $= 25\% \times 1.200.000 = 300.000$. Harga setelah potongan $= 1.200.000 - 300.000 = 900.000$.
2. Dibayar dengan tabungan $= \dfrac{2}{3} \times 900.000 = 600.000$.
3. Sisa $= 900.000 - 600.000 = 300.000$.
4. Setiap cicilan $= 300.000 : 3 = 100.000$.

Cek setiap pilihan:
- **A. Rp100.000,00** — benar.
- **B. Rp200.000,00** — salah, tabungan dianggap $\dfrac{1}{3}$ sehingga sisanya $600.000$, lalu dibagi 3.
- **C. Rp300.000,00** — salah, ini sisa yang harus dicicil, belum dibagi 3 (kebetulan sama dengan besar potongan).
- **D. Rp600.000,00** — salah, ini uang tabungan yang dibayarkan.
- **E. Rp900.000,00** — salah, ini harga setelah potongan.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  {
    // 8
    kode_subdomain: "SD-MTK-D1-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: r`Manakah bilangan yang **lebih besar** daripada $\dfrac{5}{8}$?${MCMA}`,
    opsi_a: r`$0{,}65$`,
    opsi_b: "62%",
    opsi_c: r`$\dfrac{2}{3}$`,
    opsi_d: r`$0{,}6$`,
    opsi_e: r`$\dfrac{7}{10}$`,
    kunci: "A,C,E",
    pembahasan: r`Ubah semua ke bentuk desimal. $\dfrac{5}{8} = 5 : 8 = 0{,}625$.

- **A.** $0{,}65 > 0{,}625$ — benar. (Bandingkan $0{,}650$ dengan $0{,}625$: angka perseratusan 5 lebih besar dari 2.)
- **B.** $62\% = 0{,}62 < 0{,}625$ — salah, selisihnya sangat kecil tetapi tetap lebih kecil.
- **C.** $\dfrac{2}{3} \approx 0{,}667 > 0{,}625$ — benar.
- **D.** $0{,}6 = 0{,}600 < 0{,}625$ — salah.
- **E.** $\dfrac{7}{10} = 0{,}7 > 0{,}625$ — benar. Jangan tertukar: 0,7 lebih besar dari 0,625 walaupun angkanya lebih sedikit.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  // ---- Stimulus: Kue Lapis ----
  {
    // 9
    kode_stimulus: "SD-MTK-P5-KUE",
    kode_subdomain: "SD-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: "Pecahan yang menunjukkan bagian Kue A yang sudah dimakan adalah ....",
    opsi_a: r`$\dfrac{1}{4}$`,
    opsi_b: r`$\dfrac{1}{3}$`,
    opsi_c: r`$\dfrac{3}{4}$`,
    opsi_d: r`$\dfrac{4}{3}$`,
    opsi_e: r`$\dfrac{3}{1}$`,
    kunci: "C",
    pembahasan: r`Kue A dibagi menjadi **4** bagian sama besar (penyebut) dan **3** bagian diarsir atau sudah dimakan (pembilang). Jadi, pecahannya $\dfrac{3}{4}$.

Cek setiap pilihan:
- **A.** $\dfrac{1}{4}$ — salah, ini bagian yang **belum** dimakan (1 bagian tidak diarsir).
- **B.** $\dfrac{1}{3}$ — salah, membandingkan bagian tak diarsir dengan bagian diarsir (1 banding 3), bukan dengan seluruh bagian.
- **C.** $\dfrac{3}{4}$ — benar.
- **D.** $\dfrac{4}{3}$ — salah, pembilang dan penyebut tertukar; nilainya lebih dari satu kue.
- **E.** $\dfrac{3}{1}$ — salah, sama dengan 3 kue utuh.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 10
    kode_stimulus: "SD-MTK-P5-KUE",
    kode_subdomain: "SD-MTK-D1-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Manakah pernyataan yang sesuai dengan gambar?${MCMA}`,
    opsi_a: "Bagian Kue A yang dimakan sama banyak dengan bagian Kue B yang dimakan.",
    opsi_b: r`Sisa Kue C adalah $\dfrac{2}{3}$ bagian.`,
    opsi_c: "Kue C adalah kue yang paling sedikit dimakan.",
    opsi_d: r`Jumlah bagian Kue A dan Kue C yang dimakan adalah $\dfrac{5}{10}$ kue.`,
    opsi_e: r`Sisa Kue B adalah $\dfrac{2}{6}$ bagian.`,
    kunci: "A,B,C",
    pembahasan: r`Bagian yang dimakan: Kue A $\dfrac{3}{4}$, Kue B $\dfrac{6}{8}$, Kue C $\dfrac{2}{6}$.

- **A** — benar, $\dfrac{6}{8} = \dfrac{6 : 2}{8 : 2} = \dfrac{3}{4}$. Pecahan senilai, jadi sama banyak meskipun potongannya berbeda.
- **B** — benar, sisa Kue C $= \dfrac{4}{6} = \dfrac{2}{3}$.
- **C** — benar, $\dfrac{2}{6} = \dfrac{1}{3}$, lebih kecil daripada $\dfrac{3}{4}$.
- **D** — salah, $\dfrac{3}{4} + \dfrac{1}{3} = \dfrac{9}{12} + \dfrac{4}{12} = \dfrac{13}{12} = 1\dfrac{1}{12}$ kue. Nilai $\dfrac{5}{10}$ muncul bila pembilang dijumlah dengan pembilang ($3 + 2$) dan penyebut dengan penyebut ($4 + 6$).
- **E** — salah, Kue B dibagi **8**, bukan 6. Sisanya 2 dari 8 bagian, yaitu $\dfrac{2}{8} = \dfrac{1}{4}$.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  {
    // 11
    kode_stimulus: "SD-MTK-P5-KUE",
    kode_subdomain: "SD-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: "Semua sisa kue (bagian yang belum dimakan) dari ketiga loyang dikumpulkan. Jumlah sisa kue seluruhnya adalah ... kue.",
    opsi_a: r`$\dfrac{7}{18}$`,
    opsi_b: r`$\dfrac{2}{3}$`,
    opsi_c: r`$1\dfrac{1}{6}$`,
    opsi_d: r`$1\dfrac{1}{4}$`,
    opsi_e: r`$1\dfrac{5}{6}$`,
    kunci: "C",
    pembahasan: r`Sisa setiap kue: A $= \dfrac{1}{4}$, B $= \dfrac{2}{8} = \dfrac{1}{4}$, C $= \dfrac{4}{6} = \dfrac{2}{3}$.

Jumlah $= \dfrac{1}{4} + \dfrac{1}{4} + \dfrac{2}{3} = \dfrac{3}{12} + \dfrac{3}{12} + \dfrac{8}{12} = \dfrac{14}{12} = 1\dfrac{2}{12} = 1\dfrac{1}{6}$ kue.

Cek setiap pilihan:
- **A.** $\dfrac{7}{18}$ — salah, pembilang dijumlah ($1 + 2 + 4$) dan penyebut dijumlah ($4 + 8 + 6$). Pecahan harus disamakan penyebutnya dulu.
- **B.** $\dfrac{2}{3}$ — salah, ini sisa Kue C saja.
- **C.** $1\dfrac{1}{6}$ — benar.
- **D.** $1\dfrac{1}{4}$ — salah, sisa Kue B dibaca $\dfrac{1}{3}$ (seolah dibagi 6).
- **E.** $1\dfrac{5}{6}$ — salah, ini jumlah bagian yang **sudah dimakan** ($\dfrac{3}{4} + \dfrac{3}{4} + \dfrac{1}{3}$).`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  // ---- Objek geometri ----
  {
    // 12
    kode_subdomain: "SD-MTK-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: "Banyak titik sudut pada sebuah kubus adalah ....",
    opsi_a: "4",
    opsi_b: "6",
    opsi_c: "8",
    opsi_d: "12",
    opsi_e: "24",
    kunci: "C",
    pembahasan: `Titik sudut adalah titik pertemuan tiga rusuk. Kubus memiliki 4 titik sudut di bagian atas dan 4 di bagian bawah, jumlahnya **8**.

Cek setiap pilihan:
- **A. 4** — salah, hanya menghitung titik sudut satu sisi (persegi).
- **B. 6** — salah, ini banyak **sisi** kubus.
- **C. 8** — benar.
- **D. 12** — salah, ini banyak **rusuk** kubus.
- **E. 24** — salah, menghitung 4 titik pada setiap sisi ($6 \\times 4$), padahal setiap titik sudut dipakai bersama oleh 3 sisi.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 13
    kode_subdomain: "SD-MTK-D2-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Manakah sifat yang dimiliki oleh **setiap** persegi panjang?${MCMA}`,
    opsi_a: "Sisi-sisi yang berhadapan sama panjang dan sejajar.",
    opsi_b: "Keempat sudutnya siku-siku.",
    opsi_c: "Kedua diagonalnya sama panjang.",
    opsi_d: "Kedua diagonalnya saling tegak lurus.",
    opsi_e: "Memiliki 4 sumbu simetri.",
    kunci: "A,B,C",
    pembahasan: `- **A** — benar, sisi panjang berhadapan dengan sisi panjang, sisi lebar dengan sisi lebar.
- **B** — benar, semua sudut persegi panjang 90°.
- **C** — benar, kedua diagonal persegi panjang sama panjang.
- **D** — salah, diagonal persegi panjang hanya tegak lurus bila bangunnya persegi. Pada persegi panjang biasa, diagonal berpotongan miring.
- **E** — salah, persegi panjang hanya memiliki **2** sumbu simetri (garis tengah mendatar dan tegak). Empat sumbu simetri adalah sifat persegi.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 14
    kode_subdomain: "SD-MTK-D2-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Tentukan **Benar** atau **Salah** setiap pernyataan tentang bangun datar berikut!",
    opsi_a: "Segi delapan memiliki 8 sisi dan 8 titik sudut.",
    opsi_b: "Setiap sudut segitiga sama sisi besarnya 60°.",
    opsi_c: "Jajargenjang memiliki 2 sumbu simetri.",
    opsi_d: "Setiap persegi juga merupakan persegi panjang.",
    kunci: "B,B,S,B",
    pembahasan: `- **Benar** — "segi delapan" berarti bangun dengan 8 sisi; banyak titik sudutnya sama dengan banyak sisinya.
- **Benar** — jumlah sudut segitiga 180°, dan ketiga sudut segitiga sama sisi sama besar: 180° : 3 = 60°.
- **Salah** — jajargenjang (yang bukan persegi panjang atau belah ketupat) **tidak** memiliki sumbu simetri. Bila dilipat pada garis tengahnya, kedua bagian tidak saling menutupi.
- **Benar** — persegi memenuhi semua ciri persegi panjang: sisi berhadapan sama panjang dan sejajar, serta keempat sudutnya siku-siku. Persegi adalah persegi panjang yang keempat sisinya sama panjang.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 15
    kode_subdomain: "SD-MTK-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: "Sebuah balok berukuran panjang 5 cm, lebar 3 cm, dan tinggi 3 cm. Banyak sisi balok yang berbentuk persegi adalah ....",
    opsi_a: "0",
    opsi_b: "2",
    opsi_c: "3",
    opsi_d: "4",
    opsi_e: "6",
    kunci: "B",
    pembahasan: r`Balok memiliki 6 sisi yang berpasangan:
- 2 sisi berukuran panjang × lebar $= 5 \times 3$ (persegi panjang),
- 2 sisi berukuran panjang × tinggi $= 5 \times 3$ (persegi panjang),
- 2 sisi berukuran lebar × tinggi $= 3 \times 3$ (**persegi**).

Jadi, ada **2** sisi berbentuk persegi.

Cek setiap pilihan:
- **A. 0** — salah, mengira balok tidak pernah memiliki sisi persegi. Balok bisa memiliki sisi persegi bila dua ukurannya sama.
- **B. 2** — benar.
- **C. 3** — salah, setiap jenis sisi pada balok selalu berpasangan (sisi depan–belakang, kiri–kanan, atas–bawah), sehingga banyaknya genap.
- **D. 4** — salah, ini banyak sisi yang berbentuk persegi panjang ($5 \times 3$).
- **E. 6** — salah, semua sisi persegi hanya terjadi pada kubus (ketiga ukurannya sama).`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 16
    kode_subdomain: "SD-MTK-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: "Dika menyusun kubus-kubus satuan menjadi balok berukuran 4 kubus ke samping, 3 kubus ke belakang, dan 2 kubus ke atas. Ia ingin menambah kubus satuan agar susunannya menjadi sebuah kubus besar dengan rusuk 4 kubus satuan. Banyak kubus satuan yang harus ditambahkan adalah ....",
    opsi_a: "8",
    opsi_b: "24",
    opsi_c: "32",
    opsi_d: "40",
    opsi_e: "64",
    kunci: "D",
    pembahasan: r`- Kubus satuan yang sudah ada $= 4 \times 3 \times 2 = 24$.
- Kubus besar rusuk 4 membutuhkan $4 \times 4 \times 4 = 64$ kubus satuan.
- Yang harus ditambahkan $= 64 - 24 = 40$.

Cek setiap pilihan:
- **A. 8** — salah, hanya menambah satu baris ke belakang ($4 \times 1 \times 2$) sehingga menjadi $4 \times 4 \times 2$, belum kubus.
- **B. 24** — salah, ini banyak kubus yang **sudah ada**, bukan yang harus ditambahkan.
- **C. 32** — salah, menganggap susunan semula $4 \times 4 \times 2 = 32$ sehingga $64 - 32$; padahal ke belakang hanya 3 kubus.
- **D. 40** — benar.
- **E. 64** — salah, ini banyak kubus satuan pada kubus besar seluruhnya.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  // ---- Stimulus: Kertas Berpetak ----
  {
    // 17
    kode_stimulus: "SD-MTK-P5-PETAK",
    kode_subdomain: "SD-MTK-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: "Bangun P pada gambar adalah ....",
    opsi_a: "persegi panjang",
    opsi_b: "trapesium",
    opsi_c: "jajargenjang",
    opsi_d: "belah ketupat",
    opsi_e: "layang-layang",
    kunci: "C",
    pembahasan: `Bangun P memiliki dua pasang sisi yang sejajar: sisi atas sejajar sisi bawah (masing-masing 4 petak), dan kedua sisi miringnya juga sejajar. Sudut-sudutnya tidak siku-siku, dan sisi miringnya tidak sama panjang dengan sisi mendatarnya. Bangun seperti ini adalah **jajargenjang**.

Cek setiap pilihan:
- **A. persegi panjang** — salah, sudutnya tidak siku-siku.
- **B. trapesium** — salah, trapesium hanya memiliki sepasang sisi sejajar; P memiliki dua pasang.
- **C. jajargenjang** — benar.
- **D. belah ketupat** — salah, belah ketupat keempat sisinya sama panjang. Sisi miring P (melintasi 2 petak ke samping dan 3 petak ke atas) tidak sama panjang dengan sisi mendatarnya yang 4 cm.
- **E. layang-layang** — salah, layang-layang tidak memiliki sisi yang sejajar.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 18
    kode_stimulus: "SD-MTK-P5-PETAK",
    kode_subdomain: "SD-MTK-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: "Luas bangun P adalah ....",
    opsi_a: "6 cm²",
    opsi_b: "7 cm²",
    opsi_c: "12 cm²",
    opsi_d: "14 cm²",
    opsi_e: "24 cm²",
    kunci: "C",
    pembahasan: r`Luas jajargenjang $=$ alas $\times$ tinggi. Dari gambar, alas P = 4 petak = 4 cm, dan tinggi P (jarak tegak antara sisi atas dan sisi bawah) = 3 petak = 3 cm.

Luas $= 4 \times 3 = 12$ cm².

Cara lain: potong segitiga di sisi kanan P dan tempelkan di sisi kiri; bangun menjadi persegi panjang $4 \times 3$, yaitu 12 petak.

Cek setiap pilihan:
- **A. 6 cm²** — salah, dibagi 2 seperti rumus luas segitiga.
- **B. 7 cm²** — salah, alas dan tinggi dijumlahkan ($4 + 3$).
- **C. 12 cm²** — benar.
- **D. 14 cm²** — salah, $2 \times (4 + 3)$ menyerupai rumus keliling persegi panjang, bukan luas.
- **E. 24 cm²** — salah, hasil kali alas dan tinggi dikalikan 2 lagi.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 19
    kode_stimulus: "SD-MTK-P5-PETAK",
    kode_subdomain: "SD-MTK-D2-S2",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Tentukan **Benar** atau **Salah** setiap pernyataan berikut berdasarkan gambar!",
    opsi_a: "Luas bangun Q adalah 8 cm².",
    opsi_b: "Luas bangun P lebih besar daripada luas bangun Q.",
    opsi_c: "Jumlah luas bangun P dan Q adalah 20 cm².",
    opsi_d: "Luas bangun Q sama dengan luas bangun P.",
    kunci: "B,B,B,S",
    pembahasan: r`Q adalah segitiga siku-siku dengan alas 4 cm dan tinggi 4 cm. Luas $Q = \dfrac{4 \times 4}{2} = 8$ cm². Luas P = 12 cm² (soal sebelumnya).

- **Benar** — luas Q = 8 cm². Cara cek: Q adalah setengah dari persegi $4 \times 4 = 16$ petak.
- **Benar** — 12 cm² > 8 cm².
- **Benar** — $12 + 8 = 20$ cm².
- **Salah** — 8 cm² tidak sama dengan 12 cm². Walaupun alas keduanya sama (4 cm), tinggi berbeda dan rumus luasnya berbeda (segitiga dibagi 2).`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  // ---- Stimulus: Gelas Ukur ----
  {
    // 20
    kode_stimulus: "SD-MTK-P5-GELAS",
    kode_subdomain: "SD-MTK-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: "Banyak jus jeruk di dalam Gelas A adalah ....",
    opsi_a: "700 ml",
    opsi_b: "750 ml",
    opsi_c: "775 ml",
    opsi_d: "800 ml",
    opsi_e: "850 ml",
    kunci: "B",
    pembahasan: `Garis panjang berangka menunjukkan kelipatan 100 ml, dan garis pendek di antaranya menunjukkan 50 ml. Permukaan jus tepat berada pada garis pendek antara 700 dan 800, yaitu **750 ml**.

Cek setiap pilihan:
- **A. 700 ml** — salah, ini garis angka di bawah permukaan jus.
- **B. 750 ml** — benar.
- **C. 775 ml** — salah, garis pendek bernilai 50 ml, bukan 75 ml.
- **D. 800 ml** — salah, ini garis angka di atas permukaan jus.
- **E. 850 ml** — salah, permukaan jus belum melewati garis 800.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 21
    kode_stimulus: "SD-MTK-P5-GELAS",
    kode_subdomain: "SD-MTK-D2-S2",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Manakah ukuran yang sama dengan isi jus jeruk di Gelas A?${MCMA}`,
    opsi_a: "0,75 liter",
    opsi_b: "75 cl",
    opsi_c: "7,5 dl",
    opsi_d: "7,5 liter",
    opsi_e: "0,075 liter",
    kunci: "A,B,C",
    pembahasan: r`Isi Gelas A = 750 ml. Hubungan satuan: 1 liter = 10 dl = 100 cl = 1.000 ml.

- **A** — benar, $750 : 1.000 = 0{,}75$ liter.
- **B** — benar, 1 cl = 10 ml, jadi $750 : 10 = 75$ cl.
- **C** — benar, 1 dl = 100 ml, jadi $750 : 100 = 7{,}5$ dl.
- **D** — salah, 7,5 liter = 7.500 ml, sepuluh kali lebih banyak. Koma salah tempat (dibagi 100, bukan 1.000).
- **E** — salah, 0,075 liter = 75 ml, sepuluh kali lebih sedikit.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 22
    kode_stimulus: "SD-MTK-P5-GELAS",
    kode_subdomain: "SD-MTK-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: "Jus jeruk di Gelas A dan sirup di Gelas B dicampur, lalu dituangkan ke gelas-gelas kecil yang masing-masing berisi 150 ml. Banyak gelas kecil yang dapat terisi penuh adalah ....",
    opsi_a: "2 gelas",
    opsi_b: "5 gelas",
    opsi_c: "7 gelas",
    opsi_d: "8 gelas",
    opsi_e: "1.150 gelas",
    kunci: "C",
    pembahasan: r`Baca Gelas B: permukaan sirup pada garis 400, jadi sirup = 400 ml.

Campuran $= 750 + 400 = 1.150$ ml. $1.150 : 150 = 7$ sisa 100 ml ($7 \times 150 = 1.050$). Sisa 100 ml tidak cukup untuk mengisi penuh gelas ke-8.

Cek setiap pilihan:
- **A. 2 gelas** — salah, hanya sirup ($400 : 150 = 2$ sisa 100).
- **B. 5 gelas** — salah, hanya jus jeruk ($750 : 150 = 5$).
- **C. 7 gelas** — benar.
- **D. 8 gelas** — salah, hasil $7{,}67$ dibulatkan ke atas. Gelas ke-8 hanya terisi 100 ml, tidak penuh.
- **E. 1.150 gelas** — salah, ini jumlah mililiter campuran, belum dibagi 150.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  // ---- Pengukuran (soal tunggal) ----
  {
    // 23
    kode_subdomain: "SD-MTK-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: "Sebuah film dimulai pukul 13.45 dan berlangsung selama 1 jam 50 menit. Film itu selesai pukul ....",
    opsi_a: "14.35",
    opsi_b: "15.25",
    opsi_c: "15.35",
    opsi_d: "14.95",
    opsi_e: "15.95",
    kunci: "C",
    pembahasan: r`Tambahkan jam dulu, lalu menit:
- 13.45 + 1 jam = 14.45
- 14.45 + 15 menit = 15.00
- 15.00 + 35 menit sisanya = 15.35 (karena $15 + 35 = 50$ menit)

Cek setiap pilihan:
- **A. 14.35** — salah, 1 jam terlupa; hanya 50 menit yang ditambahkan.
- **B. 15.25** — salah, 50 menit dihitung 40 menit (13.45 + 1 jam 40 menit).
- **C. 15.35** — benar.
- **D. 14.95** — salah, $45 + 50 = 95$ ditulis langsung sebagai menit. Satu jam hanya 60 menit, jadi 95 menit = 1 jam 35 menit.
- **E. 15.95** — salah, kesalahan yang sama: 95 menit tidak mungkin; waktu ditulis seperti bilangan biasa.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 24
    kode_subdomain: "SD-MTK-D2-S2",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Sebuah bus menempuh jarak 120 km dalam waktu 2 jam 30 menit dengan kecepatan tetap. Tentukan **Benar** atau **Salah** setiap pernyataan berikut!",
    opsi_a: "Kecepatan bus adalah 48 km/jam.",
    opsi_b: "Dalam 1 jam, bus menempuh 60 km.",
    opsi_c: "2 jam 30 menit sama dengan 150 menit.",
    opsi_d: "Jika kecepatannya 60 km/jam, jarak 120 km ditempuh dalam 2 jam.",
    kunci: "B,S,B,B",
    pembahasan: r`2 jam 30 menit $= 2\dfrac{1}{2}$ jam $= 2{,}5$ jam.

- **Benar** — kecepatan $= \dfrac{120}{2{,}5} = 48$ km/jam.
- **Salah** — dalam 1 jam bus menempuh 48 km (sesuai kecepatannya). Nilai 60 km muncul bila waktu dianggap 2 jam saja ($120 : 2$).
- **Benar** — $2 \times 60 + 30 = 150$ menit.
- **Benar** — waktu $= \dfrac{120}{60} = 2$ jam.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  // ---- Stimulus: Cara Pergi ke Sekolah ----
  {
    // 25
    kode_stimulus: "SD-MTK-P5-SEKOLAH",
    kode_subdomain: "SD-MTK-D3-S1",
    bentuk_soal: "pg",
    pertanyaan: "Cara pergi ke sekolah yang paling banyak dipilih siswa adalah ....",
    opsi_a: "jalan kaki",
    opsi_b: "naik sepeda",
    opsi_c: "diantar sepeda motor",
    opsi_d: "naik angkot",
    opsi_e: "jalan kaki dan naik sepeda sama banyak",
    kunci: "C",
    pembahasan: `Bilangan terbesar pada kolom banyak siswa adalah 11, yaitu **diantar sepeda motor**.

Cek setiap pilihan:
- **A. jalan kaki** — salah, 9 siswa; terbanyak kedua.
- **B. naik sepeda** — salah, 7 siswa.
- **C. diantar sepeda motor** — benar, 11 siswa.
- **D. naik angkot** — salah, 5 siswa; justru paling sedikit.
- **E** — salah, jalan kaki (9) dan naik sepeda (7) tidak sama banyak.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 26
    kode_stimulus: "SD-MTK-P5-SEKOLAH",
    kode_subdomain: "SD-MTK-D3-S1",
    bentuk_soal: "pg",
    pertanyaan: "Selisih banyak siswa yang berjalan kaki dan yang naik angkot adalah ....",
    opsi_a: "2 siswa",
    opsi_b: "4 siswa",
    opsi_c: "6 siswa",
    opsi_d: "9 siswa",
    opsi_e: "14 siswa",
    kunci: "B",
    pembahasan: r`Jalan kaki 9 siswa, naik angkot 5 siswa. Selisih $= 9 - 5 = 4$ siswa.

Cek setiap pilihan:
- **A. 2 siswa** — salah, ini selisih jalan kaki dan naik sepeda ($9 - 7$).
- **B. 4 siswa** — benar.
- **C. 6 siswa** — salah, ini selisih diantar sepeda motor dan naik angkot ($11 - 5$).
- **D. 9 siswa** — salah, ini banyak siswa yang berjalan kaki saja.
- **E. 14 siswa** — salah, ini jumlah ($9 + 5$), bukan selisih.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 27
    kode_stimulus: "SD-MTK-P5-SEKOLAH",
    kode_subdomain: "SD-MTK-D3-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Data tersebut akan dibuat piktogram. Setiap 1 gambar orang mewakili 2 siswa.

Manakah pernyataan yang benar?${MCMA}`,
    opsi_a: r`Jalan kaki digambarkan dengan $4\dfrac{1}{2}$ gambar orang.`,
    opsi_b: r`Naik sepeda digambarkan dengan $3\dfrac{1}{2}$ gambar orang.`,
    opsi_c: r`Diantar sepeda motor digambarkan dengan $5\dfrac{1}{2}$ gambar orang.`,
    opsi_d: "Naik angkot digambarkan dengan 3 gambar orang.",
    opsi_e: "Seluruh piktogram berisi 32 gambar orang.",
    kunci: "A,B,C",
    pembahasan: r`Banyak gambar = banyak siswa $: 2$. Bila hasilnya ada sisa 1 siswa, digambar setengah gambar orang.

- **A** — benar, $9 : 2 = 4\dfrac{1}{2}$.
- **B** — benar, $7 : 2 = 3\dfrac{1}{2}$.
- **C** — benar, $11 : 2 = 5\dfrac{1}{2}$.
- **D** — salah, $5 : 2 = 2\dfrac{1}{2}$ gambar; 3 gambar berarti 6 siswa.
- **E** — salah, 32 adalah banyak siswa. Banyak gambar $= 32 : 2 = 16$.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 28
    kode_stimulus: "SD-MTK-P5-SEKOLAH",
    kode_subdomain: "SD-MTK-D3-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Tentukan **Benar** atau **Salah** setiap pernyataan berikut!",
    opsi_a: "Lebih dari setengah siswa pergi ke sekolah tanpa kendaraan bermotor (jalan kaki atau naik sepeda).",
    opsi_b: "Siswa yang naik sepeda kurang dari seperempat seluruh siswa.",
    opsi_c: "Jika 3 siswa yang biasa diantar sepeda motor beralih berjalan kaki, cara yang paling banyak dipilih menjadi jalan kaki.",
    kunci: "S,B,B",
    pembahasan: r`- **Salah** — jalan kaki + naik sepeda $= 9 + 7 = 16$ siswa. Setengah dari 32 adalah 16, jadi tepat setengah, **bukan lebih dari** setengah.
- **Benar** — seperempat dari 32 adalah 8. Siswa naik sepeda 7, kurang dari 8.
- **Benar** — setelah berpindah: jalan kaki $9 + 3 = 12$, diantar sepeda motor $11 - 3 = 8$. Jalan kaki (12) menjadi yang terbanyak.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  {
    // 29
    kode_stimulus: "SD-MTK-P5-SEKOLAH",
    kode_subdomain: "SD-MTK-D3-S1",
    bentuk_soal: "pg",
    pertanyaan: "Kelas VI memiliki 30 siswa. Sebanyak 40% siswa kelas VI pergi ke sekolah dengan berjalan kaki. Banyak siswa kelas V dan kelas VI yang berjalan kaki seluruhnya adalah ....",
    opsi_a: "9 siswa",
    opsi_b: "12 siswa",
    opsi_c: "21 siswa",
    opsi_d: "40 siswa",
    opsi_e: "49 siswa",
    kunci: "C",
    pembahasan: r`Siswa kelas VI yang berjalan kaki $= 40\% \times 30 = \dfrac{40}{100} \times 30 = 12$ siswa. Kelas V yang berjalan kaki (dari tabel) = 9 siswa.

Jumlah $= 9 + 12 = 21$ siswa.

Cek setiap pilihan:
- **A. 9 siswa** — salah, ini kelas V saja.
- **B. 12 siswa** — salah, ini kelas VI saja.
- **C. 21 siswa** — benar.
- **D. 40 siswa** — salah, 40 adalah besar persen, bukan banyak siswa.
- **E. 49 siswa** — salah, persen langsung dijumlahkan dengan banyak siswa ($9 + 40$).`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  // ---- Data (soal tunggal) ----
  {
    // 30
    kode_subdomain: "SD-MTK-D3-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: `Berat lima karung beras di sebuah toko adalah 25 kg, 30 kg, 28 kg, 27 kg, dan 30 kg.

Tentukan **Benar** atau **Salah** setiap pernyataan berikut!`,
    opsi_a: "Rata-rata berat karung beras adalah 28 kg.",
    opsi_b: "Berat yang paling sering muncul (modus) adalah 30 kg.",
    opsi_c: "Berat kelima karung seluruhnya adalah 140 kg.",
    opsi_d: "Ada 3 karung yang beratnya lebih dari rata-rata.",
    kunci: "B,B,B,S",
    pembahasan: r`Jumlah berat $= 25 + 30 + 28 + 27 + 30 = 140$ kg.

- **Benar** — rata-rata $= 140 : 5 = 28$ kg.
- **Benar** — 30 kg muncul dua kali, berat lain hanya sekali.
- **Benar** — jumlahnya 140 kg.
- **Salah** — berat yang lebih dari 28 kg hanya 30 kg dan 30 kg, yaitu **2** karung. Karung 28 kg sama dengan rata-rata, tidak lebih.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
];

export default {
  title: "TKA SD Matematika — Paket 5",
  description: "30 soal: operasi hitung, pecahan dan persen, KPK dan FPB, sifat bangun datar dan bangun ruang, luas pada kertas berpetak, membaca gelas ukur, waktu dan kecepatan, serta pengolahan data. Dilengkapi gambar dan pembahasan setiap pilihan jawaban.",
  jenjang: "SD",
  subjectCode: "SD-MTK",
  durationMinutes: 75,
  isPremium: true,
  isFullSimulation: true,
  createdByEmail: "kpbgalimka@gmail.com",
  stimuli,
  rows,
  images: {
    "kue-lapis": { title: "Tiga kue lapis dengan bagian yang diarsir", svg: imgKue() },
    "kertas-petak": { title: "Jajargenjang P dan segitiga Q pada kertas berpetak", svg: imgPetak() },
    "gelas-ukur": { title: "Gelas ukur A (jus jeruk) dan B (sirup)", svg: imgGelas() },
  },
};
