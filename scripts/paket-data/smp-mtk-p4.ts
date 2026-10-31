// TKA SMP Matematika — Paket 4 (ditulis Claude). 30 soal: 18 PG · 6 MCMA · 6 Kategori;
// 10/10 subtopik (3 soal masing-masing); L1 7 · L2 14 · L3 9. 3 gambar SVG baru: garis sejajar
// & transversal, segitiga pada bidang koordinat, diagram garis penjualan sepeda listrik.
// Pembahasan membahas setiap pilihan (kenapa benar / kenapa salah).
const r = String.raw;
const FONT = `font-family="Arial, Helvetica, sans-serif"`;
const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" ${FONT}><rect width="${w}" height="${h}" fill="#fff"/>${body}</svg>`;
const text = (x: number, y: number, t: string, o: { size?: number; anchor?: string; weight?: string; fill?: string; italic?: boolean } = {}) =>
  `<text x="${x}" y="${y}" font-size="${o.size ?? 18}" text-anchor="${o.anchor ?? "middle"}" font-weight="${o.weight ?? "normal"}" fill="${o.fill ?? "#111"}"${o.italic ? ` font-style="italic"` : ""}>${t}</text>`;
const line = (x1: number, y1: number, x2: number, y2: number, o: { stroke?: string; w?: number; dash?: boolean } = {}) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.stroke ?? "#111"}" stroke-width="${o.w ?? 2}"${o.dash ? ` stroke-dasharray="6 5"` : ""}/>`;
const dot = (x: number, y: number, rr = 5, fill = "#111") => `<circle cx="${x}" cy="${y}" r="${rr}" fill="${fill}"/>`;
// Busur sudut dari arah a1° ke a2° (derajat, koordinat SVG: 0° = kanan, searah jarum jam).
const arc = (cx: number, cy: number, rr: number, a1: number, a2: number, stroke: string) => {
  const p = (a: number) => [cx + rr * Math.cos((a * Math.PI) / 180), cy + rr * Math.sin((a * Math.PI) / 180)].map((v) => v.toFixed(1)).join(",");
  return `<path d="M${p(a1)} A${rr},${rr} 0 0 1 ${p(a2)}" fill="none" stroke="${stroke}" stroke-width="2.5"/>`;
};

// ---------- Gambar ----------

// Stimulus garis sejajar l ∥ m dipotong t (70° terhadap l). (3x+10)° & (5x−30)° dalam berseberangan, y berpelurus dengan (5x−30)°.
function imgSejajar() {
  const k = Math.cos((70 * Math.PI) / 180) / Math.sin((70 * Math.PI) / 180); // dx per dy
  const P = [300, 90], Q = [300 + 160 * k, 250];
  let s = line(50, 90, 580, 90, { w: 3 }) + line(50, 250, 580, 250, { w: 3 });
  s += line(300 - 60 * k, 30, Q[0] + 60 * k, 310, { w: 3, stroke: "#1d4ed8" });
  s += text(592, 96, "l", { italic: true, weight: "bold", anchor: "start", size: 22 }) + text(592, 256, "m", { italic: true, weight: "bold", anchor: "start", size: 22 });
  s += text(300 - 60 * k + 14, 34, "t", { italic: true, weight: "bold", anchor: "start", size: 22, fill: "#1d4ed8" });
  s += arc(P[0], P[1], 34, 0, 70, "#dc2626") + text(P[0] + 44, P[1] + 34, "(3x + 10)°", { anchor: "start", fill: "#dc2626", weight: "bold" });
  s += arc(Q[0], Q[1], 34, 180, 250, "#059669") + text(Q[0] - 42, Q[1] - 14, "(5x − 30)°", { anchor: "end", fill: "#059669", weight: "bold" });
  s += arc(Q[0], Q[1], 26, 70, 180, "#7c3aed") + text(Q[0] - 34, Q[1] + 34, "y", { anchor: "end", fill: "#7c3aed", weight: "bold", italic: true, size: 22 });
  return svg(640, 330, dot(P[0], P[1], 4) + dot(Q[0], Q[1], 4) + s);
}

// Stimulus segitiga ABC: A(1, 2), B(4, 2), C(1, 5) pada bidang koordinat −6..6.
function imgKoordinat() {
  const c = 34, O = [250, 250];
  const X = (x: number) => O[0] + x * c, Y = (y: number) => O[1] - y * c;
  let s = "";
  for (let i = -6; i <= 6; i++) {
    s += line(X(i), Y(-6), X(i), Y(6), { stroke: "#e5e7eb", w: 1 }) + line(X(-6), Y(i), X(6), Y(i), { stroke: "#e5e7eb", w: 1 });
    if (i !== 0) s += text(X(i), O[1] + 18, String(i).replace("-", "−"), { size: 12 }) + text(O[0] - 8, Y(i) + 4, String(i).replace("-", "−"), { size: 12, anchor: "end" });
  }
  s += line(X(-6) - 10, O[1], X(6) + 12, O[1], { w: 2 }) + line(O[0], Y(-6) + 10, O[0], Y(6) - 12, { w: 2 });
  s += `<path d="M${X(6) + 18},${O[1]} l-10,-6 v12 z"/><path d="M${O[0]},${Y(6) - 18} l-6,10 h12 z"/>`;
  s += text(X(6) + 14, O[1] + 22, "x", { italic: true, weight: "bold" }) + text(O[0] + 14, Y(6) - 6, "y", { italic: true, weight: "bold" }) + text(O[0] - 8, O[1] + 18, "O", { size: 13, anchor: "end" });
  s += `<polygon points="${X(1)},${Y(2)} ${X(4)},${Y(2)} ${X(1)},${Y(5)}" fill="#fecaca" fill-opacity="0.7" stroke="#b91c1c" stroke-width="2.5"/>`;
  s += dot(X(1), Y(2), 4) + dot(X(4), Y(2), 4) + dot(X(1), Y(5), 4);
  s += text(X(1) - 8, Y(2) + 20, "A", { weight: "bold", anchor: "end" }) + text(X(4) + 8, Y(2) + 20, "B", { weight: "bold", anchor: "start" }) + text(X(1) - 8, Y(5) - 6, "C", { weight: "bold", anchor: "end" });
  return svg(500, 500, s);
}

