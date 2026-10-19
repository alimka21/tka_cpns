// TKA SMA Matematika — Paket 7 (soal baru, ditulis untuk Pakar TKA).
// 25 soal: 15 PG, 4 MCMA, 6 Kategori; 4 grup stimulus; 4 gambar baru (SVG).
const r = String.raw;
const FONT = `font-family="Arial, Helvetica, sans-serif"`;
const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" ${FONT}><rect width="${w}" height="${h}" fill="#fff"/>${body}</svg>`;
const text = (x: number, y: number, t: string, o: { size?: number; anchor?: string; weight?: string; fill?: string; italic?: boolean } = {}) =>
  `<text x="${x}" y="${y}" font-size="${o.size ?? 18}" text-anchor="${o.anchor ?? "middle"}" font-weight="${o.weight ?? "normal"}" fill="${o.fill ?? "#111"}"${o.italic ? ` font-style="italic"` : ""}>${t}</text>`;
const line = (x1: number, y1: number, x2: number, y2: number, o: { stroke?: string; w?: number; dash?: boolean; arrow?: boolean } = {}) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.stroke ?? "#111"}" stroke-width="${o.w ?? 2}"${o.dash ? ` stroke-dasharray="6 5"` : ""}${o.arrow ? ` marker-end="url(#ar)"` : ""}/>`;
const arrowDef = `<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#111"/></marker></defs>`;
const dot = (x: number, y: number, rr = 5, fill = "#111") => `<circle cx="${x}" cy="${y}" r="${rr}" fill="${fill}"/>`;

// ---------- Gambar ----------

// Penampang memanjang kolam: panjang 25 m, kedalaman 1,2 m (dangkal) → 2,0 m (dalam), lebar 10 m.
function imgKolam() {
  const x0 = 120, x1 = 720, top = 90, kx = 24, ky = 80; // 1 m = 24 px mendatar, 80 px tegak (skala tegak diperbesar)
  const yShallow = top + 1.2 * ky, yDeep = top + 2.0 * ky;
  let s = arrowDef;
  s += `<path d="M${x0},${top} L${x1},${top} L${x1},${yDeep} L${x0},${yShallow} z" fill="#bae6fd" stroke="#0369a1" stroke-width="3"/>`;
  s += `<path d="M${x0 - 30},${top} L${x0},${top} M${x1},${top} L${x1 + 30},${top}" stroke="#6b7280" stroke-width="3"/>`;
  s += line(x0, top - 30, x1, top - 30, { w: 1.5 }) + line(x0, top - 38, x0, top - 22, { w: 1.5 }) + line(x1, top - 38, x1, top - 22, { w: 1.5 });
  s += `<rect x="${(x0 + x1) / 2 - 40}" y="${top - 44}" width="80" height="26" fill="#fff"/>` + text((x0 + x1) / 2, top - 24, "25 m", { weight: "bold" });
  s += line(x0 - 18, top, x0 - 18, yShallow, { w: 1.5 }) + text(x0 - 26, (top + yShallow) / 2 + 6, "1,2 m", { weight: "bold", anchor: "end" });
  s += line(x1 + 18, top, x1 + 18, yDeep, { w: 1.5 }) + text(x1 + 26, (top + yDeep) / 2 + 6, "2,0 m", { weight: "bold", anchor: "start" });
  s += text((x0 + x1) / 2, yDeep + 46, "Penampang memanjang kolam (lebar kolam 10 m)", { size: 16, italic: true });
  s += text(x0 + 70, top + 40, "dangkal", { size: 15, fill: "#0369a1" }) + text(x1 - 70, top + 100, "dalam", { size: 15, fill: "#0369a1" });
  return svg(860, 320, s);
}

// Histogram uang saku harian 40 siswa.
function imgHistogram() {
  const ox = 90, oy = 360, bw = 90, uy = 18;
  const data: [string, number][] = [["5–9", 4], ["10–14", 10], ["15–19", 16], ["20–24", 7], ["25–29", 3]];
  let s = arrowDef;
  for (let f = 0; f <= 18; f += 2) s += line(ox, oy - f * uy, ox + bw * 5 + 20, oy - f * uy, { stroke: "#e5e7eb", w: 1 }) + text(ox - 10, oy - f * uy + 5, String(f), { size: 14, anchor: "end" });
  data.forEach(([label, f], i) => {
    s += `<rect x="${ox + i * bw}" y="${oy - f * uy}" width="${bw}" height="${f * uy}" fill="#60a5fa" stroke="#1e3a8a" stroke-width="2"/>`;
    s += text(ox + i * bw + bw / 2, oy - f * uy - 8, String(f), { weight: "bold", size: 16 });
    s += text(ox + i * bw + bw / 2, oy + 24, label, { size: 15 });
  });
  s += line(ox, oy, ox + bw * 5 + 30, oy, { arrow: true }) + line(ox, oy, ox, oy - 19 * uy, { arrow: true });
  s += text(ox + bw * 2.5, oy + 52, "Uang saku harian (ribu rupiah)", { weight: "bold", size: 16 });
  s += `<text transform="translate(30 ${oy - 9 * uy}) rotate(-90)" font-size="16" font-weight="bold" text-anchor="middle">Banyak siswa</text>`;
  return svg(620, 430, s);
}

// Menara pemancar: sudut elevasi 30° dari A dan 60° dari B, AB = 40 m (tinggi menara 20√3 m).
function imgMenara() {
  const gy = 330, k = 6.5; // 1 m = 6,5 px
  const T = 600, A = T - 60 * k, B = T - 20 * k, H = 20 * Math.sqrt(3) * k;
  let s = `<rect x="0" y="${gy}" width="720" height="40" fill="#d9f99d"/>`;
  s += `<path d="M${T - 14},${gy} L${T - 5},${gy - H} L${T + 5},${gy - H} L${T + 14},${gy} z" fill="#e5e7eb" stroke="#374151" stroke-width="2"/>`;
  for (let i = 1; i < 6; i++) { const y = gy - (H * i) / 6; s += line(T - 13 + (i * 8) / 6, y, T + 13 - (i * 8) / 6, y, { w: 1.5, stroke: "#374151" }); }
  s += dot(T, gy - H, 6, "#dc2626") + text(T + 14, gy - H + 4, "puncak menara", { size: 15, anchor: "start" });
  s += line(A, gy, T, gy - H, { dash: true, w: 2 }) + line(B, gy, T, gy - H, { dash: true, w: 2 });
  s += dot(A, gy, 6) + dot(B, gy, 6) + text(A, gy + 26, "A", { weight: "bold" }) + text(B, gy + 26, "B", { weight: "bold" }) + text(T, gy + 26, "C", { weight: "bold" });
  s += `<path d="M${A + 48},${gy} A48,48 0 0 0 ${A + 48 * Math.cos(Math.PI / 6)},${gy - 48 * Math.sin(Math.PI / 6)}" fill="none" stroke="#2563eb" stroke-width="2"/>` + text(A + 62, gy - 10, "30°", { weight: "bold", fill: "#2563eb", anchor: "start" });
  s += `<path d="M${B + 36},${gy} A36,36 0 0 0 ${B + 36 * Math.cos(Math.PI / 3)},${gy - 36 * Math.sin(Math.PI / 3)}" fill="none" stroke="#2563eb" stroke-width="2"/>` + text(B + 40, gy - 34, "60°", { weight: "bold", fill: "#2563eb", anchor: "start" });
  s += line(A, gy + 44, B, gy + 44, { w: 1.5 }) + line(A, gy + 36, A, gy + 52, { w: 1.5 }) + line(B, gy + 36, B, gy + 52, { w: 1.5 }) + text((A + B) / 2, gy + 64, "40 m", { weight: "bold" });
  return svg(720, 410, s);
}

// Grafik fungsi kuadrat y = x² − 2x − 3.
function imgParabola() {
  const ox = 300, oy = 230, u = 40;
  const X = (x: number) => ox + x * u, Y = (y: number) => oy - y * u;
  let s = arrowDef;
  for (let x = -4; x <= 6; x++) s += line(X(x), 20, X(x), 470, { stroke: "#f1f5f9", w: 1 });
  for (let y = -5; y <= 5; y++) s += line(40, Y(y), 560, Y(y), { stroke: "#f1f5f9", w: 1 });
  s += line(40, oy, 570, oy, { arrow: true }) + line(ox, 470, ox, 15, { arrow: true });
  s += text(560, oy + 24, "x", { italic: true }) + text(ox + 16, 26, "y", { italic: true });
  const pts: string[] = [];
  for (let x = -1.9; x <= 3.9; x += 0.05) pts.push(`${X(x).toFixed(1)},${Y(x * x - 2 * x - 3).toFixed(1)}`);
  s += `<polyline points="${pts.join(" ")}" fill="none" stroke="#dc2626" stroke-width="3"/>`;
  s += dot(X(-1), oy, 6) + text(X(-1) - 6, oy + 24, "−1", { size: 16, anchor: "end" });
  s += dot(X(3), oy, 6) + text(X(3) + 8, oy + 24, "3", { size: 16, anchor: "start" });
  s += dot(ox, Y(-3), 6) + text(ox - 10, Y(-3) + 6, "−3", { size: 16, anchor: "end" });
  s += text(ox - 12, oy + 22, "0", { size: 15 });
  return svg(600, 490, s);
}

// ---------- Stimulus ----------
const stimuli = [
  {
    code: "SMA-MTK-P7-PARKIR",
    title: "Tarif Parkir Bandara",
    content: r`Tarif parkir mobil di sebuah bandara:

| Lama parkir | Tarif |
|---|---|
| 1 jam pertama | Rp5.000,00 |
| Setiap jam berikutnya (bagian dari jam dihitung 1 jam) | Rp4.000,00 per jam |
| Tarif maksimum per 24 jam | Rp60.000,00 |

Selama tarif belum mencapai batas maksimum, tarif parkir $t$ jam ($t$ bilangan asli) dapat dinyatakan dengan $T(t) = 4.000t + 1.000$ rupiah.`,
  },
  {
    code: "SMA-MTK-P7-KOLAM",
    title: "Kolam Renang Sekolah",
    content: r`Kolam renang sekolah berbentuk prisma tegak dengan alas berupa trapesium (penampang memanjang). Panjang kolam 25 m dan lebarnya 10 m. Kedalaman di ujung dangkal 1,2 m dan bertambah secara merata hingga 2,0 m di ujung dalam, seperti gambar berikut.`,
    gambar: "kolam",
  },
  {
    code: "SMA-MTK-P7-SAKU",
    title: "Uang Saku Harian Siswa",
    content: r`OSIS mendata uang saku harian 40 siswa kelas XI. Hasilnya disajikan dalam histogram berikut (dalam ribu rupiah; kelas 5–9 berarti Rp5.000 sampai Rp9.000).`,
    gambar: "histogram",
  },
  {
    code: "SMA-MTK-P7-MENARA",
    title: "Menara Pemancar",
    content: r`Rina berdiri di titik A dan melihat puncak menara pemancar dengan sudut elevasi 30°. Ia lalu berjalan lurus 40 m mendekati menara hingga titik B, dan sudut elevasinya menjadi 60°. Titik A, B, dan kaki menara C segaris dan mendatar; tinggi mata Rina diabaikan.`,
    gambar: "menara",
  },
];

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
  kode_stimulus?: string;
  gambar?: string;
};

