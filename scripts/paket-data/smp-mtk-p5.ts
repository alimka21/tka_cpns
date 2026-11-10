// TKA SMP Matematika — Paket 5 (ditulis Claude). 30 soal: 18 PG · 6 MCMA · 6 Kategori;
// 10/10 subtopik (3 soal masing-masing); mudah 6 · sedang 15 · sulit 9; L1 7 · L2 14 · L3 9.
// 4 gambar SVG baru: grafik biaya kirim paket, segitiga KLM pada bidang koordinat, denah taman
// gabungan persegi panjang + setengah lingkaran, diagram lingkaran moda transportasi siswa.
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

// ---------- Gambar ----------

// Grafik biaya kirim paket: y = 4x + 10 (ribu rupiah), x = berat (kg) 0–10. Titik (0,10), (5,30), (8,42).
function imgKirim() {
  const X = (x: number) => 90 + x * 50, Y = (y: number) => 400 - y * 6; // 1 kg = 50 px, 1 ribu = 6 px
  let s = text(345, 34, "Biaya Kirim Paket Ekspres Kilat", { size: 22, weight: "bold" });
  for (let y = 0; y <= 50; y += 10) s += line(X(0), Y(y), X(10), Y(y), { stroke: y ? "#e5e7eb" : "#111", w: y ? 1 : 2 }) + text(X(0) - 12, Y(y) + 6, String(y), { size: 16, anchor: "end" });
  for (let x = 0; x <= 10; x++) s += line(X(x), Y(0), X(x), Y(50), { stroke: x ? "#e5e7eb" : "#111", w: x ? 1 : 2 }) + text(X(x), Y(0) + 26, String(x), { size: 16 });
  s += line(X(0), Y(10), X(10), Y(50), { stroke: "#dc2626", w: 3.5 });
  for (const [x, y] of [[0, 10], [5, 30], [8, 42]]) {
    s += line(X(x), Y(y), X(x), Y(0), { stroke: "#2563eb", dash: true }) + line(X(0), Y(y), X(x), Y(y), { stroke: "#2563eb", dash: true }) + dot(X(x), Y(y), 6, "#dc2626");
  }
  s += text(X(5), Y(0) + 58, "Berat paket (kg)", { size: 17 });
  s += `<text x="28" y="${Y(25)}" font-size="17" text-anchor="middle" transform="rotate(-90 28 ${Y(25)})">Biaya (ribu rupiah)</text>`;
  return svg(640, 480, s);
}

// Bidang koordinat −5..5 dengan segitiga K(−3,1), L(−1,1), M(−1,4).
function imgKoordinat() {
  const u = 40, X = (x: number) => 260 + x * u, Y = (y: number) => 260 - y * u;
  let s = "";
  for (let i = -5; i <= 5; i++) {
    s += line(X(i), Y(-5), X(i), Y(5), { stroke: "#e5e7eb", w: 1 }) + line(X(-5), Y(i), X(5), Y(i), { stroke: "#e5e7eb", w: 1 });
    if (i !== 0) s += text(X(i), Y(0) + 20, String(i), { size: 14 }) + text(X(0) - 8, Y(i) + 5, String(i), { size: 14, anchor: "end" });
  }
  s += line(X(-5.4), Y(0), X(5.4), Y(0)) + line(X(0), Y(-5.4), X(0), Y(5.4));
  s += text(X(5.4) + 12, Y(0) + 6, "X", { size: 18, weight: "bold", italic: true }) + text(X(0), Y(5.4) - 8, "Y", { size: 18, weight: "bold", italic: true });
  s += text(X(0) - 8, Y(0) + 20, "O", { size: 14, anchor: "end" });
  const K = [-3, 1], L = [-1, 1], M = [-1, 4];
  s += `<polygon points="${[K, L, M].map(([x, y]) => `${X(x)},${Y(y)}`).join(" ")}" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="3"/>`;
  s += dot(X(K[0]), Y(K[1]), 5, "#1d4ed8") + dot(X(L[0]), Y(L[1]), 5, "#1d4ed8") + dot(X(M[0]), Y(M[1]), 5, "#1d4ed8");
  s += text(X(K[0]) - 10, Y(K[1]) + 22, "K", { size: 18, weight: "bold" }) + text(X(L[0]) + 14, Y(L[1]) + 22, "L", { size: 18, weight: "bold" }) + text(X(M[0]) + 16, Y(M[1]) - 6, "M", { size: 18, weight: "bold" });
  return svg(540, 540, s);
}

// Denah taman: persegi panjang 14 m × 10 m + setengah lingkaran berdiameter 14 m di sisi atas.
function imgTaman() {
  const k = 25, x0 = 105, x1 = x0 + 14 * k, yTop = 220, yBot = yTop + 10 * k, R = 7 * k, cx = (x0 + x1) / 2;
  let s = `<path d="M${x0},${yTop} A${R},${R} 0 0 1 ${x1},${yTop} L${x1},${yBot} L${x0},${yBot} Z" fill="#bbf7d0" stroke="#166534" stroke-width="3"/>`;
  s += line(x0, yTop, x1, yTop, { stroke: "#166534", w: 1.5, dash: true });
  s += dot(cx, yTop, 4, "#166534");
  s += line(x0, yBot + 30, x1, yBot + 30, { w: 1.5 }) + line(x0, yBot + 22, x0, yBot + 38, { w: 1.5 }) + line(x1, yBot + 22, x1, yBot + 38, { w: 1.5 });
  s += text(cx, yBot + 58, "14 m", { size: 20, weight: "bold" });
  s += line(x1 + 30, yTop, x1 + 30, yBot, { w: 1.5 }) + line(x1 + 22, yTop, x1 + 38, yTop, { w: 1.5 }) + line(x1 + 22, yBot, x1 + 38, yBot, { w: 1.5 });
  s += text(x1 + 42, (yTop + yBot) / 2 + 7, "10 m", { size: 20, weight: "bold", anchor: "start" });
  return svg(560, 540, s);
}