// Stimulus diagram garis penjualan sepeda listrik Jan–Jun: 12, 15, 9, 18, 24, 18 (garis bantu tiap 3).
function imgSepeda() {
  const data: [string, number][] = [["Jan", 12], ["Feb", 15], ["Mar", 9], ["Apr", 18], ["Mei", 24], ["Jun", 18]];
  const x0 = 80, y0 = 380, h = 11; // 1 unit = 11 px
  let s = text(345, 30, "Penjualan Sepeda Listrik Toko Maju, Januari–Juni", { size: 19, weight: "bold" });
  for (let v = 0; v <= 27; v += 3) {
    s += line(x0, y0 - v * h, 620, y0 - v * h, { stroke: "#e5e7eb", w: 1 });
    s += text(x0 - 10, y0 - v * h + 5, String(v), { anchor: "end", size: 14 });
  }
  const pts = data.map(([, v], i) => [x0 + 50 + i * 90, y0 - v * h]);
  s += `<polyline points="${pts.map((p) => p.join(",")).join(" ")}" fill="none" stroke="#ea580c" stroke-width="3"/>`;
  data.forEach(([k, v], i) => {
    s += dot(pts[i][0], pts[i][1], 6, "#ea580c") + text(pts[i][0], pts[i][1] - 12, String(v), { size: 15, weight: "bold" });
    s += text(pts[i][0], y0 + 24, k, { size: 15 });
  });
  s += line(x0, y0, 620, y0, { w: 2 }) + line(x0, 50, x0, y0, { w: 2 });
  s += text(350, y0 + 50, "Bulan", { size: 16 });
  s += `<text x="26" y="${y0 - 150}" font-size="16" text-anchor="middle" transform="rotate(-90 26 ${y0 - 150})">Banyak sepeda terjual (unit)</text>`;
  return svg(650, 450, s);
}

// ---------- Stimulus ----------