const rows: Row[] = [
  // ---- Grup 1: tarif parkir ----
  {
    kode_stimulus: "SMA-MTK-P7-PARKIR",
    kode_subdomain: "SMA-MTK-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: r`Pak Budi memarkir mobilnya selama 4 jam 20 menit. Biaya parkir yang harus dibayar Pak Budi adalah ....`,
    opsi_a: "Rp17.000,00",
    opsi_b: "Rp19.000,00",
    opsi_c: "Rp21.000,00",
    opsi_d: "Rp25.000,00",
    opsi_e: "Rp22.333,00",
    kunci: "C",
    pembahasan: r`4 jam 20 menit dihitung 5 jam (bagian dari jam dihitung 1 jam): 1 jam pertama + 4 jam berikutnya.

Biaya $= 5.000 + 4 \times 4.000 = 21.000$, atau $T(5) = 4.000(5) + 1.000 = 21.000$.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    kode_stimulus: "SMA-MTK-P7-PARKIR",
    kode_subdomain: "SMA-MTK-D2-S2",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: r`Tentukan **Benar** atau **Salah** setiap pernyataan berikut!`,
    opsi_a: "Pengendara yang parkir tepat 6 jam membayar Rp25.000,00.",
    opsi_b: r`Rumus $T(t) = 4.000t + 1.000$ memberikan tarif yang sama dengan tabel untuk $t = 1$.`,
    opsi_c: "Pengendara yang parkir 20 jam membayar Rp81.000,00.",
    kunci: "B,B,S",
    pembahasan: r`- $T(6) = 24.000 + 1.000 = 25.000$ → **Benar**.
- $T(1) = 5.000$, sama dengan tarif 1 jam pertama → **Benar**.
- $T(20) = 81.000$ melebihi tarif maksimum, sehingga yang dibayar Rp60.000,00 → **Salah**.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    kode_stimulus: "SMA-MTK-P7-PARKIR",
    kode_subdomain: "SMA-MTK-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Lama parkir paling singkat (dalam jam, setelah pembulatan ke atas) yang membuat pengendara membayar tarif maksimum Rp60.000,00 adalah ....`,
    opsi_a: "13 jam",
    opsi_b: "14 jam",
    opsi_c: "15 jam",
    opsi_d: "16 jam",
    opsi_e: "24 jam",
    kunci: "C",
    pembahasan: r`Tarif maksimum berlaku saat $4.000t + 1.000 \ge 60.000 \Rightarrow t \ge 14{,}75$. Karena $t$ bilangan asli, $t = 15$.

Cek: $T(14) = 57.000$ (masih di bawah batas) dan $T(15) = 61.000$ (dibatasi menjadi 60.000).`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  // ---- Grup 2: kolam renang ----
  {
    kode_stimulus: "SMA-MTK-P7-KOLAM",
    kode_subdomain: "SMA-MTK-D3-S3",
    bentuk_soal: "pg",
    pertanyaan: r`Volume air kolam saat terisi penuh adalah ....`,
    opsi_a: r`$300\text{ m}^3$`,
    opsi_b: r`$400\text{ m}^3$`,
    opsi_c: r`$480\text{ m}^3$`,
    opsi_d: r`$500\text{ m}^3$`,
    opsi_e: r`$600\text{ m}^3$`,
    kunci: "B",
    pembahasan: r`Luas penampang (trapesium) $= \frac{1{,}2 + 2{,}0}{2} \times 25 = 40\text{ m}^2$.

Volume $= 40 \times 10 = 400\text{ m}^3$.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    kode_stimulus: "SMA-MTK-P7-KOLAM",
    kode_subdomain: "SMA-MTK-D3-S3",
    bentuk_soal: "pg",
    pertanyaan: r`Kolam yang kosong diisi air dengan debit 20 liter per detik. Waktu yang diperlukan sampai kolam penuh adalah ....`,
    opsi_a: "4 jam 30 menit",
    opsi_b: "5 jam 33 menit 20 detik",
    opsi_c: "6 jam 40 menit",
    opsi_d: "8 jam 20 menit",
    opsi_e: "20 jam",
    kunci: "B",
    pembahasan: r`$400\text{ m}^3 = 400.000$ liter. Waktu $= \frac{400.000}{20} = 20.000$ detik.

$20.000$ detik $= 5$ jam ($18.000$ detik) $+ 2.000$ detik $= 5$ jam 33 menit 20 detik.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    kode_stimulus: "SMA-MTK-P7-KOLAM",
    kode_subdomain: "SMA-MTK-D3-S3",
    bentuk_soal: "pgk_mcma",
    pertanyaan: r`Seluruh dinding bagian dalam dan lantai kolam akan dicat. Pilihlah **semua** pernyataan yang benar!`,
    opsi_a: r`Luas kedua dinding samping (berbentuk trapesium) adalah $80\text{ m}^2$.`,
    opsi_b: r`Luas lantai kolam yang miring lebih dari $250\text{ m}^2$.`,
    opsi_c: r`Luas seluruh bagian yang dicat kurang dari $350\text{ m}^2$.`,
    opsi_d: r`Luas dinding di ujung dangkal adalah $12\text{ m}^2$.`,
    kunci: "A,B,D",
    pembahasan: r`- Dua dinding samping: $2 \times 40 = 80\text{ m}^2$ (benar).
- Panjang lantai miring $= \sqrt{25^2 + 0{,}8^2} \approx 25{,}01$ m, sehingga luasnya $\approx 250{,}1\text{ m}^2 > 250$ (benar).
- Dinding ujung dangkal $10 \times 1{,}2 = 12\text{ m}^2$ (benar); ujung dalam $10 \times 2 = 20\text{ m}^2$.
- Total $\approx 80 + 250{,}1 + 12 + 20 = 362{,}1\text{ m}^2$, tidak kurang dari 350 (pernyataan 3 salah).`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  // ---- Grup 3: uang saku ----
  {
    kode_stimulus: "SMA-MTK-P7-SAKU",
    kode_subdomain: "SMA-MTK-D5-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Persentase siswa yang uang sakunya minimal Rp20.000,00 adalah ....`,
    opsi_a: "17,5%",
    opsi_b: "25%",
    opsi_c: "32,5%",
    opsi_d: "40%",
    opsi_e: "65%",
    kunci: "B",
    pembahasan: r`Kelas 20–24 dan 25–29: $7 + 3 = 10$ siswa. Persentase $= \frac{10}{40} \times 100\% = 25\%$.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    kode_stimulus: "SMA-MTK-P7-SAKU",
    kode_subdomain: "SMA-MTK-D5-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Modus data uang saku tersebut adalah ....`,
    opsi_a: "Rp15.500,00",
    opsi_b: "Rp16.000,00",
    opsi_c: "Rp16.500,00",
    opsi_d: "Rp17.000,00",
    opsi_e: "Rp17.500,00",
    kunci: "C",
    pembahasan: r`Kelas modus 15–19 (frekuensi 16), tepi bawah $L = 14{,}5$, panjang kelas $p = 5$, $d_1 = 16 - 10 = 6$, $d_2 = 16 - 7 = 9$.

$$Mo = L + \frac{d_1}{d_1 + d_2} \times p = 14{,}5 + \frac{6}{15} \times 5 = 16{,}5$$

Modus Rp16.500,00.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    kode_stimulus: "SMA-MTK-P7-SAKU",
    kode_subdomain: "SMA-MTK-D5-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: r`Tentukan **Benar** atau **Salah** setiap pernyataan berikut!`,
    opsi_a: "Median data terletak pada kelas 15–19.",
    opsi_b: "Rata-rata uang saku (dihitung dengan titik tengah kelas) lebih dari Rp17.000,00.",
    opsi_c: "Banyak siswa yang uang sakunya kurang dari Rp15.000,00 adalah 14 orang.",
    kunci: "B,S,B",
    pembahasan: r`- Frekuensi kumulatif: 4, 14, 30, 37, 40. Data ke-20 dan ke-21 berada di kelas 15–19 → **Benar**.
- Titik tengah 7, 12, 17, 22, 27: $\bar{x} = \frac{28 + 120 + 272 + 154 + 81}{40} = \frac{655}{40} = 16{,}375$ → Rp16.375, tidak lebih dari Rp17.000 → **Salah**.
- Kelas 5–9 dan 10–14: $4 + 10 = 14$ → **Benar**.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    kode_stimulus: "SMA-MTK-P7-SAKU",
    kode_subdomain: "SMA-MTK-D5-S2",
    bentuk_soal: "pg",
    pertanyaan: r`Dari 40 siswa tersebut dipilih 2 siswa secara acak. Peluang terpilihnya dua siswa yang uang sakunya pada kelas 25–29 adalah ....`,
    opsi_a: r`$\frac{1}{260}$`,
    opsi_b: r`$\frac{1}{130}$`,
    opsi_c: r`$\frac{9}{1.600}$`,
    opsi_d: r`$\frac{3}{80}$`,
    opsi_e: r`$\frac{3}{40}$`,
    kunci: "A",
    pembahasan: r`$P = \frac{C(3, 2)}{C(40, 2)} = \frac{3}{780} = \frac{1}{260}$.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  // ---- Grup 4: menara ----
  {
    kode_stimulus: "SMA-MTK-P7-MENARA",
    kode_subdomain: "SMA-MTK-D4-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Tinggi menara pemancar tersebut adalah ....`,
    opsi_a: "20 m",
    opsi_b: r`$20\sqrt{3}$ m`,
    opsi_c: "40 m",
    opsi_d: r`$40\sqrt{3}$ m`,
    opsi_e: "60 m",
    kunci: "B",
    pembahasan: r`Misal $BC = x$ dan tinggi menara $h$.

- Dari B: $\tan 60° = \frac{h}{x} \Rightarrow h = x\sqrt{3}$.
- Dari A: $\tan 30° = \frac{h}{x + 40} \Rightarrow h = \frac{x + 40}{\sqrt{3}}$.

$x\sqrt{3} = \frac{x + 40}{\sqrt{3}} \Rightarrow 3x = x + 40 \Rightarrow x = 20$, sehingga $h = 20\sqrt{3} \approx 34{,}6$ m.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  {
    kode_stimulus: "SMA-MTK-P7-MENARA",
    kode_subdomain: "SMA-MTK-D4-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Jarak garis pandang dari titik B ke puncak menara adalah ....`,
    opsi_a: "20 m",
    opsi_b: r`$20\sqrt{3}$ m`,
    opsi_c: "40 m",
    opsi_d: r`$40\sqrt{3}$ m`,
    opsi_e: "80 m",
    kunci: "C",
    pembahasan: r`$\sin 60° = \frac{h}{BP} \Rightarrow BP = \frac{20\sqrt{3}}{\frac{1}{2}\sqrt{3}} = 40$ m.

Cara lain: segitiga APB sama kaki karena $\angle PAB = 30°$ dan $\angle APB = 60° - 30° = 30°$, sehingga $BP = AB = 40$ m.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    kode_stimulus: "SMA-MTK-P7-MENARA",
    kode_subdomain: "SMA-MTK-D4-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: r`Tentukan **Benar** atau **Salah** setiap pernyataan berikut!`,
    opsi_a: r`$\sin 60° = \cos 30°$`,
    opsi_b: r`$\tan 30° \times \tan 60° = 1$`,
    opsi_c: "Jika Rina berjalan 10 m lagi dari B mendekati menara, sudut elevasinya menjadi kurang dari 60°.",
    kunci: "B,B,S",
    pembahasan: r`- $\sin 60° = \cos 30° = \frac{1}{2}\sqrt{3}$ → **Benar**.
- $\frac{1}{\sqrt{3}} \times \sqrt{3} = 1$ → **Benar**.
- Semakin dekat ke menara, sudut elevasi semakin **besar** ($\tan \theta = \frac{20\sqrt{3}}{10} = 2\sqrt{3}$, $\theta \approx 73{,}9°$) → **Salah**.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  // ---- Soal tunggal ----
  {
    kode_subdomain: "SMA-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Hasil dari $\left(2\sqrt{3} + \sqrt{12}\right)\left(\sqrt{27} - \sqrt{3}\right)$ adalah ....`,
    opsi_a: "12",
    opsi_b: "18",
    opsi_c: "24",
    opsi_d: "36",
    opsi_e: r`$24\sqrt{3}$`,
    kunci: "C",
    pembahasan: r`$2\sqrt{3} + \sqrt{12} = 2\sqrt{3} + 2\sqrt{3} = 4\sqrt{3}$ dan $\sqrt{27} - \sqrt{3} = 3\sqrt{3} - \sqrt{3} = 2\sqrt{3}$.

Hasilnya $4\sqrt{3} \times 2\sqrt{3} = 8 \times 3 = 24$.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    kode_subdomain: "SMA-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Nilai $x$ yang memenuhi $2^{x+1} \cdot 4^{x} = 128$ adalah ....`,
    opsi_a: "1",
    opsi_b: "2",
    opsi_c: "3",
    opsi_d: "4",
    opsi_e: "6",
    kunci: "B",
    pembahasan: r`$2^{x+1} \cdot 2^{2x} = 2^{3x+1} = 2^7 \Rightarrow 3x + 1 = 7 \Rightarrow x = 2$.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    kode_subdomain: "SMA-MTK-D1-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: r`Pilihlah **semua** pernyataan yang benar!`,
    opsi_a: r`$\,{}^{2}\log 8 + {}^{2}\log 4 = 5$`,
    opsi_b: r`$\log 2 + \log 50 = 2$`,
    opsi_c: r`$\,{}^{3}\log 81 = 3$`,
    opsi_d: r`$\dfrac{{}^{2}\log 16}{{}^{2}\log 4} = 2$`,
    kunci: "A,B,D",
    pembahasan: r`- $3 + 2 = 5$ (benar).
- $\log (2 \times 50) = \log 100 = 2$ (benar).
- $\,{}^{3}\log 81 = 4$ karena $3^4 = 81$ (salah).
- $\frac{4}{2} = 2$ (benar).`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    kode_subdomain: "SMA-MTK-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Harga tiket masuk museum untuk 3 orang dewasa dan 2 pelajar adalah Rp95.000,00, sedangkan untuk 2 orang dewasa dan 4 pelajar adalah Rp90.000,00. Harga tiket 1 orang dewasa dan 1 pelajar adalah ....`,
    opsi_a: "Rp30.000,00",
    opsi_b: "Rp35.000,00",
    opsi_c: "Rp40.000,00",
    opsi_d: "Rp45.000,00",
    opsi_e: "Rp50.000,00",
    kunci: "B",
    pembahasan: r`$3d + 2p = 95.000$ dan $2d + 4p = 90.000$. Kalikan persamaan pertama dengan 2: $6d + 4p = 190.000$. Kurangkan: $4d = 100.000 \Rightarrow d = 25.000$, lalu $p = 10.000$.

$d + p = 35.000$.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    kode_subdomain: "SMA-MTK-D2-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: r`Sebuah toko kue membuat kue jenis A dan B. Satu loyang kue A membutuhkan 2 kg tepung dan 1 kg gula, sedangkan satu loyang kue B membutuhkan 1 kg tepung dan 1 kg gula. Tersedia 40 kg tepung dan 25 kg gula. Keuntungan per loyang kue A Rp30.000,00 dan kue B Rp20.000,00. Misalkan $x$ = banyak loyang kue A dan $y$ = banyak loyang kue B.

Pilihlah **semua** pernyataan yang benar!`,
    opsi_a: r`Kendala bahan gula dinyatakan dengan $x + y \le 25$.`,
    opsi_b: "Keuntungan maksimum yang dapat diperoleh adalah Rp650.000,00.",
    opsi_c: "Keuntungan maksimum dicapai saat toko membuat 20 loyang kue A saja.",
    opsi_d: r`Membuat 10 loyang kue A dan 15 loyang kue B memenuhi semua kendala.`,
    kunci: "A,B,D",
    pembahasan: r`Kendala: $2x + y \le 40$ (tepung), $x + y \le 25$ (gula), $x, y \ge 0$. Titik pojok: $(0, 25)$, $(15, 10)$, $(20, 0)$.

Nilai $30.000x + 20.000y$: $(0, 25) \to 500.000$; $(15, 10) \to 650.000$; $(20, 0) \to 600.000$. Maksimum Rp650.000 di $(15, 10)$, jadi pernyataan 3 salah.

$(10, 15)$: $2(10) + 15 = 35 \le 40$ dan $10 + 15 = 25 \le 25$ → memenuhi.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  {
    kode_subdomain: "SMA-MTK-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: r`Perhatikan grafik fungsi kuadrat berikut. Grafik memotong sumbu-$x$ di $x = -1$ dan $x = 3$, serta memotong sumbu-$y$ di $y = -3$. Rumus fungsi tersebut adalah ....`,
    opsi_a: r`$f(x) = x^2 - 2x - 3$`,
    opsi_b: r`$f(x) = x^2 + 2x - 3$`,
    opsi_c: r`$f(x) = -x^2 + 2x + 3$`,
    opsi_d: r`$f(x) = x^2 - 3x - 1$`,
    opsi_e: r`$f(x) = 2x^2 - 4x - 3$`,
    kunci: "A",
    gambar: "parabola",
    pembahasan: r`Akar-akarnya $-1$ dan $3$: $f(x) = a(x + 1)(x - 3)$. Titik $(0, -3)$: $a(1)(-3) = -3 \Rightarrow a = 1$.

$f(x) = (x + 1)(x - 3) = x^2 - 2x - 3$. Grafik terbuka ke atas, sesuai $a = 1 > 0$.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    kode_subdomain: "SMA-MTK-D2-S2",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: r`Diketahui $f(x) = 2x - 1$ dan $g(x) = x^2 + 1$. Tentukan **Benar** atau **Salah** setiap pernyataan berikut!`,
    opsi_a: r`$(f \circ g)(2) = 9$`,
    opsi_b: r`$(g \circ f)(x) = 4x^2 - 4x + 2$`,
    opsi_c: r`$f^{-1}(x) = \dfrac{x - 1}{2}$`,
    kunci: "B,B,S",
    pembahasan: r`- $g(2) = 5$, $f(5) = 9$ → **Benar**.
- $g(f(x)) = (2x - 1)^2 + 1 = 4x^2 - 4x + 2$ → **Benar**.
- $y = 2x - 1 \Rightarrow x = \frac{y + 1}{2}$, jadi $f^{-1}(x) = \frac{x + 1}{2}$ → **Salah**.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    kode_subdomain: "SMA-MTK-D2-S3",
    bentuk_soal: "pg",
    pertanyaan: r`Seorang atlet berlatih lari. Pada hari pertama ia berlari 3 km, dan setiap hari jaraknya bertambah 0,5 km dari hari sebelumnya. Jarak total yang ditempuh selama 20 hari latihan adalah ....`,
    opsi_a: "125 km",
    opsi_b: "145 km",
    opsi_c: "155 km",
    opsi_d: "165 km",
    opsi_e: "190 km",
    kunci: "C",
    pembahasan: r`Deret aritmetika dengan $a = 3$, $b = 0{,}5$, $n = 20$:

$$S_{20} = \frac{20}{2}\left(2 \cdot 3 + 19 \cdot 0{,}5\right) = 10(6 + 9{,}5) = 155 \text{ km}$$`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    kode_subdomain: "SMA-MTK-D2-S3",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: r`Bu Sari menabung Rp10.000.000,00 dengan bunga majemuk 5% per tahun (bunga ditambahkan ke tabungan setiap akhir tahun dan tidak diambil). Tentukan **Benar** atau **Salah** setiap pernyataan berikut!`,
    opsi_a: "Setelah 1 tahun, tabungan Bu Sari menjadi Rp10.500.000,00.",
    opsi_b: "Setelah 3 tahun, tabungan Bu Sari menjadi Rp11.576.250,00.",
    opsi_c: "Total bunga selama 3 tahun adalah Rp1.500.000,00.",
    kunci: "B,B,S",
    pembahasan: r`$M_n = 10.000.000 \times 1{,}05^n$.

- $M_1 = 10.500.000$ → **Benar**.
- $M_3 = 10.000.000 \times 1{,}157625 = 11.576.250$ → **Benar**.
- Bunga 3 tahun $= 1.576.250$; Rp1.500.000 adalah hasil bunga tunggal → **Salah**.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    kode_subdomain: "SMA-MTK-D2-S3",
    bentuk_soal: "pgk_mcma",
    pertanyaan: r`Sebuah bola dijatuhkan dari ketinggian 8 m. Setiap kali memantul, bola mencapai $\frac{3}{4}$ tinggi sebelumnya, terus-menerus hingga berhenti. Pilihlah **semua** pernyataan yang benar!`,
    opsi_a: "Tinggi pantulan kedua adalah 4,5 m.",
    opsi_b: "Panjang seluruh lintasan bola hingga berhenti adalah 56 m.",
    opsi_c: "Tinggi pantulan ketiga lebih dari 3,5 m.",
    opsi_d: r`Tinggi pantulan-pantulannya membentuk barisan geometri dengan rasio $\frac{3}{4}$.`,
    kunci: "A,B,D",
    pembahasan: r`Pantulan ke-$n$: $8\left(\frac{3}{4}\right)^n$. Pantulan ke-2: $8 \times \frac{9}{16} = 4{,}5$ m (benar); ke-3: $8 \times \frac{27}{64} = 3{,}375$ m (tidak lebih dari 3,5 m).

Lintasan $= 8 + 2 \times \frac{6}{1 - \frac{3}{4}} = 8 + 48 = 56$ m (benar; setiap pantulan naik dan turun, deret geometri tak hingga dengan suku pertama 6).`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  {
    kode_subdomain: "SMA-MTK-D3-S2",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: r`Diketahui titik $A(2, -3)$. Tentukan **Benar** atau **Salah** setiap pernyataan berikut!`,
    opsi_a: r`Bayangan A oleh pencerminan terhadap sumbu-$x$ adalah $(2, 3)$.`,
    opsi_b: r`Bayangan A oleh pencerminan terhadap garis $y = x$ adalah $(-3, 2)$.`,
    opsi_c: r`Bayangan A oleh pencerminan terhadap garis $y = x$ dilanjutkan translasi $\begin{pmatrix} -1 \\ 4 \end{pmatrix}$ adalah $(-2, 1)$.`,
    kunci: "B,B,S",
    pembahasan: r`- Cermin sumbu-$x$: $(x, y) \to (x, -y) = (2, 3)$ → **Benar**.
- Cermin $y = x$: $(x, y) \to (y, x) = (-3, 2)$ → **Benar**.
- Lalu translasi: $(-3 - 1, 2 + 4) = (-4, 6)$, bukan $(-2, 1)$ → **Salah**.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    kode_subdomain: "SMA-MTK-D3-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Limas segi empat beraturan T.ABCD memiliki panjang rusuk alas 12 cm dan panjang rusuk tegak 10 cm. Tinggi limas tersebut adalah ....`,
    opsi_a: r`$2\sqrt{7}$ cm`,
    opsi_b: r`$4\sqrt{2}$ cm`,
    opsi_c: "8 cm",
    opsi_d: r`$2\sqrt{11}$ cm`,
    opsi_e: r`$6\sqrt{2}$ cm`,
    kunci: "A",
    pembahasan: r`Jarak titik potong diagonal alas ke titik sudut $= \frac{1}{2} \times 12\sqrt{2} = 6\sqrt{2}$ cm.

Tinggi $= \sqrt{10^2 - (6\sqrt{2})^2} = \sqrt{100 - 72} = \sqrt{28} = 2\sqrt{7}$ cm.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
];

export default {
  title: "TKA SMA Matematika — Paket 7",
  description: "25 soal: bilangan real, persamaan & program linear, fungsi, barisan & deret, geometri, trigonometri, statistik, dan peluang, dengan grafik dan gambar.",
  jenjang: "SMA",
  subjectCode: "SMA-MTK",
  durationMinutes: 70,
  isPremium: true,
  isFullSimulation: true,
  createdByEmail: "kpbgalimka@gmail.com",
  stimuli,
  rows,
  images: {
    kolam: { title: "Penampang kolam renang", svg: imgKolam() },
    histogram: { title: "Histogram uang saku harian", svg: imgHistogram() },
    menara: { title: "Sudut elevasi menara pemancar", svg: imgMenara() },
    parabola: { title: "Grafik fungsi kuadrat", svg: imgParabola() },
  },
};