// Diagram lingkaran moda transportasi 240 siswa: jalan kaki 25%, sepeda 15%, angkot 20%, diantar motor 35%, mobil 5%.
function imgLingkaran() {
  const data: [string, number, string][] = [
    ["Jalan kaki", 25, "#60a5fa"],
    ["Sepeda", 15, "#34d399"],
    ["Angkot", 20, "#fbbf24"],
    ["Diantar motor", 35, "#f87171"],
    ["Mobil", 5, "#a78bfa"],
  ];
  const cx = 220, cy = 250, R = 170;
  const pt = (deg: number, rr: number) => [cx + rr * Math.cos((deg * Math.PI) / 180), cy + rr * Math.sin((deg * Math.PI) / 180)];
  let s = text(340, 36, "Cara Siswa Berangkat ke Sekolah (240 siswa)", { size: 21, weight: "bold" });
  let a = -90;
  for (const [, p, c] of data) {
    const b = a + (p / 100) * 360, [x1, y1] = pt(a, R), [x2, y2] = pt(b, R);
    s += `<path d="M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${R},${R} 0 ${p > 50 ? 1 : 0} 1 ${x2.toFixed(1)},${y2.toFixed(1)} Z" fill="${c}" stroke="#fff" stroke-width="3"/>`;
    const [lx, ly] = pt((a + b) / 2, p < 10 ? R * 0.78 : R * 0.62);
    s += text(lx, ly + 7, `${p}%`, { size: p < 10 ? 16 : 20, weight: "bold" });
    a = b;
  }
  data.forEach(([n, , c], i) => {
    const y = 150 + i * 44;
    s += `<rect x="440" y="${y - 18}" width="24" height="24" rx="4" fill="${c}"/>` + text(476, y, n, { size: 18, anchor: "start" });
  });
  return svg(680, 450, s);
}

// ---------- Stimulus ----------