const stimuli = [
  {
    code: "SMP-MTK-P4-SEJAJAR",
    title: "Garis Sejajar dan Garis Transversal",
    content: "Pada gambar berikut, garis $l$ sejajar dengan garis $m$. Kedua garis itu dipotong oleh garis $t$.",
    gambar: "garis-sejajar",
  },
  {
    code: "SMP-MTK-P4-KOORDINAT",
    title: "Segitiga ABC pada Bidang Koordinat",
    content: "Segitiga ABC digambar pada bidang koordinat Kartesius berikut. Koordinat titik-titiknya adalah A(1, 2), B(4, 2), dan C(1, 5).",
    gambar: "segitiga-koordinat",
  },
  {
    code: "SMP-MTK-P4-SEPEDA",
    title: "Penjualan Sepeda Listrik",
    content: "Diagram garis berikut menunjukkan banyak sepeda listrik yang terjual di Toko Maju setiap bulan dari Januari sampai Juni.",
    gambar: "diagram-sepeda",
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

const MCMA = "\n\nPilihlah **semua** jawaban yang benar!";

const rows: Row[] = [
  // ---- Bilangan Real ----
  {
    // 1
    kode_subdomain: "SMP-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: "Ukuran sebuah bakteri adalah 0,000045 meter. Bentuk notasi ilmiah dari ukuran tersebut adalah ....",
    opsi_a: r`$4{,}5 \times 10^{-4}$ meter`,
    opsi_b: r`$4{,}5 \times 10^{-5}$ meter`,
    opsi_c: r`$45 \times 10^{-6}$ meter`,
    opsi_d: r`$4{,}5 \times 10^{5}$ meter`,
    kunci: "B",
    pembahasan: r`Notasi ilmiah berbentuk $a \times 10^n$ dengan $1 \le a < 10$. Agar 0,000045 menjadi 4,5, koma digeser **5 tempat ke kanan**. Karena bilangannya kurang dari 1, pangkatnya negatif: $0{,}000045 = 4{,}5 \times 10^{-5}$.

Cek setiap pilihan:
- **A.** $4{,}5 \times 10^{-4} = 0{,}00045$ — salah, nilainya 10 kali lebih besar (koma hanya digeser 4 tempat).
- **B.** $4{,}5 \times 10^{-5}$ — benar.
- **C.** $45 \times 10^{-6}$ — **nilainya sama** (0,000045), tetapi **bukan notasi ilmiah** karena $45$ tidak memenuhi $1 \le a < 10$.
- **D.** $4{,}5 \times 10^{5} = 450.000$ — salah, pangkat positif menghasilkan bilangan besar, padahal ukuran bakteri sangat kecil.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 2
    kode_subdomain: "SMP-MTK-D1-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Tentukan **Benar** atau **Salah** setiap pernyataan berikut!",
    opsi_a: r`$2^3 \times 2^4 = 2^{12}$`,
    opsi_b: r`$(-3)^2 = 9$`,
    opsi_c: r`$\sqrt{48} = 4\sqrt{3}$`,
    opsi_d: r`$5^0 = 0$`,
    kunci: "S,B,B,S",
    pembahasan: r`- **Salah** — perkalian bilangan berpangkat dengan basis sama: pangkatnya **dijumlahkan**, bukan dikalikan. $2^3 \times 2^4 = 2^{3+4} = 2^7 = 128$, sedangkan $2^{12} = 4.096$.
- **Benar** — $(-3)^2 = (-3) \times (-3) = 9$; negatif dikali negatif hasilnya positif. (Bandingkan dengan $-3^2 = -9$, karena tanpa kurung hanya 3 yang dikuadratkan.)
- **Benar** — $\sqrt{48} = \sqrt{16 \times 3} = \sqrt{16} \times \sqrt{3} = 4\sqrt{3}$. Pilih faktor 48 yang merupakan bilangan kuadrat terbesar (16).
- **Salah** — setiap bilangan bukan nol berpangkat nol hasilnya **1**, sehingga $5^0 = 1$. Alasannya: $\dfrac{5^2}{5^2} = 5^{2-2} = 5^0$, padahal $\dfrac{25}{25} = 1$.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 3
    kode_subdomain: "SMP-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: "Pembangunan sebuah gedung direncanakan selesai dalam 30 hari oleh 12 pekerja. Setelah 10 hari bekerja, pemborong menambah 4 pekerja dengan kemampuan kerja yang sama. Pembangunan gedung selesai lebih cepat ... hari dari rencana.",
    opsi_a: "5",
    opsi_b: "10",
    opsi_c: "15",
    opsi_d: "20",
    kunci: "A",
    pembahasan: r`Sisa pekerjaan setelah 10 hari setara dengan pekerjaan 12 pekerja selama $30 - 10 = 20$ hari.

Banyak pekerja dan waktu berbanding **berbalik nilai** (pekerja lebih banyak, waktu lebih singkat):

$12 \times 20 = 16 \times t \Rightarrow t = \dfrac{240}{16} = 15$ hari.

Total waktu $= 10 + 15 = 25$ hari. Lebih cepat $30 - 25 = 5$ hari.

Cek setiap pilihan:
- **A. 5** — benar.
- **B. 10** — salah, ini 10 hari pertama sebelum pekerja ditambah, bukan selisih waktu.
- **C. 15** — salah, ini lama penyelesaian **sisa** pekerjaan oleh 16 pekerja, bukan selisih dengan rencana.
- **D. 20** — salah, ini sisa waktu menurut rencana awal. Bila dihitung berbanding senilai ($\dfrac{16}{12} \times 20 \approx 26{,}7$) hasilnya pun keliru karena tambahan pekerja justru mempersingkat waktu.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  // ---- Persamaan & Pertidaksamaan Linear ----
  {
    // 4
    kode_subdomain: "SMP-MTK-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Nilai $x$ yang memenuhi persamaan $5(x - 2) = 3x + 4$ adalah ....`,
    opsi_a: "−7",
    opsi_b: "3",
    opsi_c: "7",
    opsi_d: "14",
    kunci: "C",
    pembahasan: r`$5(x - 2) = 3x + 4$

$5x - 10 = 3x + 4$ (sifat distributif)

$5x - 3x = 4 + 10$

$2x = 14 \Rightarrow x = 7$

Periksa: $5(7 - 2) = 25$ dan $3(7) + 4 = 25$. ✓

Cek setiap pilihan:
- **A. −7** — salah, tanda berubah keliru saat memindahkan suku. Periksa: $5(-9) = -45 \ne 3(-7) + 4 = -17$.
- **B. 3** — salah, 5 hanya dikalikan ke $x$, tidak ke $-2$: $5x - 2 = 3x + 4 \Rightarrow x = 3$. Distributif harus mengalikan **kedua** suku dalam kurung.
- **C. 7** — benar.
- **D. 14** — salah, berhenti pada $2x = 14$ dan lupa membagi dengan 2.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 5
    kode_subdomain: "SMP-MTK-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: "Rina membeli 2 buku dan 3 pensil seharga Rp17.000,00. Doni membeli 1 buku dan 2 pensil yang sama seharga Rp10.000,00. Harga 3 buku dan 1 pensil adalah ....",
    opsi_a: "Rp12.000,00",
    opsi_b: "Rp13.000,00",
    opsi_c: "Rp15.000,00",
    opsi_d: "Rp17.000,00",
    kunci: "C",
    pembahasan: r`Misalkan harga 1 buku $= b$ dan harga 1 pensil $= p$.

$2b + 3p = 17.000$ ... (1)
$b + 2p = 10.000$ ... (2)

Kalikan (2) dengan 2: $2b + 4p = 20.000$ ... (3)

(3) − (1): $p = 3.000$. Substitusi ke (2): $b = 10.000 - 6.000 = 4.000$.

Harga 3 buku dan 1 pensil $= 3(4.000) + 3.000 = 15.000$.

Cek setiap pilihan:
- **A. Rp12.000,00** — salah, ini harga 3 buku saja; harga 1 pensil belum ditambahkan.
- **B. Rp13.000,00** — salah, harga buku dan pensil tertukar: $3(3.000) + 4.000$.
- **C. Rp15.000,00** — benar.
- **D. Rp17.000,00** — salah, ini harga belanjaan Rina (2 buku dan 3 pensil), bukan 3 buku dan 1 pensil.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 6
    kode_subdomain: "SMP-MTK-D2-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Sebuah lift barang memiliki beban maksimum 500 kg. Seorang petugas dengan berat 70 kg naik lift sambil membawa beberapa kotak. Setiap kotak beratnya 25 kg. Misalkan banyak kotak adalah $x$.${MCMA}`,
    opsi_a: r`Model matematikanya adalah $70 + 25x \le 500$.`,
    opsi_b: r`Model matematikanya adalah $25x \ge 430$.`,
    opsi_c: "Petugas dapat membawa paling banyak 17 kotak.",
    opsi_d: "Petugas masih aman membawa 18 kotak.",
    opsi_e: "Jika berat setiap kotak 20 kg, petugas dapat membawa paling banyak 21 kotak.",
    kunci: "A,C,E",
    pembahasan: r`Berat total (petugas + kotak) **tidak boleh melebihi** 500 kg, sehingga tanda yang dipakai adalah $\le$.

$70 + 25x \le 500 \Rightarrow 25x \le 430 \Rightarrow x \le 17{,}2$.

Karena banyak kotak bilangan cacah, $x$ paling besar 17.

Cek setiap pilihan:
- **A** — benar, sesuai uraian di atas.
- **B** — salah, tanda $\ge$ berarti "paling sedikit", padahal batas lift adalah "paling banyak".
- **C** — benar, $70 + 25(17) = 495 \le 500$.
- **D** — salah, $70 + 25(18) = 520 > 500$, melebihi batas lift.
- **E** — benar, $70 + 20x \le 500 \Rightarrow x \le 21{,}5$, jadi paling banyak 21 kotak; periksa $70 + 20(21) = 490$ dan $70 + 20(22) = 510$ (melebihi).`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  // ---- Bentuk Aljabar ----
  {
    // 7
    kode_subdomain: "SMP-MTK-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: r`Bentuk sederhana dari $3(2x - 4) - 2(x - 5)$ adalah ....`,
    opsi_a: r`$4x - 22$`,
    opsi_b: r`$4x - 17$`,
    opsi_c: r`$4x - 2$`,
    opsi_d: r`$8x - 2$`,
    kunci: "C",
    pembahasan: r`$3(2x - 4) - 2(x - 5) = 6x - 12 - 2x + 10 = (6x - 2x) + (-12 + 10) = 4x - 2$.

Perhatikan: $-2 \times (-5) = +10$ (negatif dikali negatif menjadi positif).

Cek setiap pilihan:
- **A.** $4x - 22$ — salah, $-2 \times (-5)$ dihitung $-10$ sehingga $-12 - 10 = -22$.
- **B.** $4x - 17$ — salah, $-2$ hanya dikalikan ke $x$, sedangkan $-5$ ditulis apa adanya: $-12 - 5 = -17$.
- **C.** $4x - 2$ — benar.
- **D.** $8x - 2$ — salah, suku $-2x$ dijumlahkan menjadi $6x + 2x$; tanda negatif di depan 2 terlupa.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 8
    kode_subdomain: "SMP-MTK-D2-S2",
    bentuk_soal: "pgk_mcma",
    pertanyaan: r`Manakah bentuk aljabar yang setara dengan $(x + 3)(x - 2)$?${MCMA}`,
    opsi_a: r`$x^2 + x - 6$`,
    opsi_b: r`$x^2 - x - 6$`,
    opsi_c: r`$x(x + 1) - 6$`,
    opsi_d: r`$x^2 - 6$`,
    opsi_e: r`$(x - 2)(x + 3)$`,
    kunci: "A,C,E",
    pembahasan: r`Kalikan setiap suku: $(x + 3)(x - 2) = x^2 - 2x + 3x - 6 = x^2 + x - 6$.

Cek setiap pilihan:
- **A.** $x^2 + x - 6$ — benar, hasil perkalian di atas.
- **B.** $x^2 - x - 6$ — salah, tanda suku tengah terbalik; ini hasil $(x - 3)(x + 2)$.
- **C.** $x(x + 1) - 6 = x^2 + x - 6$ — benar, sifat distributif menghasilkan bentuk yang sama.
- **D.** $x^2 - 6$ — salah, hanya suku pertama dikali suku pertama dan suku kedua dikali suku kedua; suku $-2x + 3x = x$ terlupa.
- **E.** $(x - 2)(x + 3)$ — benar, perkalian bersifat komutatif: urutan faktor boleh ditukar.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 9
    kode_subdomain: "SMP-MTK-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: r`Sebuah kebun berbentuk persegi panjang memiliki panjang $(2x + 3)$ meter dan lebar $(x - 1)$ meter. Keliling kebun itu 40 meter. Luas kebun tersebut adalah ....`,
    opsi_a: "20 m²",
    opsi_b: "75 m²",
    opsi_c: "90 m²",
    opsi_d: "150 m²",
    kunci: "B",
    pembahasan: r`Keliling $= 2(p + l) = 2\big((2x + 3) + (x - 1)\big) = 2(3x + 2) = 6x + 4$.

$6x + 4 = 40 \Rightarrow 6x = 36 \Rightarrow x = 6$.

Panjang $= 2(6) + 3 = 15$ m dan lebar $= 6 - 1 = 5$ m. Periksa keliling: $2(15 + 5) = 40$ ✓.

Luas $= 15 \times 5 = 75$ m².

Cek setiap pilihan:
- **A. 20 m²** — salah, ini $p + l = 15 + 5$ (setengah keliling), bukan luas.
- **B. 75 m²** — benar.
- **C. 90 m²** — salah, lebar diambil $x = 6$ m, lupa dikurangi 1: $15 \times 6$.
- **D. 150 m²** — salah, luas dikalikan 2 seperti menghitung keliling: $2 \times 15 \times 5$.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  // ---- Fungsi ----
  {
    // 10
    kode_subdomain: "SMP-MTK-D2-S3",
    bentuk_soal: "pg",
    pertanyaan: r`Diketahui fungsi $f(x) = 3x - 5$. Nilai $f(-2)$ adalah ....`,
    opsi_a: "−11",
    opsi_b: "−1",
    opsi_c: "1",
    opsi_d: "11",
    kunci: "A",
    pembahasan: r`Substitusikan $x = -2$: $f(-2) = 3(-2) - 5 = -6 - 5 = -11$.

Cek setiap pilihan:
- **A. −11** — benar.
- **B. −1** — salah, $-6 - 5$ dihitung seperti $-6 + 5$.
- **C. 1** — salah, $3(-2)$ dihitung $+6$, lalu $6 - 5 = 1$. Positif dikali negatif hasilnya negatif.
- **D. 11** — salah, tanda negatif hasil akhir hilang.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 11
    kode_subdomain: "SMP-MTK-D2-S3",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: `Diketahui himpunan A = {1, 2, 3, 4} dan B = {a, b, c, d}. Relasi dari A ke B dinyatakan dengan himpunan pasangan berurutan {(1, a), (2, b), (3, a), (4, c)}.

Tentukan **Benar** atau **Salah** setiap pernyataan berikut!`,
    opsi_a: "Relasi tersebut merupakan fungsi.",
    opsi_b: "Daerah hasil (range) fungsi tersebut adalah {a, b, c}.",
    opsi_c: "Kodomain fungsi tersebut adalah {a, b, c}.",
    opsi_d: "Jika pasangan (2, d) ditambahkan, relasi tersebut tetap merupakan fungsi.",
    kunci: "B,B,S,S",
    pembahasan: `Fungsi dari A ke B: **setiap** anggota A dipasangkan dengan **tepat satu** anggota B.

- **Benar** — 1, 2, 3, dan 4 masing-masing punya tepat satu pasangan. Anggota B boleh dipakai lebih dari sekali (a dipasangkan dengan 1 dan 3) dan boleh tidak dipakai (d).
- **Benar** — daerah hasil adalah anggota B yang benar-benar menjadi pasangan: a, b, dan c.
- **Salah** — kodomain adalah **seluruh** himpunan B = {a, b, c, d}, termasuk d yang tidak punya pasangan. Kodomain sering tertukar dengan daerah hasil.
- **Salah** — bila (2, d) ditambahkan, anggota 2 punya dua pasangan (b dan d), sehingga syarat "tepat satu" tidak terpenuhi.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 12
    kode_subdomain: "SMP-MTK-D2-S3",
    bentuk_soal: "pg",
    pertanyaan: r`Tarif taksi daring dihitung dengan fungsi $f(x) = ax + b$, dengan $x$ jarak tempuh (km) dan $b$ biaya awal. Perjalanan 5 km bertarif Rp28.000,00 dan perjalanan 12 km bertarif Rp56.000,00. Tarif untuk perjalanan 20 km adalah ....`,
    opsi_a: "Rp80.000,00",
    opsi_b: "Rp88.000,00",
    opsi_c: "Rp96.000,00",
    opsi_d: "Rp112.000,00",
    kunci: "B",
    pembahasan: r`$f(5) = 5a + b = 28.000$ ... (1)
$f(12) = 12a + b = 56.000$ ... (2)

(2) − (1): $7a = 28.000 \Rightarrow a = 4.000$ (tarif per km).
Substitusi ke (1): $20.000 + b = 28.000 \Rightarrow b = 8.000$ (biaya awal).

$f(20) = 4.000(20) + 8.000 = 88.000$.

Cek setiap pilihan:
- **A. Rp80.000,00** — salah, biaya awal $b$ tidak ditambahkan ($4.000 \times 20$).
- **B. Rp88.000,00** — benar.
- **C. Rp96.000,00** — salah, menjumlahkan tarif 12 km dan 8 km ($56.000 + 40.000$). Cara ini menghitung biaya awal **dua kali**.
- **D. Rp112.000,00** — salah, tarif dianggap sebanding dengan jarak ($\dfrac{28.000}{5} \times 20$). Karena ada biaya awal, tarif tidak sebanding dengan jarak.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  // ---- Barisan dan Deret ----
  {
    // 13
    kode_subdomain: "SMP-MTK-D2-S4",
    bentuk_soal: "pg",
    pertanyaan: "Suku ke-10 dari barisan 4, 7, 10, 13, ... adalah ....",
    opsi_a: "30",
    opsi_b: "31",
    opsi_c: "34",
    opsi_d: "40",
    kunci: "B",
    pembahasan: r`Barisan aritmetika dengan suku pertama $a = 4$ dan beda $b = 7 - 4 = 3$.

$U_n = a + (n - 1)b \Rightarrow U_{10} = 4 + 9 \times 3 = 31$.

Cek setiap pilihan:
- **A. 30** — salah, hanya $10 \times 3$; suku pertama tidak diperhitungkan.
- **B. 31** — benar.
- **C. 34** — salah, memakai $n \times b$ alih-alih $(n - 1) \times b$: $4 + 10 \times 3$. Ini suku ke-11.
- **D. 40** — salah, $10 \times 4$; suku pertama dikalikan banyak suku, padahal yang bertambah tetap adalah beda 3.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 14
    kode_subdomain: "SMP-MTK-D2-S4",
    bentuk_soal: "pg",
    pertanyaan: "Sebuah gedung pertunjukan memiliki 12 baris kursi. Baris pertama berisi 15 kursi, dan setiap baris berikutnya berisi 2 kursi lebih banyak daripada baris di depannya. Banyak kursi seluruhnya adalah ....",
    opsi_a: "37",
    opsi_b: "180",
    opsi_c: "312",
    opsi_d: "324",
    kunci: "C",
    pembahasan: r`Deret aritmetika dengan $a = 15$, $b = 2$, $n = 12$.

Baris terakhir: $U_{12} = 15 + 11 \times 2 = 37$.

Jumlah kursi: $S_{12} = \dfrac{n}{2}(a + U_{12}) = \dfrac{12}{2}(15 + 37) = 6 \times 52 = 312$.

Cek setiap pilihan:
- **A. 37** — salah, ini banyak kursi pada baris ke-12 saja, bukan jumlah seluruh kursi.
- **B. 180** — salah, $12 \times 15$; setiap baris dianggap sama banyak, padahal bertambah 2.
- **C. 312** — benar.
- **D. 324** — salah, memakai $(n)b$ alih-alih $(n - 1)b$: baris terakhir dihitung $15 + 12 \times 2 = 39$, sehingga $6 \times 54 = 324$.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 15
    kode_subdomain: "SMP-MTK-D2-S4",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Diketahui barisan bilangan 3, 6, 12, 24, ....${MCMA}`,
    opsi_a: "Setiap suku diperoleh dengan mengalikan suku sebelumnya dengan 2.",
    opsi_b: "Suku ke-6 barisan tersebut adalah 96.",
    opsi_c: "Jumlah 5 suku pertama barisan tersebut adalah 93.",
    opsi_d: "Suku ke-7 barisan tersebut adalah 162.",
    opsi_e: "Barisan tersebut adalah barisan aritmetika dengan beda 3.",
    kunci: "A,B,C",
    pembahasan: r`Perbandingan suku berurutan tetap: $6 : 3 = 12 : 6 = 24 : 12 = 2$. Jadi barisan ini barisan **geometri** dengan rasio 2.

Lanjutkan barisan: 3, 6, 12, 24, **48**, **96**, **192**, ....

Cek setiap pilihan:
- **A** — benar, rasionya 2.
- **B** — benar, suku ke-6 adalah 96.
- **C** — benar, $3 + 6 + 12 + 24 + 48 = 93$.
- **D** — salah, suku ke-7 adalah $96 \times 2 = 192$. Nilai 162 muncul bila rasio dianggap 3 setelah suku tertentu.
- **E** — salah, selisihnya tidak tetap ($6 - 3 = 3$, tetapi $12 - 6 = 6$), sehingga bukan barisan aritmetika.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  // ---- Objek Geometri (stimulus garis sejajar) ----
  {
    // 16
    kode_stimulus: "SMP-MTK-P4-SEJAJAR",
    kode_subdomain: "SMP-MTK-D3-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Nilai $x$ adalah ....`,
    opsi_a: "10",
    opsi_b: "20",
    opsi_c: "25",
    opsi_d: "35",
    kunci: "B",
    pembahasan: r`Sudut $(3x + 10)°$ berada di **bawah** garis $l$ dan di **kanan** garis $t$. Sudut $(5x - 30)°$ berada di **atas** garis $m$ dan di **kiri** garis $t$. Keduanya terletak di antara dua garis sejajar dan pada sisi berlawanan dari $t$, sehingga merupakan **sudut dalam berseberangan** yang besarnya sama.

$5x - 30 = 3x + 10 \Rightarrow 2x = 40 \Rightarrow x = 20$.

Periksa: $3(20) + 10 = 70°$ dan $5(20) - 30 = 70°$ ✓.

Cek setiap pilihan:
- **A. 10** — salah, $3(10) + 10 = 40°$ tidak sama dengan $5(10) - 30 = 20°$.
- **B. 20** — benar.
- **C. 25** — salah, kedua sudut dianggap berpelurus (jumlahnya 180°): $8x - 20 = 180$. Sudut dalam berseberangan sama besar, bukan berjumlah 180°.
- **D. 35** — salah, $3(35) + 10 = 115°$ tidak sama dengan $5(35) - 30 = 145°$.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 17
    kode_stimulus: "SMP-MTK-P4-SEJAJAR",
    kode_subdomain: "SMP-MTK-D3-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Tentukan **Benar** atau **Salah** setiap pernyataan berikut berdasarkan gambar!",
    opsi_a: r`Besar sudut $(3x + 10)°$ adalah 70°.`,
    opsi_b: r`Nilai $y$ adalah 110.`,
    opsi_c: r`Sudut $(5x - 30)°$ dan sudut $y°$ saling berpelurus.`,
    opsi_d: r`Sudut $(3x + 10)°$ dan sudut $(5x - 30)°$ adalah sudut sehadap.`,
    kunci: "B,B,B,S",
    pembahasan: r`Dari soal sebelumnya, $x = 20$.

- **Benar** — $3(20) + 10 = 70°$.
- **Benar** — sudut $y°$ dan sudut $(5x - 30)°$ berada pada titik potong yang sama dan bersama-sama membentuk garis lurus $t$, sehingga $y = 180 - 70 = 110$.
- **Benar** — alasan yang sama: kedua sudut bersebelahan dan jumlahnya 180°.
- **Salah** — sudut sehadap menempati **posisi yang sama** di kedua titik potong (misalnya sama-sama di atas garis dan di kanan $t$). Kedua sudut ini berada pada sisi berlawanan dari $t$ dan di antara garis $l$ dan $m$, jadi namanya **sudut dalam berseberangan**.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 18
    kode_subdomain: "SMP-MTK-D3-S1",
    bentuk_soal: "pg",
    pertanyaan: "Sebuah tangga sepanjang 10 m disandarkan pada dinding tegak. Kaki tangga berjarak 6 m dari dinding. Kemudian kaki tangga digeser menjauhi dinding sehingga ujung atas tangga turun 2 m. Kaki tangga bergeser sejauh ....",
    opsi_a: "1 m",
    opsi_b: "2 m",
    opsi_c: "4 m",
    opsi_d: "8 m",
    kunci: "B",
    pembahasan: r`Tangga, dinding, dan lantai membentuk segitiga siku-siku dengan tangga sebagai sisi miring.

Posisi awal: tinggi ujung tangga $= \sqrt{10^2 - 6^2} = \sqrt{100 - 36} = \sqrt{64} = 8$ m.

Setelah turun 2 m, tingginya $8 - 2 = 6$ m. Jarak kaki tangga yang baru $= \sqrt{10^2 - 6^2} = 8$ m.

Kaki tangga bergeser $8 - 6 = 2$ m.

Cek setiap pilihan:
- **A. 1 m** — salah. Periksa: kaki tangga 7 m dari dinding membuat tinggi $\sqrt{100 - 49} = \sqrt{51} \approx 7{,}1$ m, bukan 6 m.
- **B. 2 m** — benar. (Kebetulan sama dengan turunnya ujung atas; itu hanya berlaku untuk ukuran ini, bukan aturan umum.)
- **C. 4 m** — salah. Periksa: kaki tangga 10 m dari dinding berarti tinggi $\sqrt{100 - 100} = 0$, tangga rebah di lantai.
- **D. 8 m** — salah, ini jarak kaki tangga yang **baru** dari dinding, bukan besar pergeserannya.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  // ---- Transformasi Geometri (stimulus koordinat) ----
  {
    // 19
    kode_stimulus: "SMP-MTK-P4-KOORDINAT",
    kode_subdomain: "SMP-MTK-D3-S2",
    bentuk_soal: "pg",
    pertanyaan: "Bayangan titik C oleh pencerminan terhadap sumbu-$x$ adalah ....",
    opsi_a: "(−1, 5)",
    opsi_b: "(1, −5)",
    opsi_c: "(−1, −5)",
    opsi_d: "(5, 1)",
    kunci: "B",
    pembahasan: r`Pencerminan terhadap sumbu-$x$: $(x, y) \to (x, -y)$. Jarak titik ke sumbu-$x$ tetap, tetapi pindah ke sisi seberang (atas menjadi bawah).

C(1, 5) → C'(1, −5).

Cek setiap pilihan:
- **A. (−1, 5)** — salah, ini pencerminan terhadap sumbu-$y$.
- **B. (1, −5)** — benar.
- **C. (−1, −5)** — salah, ini pencerminan terhadap titik asal O (kedua koordinat berubah tanda).
- **D. (5, 1)** — salah, ini pencerminan terhadap garis $y = x$ (koordinat ditukar).`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 20
    kode_stimulus: "SMP-MTK-P4-KOORDINAT",
    kode_subdomain: "SMP-MTK-D3-S2",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Segitiga ABC ditranslasikan 5 satuan ke kiri dan 3 satuan ke bawah.${MCMA}`,
    opsi_a: "Bayangan titik A adalah A'(−4, −1).",
    opsi_b: "Bayangan titik B adalah B'(−1, −1).",
    opsi_c: "Bayangan titik C adalah C'(−4, 8).",
    opsi_d: "Bentuk dan ukuran segitiga bayangan sama dengan segitiga ABC.",
    opsi_e: "Luas segitiga bayangan dua kali luas segitiga ABC.",
    kunci: "A,B,D",
    pembahasan: r`Translasi 5 ke kiri dan 3 ke bawah: $(x, y) \to (x - 5, y - 3)$.

Cek setiap pilihan:
- **A** — benar, A(1, 2) → $(1 - 5, 2 - 3) = (-4, -1)$.
- **B** — benar, B(4, 2) → $(4 - 5, 2 - 3) = (-1, -1)$.
- **C** — salah, C(1, 5) → $(1 - 5, 5 - 3) = (-4, 2)$. Nilai 8 muncul bila "ke bawah" dianggap menambah $y$.
- **D** — benar, translasi hanya menggeser; bentuk, ukuran, dan arah bangun tidak berubah.
- **E** — salah, karena ukuran tidak berubah, luasnya pun sama. Luas berubah hanya pada dilatasi.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 21
    kode_stimulus: "SMP-MTK-P4-KOORDINAT",
    kode_subdomain: "SMP-MTK-D3-S2",
    bentuk_soal: "pg",
    pertanyaan: "Titik B dirotasi 90° berlawanan arah jarum jam dengan pusat O(0, 0), kemudian hasilnya dicerminkan terhadap sumbu-$y$. Koordinat bayangan akhir titik B adalah ....",
    opsi_a: "(−2, 4)",
    opsi_b: "(2, 4)",
    opsi_c: "(−2, −4)",
    opsi_d: "(4, −2)",
    kunci: "B",
    pembahasan: r`Langkah 1 — rotasi 90° berlawanan arah jarum jam pusat O: $(x, y) \to (-y, x)$.
B(4, 2) → B'(−2, 4).

Langkah 2 — pencerminan terhadap sumbu-$y$: $(x, y) \to (-x, y)$.
B'(−2, 4) → B''(2, 4).

Cek setiap pilihan:
- **A. (−2, 4)** — salah, ini hasil langkah 1 saja; pencerminan belum dilakukan.
- **B. (2, 4)** — benar.
- **C. (−2, −4)** — salah, rotasi dilakukan **searah** jarum jam ($(x, y) \to (y, -x)$ menghasilkan (2, −4)) lalu dicerminkan terhadap sumbu-$y$.
- **D. (4, −2)** — salah, ini hanya pencerminan B terhadap sumbu-$x$; rotasi tidak dilakukan.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  // ---- Pengukuran ----
  {
    // 22
    kode_subdomain: "SMP-MTK-D3-S3",
    bentuk_soal: "pg",
    pertanyaan: r`Sebuah meja berbentuk lingkaran memiliki diameter 14 dm. Luas permukaan meja tersebut adalah .... $\left(\pi = \dfrac{22}{7}\right)$`,
    opsi_a: "44 dm²",
    opsi_b: "88 dm²",
    opsi_c: "154 dm²",
    opsi_d: "616 dm²",
    kunci: "C",
    pembahasan: r`Jari-jari $r = \dfrac{14}{2} = 7$ dm.

Luas $= \pi r^2 = \dfrac{22}{7} \times 7 \times 7 = 154$ dm².

Cek setiap pilihan:
- **A. 44 dm²** — salah, ini keliling lingkaran ($\pi d = \dfrac{22}{7} \times 14$), dan satuannya pun seharusnya dm, bukan dm².
- **B. 88 dm²** — salah, rumus keliling dipakai dengan $r = 14$ ($2 \times \dfrac{22}{7} \times 14$).
- **C. 154 dm²** — benar.
- **D. 616 dm²** — salah, diameter langsung dipakai sebagai jari-jari: $\dfrac{22}{7} \times 14 \times 14$.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 23
    kode_subdomain: "SMP-MTK-D3-S3",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: `Sebuah tenda berbentuk prisma segitiga. Alasnya (bagian depan tenda) berbentuk segitiga sama kaki dengan lebar 3 m dan tinggi 2 m. Panjang tenda 4 m.

Tentukan **Benar** atau **Salah** setiap pernyataan berikut!`,
    opsi_a: "Luas bagian depan tenda (segitiga) adalah 3 m².",
    opsi_b: "Volume ruang di dalam tenda adalah 12 m³.",
    opsi_c: "Volume ruang di dalam tenda adalah 24 m³.",
    opsi_d: "Panjang kain miring dari puncak tenda ke tepi bawah adalah 2,5 m.",
    kunci: "B,B,S,B",
    pembahasan: r`- **Benar** — luas segitiga $= \dfrac{3 \times 2}{2} = 3$ m².
- **Benar** — volume prisma = luas alas × tinggi prisma $= 3 \times 4 = 12$ m³. Pada prisma, "alas" adalah segitiga di depan, dan "tinggi prisma" adalah panjang tenda.
- **Salah** — 24 m³ didapat bila luas segitiga tidak dibagi 2 ($3 \times 2 \times 4$). Itu volume balok, bukan prisma segitiga.
- **Benar** — tinggi segitiga membagi lebar 3 m menjadi dua bagian 1,5 m. Sisi miring $= \sqrt{1{,}5^2 + 2^2} = \sqrt{2{,}25 + 4} = \sqrt{6{,}25} = 2{,}5$ m.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 24
    kode_subdomain: "SMP-MTK-D3-S3",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Sebuah limas memiliki alas berbentuk persegi dengan panjang sisi 6 cm dan tinggi limas 4 cm. Sebuah prisma (balok) memiliki alas dan tinggi yang sama dengan limas tersebut.${MCMA}`,
    opsi_a: "Volume limas adalah 48 cm³.",
    opsi_b: "Volume prisma adalah 144 cm³.",
    opsi_c: "Volume limas sama dengan sepertiga volume prisma.",
    opsi_d: "Volume limas adalah 144 cm³.",
    opsi_e: "Jika tinggi limas dijadikan dua kali semula, volumenya menjadi empat kali semula.",
    kunci: "A,B,C",
    pembahasan: r`Luas alas $= 6 \times 6 = 36$ cm².

Volume prisma $= 36 \times 4 = 144$ cm³. Volume limas $= \dfrac{1}{3} \times 36 \times 4 = 48$ cm³.

Cek setiap pilihan:
- **A** — benar, $\dfrac{1}{3} \times 36 \times 4 = 48$.
- **B** — benar, $36 \times 4 = 144$.
- **C** — benar, $48 = \dfrac{1}{3} \times 144$. Hubungan ini berlaku untuk setiap limas dan prisma yang alas dan tingginya sama.
- **D** — salah, faktor $\dfrac{1}{3}$ terlupa; 144 cm³ adalah volume prisma.
- **E** — salah, volume sebanding dengan tinggi: tinggi 2 kali → volume $\dfrac{1}{3} \times 36 \times 8 = 96$ cm³, yaitu **2 kali** semula. Volume menjadi 4 kali bila sisi alasnya yang dijadikan 2 kali.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  // ---- Data (stimulus diagram garis) ----
  {
    // 25
    kode_stimulus: "SMP-MTK-P4-SEPEDA",
    kode_subdomain: "SMP-MTK-D4-S1",
    bentuk_soal: "pg",
    pertanyaan: "Kenaikan penjualan terbesar dari satu bulan ke bulan berikutnya terjadi pada ....",
    opsi_a: "Januari ke Februari",
    opsi_b: "Maret ke April",
    opsi_c: "April ke Mei",
    opsi_d: "Mei ke Juni",
    kunci: "B",
    pembahasan: r`Hitung perubahan setiap bulan:
- Januari → Februari: $15 - 12 = +3$
- Februari → Maret: $9 - 15 = -6$ (turun)
- Maret → April: $18 - 9 = +9$
- April → Mei: $24 - 18 = +6$
- Mei → Juni: $18 - 24 = -6$ (turun)

Pada diagram garis, kenaikan terbesar terlihat sebagai ruas garis yang **paling curam naik**.

Cek setiap pilihan:
- **A. Januari ke Februari** — salah, hanya naik 3 unit.
- **B. Maret ke April** — benar, naik 9 unit.
- **C. April ke Mei** — salah, naik 6 unit. Mei memang penjualan tertinggi, tetapi kenaikannya bukan yang terbesar.
- **D. Mei ke Juni** — salah, penjualan justru turun 6 unit.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 26
    kode_stimulus: "SMP-MTK-P4-SEPEDA",
    kode_subdomain: "SMP-MTK-D4-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Tentukan **Benar** atau **Salah** setiap pernyataan tentang data penjualan Januari–Juni berikut!",
    opsi_a: "Rata-rata penjualan per bulan adalah 16 unit.",
    opsi_b: "Median data penjualan adalah 16,5 unit.",
    opsi_c: "Jangkauan data penjualan adalah 12 unit.",
    opsi_d: "Ada 3 bulan yang penjualannya di atas rata-rata.",
    kunci: "B,B,S,B",
    pembahasan: r`Data: 12, 15, 9, 18, 24, 18. Diurutkan: 9, 12, 15, 18, 18, 24.

- **Benar** — rata-rata $= \dfrac{12 + 15 + 9 + 18 + 24 + 18}{6} = \dfrac{96}{6} = 16$.
- **Benar** — banyak data genap (6), median adalah rata-rata data ke-3 dan ke-4 setelah diurutkan: $\dfrac{15 + 18}{2} = 16{,}5$. Kesalahan umum: mengambil data tengah tanpa mengurutkan.
- **Salah** — jangkauan = data terbesar − data terkecil $= 24 - 9 = 15$. Nilai 12 muncul bila memakai data Januari (data pertama) sebagai data terkecil: $24 - 12$.
- **Benar** — bulan dengan penjualan lebih dari 16: April (18), Mei (24), dan Juni (18), yaitu 3 bulan.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 27
    kode_stimulus: "SMP-MTK-P4-SEPEDA",
    kode_subdomain: "SMP-MTK-D4-S1",
    bentuk_soal: "pg",
    pertanyaan: "Pemilik toko menginginkan rata-rata penjualan dari Januari sampai Juli menjadi 18 unit per bulan. Banyak sepeda yang harus terjual pada bulan Juli adalah ....",
    opsi_a: "18 unit",
    opsi_b: "24 unit",
    opsi_c: "30 unit",
    opsi_d: "126 unit",
    kunci: "C",
    pembahasan: r`Rata-rata 7 bulan 18 unit berarti jumlah penjualan 7 bulan $= 7 \times 18 = 126$ unit.

Jumlah penjualan Januari–Juni $= 96$ unit. Penjualan Juli $= 126 - 96 = 30$ unit.

Periksa: $\dfrac{96 + 30}{7} = \dfrac{126}{7} = 18$ ✓.

Cek setiap pilihan:
- **A. 18 unit** — salah, rata-rata 6 bulan pertama hanya 16, sehingga menjual tepat 18 unit pada Juli hanya menaikkan rata-rata menjadi $\dfrac{114}{7} \approx 16{,}3$.
- **B. 24 unit** — salah, ini penjualan tertinggi sebelumnya; rata-rata menjadi $\dfrac{120}{7} \approx 17{,}1$, belum 18.
- **C. 30 unit** — benar.
- **D. 126 unit** — salah, ini jumlah penjualan 7 bulan yang dibutuhkan, belum dikurangi penjualan Januari–Juni.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  // ---- Peluang ----
  {
    // 28
    kode_subdomain: "SMP-MTK-D4-S2",
    bentuk_soal: "pg",
    pertanyaan: "Sebuah dadu bersisi enam dilempar satu kali. Peluang muncul mata dadu bilangan prima adalah ....",
    opsi_a: r`$\dfrac{1}{6}$`,
    opsi_b: r`$\dfrac{1}{3}$`,
    opsi_c: r`$\dfrac{1}{2}$`,
    opsi_d: r`$\dfrac{2}{3}$`,
    kunci: "C",
    pembahasan: r`Ruang sampel: {1, 2, 3, 4, 5, 6}, ada 6 hasil. Bilangan prima di antaranya: {2, 3, 5}, ada 3 hasil. (1 bukan bilangan prima karena hanya memiliki satu faktor.)

Peluang $= \dfrac{3}{6} = \dfrac{1}{2}$.

Cek setiap pilihan:
- **A.** $\dfrac{1}{6}$ — salah, ini peluang muncul satu mata dadu tertentu saja.
- **B.** $\dfrac{1}{3}$ — salah, hanya menghitung 2 bilangan prima (misalnya lupa bahwa 2 bilangan prima karena genap).
- **C.** $\dfrac{1}{2}$ — benar.
- **D.** $\dfrac{2}{3}$ — salah, angka 1 ikut dihitung sebagai bilangan prima (4 dari 6).`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 29
    kode_subdomain: "SMP-MTK-D4-S2",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Sebuah kantong berisi 5 kelereng merah, 3 kelereng biru, dan 2 kelereng hijau. Sebuah kelereng diambil secara acak.${MCMA}`,
    opsi_a: r`Peluang terambil kelereng merah adalah $\dfrac{1}{2}$.`,
    opsi_b: r`Peluang terambil kelereng yang bukan biru adalah $\dfrac{7}{10}$.`,
    opsi_c: r`Peluang terambil kelereng hijau adalah $\dfrac{1}{5}$.`,
    opsi_d: "Peluang terambil kelereng kuning adalah 1.",
    opsi_e: r`Peluang terambil kelereng merah atau biru adalah $\dfrac{3}{10}$.`,
    kunci: "A,B,C",
    pembahasan: r`Banyak kelereng seluruhnya $= 5 + 3 + 2 = 10$.

Cek setiap pilihan:
- **A** — benar, $\dfrac{5}{10} = \dfrac{1}{2}$.
- **B** — benar, kelereng bukan biru $= 5 + 2 = 7$, peluangnya $\dfrac{7}{10}$ (atau $1 - \dfrac{3}{10}$).
- **C** — benar, $\dfrac{2}{10} = \dfrac{1}{5}$.
- **D** — salah, tidak ada kelereng kuning, sehingga peluangnya **0** (kejadian mustahil). Peluang 1 berarti kejadian pasti terjadi.
- **E** — salah, merah atau biru $= 5 + 3 = 8$ kelereng, peluangnya $\dfrac{8}{10}$. Nilai $\dfrac{3}{10}$ adalah peluang biru saja.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 30
    kode_subdomain: "SMP-MTK-D4-S2",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Sebuah koin dilempar 50 kali. Hasilnya, sisi angka muncul 28 kali. Tentukan **Benar** atau **Salah** setiap pernyataan berikut!",
    opsi_a: "Frekuensi relatif muncul sisi angka adalah 0,56.",
    opsi_b: "Frekuensi relatif muncul sisi gambar adalah 0,44.",
    opsi_c: "Peluang teoretis muncul sisi angka adalah 0,56.",
    opsi_d: "Jika koin dilempar 100 kali, sisi angka pasti muncul 56 kali.",
    kunci: "B,B,S,S",
    pembahasan: r`Frekuensi relatif = banyak kejadian muncul ÷ banyak percobaan (hasil percobaan nyata). Peluang teoretis = banyak hasil yang diharapkan ÷ banyak semua hasil yang mungkin.

- **Benar** — $\dfrac{28}{50} = 0{,}56$.
- **Benar** — sisi gambar muncul $50 - 28 = 22$ kali, frekuensi relatifnya $\dfrac{22}{50} = 0{,}44$.
- **Salah** — koin memiliki 2 sisi yang sama mungkin muncul, sehingga peluang teoretisnya $\dfrac{1}{2} = 0{,}5$. Nilai 0,56 adalah frekuensi relatif hasil percobaan.
- **Salah** — hasil percobaan acak tidak pasti. Frekuensi relatif hanya memberi **perkiraan**; pada 100 lemparan, sisi angka bisa muncul lebih atau kurang dari 56 kali (harapannya sekitar 50 kali).`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
];

export default {
  title: "TKA SMP Matematika — Paket 4",
  description: "30 soal: notasi ilmiah, perbandingan, persamaan dan pertidaksamaan linear, bentuk aljabar, fungsi, barisan dan deret, sudut pada garis sejajar, Teorema Pythagoras, transformasi, luas dan volume, statistika, serta peluang. Dilengkapi gambar dan pembahasan setiap pilihan jawaban.",
  jenjang: "SMP",
  subjectCode: "SMP-MTK",
  durationMinutes: 75,
  isPremium: true,
  isFullSimulation: true,
  createdByEmail: "kpbgalimka@gmail.com",
  stimuli,
  rows,
  images: {
    "garis-sejajar": { title: "Dua garis sejajar dipotong garis transversal", svg: imgSejajar() },
    "segitiga-koordinat": { title: "Segitiga ABC pada bidang koordinat", svg: imgKoordinat() },
    "diagram-sepeda": { title: "Diagram garis penjualan sepeda listrik", svg: imgSepeda() },
  },
};