const stimuli = [
  {
    code: "SMP-MTK-P5-KOORDINAT",
    title: "Segitiga KLM pada Bidang Koordinat",
    content: "Segitiga KLM digambar pada bidang koordinat Kartesius berikut. Koordinat titik-titiknya adalah K(−3, 1), L(−1, 1), dan M(−1, 4).",
    gambar: "segitiga-klm",
  },
  {
    code: "SMP-MTK-P5-TAMAN",
    title: "Denah Taman Sekolah",
    content: r`Gambar berikut adalah denah taman sekolah. Taman terdiri atas daerah persegi panjang berukuran 14 m × 10 m dan daerah setengah lingkaran yang diameternya sama dengan sisi 14 m. Gunakan $\pi = \dfrac{22}{7}$.`,
    gambar: "denah-taman",
  },
  {
    code: "SMP-MTK-P5-TRANSPORTASI",
    title: "Cara Siswa Berangkat ke Sekolah",
    content: "OSIS sebuah SMP melakukan survei kepada 240 siswa tentang cara mereka berangkat ke sekolah. Setiap siswa hanya memilih satu cara. Hasilnya disajikan pada diagram lingkaran berikut.",
    gambar: "diagram-transportasi",
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

const MCMA = "\n\nPilihlah **semua** jawaban yang benar!";

const rows: Row[] = [
  // ---- Bilangan Real ----
  {
    // 1
    kode_subdomain: "SMP-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: "Suhu di puncak sebuah gunung pada pukul 04.00 adalah −6 °C. Pada pukul 10.00 suhu naik 14 °C, lalu menjelang malam suhu turun 9 °C. Suhu di puncak gunung menjelang malam adalah ....",
    opsi_a: "11 °C",
    opsi_b: "−1 °C",
    opsi_c: "17 °C",
    opsi_d: "−29 °C",
    kunci: "B",
    pembahasan: r`Naik berarti ditambah, turun berarti dikurangi: $-6 + 14 - 9 = 8 - 9 = -1$ °C.

Cek setiap pilihan:
- **A.** 11 °C — salah, tanda negatif suhu awal terlewat: $6 + 14 - 9 = 11$.
- **B.** −1 °C — benar.
- **C.** 17 °C — salah, ini hasil $-6 + 14 + 9$ (penurunan dianggap kenaikan).
- **D.** −29 °C — salah, ini hasil $-6 - 14 - 9$ (kenaikan dianggap penurunan).`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 2
    kode_subdomain: "SMP-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: "Persediaan pakan di sebuah peternakan cukup untuk 30 ekor ayam selama 12 hari. Jika peternak menambah 6 ekor ayam, persediaan pakan yang sama akan cukup untuk ....",
    opsi_a: "6 hari",
    opsi_b: "10 hari",
    opsi_c: "12 hari",
    opsi_d: "18 hari",
    kunci: "B",
    pembahasan: r`Makin banyak ayam, makin cepat pakan habis. Jadi, ini **perbandingan berbalik nilai**: banyak ayam × banyak hari selalu tetap.

$30 \times 12 = 360$, lalu $360 \div (30 + 6) = 360 \div 36 = 10$ hari.

Cek setiap pilihan:
- **A.** 6 hari — salah, ini hasil $12 - 6$. Tambahan ayam langsung dikurangkan dari banyak hari tanpa memakai perbandingan.
- **B.** 10 hari — benar.
- **C.** 12 hari — salah, banyak hari dianggap tidak berubah, padahal ayam bertambah sehingga pakan lebih cepat habis.
- **D.** 18 hari — salah, ini hasil $12 + 6$. Hari justru harus berkurang karena ayam bertambah.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 3
    kode_subdomain: "SMP-MTK-D1-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: "Sebuah mobil listrik dapat menempuh jarak 150 km dengan menghabiskan energi 25 kWh. Laju pemakaian energinya tetap. Manakah pernyataan berikut yang benar?" + MCMA,
    opsi_a: "Mobil itu menempuh 6 km untuk setiap 1 kWh energi.",
    opsi_b: "Untuk menempuh 240 km, diperlukan energi 40 kWh.",
    opsi_c: "Dengan energi 18 kWh, mobil itu dapat menempuh 120 km.",
    opsi_d: "Jika harga listrik Rp2.500,00 per kWh, biaya energi untuk setiap 1 km kurang dari Rp400,00.",
    opsi_e: "Hubungan jarak tempuh dan energi yang dipakai merupakan perbandingan senilai.",
    kunci: "A,B,E",
    pembahasan: r`Laju: $150 \div 25 = 6$ km per kWh.

Cek setiap pilihan:
- **A** — benar, $150 \div 25 = 6$ km/kWh.
- **B** — benar, $240 \div 6 = 40$ kWh.
- **C** — salah, $18 \times 6 = 108$ km, bukan 120 km.
- **D** — salah, biaya per km $= 2.500 \div 6 \approx$ Rp416,67, lebih dari Rp400,00.
- **E** — benar, makin jauh jaraknya makin banyak energinya, dengan hasil bagi tetap (6 km/kWh).`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },

  // ---- Persamaan dan Pertidaksamaan Linear ----
  {
    // 4
    kode_subdomain: "SMP-MTK-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: "Sebuah lift barang mampu mengangkut beban paling berat 500 kg. Seorang petugas bermassa 70 kg akan naik lift sambil membawa sejumlah kotak. Massa setiap kotak 24 kg. Banyak kotak paling banyak yang dapat dibawa petugas dalam sekali naik adalah ....",
    opsi_a: "17",
    opsi_b: "18",
    opsi_c: "23",
    opsi_d: "21",
    kunci: "A",
    pembahasan: r`Misalkan banyak kotak $n$. Pertidaksamaannya: $70 + 24n \le 500 \Rightarrow 24n \le 430 \Rightarrow n \le 17{,}9...$

Karena $n$ bilangan cacah, nilai terbesarnya **17** (cek: $70 + 24 \times 17 = 478 \le 500$, sedangkan $70 + 24 \times 18 = 502 > 500$).

Cek setiap pilihan:
- **A.** 17 — benar.
- **B.** 18 — salah, total 502 kg melebihi batas (hasil pembulatan ke atas).
- **C.** 23 — salah, massa petugas justru ditambahkan ke batas: $(500 + 70) \div 24 \approx 23{,}75$.
- **D.** 21 — salah, ini hasil $500 \div 24 \approx 20{,}8$ dibulatkan tanpa memperhitungkan massa petugas.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 5
    kode_subdomain: "SMP-MTK-D2-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Di sebuah toko alat tulis, harga 3 buku dan 2 pulpen adalah Rp27.000,00, sedangkan harga 2 buku dan 3 pulpen adalah Rp23.000,00. Tentukan **Benar** atau **Salah** setiap pernyataan berikut!",
    opsi_a: "Harga 1 buku adalah Rp7.000,00.",
    opsi_b: "Harga 1 buku dan 1 pulpen adalah Rp10.000,00.",
    opsi_c: "Harga 1 pulpen adalah Rp4.000,00.",
    opsi_d: "Harga 4 buku sama dengan harga 9 pulpen.",
    kunci: "B,B,S,S",
    pembahasan: r`Misalkan harga buku $b$ dan pulpen $p$:
$3b + 2p = 27.000$ dan $2b + 3p = 23.000$.

Jumlahkan: $5b + 5p = 50.000 \Rightarrow b + p = 10.000$.
Kurangkan: $b - p = 4.000$.
Jadi, $b = 7.000$ dan $p = 3.000$.

- **Benar** — $b = 7.000$.
- **Benar** — $b + p = 10.000$.
- **Salah** — $p = 3.000$. Nilai 4.000 adalah selisih harga buku dan pulpen.
- **Salah** — $4 \times 7.000 = 28.000$, sedangkan $9 \times 3.000 = 27.000$. Keduanya tidak sama.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  {
    // 6
    kode_subdomain: "SMP-MTK-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: "Nilai $x$ yang memenuhi persamaan $3(x - 2) = x + 10$ adalah ....",
    opsi_a: "2",
    opsi_b: "4",
    opsi_c: "8",
    opsi_d: "16",
    kunci: "C",
    pembahasan: r`$3(x - 2) = x + 10 \Rightarrow 3x - 6 = x + 10 \Rightarrow 2x = 16 \Rightarrow x = 8$.

Cek: $3(8 - 2) = 18$ dan $8 + 10 = 18$. ✔

- **A.** 2 — salah, $-6$ dipindah ruas tanpa mengganti tanda: $2x = 10 - 6 = 4$, lalu $x = 2$.
- **B.** 4 — salah, $x$ dipindah ruas tanpa mengganti tanda: $3x + x = 16$, lalu $x = 4$.
- **C.** 8 — benar.
- **D.** 16 — salah, itu nilai $2x$, belum dibagi 2.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },

  // ---- Bentuk Aljabar ----
  {
    // 7
    kode_subdomain: "SMP-MTK-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: "Bentuk sederhana dari $4(2a - 3b) - 2(a - 5b)$ adalah ....",
    opsi_a: "$6a - 2b$",
    opsi_b: "$6a - 22b$",
    opsi_c: "$6a + 2b$",
    opsi_d: "$10a - 2b$",
    kunci: "A",
    pembahasan: r`Gunakan sifat distributif: $4(2a - 3b) = 8a - 12b$ dan $-2(a - 5b) = -2a + 10b$.

Jumlahkan suku sejenis: $(8a - 2a) + (-12b + 10b) = 6a - 2b$.

- **A** — benar.
- **B** — salah, $-2 \times (-5b)$ dihitung $-10b$ (tanda negatif kali negatif seharusnya positif).
- **C** — salah, hasil $-12b + 10b$ adalah $-2b$, bukan $+2b$.
- **D** — salah, $8a - 2a$ dihitung sebagai $8a + 2a$.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 8
    kode_subdomain: "SMP-MTK-D2-S2",
    bentuk_soal: "pgk_mcma",
    pertanyaan: "Harga satu kotak pensil adalah $x$ rupiah dan harga satu buku tulis adalah $y$ rupiah. Rina membeli 3 kotak pensil dan 5 buku tulis. Doni membeli 2 kotak pensil dan 4 buku tulis. Manakah pernyataan berikut yang benar?" + MCMA,
    opsi_a: "Total belanja Rina dinyatakan dengan $3x + 5y$.",
    opsi_b: "Total belanja Rina dan Doni dinyatakan dengan $5x + 9y$.",
    opsi_c: "Selisih belanja Rina dan Doni dinyatakan dengan $x + y$.",
    opsi_d: "Total belanja Rina dan Doni dapat disederhanakan menjadi $14xy$.",
    opsi_e: "Jika $x = 2.000$ dan $y = 3.000$, total belanja Doni adalah Rp18.000,00.",
    kunci: "A,B,C",
    pembahasan: r`Belanja Rina $= 3x + 5y$ dan belanja Doni $= 2x + 4y$.

- **A** — benar.
- **B** — benar, $(3x + 5y) + (2x + 4y) = 5x + 9y$.
- **C** — benar, $(3x + 5y) - (2x + 4y) = x + y$.
- **D** — salah, $5x$ dan $9y$ bukan suku sejenis, sehingga tidak dapat dijumlahkan menjadi satu suku.
- **E** — salah, $2(2.000) + 4(3.000) = 4.000 + 12.000 = 16.000$, bukan 18.000.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 9
    kode_subdomain: "SMP-MTK-D2-S2",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Sebuah taman berbentuk persegi dengan panjang sisi $(x + 3)$ meter. Di tengah taman dibuat kolam berbentuk persegi dengan panjang sisi $x$ meter. Daerah taman di luar kolam ditanami rumput. Tentukan **Benar** atau **Salah** setiap pernyataan berikut!",
    opsi_a: "Luas seluruh taman dinyatakan dengan $(x^2 + 6x + 9)$ m².",
    opsi_b: "Luas daerah yang ditanami rumput dinyatakan dengan $(6x + 9)$ m².",
    opsi_c: "Jika $x = 4$, luas daerah yang ditanami rumput adalah 33 m².",
    opsi_d: "Luas daerah yang ditanami rumput selalu 9 m² karena $(x + 3)^2 - x^2 = 3^2$.",
    kunci: "B,B,B,S",
    pembahasan: r`Luas taman $= (x + 3)^2 = (x + 3)(x + 3) = x^2 + 3x + 3x + 9 = x^2 + 6x + 9$.
Luas rumput $= (x^2 + 6x + 9) - x^2 = 6x + 9$.

- **Benar** — sesuai perhitungan di atas.
- **Benar** — sesuai perhitungan di atas.
- **Benar** — untuk $x = 4$: $6(4) + 9 = 33$ m² (cek: luas taman $7^2 = 49$, luas kolam $4^2 = 16$, selisihnya 33).
- **Salah** — $(x + 3)^2 \neq x^2 + 3^2$. Kesalahan ini melupakan suku tengah $6x$. Luas rumput bergantung pada $x$.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },

  // ---- Fungsi ----
  {
    // 10
    kode_subdomain: "SMP-MTK-D2-S3",
    bentuk_soal: "pg",
    pertanyaan: "Diketahui $A = \\{1, 2, 3\\}$ dan $B = \\{a, b, c\\}$. Himpunan pasangan berurutan dari $A$ ke $B$ berikut yang merupakan **fungsi** adalah ....",
    opsi_a: "$\\{(1, a), (2, a), (3, b)\\}$",
    opsi_b: "$\\{(1, a), (1, b), (2, c)\\}$",
    opsi_c: "$\\{(1, a), (2, b), (2, c)\\}$",
    opsi_d: "$\\{(1, a), (1, b), (1, c)\\}$",
    kunci: "A",
    pembahasan: r`Relasi dari $A$ ke $B$ disebut fungsi jika **setiap** anggota $A$ dipasangkan dengan **tepat satu** anggota $B$.

- **A** — benar, 1, 2, dan 3 masing-masing punya tepat satu pasangan. Dua anggota $A$ boleh berpasangan dengan anggota $B$ yang sama.
- **B** — salah, 1 punya dua pasangan dan 3 tidak punya pasangan.
- **C** — salah, 2 punya dua pasangan dan 3 tidak punya pasangan.
- **D** — salah, 1 punya tiga pasangan, sedangkan 2 dan 3 tidak punya pasangan.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 11
    kode_subdomain: "SMP-MTK-D2-S3",
    bentuk_soal: "pg",
    pertanyaan: "Grafik berikut menunjukkan hubungan antara berat paket dan biaya kirim pada layanan Ekspres Kilat. Biaya kirim bertambah dengan pola yang sama untuk setiap kenaikan berat. Biaya untuk mengirim paket seberat 12 kg adalah ....",
    gambar: "grafik-kirim",
    opsi_a: "Rp48.000,00",
    opsi_b: "Rp58.000,00",
    opsi_c: "Rp63.000,00",
    opsi_d: "Rp72.000,00",
    kunci: "B",
    pembahasan: r`Dari grafik: berat 0 kg → Rp10.000 (biaya tetap), berat 5 kg → Rp30.000. Kenaikan biaya per kg $= \dfrac{30.000 - 10.000}{5} = 4.000$.

Fungsinya $f(x) = 4.000x + 10.000$. Cek dengan titik (8, 42): $4.000(8) + 10.000 = 42.000$ ✔.

$f(12) = 4.000(12) + 10.000 = 58.000$.

- **A** — salah, $4.000 \times 12 = 48.000$ tanpa biaya tetap Rp10.000.
- **B** — benar.
- **C** — salah, ini hasil perbandingan senilai dari titik (8, 42): $\dfrac{12}{8} \times 42.000 = 63.000$. Grafik tidak melalui titik (0, 0), jadi biaya tidak sebanding dengan berat.
- **D** — salah, ini hasil $\dfrac{30.000}{5} \times 12$. Biaya per kg dihitung Rp6.000 karena biaya tetap ikut dibagi.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 12
    kode_subdomain: "SMP-MTK-D2-S3",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Fungsi $f$ dirumuskan dengan $f(x) = ax + b$. Diketahui $f(2) = 7$ dan $f(5) = 16$. Tentukan **Benar** atau **Salah** setiap pernyataan berikut!",
    opsi_a: "Rumus fungsinya adalah $f(x) = 3x + 1$.",
    opsi_b: "Nilai $f(0) = 1$.",
    opsi_c: "Nilai $f(-2) = -7$.",
    opsi_d: "Nilai $x$ yang memenuhi $f(x) = 31$ adalah $x = 10$.",
    kunci: "B,B,S,B",
    pembahasan: r`$f(5) - f(2) = 3a = 16 - 7 = 9 \Rightarrow a = 3$. Lalu $2(3) + b = 7 \Rightarrow b = 1$. Jadi $f(x) = 3x + 1$.

- **Benar** — sesuai perhitungan.
- **Benar** — $f(0) = 3(0) + 1 = 1$.
- **Salah** — $f(-2) = 3(-2) + 1 = -6 + 1 = -5$, bukan $-7$.
- **Benar** — $3x + 1 = 31 \Rightarrow 3x = 30 \Rightarrow x = 10$.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },

  // ---- Barisan dan Deret ----
  {
    // 13
    kode_subdomain: "SMP-MTK-D2-S4",
    bentuk_soal: "pgk_mcma",
    pertanyaan: "Kursi di sebuah gedung pertunjukan disusun bertingkat. Baris pertama terdiri atas 20 kursi, dan setiap baris berikutnya 3 kursi lebih banyak daripada baris sebelumnya. Manakah pernyataan berikut yang benar?" + MCMA,
    opsi_a: "Baris ke-15 terdiri atas 62 kursi.",
    opsi_b: "Baris ke-10 terdiri atas 50 kursi.",
    opsi_c: "Banyak kursi pada 10 baris pertama seluruhnya 335 kursi.",
    opsi_d: "Selisih banyak kursi baris ke-20 dan baris ke-5 adalah 50 kursi.",
    opsi_e: "Baris ke-11 terdiri atas 50 kursi.",
    kunci: "A,C,E",
    pembahasan: r`Barisan aritmetika dengan $a = 20$ dan $b = 3$, sehingga $U_n = 20 + (n - 1) \times 3$.

- **A** — benar, $U_{15} = 20 + 14 \times 3 = 62$.
- **B** — salah, $U_{10} = 20 + 9 \times 3 = 47$.
- **C** — benar, $S_{10} = \dfrac{10}{2}(20 + 47) = 5 \times 67 = 335$.
- **D** — salah, $U_{20} - U_5 = (20 - 5) \times 3 = 45$.
- **E** — benar, $U_{11} = 20 + 10 \times 3 = 50$.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 14
    kode_subdomain: "SMP-MTK-D2-S4",
    bentuk_soal: "pgk_mcma",
    pertanyaan: "Rani menabung setiap minggu. Pada minggu pertama ia menabung Rp5.000,00. Setiap minggu berikutnya, tabungannya Rp2.000,00 lebih banyak daripada minggu sebelumnya. Manakah pernyataan berikut yang benar?" + MCMA,
    opsi_a: "Uang yang ditabung pada minggu ke-10 adalah Rp23.000,00.",
    opsi_b: "Jumlah tabungan Rani selama 10 minggu adalah Rp140.000,00.",
    opsi_c: "Rani pertama kali menabung lebih dari Rp30.000,00 dalam seminggu pada minggu ke-13.",
    opsi_d: "Uang yang ditabung setiap minggu membentuk barisan aritmetika dengan beda Rp2.000,00.",
    opsi_e: "Jumlah tabungan Rani selama 5 minggu pertama adalah Rp35.000,00.",
    kunci: "A,B,D",
    pembahasan: r`$a = 5.000$, $b = 2.000$, $U_n = 5.000 + (n - 1) \times 2.000$.

- **A** — benar, $U_{10} = 5.000 + 9 \times 2.000 = 23.000$.
- **B** — benar, $S_{10} = \dfrac{10}{2}(5.000 + 23.000) = 140.000$.
- **C** — salah, $U_{13} = 5.000 + 24.000 = 29.000$ (belum lebih dari 30.000). Baru $U_{14} = 31.000$. Jadi, jawabannya minggu ke-14.
- **D** — benar, setiap minggu bertambah tetap Rp2.000,00.
- **E** — salah, $S_5 = \dfrac{5}{2}(5.000 + 13.000) = 45.000$.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  {
    // 15
    kode_subdomain: "SMP-MTK-D2-S4",
    bentuk_soal: "pg",
    pertanyaan: "Perhatikan pola bilangan berikut: 2, 6, 12, 20, 30, .... Suku ke-10 pola bilangan tersebut adalah ....",
    opsi_a: "90",
    opsi_b: "100",
    opsi_c: "110",
    opsi_d: "132",
    kunci: "C",
    pembahasan: r`Perhatikan bentuk tiap suku: $2 = 1 \times 2$, $6 = 2 \times 3$, $12 = 3 \times 4$, $20 = 4 \times 5$, $30 = 5 \times 6$. Jadi, $U_n = n(n + 1)$.

$U_{10} = 10 \times 11 = 110$.

Cara lain: selisihnya 4, 6, 8, 10, ... (bertambah 2), sehingga suku berikutnya 42, 56, 72, 90, 110.

- **A.** 90 — salah, itu suku ke-9 ($9 \times 10$).
- **B.** 100 — salah, itu $10^2$, bukan $10 \times 11$.
- **C.** 110 — benar.
- **D.** 132 — salah, itu suku ke-11 ($11 \times 12$).`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },

  // ---- Objek Geometri ----
  {
    // 16
    kode_subdomain: "SMP-MTK-D3-S1",
    bentuk_soal: "pg",
    pertanyaan: "Sebuah tangga sepanjang 5 m disandarkan pada dinding tegak. Jarak kaki tangga ke dinding adalah 1,4 m. Tinggi ujung atas tangga dari lantai adalah ....",
    opsi_a: "3,6 m",
    opsi_b: "4,8 m",
    opsi_c: "5,2 m",
    opsi_d: "6,4 m",
    kunci: "B",
    pembahasan: r`Tangga, dinding, dan lantai membentuk segitiga siku-siku dengan tangga sebagai sisi miring.

$t = \sqrt{5^2 - 1{,}4^2} = \sqrt{25 - 1{,}96} = \sqrt{23{,}04} = 4{,}8$ m.

- **A.** 3,6 m — salah, ini hasil $5 - 1{,}4$ (Teorema Pythagoras tidak dipakai).
- **B.** 4,8 m — benar.
- **C.** 5,2 m — salah, ini hasil $\sqrt{25 + 1{,}96}$. Sisi miring diperlakukan seperti sisi siku-siku, padahal tinggi tangga tidak mungkin melebihi panjang tangga.
- **D.** 6,4 m — salah, ini hasil $5 + 1{,}4$.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 17
    kode_subdomain: "SMP-MTK-D3-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Pada segitiga PQR, besar $\\angle P = (2x + 10)°$, $\\angle Q = (3x - 5)°$, dan $\\angle R = (x + 25)°$. Tentukan **Benar** atau **Salah** setiap pernyataan berikut!",
    opsi_a: "Nilai $x = 25$.",
    opsi_b: "Sudut terbesar segitiga PQR adalah $\\angle Q$.",
    opsi_c: "Segitiga PQR merupakan segitiga siku-siku.",
    opsi_d: "Pelurus $\\angle R$ besarnya 130°.",
    kunci: "B,B,S,B",
    pembahasan: r`Jumlah sudut segitiga 180°: $(2x + 10) + (3x - 5) + (x + 25) = 6x + 30 = 180 \Rightarrow x = 25$.

Jadi $\angle P = 60°$, $\angle Q = 70°$, $\angle R = 50°$.

- **Benar** — $x = 25$.
- **Benar** — $70°$ adalah sudut terbesar.
- **Salah** — tidak ada sudut yang besarnya 90°. Ketiga sudutnya lancip, jadi segitiga PQR adalah segitiga lancip.
- **Benar** — pelurus $\angle R = 180° - 50° = 130°$.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 18
    kode_subdomain: "SMP-MTK-D3-S1",
    bentuk_soal: "pg",
    pertanyaan: "Segitiga ABC sebangun dengan segitiga PQR. Panjang sisi segitiga ABC adalah AB = 6 cm, BC = 8 cm, dan AC = 10 cm. Keliling segitiga PQR adalah 60 cm. Panjang sisi terpendek segitiga PQR adalah ....",
    opsi_a: "12 cm",
    opsi_b: "15 cm",
    opsi_c: "18 cm",
    opsi_d: "25 cm",
    kunci: "B",
    pembahasan: r`Pada bangun yang sebangun, perbandingan keliling sama dengan perbandingan sisi yang bersesuaian.

Keliling ABC $= 6 + 8 + 10 = 24$ cm. Faktor skala $k = \dfrac{60}{24} = 2{,}5$.
Sisi terpendek PQR bersesuaian dengan AB: $6 \times 2{,}5 = 15$ cm.

- **A.** 12 cm — salah, ini hasil $6 \times 2$ (faktor skala dibulatkan menjadi 2).
- **B.** 15 cm — benar.
- **C.** 18 cm — salah, ini hasil $6 \times 3$ (faktor skala dibulatkan menjadi 3).
- **D.** 25 cm — salah, itu sisi terpanjang PQR ($10 \times 2{,}5$).`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },

  // ---- Transformasi Geometri (stimulus koordinat) ----
  {
    // 19
    kode_stimulus: "SMP-MTK-P5-KOORDINAT",
    kode_subdomain: "SMP-MTK-D3-S2",
    bentuk_soal: "pg",
    pertanyaan: "Titik L ditranslasi 4 satuan ke kanan dan 2 satuan ke bawah. Koordinat bayangan titik L adalah ....",
    opsi_a: "(3, −1)",
    opsi_b: "(−5, 3)",
    opsi_c: "(3, 3)",
    opsi_d: "(−5, −1)",
    kunci: "A",
    pembahasan: r`L(−1, 1). Ke kanan 4 berarti $x + 4$, ke bawah 2 berarti $y - 2$: $L' = (-1 + 4,\ 1 - 2) = (3, -1)$.

- **A** — benar.
- **B** — salah, arah kedua translasi terbalik (ke kiri dan ke atas).
- **C** — salah, translasi ke bawah dihitung ke atas.
- **D** — salah, translasi ke kanan dihitung ke kiri.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 20
    kode_stimulus: "SMP-MTK-P5-KOORDINAT",
    kode_subdomain: "SMP-MTK-D3-S2",
    bentuk_soal: "pg",
    pertanyaan: "Segitiga KLM dirotasi 90° berlawanan arah jarum jam dengan pusat O(0, 0). Koordinat bayangan titik M adalah ....",
    opsi_a: "(4, 1)",
    opsi_b: "(−4, −1)",
    opsi_c: "(1, 4)",
    opsi_d: "(−4, 1)",
    kunci: "B",
    pembahasan: r`Rotasi 90° berlawanan arah jarum jam dengan pusat O: $(x, y) \to (-y, x)$.

M(−1, 4) → $(-4, -1)$. Titik M di kuadran II berpindah ke kuadran III, sesuai arah putaran berlawanan jarum jam.

- **A.** (4, 1) — salah, itu hasil rotasi 90° **searah** jarum jam: $(x, y) \to (y, -x)$.
- **B.** (−4, −1) — benar.
- **C.** (1, 4) — salah, itu hasil pencerminan terhadap sumbu-Y.
- **D.** (−4, 1) — salah, itu hasil $(x, y) \to (-y, -x)$, yaitu pencerminan terhadap garis $y = -x$, bukan rotasi.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 21
    kode_stimulus: "SMP-MTK-P5-KOORDINAT",
    kode_subdomain: "SMP-MTK-D3-S2",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Segitiga KLM didilatasi dengan pusat O(0, 0) dan faktor skala 2, sehingga diperoleh segitiga K'L'M'. Tentukan **Benar** atau **Salah** setiap pernyataan berikut!",
    opsi_a: "Koordinat titik K' adalah (−6, 2).",
    opsi_b: "Panjang sisi L'M' adalah 6 satuan.",
    opsi_c: "Luas segitiga K'L'M' adalah 12 satuan luas.",
    opsi_d: "Besar sudut di titik L' dua kali besar sudut di titik L.",
    kunci: "B,B,B,S",
    pembahasan: r`Dilatasi pusat O faktor 2: $(x, y) \to (2x, 2y)$. K'(−6, 2), L'(−2, 2), M'(−2, 8).

- **Benar** — $K' = (2 \times (-3),\ 2 \times 1) = (-6, 2)$.
- **Benar** — LM $= 4 - 1 = 3$ satuan, sehingga L'M' $= 2 \times 3 = 6$ satuan (cek: $8 - 2 = 6$).
- **Benar** — luas KLM $= \dfrac{1}{2} \times 2 \times 3 = 3$. Dilatasi faktor 2 mengalikan luas dengan $2^2 = 4$, sehingga luas K'L'M' $= 12$ (cek: $\dfrac{1}{2} \times 4 \times 6 = 12$).
- **Salah** — dilatasi menghasilkan bangun yang sebangun. Besar sudut tetap (sudut di L dan L' sama-sama 90°), hanya panjang sisi yang berubah.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },

  // ---- Pengukuran (stimulus taman) ----
  {
    // 22
    kode_stimulus: "SMP-MTK-P5-TAMAN",
    kode_subdomain: "SMP-MTK-D3-S3",
    bentuk_soal: "pg",
    pertanyaan: "Luas seluruh taman tersebut adalah ....",
    opsi_a: "162 m²",
    opsi_b: "217 m²",
    opsi_c: "294 m²",
    opsi_d: "448 m²",
    kunci: "B",
    pembahasan: r`Luas persegi panjang $= 14 \times 10 = 140$ m².
Setengah lingkaran berdiameter 14 m, jadi $r = 7$ m: luas $= \dfrac{1}{2} \times \dfrac{22}{7} \times 7 \times 7 = 77$ m².
Luas taman $= 140 + 77 = 217$ m².

- **A.** 162 m² — salah, yang ditambahkan adalah panjang busur setengah lingkaran (22 m), bukan luasnya: $140 + 22$.
- **B.** 217 m² — benar.
- **C.** 294 m² — salah, luas **satu lingkaran penuh** (154 m²) ditambahkan, bukan setengahnya.
- **D.** 448 m² — salah, jari-jari diambil 14 m (diameter dianggap jari-jari): $140 + \dfrac{1}{2} \times \dfrac{22}{7} \times 14^2 = 140 + 308$.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 23
    kode_stimulus: "SMP-MTK-P5-TAMAN",
    kode_subdomain: "SMP-MTK-D3-S3",
    bentuk_soal: "pgk_mcma",
    pertanyaan: "Taman tersebut akan ditanami rumput dan dipagari di sekelilingnya. Manakah pernyataan berikut yang benar?" + MCMA,
    opsi_a: "Panjang pagar yang diperlukan untuk mengelilingi taman adalah 56 m.",
    opsi_b: "Panjang busur setengah lingkaran adalah 44 m.",
    opsi_c: "Jika biaya menanam rumput Rp20.000,00 per m², biaya menanam rumput di seluruh taman adalah Rp4.340.000,00.",
    opsi_d: "Jika harga pagar Rp50.000,00 per meter, biaya pagar seluruhnya adalah Rp2.800.000,00.",
    opsi_e: "Luas daerah setengah lingkaran adalah 154 m².",
    kunci: "A,C,D",
    pembahasan: r`Busur setengah lingkaran $= \dfrac{1}{2} \times \dfrac{22}{7} \times 14 = 22$ m. Pagar mengelilingi tepi luar taman: dua sisi 10 m, satu sisi 14 m (bawah), dan busur. Sisi 14 m bagian atas tidak dipagari karena berada di dalam taman.

Keliling $= 10 + 14 + 10 + 22 = 56$ m.

- **A** — benar.
- **B** — salah, 44 m adalah keliling **lingkaran penuh**. Busur setengah lingkaran 22 m.
- **C** — benar, $217 \times 20.000 = 4.340.000$.
- **D** — benar, $56 \times 50.000 = 2.800.000$.
- **E** — salah, 154 m² adalah luas lingkaran penuh. Luas setengah lingkaran 77 m².`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  {
    // 24
    kode_subdomain: "SMP-MTK-D3-S3",
    bentuk_soal: "pg",
    pertanyaan: "Sebuah pabrik membuat 50 butir cokelat berbentuk bola dengan jari-jari 1,5 cm. Dengan $\\pi = 3{,}14$, volume cokelat cair yang diperlukan paling sedikit adalah ....",
    opsi_a: "471 cm³",
    opsi_b: "706,5 cm³",
    opsi_c: "2.119,5 cm³",
    opsi_d: "5.652 cm³",
    kunci: "B",
    pembahasan: r`Volume satu bola $= \dfrac{4}{3}\pi r^3 = \dfrac{4}{3} \times 3{,}14 \times 1{,}5^3 = \dfrac{4}{3} \times 3{,}14 \times 3{,}375 = 14{,}13$ cm³.
Untuk 50 butir: $50 \times 14{,}13 = 706{,}5$ cm³.

- **A.** 471 cm³ — salah, ini hasil $50 \times \dfrac{4}{3}\pi r^2$ (jari-jari hanya dikuadratkan, bukan dipangkatkan tiga).
- **B.** 706,5 cm³ — benar.
- **C.** 2.119,5 cm³ — salah, pembagi 3 pada rumus terlupa: $50 \times 4 \times 3{,}14 \times 3{,}375$.
- **D.** 5.652 cm³ — salah, diameter 3 cm dipakai sebagai jari-jari: $50 \times \dfrac{4}{3} \times 3{,}14 \times 27$.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },

  // ---- Data (stimulus diagram lingkaran) ----
  {
    // 25
    kode_stimulus: "SMP-MTK-P5-TRANSPORTASI",
    kode_subdomain: "SMP-MTK-D4-S1",
    bentuk_soal: "pg",
    pertanyaan: "Banyak siswa yang berangkat ke sekolah dengan sepeda adalah ....",
    opsi_a: "15 siswa",
    opsi_b: "24 siswa",
    opsi_c: "36 siswa",
    opsi_d: "48 siswa",
    kunci: "C",
    pembahasan: r`Sepeda 15% dari 240 siswa: $\dfrac{15}{100} \times 240 = 36$ siswa.

- **A** — salah, 15 adalah persentasenya, bukan banyak siswa.
- **B** — salah, 24 siswa adalah 10% dari 240.
- **C** — benar.
- **D** — salah, 48 siswa adalah 20% (pengguna angkot).`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 26
    kode_stimulus: "SMP-MTK-P5-TRANSPORTASI",
    kode_subdomain: "SMP-MTK-D4-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Tentukan **Benar** atau **Salah** setiap pernyataan berikut berdasarkan diagram lingkaran tersebut!",
    opsi_a: "Banyak siswa yang diantar dengan motor adalah 84 siswa.",
    opsi_b: "Selisih banyak siswa yang berjalan kaki dan yang naik angkot adalah 24 siswa.",
    opsi_c: "Besar sudut juring untuk siswa yang naik angkot adalah 60°.",
    opsi_d: "Siswa yang berjalan kaki atau bersepeda lebih banyak daripada siswa yang diantar dengan motor.",
    kunci: "B,S,S,B",
    pembahasan: r`- **Benar** — $35\% \times 240 = 84$ siswa.
- **Salah** — jalan kaki $25\% \times 240 = 60$, angkot $20\% \times 240 = 48$. Selisihnya 12 siswa.
- **Salah** — sudut juring angkot $= 20\% \times 360° = 72°$.
- **Benar** — jalan kaki + sepeda $= 25\% + 15\% = 40\%$ (96 siswa), lebih banyak daripada diantar motor 35% (84 siswa).`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 27
    kode_subdomain: "SMP-MTK-D4-S1",
    bentuk_soal: "pg",
    pertanyaan: "Rata-rata nilai ulangan 8 siswa dalam sebuah kelompok belajar adalah 75. Setelah seorang siswa baru bergabung, rata-rata nilai kelompok itu menjadi 76. Nilai ulangan siswa baru tersebut adalah ....",
    opsi_a: "76",
    opsi_b: "77",
    opsi_c: "84",
    opsi_d: "151",
    kunci: "C",
    pembahasan: r`Jumlah nilai 8 siswa $= 8 \times 75 = 600$.
Jumlah nilai 9 siswa $= 9 \times 76 = 684$.
Nilai siswa baru $= 684 - 600 = 84$.

- **A** — salah, rata-rata baru dianggap sama dengan nilai siswa baru.
- **B** — salah, rata-rata naik 1 dianggap berarti nilai siswa baru hanya 1 lebih tinggi dari rata-rata baru ($76 + 1$). Kenaikan 1 itu sebenarnya dibagi rata ke 9 siswa, sehingga siswa baru harus $9 \times 1 = 9$ di atas rata-rata lama: $75 + 9 = 84$.
- **C** — benar.
- **D** — salah, ini hasil $75 + 76$ (kedua rata-rata dijumlahkan).`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
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
    pembahasan: r`Mata dadu prima: 2, 3, 5 (3 kemungkinan). 1 bukan bilangan prima. Peluangnya $\dfrac{3}{6} = \dfrac{1}{2}$.

- **A** — salah, itu peluang satu mata dadu tertentu.
- **B** — salah, ini muncul bila hanya 2 dan 3 yang dianggap prima.
- **C** — benar.
- **D** — salah, ini muncul bila 1 dianggap prima (1, 2, 3, 5).`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L1",
  },
  {
    // 29
    kode_subdomain: "SMP-MTK-D4-S2",
    bentuk_soal: "pg",
    pertanyaan: "Sebuah kedai es krim menyurvei 200 pengunjung secara acak. Sebanyak 46 pengunjung memilih rasa cokelat. Pada akhir pekan diperkirakan datang 1.500 pengunjung. Perkiraan banyak pengunjung yang memilih rasa cokelat adalah ....",
    opsi_a: "300 orang",
    opsi_b: "345 orang",
    opsi_c: "375 orang",
    opsi_d: "460 orang",
    kunci: "B",
    pembahasan: r`Frekuensi relatif rasa cokelat $= \dfrac{46}{200} = 0{,}23$.
Perkiraan $= 0{,}23 \times 1.500 = 345$ orang.

- **A** — salah, ini hasil $0{,}2 \times 1.500$ (frekuensi relatif dibulatkan).
- **B** — benar.
- **C** — salah, ini hasil $0{,}25 \times 1.500$.
- **D** — salah, ini hasil $46 \times 10$ (sampel dianggap sepersepuluh populasi).`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 30
    kode_subdomain: "SMP-MTK-D4-S2",
    bentuk_soal: "pgk_mcma",
    pertanyaan: "Dua puluh kartu diberi nomor 1 sampai 20, lalu dikocok. Sebuah kartu diambil secara acak. Manakah pernyataan berikut yang benar?" + MCMA,
    opsi_a: r`Peluang terambil kartu bernomor kelipatan 4 adalah $\dfrac{1}{4}$.`,
    opsi_b: r`Peluang terambil kartu bernomor bilangan prima adalah $\dfrac{2}{5}$.`,
    opsi_c: r`Peluang terambil kartu bernomor kelipatan 3 adalah $\dfrac{1}{3}$.`,
    opsi_d: "Peluang terambil kartu bernomor lebih dari 20 adalah 0.",
    opsi_e: "Peluang terambil kartu bernomor genap lebih besar daripada peluang terambil kartu bernomor ganjil.",
    kunci: "A,B,D",
    pembahasan: r`Banyak titik sampel $n(S) = 20$.

- **A** — benar, kelipatan 4: 4, 8, 12, 16, 20 (5 kartu), peluangnya $\dfrac{5}{20} = \dfrac{1}{4}$.
- **B** — benar, prima: 2, 3, 5, 7, 11, 13, 17, 19 (8 kartu), peluangnya $\dfrac{8}{20} = \dfrac{2}{5}$.
- **C** — salah, kelipatan 3: 3, 6, 9, 12, 15, 18 (6 kartu), peluangnya $\dfrac{6}{20} = \dfrac{3}{10}$.
- **D** — benar, tidak ada kartu bernomor lebih dari 20, sehingga kejadian itu mustahil (peluang 0).
- **E** — salah, genap dan ganjil masing-masing 10 kartu, sehingga peluangnya sama-sama $\dfrac{1}{2}$.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
];

export default {
  title: "TKA SMP Matematika — Paket 5",
  description: "30 soal: bilangan bulat, perbandingan dan laju, persamaan dan pertidaksamaan linear, bentuk aljabar, fungsi, barisan dan deret, Teorema Pythagoras, sudut segitiga, kesebangunan, translasi-rotasi-dilatasi, luas bangun gabungan, volume bola, diagram lingkaran, rata-rata, serta peluang. Dilengkapi gambar dan pembahasan setiap pilihan jawaban.",
  jenjang: "SMP",
  subjectCode: "SMP-MTK",
  durationMinutes: 75,
  isPremium: true,
  isFullSimulation: true,
  createdByEmail: "kpbgalimka@gmail.com",
  stimuli,
  rows,
  images: {
    "grafik-kirim": { title: "Grafik biaya kirim paket terhadap berat", svg: imgKirim() },
    "segitiga-klm": { title: "Segitiga KLM pada bidang koordinat", svg: imgKoordinat() },
    "denah-taman": { title: "Denah taman gabungan persegi panjang dan setengah lingkaran", svg: imgTaman() },
    "diagram-transportasi": { title: "Diagram lingkaran cara siswa berangkat ke sekolah", svg: imgLingkaran() },
  },
};
