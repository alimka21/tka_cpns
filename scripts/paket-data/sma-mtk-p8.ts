// TKA SMA Matematika — Paket 8 (soal baru, ditulis untuk Pakar TKA). Tema: kebakaran hutan dan lahan.
// Acuan: Kerangka Asesmen SMA-MTK (10 subdomain) + pola Paket 1 & 3 (sebaran subdomain, bentuk, level).
// 25 soal: 15 PG, 4 MCMA, 6 Kategori; 4 grup stimulus (3 soal); 4 gambar baru (SVG).
// Sebaran: D1-S1 3 · D2-S1 2 · D2-S2 3 · D2-S3 3 · D3-S1 3 · D3-S2 1 · D3-S3 3 · D4-S1 2 · D5-S1 3 · D5-S2 2.
// Kesulitan 5 mudah / 12 sedang / 8 sulit; level 4 L1 / 11 L2 / 10 L3. Angka konteks = ilustrasi.
const r = String.raw;
const FONT = `font-family="Arial, Helvetica, sans-serif"`;
const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" ${FONT}><rect width="${w}" height="${h}" fill="#fff"/>${body}</svg>`;
const text = (x: number, y: number, t: string, o: { size?: number; anchor?: string; weight?: string; fill?: string; italic?: boolean } = {}) =>
  `<text x="${x}" y="${y}" font-size="${o.size ?? 18}" text-anchor="${o.anchor ?? "middle"}" font-weight="${o.weight ?? "normal"}" fill="${o.fill ?? "#111"}"${o.italic ? ` font-style="italic"` : ""}>${t}</text>`;
const line = (x1: number, y1: number, x2: number, y2: number, o: { stroke?: string; w?: number; dash?: boolean } = {}) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.stroke ?? "#111"}" stroke-width="${o.w ?? 2}"${o.dash ? ` stroke-dasharray="6 5"` : ""}/>`;
const dot = (x: number, y: number, rr = 5, fill = "#111") => `<circle cx="${x}" cy="${y}" r="${rr}" fill="${fill}"/>`;
const flame = (x: number, y: number) =>
  `<path d="M${x},${y} c-14,0 -18,-14 -10,-26 c2,8 6,10 8,8 c-4,-10 2,-22 10,-28 c-2,12 12,18 12,32 c0,8 -6,14 -20,14 z" fill="#f97316" stroke="#c2410c" stroke-width="1.5"/>`;

// ---------- Gambar ----------

// Menara pantau: tinggi mata 45 m; sudut depresi 45° ke P dan 30° ke Q (OP = 45 m, OQ = 45√3 m).
function imgMenara() {
  const gy = 340, k = 5.2, x0 = 90; // 1 m = 5,2 px
  const H = 45 * k, P = x0 + 45 * k, Q = x0 + 45 * Math.sqrt(3) * k, ey = gy - H;
  let s = `<rect x="0" y="${gy}" width="700" height="50" fill="#fef3c7"/>`;
  s += `<path d="M${x0 - 16},${gy} L${x0 - 6},${ey + 10} L${x0 + 6},${ey + 10} L${x0 + 16},${gy} z" fill="#e5e7eb" stroke="#374151" stroke-width="2"/>`;
  for (let i = 1; i < 6; i++) { const y = gy - ((H - 10) * i) / 6; s += line(x0 - 15 + (i * 9) / 6, y, x0 + 15 - (i * 9) / 6, y, { w: 1.5, stroke: "#374151" }); }
  s += `<rect x="${x0 - 22}" y="${ey - 4}" width="44" height="14" fill="#9ca3af" stroke="#374151" stroke-width="2"/>`;
  s += dot(x0, ey, 6, "#1d4ed8") + text(x0 - 30, ey - 12, "mata petugas", { size: 14, anchor: "start" });
  s += line(x0, ey, 640, ey, { dash: true, w: 1.5, stroke: "#6b7280" }) + text(640, ey - 8, "garis mendatar", { size: 13, anchor: "end", fill: "#6b7280" });
  s += line(x0, ey, P, gy, { dash: true }) + line(x0, ey, Q, gy, { dash: true });
  const arc = (rad: number, deg: number) => { const a = (deg * Math.PI) / 180; return `<path d="M${x0 + rad},${ey} A${rad},${rad} 0 0 1 ${x0 + rad * Math.cos(a)},${ey + rad * Math.sin(a)}" fill="none" stroke="#2563eb" stroke-width="2"/>`; };
  s += arc(56, 30) + text(x0 + 64, ey + 22, "30°", { weight: "bold", fill: "#2563eb", anchor: "start", size: 16 });
  s += arc(120, 45) + text(x0 + 70, ey + 104, "45°", { weight: "bold", fill: "#2563eb", anchor: "end", size: 16 });
  s += flame(P, gy) + flame(Q, gy);
  s += text(x0, gy + 28, "O", { weight: "bold" }) + text(P, gy + 28, "P", { weight: "bold" }) + text(Q, gy + 28, "Q", { weight: "bold" });
  s += line(x0 - 40, ey, x0 - 40, gy, { w: 1.5 }) + line(x0 - 48, ey, x0 - 32, ey, { w: 1.5 }) + line(x0 - 48, gy, x0 - 32, gy, { w: 1.5 });
  s += text(x0 - 48, (ey + gy) / 2 + 6, "45 m", { weight: "bold", anchor: "end" });
  return svg(700, 390, s);
}

// Embung berbentuk balok 20 m × 15 m × 3 m.
function imgEmbung() {
  const A = [110, 300], B = [470, 300], dx = 150, dy = -100, h = 90;
  const p = (pt: number[], ox = 0, oy = 0) => `${pt[0] + ox},${pt[1] + oy}`;
  let s = "";
  s += `<polygon points="${p(A, 0, -h)} ${p(B, 0, -h)} ${p(B, dx, dy - h)} ${p(A, dx, dy - h)}" fill="#bae6fd" stroke="#0369a1" stroke-width="2"/>`;
  s += `<polygon points="${p(A, 0, -h)} ${p(B, 0, -h)} ${p(B)} ${p(A)}" fill="#7dd3fc" stroke="#0369a1" stroke-width="2.5"/>`;
  s += `<polygon points="${p(B, 0, -h)} ${p(B, dx, dy - h)} ${p(B, dx, dy)} ${p(B)}" fill="#38bdf8" stroke="#0369a1" stroke-width="2.5"/>`;
  s += line(A[0] + dx, A[1] + dy, B[0] + dx, B[1] + dy, { dash: true, w: 1.5, stroke: "#0369a1" }) + line(A[0], A[1], A[0] + dx, A[1] + dy, { dash: true, w: 1.5, stroke: "#0369a1" }) + line(A[0] + dx, A[1] + dy - h, A[0] + dx, A[1] + dy, { dash: true, w: 1.5, stroke: "#0369a1" });
  s += text((A[0] + B[0]) / 2, A[1] + 30, "20 m", { weight: "bold" });
  s += text(B[0] + dx / 2 + 26, B[1] + dy / 2 + 10, "15 m", { weight: "bold", anchor: "start" });
  s += text(A[0] - 12, A[1] - h / 2 + 6, "3 m", { weight: "bold", anchor: "end" });
  return svg(720, 350, s);
}

// Tongkat 1,5 m (bayangan 2 m) dan pohon kering (tinggi t, bayangan 12 m).
function imgPohon() {
  const gy = 320, k = 24; // 1 m = 24 px
  const tx = 130, tH = 9 * k, tS = 12 * k, sx = 470, sH = 1.5 * k, sS = 2 * k;
  let s = `<rect x="0" y="${gy}" width="640" height="50" fill="#ecfccb"/>`;
  s += `<rect x="${tx - 7}" y="${gy - tH}" width="14" height="${tH}" fill="#78350f"/>`;
  s += `<path d="M${tx},${gy - tH + 40} l-38,-34 M${tx},${gy - tH + 80} l34,-30 M${tx},${gy - tH + 120} l-30,-24" stroke="#78350f" stroke-width="6" stroke-linecap="round"/>`;
  s += `<rect x="${tx}" y="${gy - 6}" width="${tS}" height="12" fill="#4b5563" opacity="0.55"/>`;
  s += line(tx, gy - tH, tx + tS, gy, { dash: true, stroke: "#d97706" });
  s += `<rect x="${sx - 3}" y="${gy - sH}" width="6" height="${sH}" fill="#111"/>`;
  s += `<rect x="${sx}" y="${gy - 5}" width="${sS}" height="10" fill="#4b5563" opacity="0.55"/>`;
  s += line(sx, gy - sH, sx + sS, gy, { dash: true, stroke: "#d97706" });
  s += line(tx - 60, gy - tH, tx - 60, gy, { w: 1.5 }) + line(tx - 68, gy - tH, tx - 52, gy - tH, { w: 1.5 }) + line(tx - 68, gy, tx - 52, gy, { w: 1.5 });
  s += text(tx - 72, gy - tH / 2 + 8, "t", { italic: true, weight: "bold", size: 22, anchor: "end" });
  s += text(tx + tS / 2, gy + 34, "bayangan pohon 12 m", { weight: "bold", size: 16 });
  s += text(sx - 10, gy - sH / 2 + 6, "1,5 m", { size: 15, anchor: "end", weight: "bold" });
  s += text(sx + sS / 2, gy + 34, "2 m", { weight: "bold", size: 16 });
  s += text(tx + 190, gy - tH + 60, "sinar matahari", { size: 14, fill: "#d97706", italic: true, anchor: "start" });
  return svg(640, 370, s);
}

// Kubus ABCD.EFGH rusuk 6 cm dengan bidang BDE diarsir.
function imgKubus() {
  const P: Record<string, [number, number]> = { A: [120, 330], B: [320, 330], C: [410, 260], D: [210, 260], E: [120, 130], F: [320, 130], G: [410, 60], H: [210, 60] };
  const L = (a: string, b: string, dash = false) => line(P[a][0], P[a][1], P[b][0], P[b][1], { dash, w: 2 });
  let s = `<polygon points="${["B", "D", "E"].map((k) => P[k].join(",")).join(" ")}" fill="#fca5a5" fill-opacity="0.55" stroke="#dc2626" stroke-width="2"/>`;
  s += L("A", "B") + L("B", "C") + L("B", "F") + L("A", "E") + L("E", "F") + L("F", "G") + L("C", "G") + L("E", "H") + L("H", "G");
  s += L("A", "D", true) + L("D", "C", true) + L("D", "H", true);
  const lab: Record<string, [number, number]> = { A: [-14, 20], B: [10, 20], C: [14, 8], D: [10, 24], E: [-16, -6], F: [16, 22], G: [12, -6], H: [-14, -8] };
  for (const k of Object.keys(P)) s += text(P[k][0] + lab[k][0], P[k][1] + lab[k][1], k, { weight: "bold" });
  s += text(220, 360, "6 cm", { weight: "bold", size: 16 });
  return svg(500, 380, s);
}

// ---------- Stimulus ----------
const stimuli = [
  {
    code: "SMA-MTK-P8-JALAR",
    title: "Penjalaran Api di Lahan Gambut",
    content: r`Api di lahan gambut sulit dipadamkan karena bisa menjalar di bawah permukaan tanah. Tim pemantau mencatat luas lahan gambut yang **baru terbakar** setiap hari di sebuah lokasi yang belum berhasil dipadamkan.

| Hari ke- | 1 | 2 | 3 |
|---|---|---|---|
| Luas lahan yang baru terbakar (hektare) | 4 | 6 | 9 |

Luas lahan yang baru terbakar setiap hari membentuk barisan geometri dan diperkirakan polanya berlanjut selama api belum padam.`,
  },
  {
    code: "SMA-MTK-P8-EMBUNG",
    title: "Embung Persediaan Air Pemadaman",
    content: r`Untuk persediaan air pemadaman, warga desa di tepi hutan membuat embung (kolam penampung air) berbentuk balok dengan panjang 20 m, lebar 15 m, dan kedalaman 3 m, seperti gambar berikut. Air embung diangkut helikopter *water bombing* menggunakan ember gantung (*bucket*) berkapasitas 4.000 liter.`,
    gambar: "embung",
  },
  {
    code: "SMA-MTK-P8-MENARA",
    title: "Menara Pantau Api",
    content: r`Seorang petugas berada di puncak menara pantau api. Tinggi mata petugas dari permukaan tanah 45 m. Ia melihat dua titik api, P dan Q, yang segaris dengan kaki menara O pada tanah datar. Sudut depresi dari mata petugas ke titik P adalah 45° dan ke titik Q adalah 30°.`,
    gambar: "menara",
  },
  {
    code: "SMA-MTK-P8-HOTSPOT",
    title: "Verifikasi Titik Panas",
    content: r`Pada musim kemarau, satelit memantau wilayah sebuah provinsi di Kalimantan dan mencatat **titik panas** (*hotspot*), yaitu lokasi dengan suhu permukaan jauh lebih tinggi dari sekitarnya. Tidak semua titik panas berarti kebakaran hutan. Karena itu, tim Manggala Agni memeriksa langsung 200 titik panas di lapangan. Hasilnya tercatat pada tabel berikut.

| Jenis lahan | Terbukti kebakaran | Bukan kebakaran | Jumlah |
|---|---|---|---|
| Lahan gambut | 84 | 36 | 120 |
| Lahan mineral | 32 | 48 | 80 |
| **Jumlah** | **116** | **84** | **200** |`,
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
  // ---- Bilangan ----
  {
    kode_subdomain: "SMA-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Bentuk sederhana dari $\dfrac{8^{\frac{2}{3}} \times 27^{\frac{1}{3}}}{16^{\frac{3}{4}}}$ adalah ....`,
    opsi_a: r`$\dfrac{3}{2}$`,
    opsi_b: "2",
    opsi_c: "3",
    opsi_d: r`$\dfrac{9}{2}$`,
    opsi_e: "6",
    kunci: "A",
    pembahasan: r`- $8^{\frac{2}{3}} = (2^3)^{\frac{2}{3}} = 2^2 = 4$
- $27^{\frac{1}{3}} = (3^3)^{\frac{1}{3}} = 3$
- $16^{\frac{3}{4}} = (2^4)^{\frac{3}{4}} = 2^3 = 8$

Jadi $\dfrac{4 \times 3}{8} = \dfrac{12}{8} = \dfrac{3}{2}$.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    kode_subdomain: "SMA-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Pada suatu musim kemarau, luas lahan gambut yang terbakar di sebuah wilayah diperkirakan $1{,}6 \times 10^{5}$ hektare. Setiap hektare lahan gambut yang terbakar melepaskan rata-rata $7{,}5 \times 10^{2}$ ton karbon dioksida (CO₂). Perkiraan total emisi CO₂ dari kebakaran tersebut adalah ....`,
    opsi_a: r`$2{,}13 \times 10^{2}$ ton`,
    opsi_b: r`$1{,}2 \times 10^{8}$ ton`,
    opsi_c: r`$9{,}1 \times 10^{7}$ ton`,
    opsi_d: r`$1{,}2 \times 10^{9}$ ton`,
    opsi_e: r`$1{,}2 \times 10^{7}$ ton`,
    kunci: "B",
    pembahasan: r`Total emisi $= (1{,}6 \times 10^{5}) \times (7{,}5 \times 10^{2})$.

- Kalikan bilangan pokoknya: $1{,}6 \times 7{,}5 = 12$.
- Jumlahkan pangkatnya: $10^{5} \times 10^{2} = 10^{7}$.

Hasilnya $12 \times 10^{7} = 1{,}2 \times 10^{8}$ ton.

Pengecoh: $2{,}13 \times 10^{2}$ didapat jika keduanya dibagi; $9{,}1 \times 10^{7}$ jika bilangan pokoknya dijumlahkan.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    kode_subdomain: "SMA-MTK-D1-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: r`Tentukan **Benar** atau **Salah** setiap pernyataan berikut!`,
    opsi_a: r`$(\sqrt{5} + \sqrt{3})(\sqrt{5} - \sqrt{3}) = 2$`,
    opsi_b: r`$\sqrt{8} + \sqrt{18} = \sqrt{26}$`,
    opsi_c: r`$\dfrac{2^{-3} \times 4^{2}}{8^{-1}} = 16$`,
    kunci: "B,S,B",
    pembahasan: r`- $(\sqrt{5})^2 - (\sqrt{3})^2 = 5 - 3 = 2$ → **Benar**.
- $\sqrt{8} + \sqrt{18} = 2\sqrt{2} + 3\sqrt{2} = 5\sqrt{2} = \sqrt{50}$, bukan $\sqrt{26}$ (akar tidak boleh dijumlahkan langsung) → **Salah**.
- $2^{-3} \times 4^{2} = 2^{-3} \times 2^{4} = 2$, lalu $2 : 8^{-1} = 2 \times 8 = 16$ → **Benar**.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L3",
  },
  // ---- Persamaan & pertidaksamaan linear ----
  {
    kode_subdomain: "SMA-MTK-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Untuk mencegah api merambat, petugas membuat sekat bakar, yaitu jalur yang dibersihkan dari bahan mudah terbakar. Dalam sehari, 3 regu Manggala Agni dan 2 regu Masyarakat Peduli Api (MPA) dapat membuat sekat bakar sepanjang 190 m. Adapun 2 regu Manggala Agni dan 4 regu MPA dapat membuat 220 m. Setiap regu sejenis bekerja sama cepat.

Jika 1 regu Manggala Agni dan 1 regu MPA bekerja selama sehari, panjang sekat bakar yang dapat dibuat adalah ....`,
    opsi_a: "55 m",
    opsi_b: "60 m",
    opsi_c: "65 m",
    opsi_d: "70 m",
    opsi_e: "75 m",
    kunci: "E",
    pembahasan: r`Misalkan $a$ = panjang sekat per regu Manggala Agni dan $b$ = per regu MPA (meter per hari).

$$3a + 2b = 190 \quad \text{dan} \quad 2a + 4b = 220 \;(\Leftrightarrow a + 2b = 110)$$

Kurangkan $(3a + 2b) - (a + 2b)$: $2a = 80$, jadi $a = 40$. Lalu $b = \frac{110 - 40}{2} = 35$.

Panjang sekat $a + b = 40 + 35 = 75$ m.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    kode_subdomain: "SMA-MTK-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Posko bantuan mengirim kotak masker dan kotak obat ke desa yang terdampak kabut asap menggunakan satu mobil. Satu kotak masker beratnya 5 kg dan dapat melayani 50 warga. Satu kotak obat beratnya 10 kg dan dapat melayani 80 warga. Mobil dapat membawa paling banyak 40 kotak dengan muatan paling berat 300 kg.

Banyak warga paling banyak yang dapat dilayani dalam sekali pengiriman adalah ....`,
    opsi_a: "2.400 warga",
    opsi_b: "2.600 warga",
    opsi_c: "2.800 warga",
    opsi_d: "3.000 warga",
    opsi_e: "3.200 warga",
    kunci: "B",
    pembahasan: r`Misalkan $x$ = kotak masker, $y$ = kotak obat. Kendala:

- $x + y \le 40$
- $5x + 10y \le 300 \Leftrightarrow x + 2y \le 60$
- $x \ge 0,\ y \ge 0$

Fungsi tujuan $f(x, y) = 50x + 80y$. Titik pojok daerah penyelesaian:

| Titik pojok | $50x + 80y$ |
|---|---|
| $(40, 0)$ | 2.000 |
| $(20, 20)$ (perpotongan kedua garis) | 2.600 |
| $(0, 30)$ | 2.400 |

Maksimum 2.600 warga (20 kotak masker dan 20 kotak obat). Pilihan 3.200 salah karena 40 kotak obat beratnya 400 kg, melebihi batas muatan.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  // ---- Fungsi ----
  {
    kode_subdomain: "SMA-MTK-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: r`Saat kabut asap, jarak pandang di sebuah bandara terus menurun. Jarak pandang $V$ (dalam km) pada $t$ jam setelah pukul 06.00 dimodelkan dengan $V(t) = 10 - 0{,}8t$ untuk $0 \le t \le 12$. Pesawat tidak diizinkan mendarat jika jarak pandang kurang dari 2 km.

Pesawat mulai tidak diizinkan mendarat setelah pukul ....`,
    opsi_a: "14.00",
    opsi_b: "15.00",
    opsi_c: "15.30",
    opsi_d: "16.00",
    opsi_e: "17.00",
    kunci: "D",
    pembahasan: r`$V(t) < 2 \Rightarrow 10 - 0{,}8t < 2 \Rightarrow 0{,}8t > 8 \Rightarrow t > 10$.

Jadi setelah 10 jam dari pukul 06.00, yaitu setelah pukul **16.00**.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    kode_subdomain: "SMA-MTK-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: r`Luas lahan yang terbakar (dalam hektare) $t$ hari setelah api pertama terdeteksi dimodelkan dengan $A(t) = 3t + 2$. Emisi asap (dalam ton) dari lahan terbakar seluas $A$ hektare dimodelkan dengan $E(A) = 50A$.

Fungsi $(E \circ A)(t)$ yang menyatakan emisi asap setelah $t$ hari adalah ....`,
    opsi_a: r`$(E \circ A)(t) = 150t + 2$`,
    opsi_b: r`$(E \circ A)(t) = 53t + 52$`,
    opsi_c: r`$(E \circ A)(t) = 3t + 52$`,
    opsi_d: r`$(E \circ A)(t) = 150t + 52$`,
    opsi_e: r`$(E \circ A)(t) = 150t + 100$`,
    kunci: "E",
    pembahasan: r`$(E \circ A)(t) = E(A(t)) = 50(3t + 2) = 150t + 100$.

Pengecoh $150t + 2$ muncul jika hanya suku $3t$ yang dikalikan 50. Sebagai cek: setelah 4 hari, $A(4) = 14$ hektare dan emisinya $50 \times 14 = 700$ ton, sama dengan $150(4) + 100$.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    kode_subdomain: "SMA-MTK-D2-S2",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: r`Diketahui fungsi $f(x) = \dfrac{2x + 1}{x - 3}$ untuk $x \ne 3$. Tentukan **Benar** atau **Salah** setiap pernyataan berikut!`,
    opsi_a: r`Daerah hasil $f$ adalah semua bilangan real kecuali 3.`,
    opsi_b: r`Fungsi invers $f$ adalah $f^{-1}(x) = \dfrac{3x + 1}{x - 2}$ untuk $x \ne 2$.`,
    opsi_c: r`$f^{-1}(5) = 4$`,
    kunci: "S,B,S",
    pembahasan: r`Cari invers: $y = \dfrac{2x + 1}{x - 3} \Rightarrow xy - 3y = 2x + 1 \Rightarrow x(y - 2) = 3y + 1 \Rightarrow x = \dfrac{3y + 1}{y - 2}$.

- Invers tidak terdefinisi untuk $y = 2$, artinya $f$ tidak pernah bernilai 2. Daerah hasil $f$ adalah semua bilangan real **kecuali 2**, bukan kecuali 3 → **Salah**.
- $f^{-1}(x) = \dfrac{3x + 1}{x - 2}$, $x \ne 2$ → **Benar**.
- $f^{-1}(5) = \dfrac{15 + 1}{3} = \dfrac{16}{3}$, bukan 4 → **Salah**.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  // ---- Grup 1: penjalaran api (barisan) ----
  {
    kode_stimulus: "SMA-MTK-P8-JALAR",
    kode_subdomain: "SMA-MTK-D2-S3",
    bentuk_soal: "pg",
    pertanyaan: r`Luas lahan yang baru terbakar pada hari ke-5 adalah ....`,
    opsi_a: "13,5 hektare",
    opsi_b: "20,25 hektare",
    opsi_c: "27 hektare",
    opsi_d: "30,375 hektare",
    opsi_e: "40,5 hektare",
    kunci: "B",
    pembahasan: r`Suku pertama $a = 4$, rasio $r = \frac{6}{4} = \frac{3}{2}$.

$U_5 = a r^{4} = 4 \times \left(\frac{3}{2}\right)^{4} = 4 \times \frac{81}{16} = 20{,}25$ hektare.

(13,5 hektare adalah hari ke-4 dan 30,375 hektare adalah hari ke-6.)`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    kode_stimulus: "SMA-MTK-P8-JALAR",
    kode_subdomain: "SMA-MTK-D2-S3",
    bentuk_soal: "pgk_mcma",
    pertanyaan: r`Pilihlah **semua** pernyataan yang benar!`,
    opsi_a: r`Rumus luas lahan yang baru terbakar pada hari ke-$n$ adalah $U_n = 4 \left(\frac{3}{2}\right)^{n}$.`,
    opsi_b: r`Rasio barisan tersebut adalah $\frac{3}{2}$.`,
    opsi_c: "Luas lahan yang baru terbakar pada hari ke-4 dua kali luas pada hari ke-2.",
    opsi_d: "Total luas lahan yang terbakar selama 4 hari pertama adalah 32,5 hektare.",
    kunci: "B,D",
    pembahasan: r`- Rumus yang benar $U_n = 4\left(\frac{3}{2}\right)^{n-1}$; dengan pangkat $n$, hari ke-1 bernilai 6, bukan 4 → salah.
- $r = \frac{6}{4} = \frac{9}{6} = \frac{3}{2}$ → benar.
- $U_4 = 13{,}5$ dan $U_2 = 6$; $\frac{13{,}5}{6} = 2{,}25$, bukan 2 → salah.
- $S_4 = 4 + 6 + 9 + 13{,}5 = 32{,}5$ hektare, atau $S_4 = \frac{4\left(\left(\frac{3}{2}\right)^4 - 1\right)}{\frac{3}{2} - 1} = 8 \times \frac{65}{16} = 32{,}5$ → benar.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    kode_stimulus: "SMA-MTK-P8-JALAR",
    kode_subdomain: "SMA-MTK-D2-S3",
    bentuk_soal: "pg",
    pertanyaan: r`Petugas menargetkan api sudah padam sebelum luas lahan yang baru terbakar dalam satu hari melebihi 30 hektare. Jika pola tersebut berlanjut, luas lahan yang baru terbakar pertama kali melebihi 30 hektare pada hari ke- ....`,
    opsi_a: "4",
    opsi_b: "5",
    opsi_c: "6",
    opsi_d: "7",
    opsi_e: "8",
    kunci: "C",
    pembahasan: r`Cari $n$ terkecil dengan $4\left(\frac{3}{2}\right)^{n-1} > 30 \Leftrightarrow \left(\frac{3}{2}\right)^{n-1} > 7{,}5$.

- $\left(\frac{3}{2}\right)^{4} = 5{,}0625$ → $U_5 = 20{,}25$ (belum melebihi 30)
- $\left(\frac{3}{2}\right)^{5} = 7{,}59375$ → $U_6 = 30{,}375$ (melebihi 30)

Jadi pertama kali melebihi 30 hektare pada **hari ke-6**. Pengecoh: menjawab hari ke-5 karena memakai **total** luas ($S_5 = 52{,}75$ sudah melebihi 30 sejak hari ke-4), padahal yang ditanyakan luas yang baru terbakar dalam satu hari.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  // ---- Objek geometri ----
  {
    kode_subdomain: "SMA-MTK-D3-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: r`Sebelum membuat sekat bakar, petugas perlu mengetahui tinggi pohon kering yang berisiko tumbang ke jalur sekat. Pada saat yang sama, sebuah tongkat tegak setinggi 1,5 m memiliki bayangan 2 m, sedangkan bayangan pohon kering 12 m, seperti gambar berikut.

Pilihlah **semua** pernyataan yang benar!`,
    gambar: "pohon",
    opsi_a: "Tinggi pohon kering adalah 9 m.",
    opsi_b: "Segitiga yang dibentuk tongkat dan bayangannya sebangun dengan segitiga yang dibentuk pohon dan bayangannya.",
    opsi_c: "Jarak dari ujung bayangan pohon ke puncak pohon adalah 13 m.",
    opsi_d: "Pada saat yang sama, pohon lain yang bayangannya 16 m memiliki tinggi 12 m.",
    kunci: "A,B,D",
    pembahasan: r`Sinar matahari sejajar, sehingga kedua segitiga siku-siku memiliki sudut yang sama besar → **sebangun** (benar).

- $\dfrac{t}{12} = \dfrac{1{,}5}{2} \Rightarrow t = 9$ m → benar.
- Jarak ujung bayangan ke puncak pohon $= \sqrt{9^2 + 12^2} = \sqrt{225} = 15$ m, bukan 13 m → salah.
- $\dfrac{t}{16} = \dfrac{1{,}5}{2} \Rightarrow t = 12$ m → benar.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    kode_subdomain: "SMA-MTK-D3-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Perhatikan kubus ABCD.EFGH dengan panjang rusuk 6 cm berikut. Jarak titik A ke bidang BDE adalah ....`,
    gambar: "kubus",
    opsi_a: r`$\sqrt{2}$ cm`,
    opsi_b: r`$\sqrt{3}$ cm`,
    opsi_c: r`$2\sqrt{2}$ cm`,
    opsi_d: r`$2\sqrt{3}$ cm`,
    opsi_e: r`$3\sqrt{2}$ cm`,
    kunci: "D",
    pembahasan: r`Gunakan volume limas A.BDE dengan dua cara.

- Alas segitiga ABD dan tinggi AE: $V = \frac{1}{3} \times \left(\frac{1}{2} \times 6 \times 6\right) \times 6 = 36\text{ cm}^3$.
- Segitiga BDE sama sisi dengan sisi diagonal bidang $6\sqrt{2}$: luasnya $\frac{\sqrt{3}}{4}(6\sqrt{2})^2 = 18\sqrt{3}\text{ cm}^2$.

Jika $d$ = jarak A ke bidang BDE: $\frac{1}{3} \times 18\sqrt{3} \times d = 36 \Rightarrow d = \frac{6}{\sqrt{3}} = 2\sqrt{3}$ cm.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  // ---- Transformasi geometri ----
  {
    kode_subdomain: "SMA-MTK-D3-S2",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: r`Pada peta pemantauan berkoordinat, sebuah drone pemadam berada di titik $D(2, -1)$. Tentukan **Benar** atau **Salah** setiap pernyataan berikut!`,
    opsi_a: r`Bayangan D oleh pencerminan terhadap garis $y = x$ adalah $(1, -2)$.`,
    opsi_b: r`Bayangan D oleh rotasi $90^\circ$ berlawanan arah jarum jam dengan pusat $O(0, 0)$ adalah $(1, 2)$.`,
    opsi_c: r`Bayangan D oleh pencerminan terhadap sumbu-$y$ dilanjutkan translasi $\begin{pmatrix} 1 \\ 4 \end{pmatrix}$ adalah $(-1, 3)$.`,
    kunci: "S,B,B",
    pembahasan: r`- Cermin $y = x$: $(x, y) \to (y, x) = (-1, 2)$, bukan $(1, -2)$ → **Salah**.
- Rotasi $90^\circ$ berlawanan jarum jam: $(x, y) \to (-y, x) = (1, 2)$ → **Benar**.
- Cermin sumbu-$y$: $(x, y) \to (-x, y) = (-2, -1)$; lalu translasi: $(-2 + 1, -1 + 4) = (-1, 3)$ → **Benar**.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  // ---- Grup 2: embung (pengukuran) ----
  {
    kode_stimulus: "SMA-MTK-P8-EMBUNG",
    kode_subdomain: "SMA-MTK-D3-S3",
    bentuk_soal: "pg",
    pertanyaan: r`Embung terisi air 80% dari volumenya. Banyak *bucket* penuh paling banyak yang dapat diambil dari embung tersebut adalah ....`,
    opsi_a: "180 kali",
    opsi_b: "225 kali",
    opsi_c: "240 kali",
    opsi_d: "300 kali",
    opsi_e: "720 kali",
    kunci: "A",
    pembahasan: r`Volume embung $= 20 \times 15 \times 3 = 900\text{ m}^3$. Air yang tersedia $= 80\% \times 900 = 720\text{ m}^3 = 720.000$ liter.

Banyak bucket $= \dfrac{720.000}{4.000} = 180$ kali.

(225 kali jika embung penuh; 720 jika lupa mengubah m³ ke liter dengan benar.)`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    kode_stimulus: "SMA-MTK-P8-EMBUNG",
    kode_subdomain: "SMA-MTK-D3-S3",
    bentuk_soal: "pgk_kategori",
    kategori: "Ya/Tidak",
    pertanyaan: r`Dasar dan keempat dinding embung akan dilapisi terpal (geomembran) agar air tidak meresap ke tanah. Tersedia terpal seluas 500 m². Tentukan **Ya** atau **Tidak** untuk setiap pernyataan berikut!`,
    opsi_a: "Luas dasar embung adalah 300 m².",
    opsi_b: "Terpal yang tersedia cukup untuk melapisi dasar dan seluruh dinding embung.",
    opsi_c: "Luas dua dinding yang berukuran 20 m × 3 m adalah 120 m².",
    kunci: "Y,T,Y",
    pembahasan: r`- Dasar $= 20 \times 15 = 300\text{ m}^2$ → **Ya**.
- Dinding $= 2(20 \times 3) + 2(15 \times 3) = 120 + 90 = 210\text{ m}^2$. Total $300 + 210 = 510\text{ m}^2 > 500\text{ m}^2$, jadi terpal kurang $10\text{ m}^2$ → **Tidak**.
- $2 \times (20 \times 3) = 120\text{ m}^2$ → **Ya**.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    kode_stimulus: "SMA-MTK-P8-EMBUNG",
    kode_subdomain: "SMA-MTK-D3-S3",
    bentuk_soal: "pgk_mcma",
    pertanyaan: r`Embung yang kosong diisi menggunakan pompa air dengan debit 5 liter per detik. Pilihlah **semua** pernyataan yang benar!`,
    opsi_a: "Setelah embung penuh, pengambilan 10 bucket penuh menurunkan permukaan air lebih dari 15 cm.",
    opsi_b: "Embung penuh setelah dipompa selama 50 jam.",
    opsi_c: "Setelah dipompa selama 20 jam, tinggi air dalam embung 1,2 m.",
    opsi_d: "Jika debit pompa dinaikkan menjadi 10 liter per detik, embung penuh dalam 25 jam.",
    kunci: "B,C,D",
    pembahasan: r`Debit $5$ L/detik $= 5 \times 3.600 = 18.000$ L/jam $= 18\text{ m}^3$/jam. Luas dasar $= 300\text{ m}^2$.

- 10 bucket $= 40.000$ L $= 40\text{ m}^3$; penurunan $= \frac{40}{300} \approx 0{,}133$ m $\approx 13{,}3$ cm, tidak lebih dari 15 cm → salah.
- Waktu penuh $= \frac{900}{18} = 50$ jam → benar.
- 20 jam → $360\text{ m}^3$; tinggi $= \frac{360}{300} = 1{,}2$ m → benar.
- Debit 2 kali → waktu setengahnya, $\frac{900}{36} = 25$ jam → benar.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  // ---- Grup 3: menara pantau (objek geometri & trigonometri) ----
  {
    kode_stimulus: "SMA-MTK-P8-MENARA",
    kode_subdomain: "SMA-MTK-D3-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Jarak garis pandang dari mata petugas ke titik api P adalah ....`,
    opsi_a: "45 m",
    opsi_b: r`$45\sqrt{2}$ m`,
    opsi_c: r`$45\sqrt{3}$ m`,
    opsi_d: "90 m",
    opsi_e: r`$90\sqrt{2}$ m`,
    kunci: "B",
    pembahasan: r`Sudut depresi 45° berarti segitiga siku-siku (mata petugas, O, P) sama kaki: $OP = 45$ m.

Dengan Teorema Pythagoras, jarak garis pandang $= \sqrt{45^2 + 45^2} = 45\sqrt{2}$ m.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L2",
  },
  {
    kode_stimulus: "SMA-MTK-P8-MENARA",
    kode_subdomain: "SMA-MTK-D4-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Jarak titik api Q dari kaki menara O adalah ....`,
    opsi_a: r`$15\sqrt{3}$ m`,
    opsi_b: "45 m",
    opsi_c: r`$45\sqrt{3}$ m`,
    opsi_d: "90 m",
    opsi_e: r`$90\sqrt{3}$ m`,
    kunci: "C",
    pembahasan: r`Sudut depresi ke Q sama dengan sudut elevasi dari Q ke mata petugas, yaitu 30° (sudut dalam berseberangan).

$\tan 30^\circ = \dfrac{45}{OQ} \Rightarrow OQ = \dfrac{45}{\frac{1}{3}\sqrt{3}} = \dfrac{135}{\sqrt{3}} = 45\sqrt{3}$ m.

Pengecoh $15\sqrt{3}$ muncul jika menghitung $45 \times \tan 30^\circ$.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    kode_stimulus: "SMA-MTK-P8-MENARA",
    kode_subdomain: "SMA-MTK-D4-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: r`Tentukan **Benar** atau **Salah** setiap pernyataan berikut!`,
    opsi_a: r`Jarak antara titik api P dan Q adalah $45(\sqrt{3} - 1)$ m.`,
    opsi_b: r`Jarak garis pandang dari mata petugas ke titik api Q adalah $45\sqrt{3}$ m.`,
    opsi_c: "Regu pemadam yang berjalan dari Q ke P dengan kecepatan 0,5 m/detik tiba dalam waktu kurang dari 1 menit.",
    kunci: "B,S,S",
    pembahasan: r`- $PQ = OQ - OP = 45\sqrt{3} - 45 = 45(\sqrt{3} - 1)$ m → **Benar**.
- $\sin 30^\circ = \dfrac{45}{d} \Rightarrow d = \dfrac{45}{\frac{1}{2}} = 90$ m. Nilai $45\sqrt{3}$ m adalah jarak mendatar OQ, bukan garis pandang → **Salah**.
- $PQ \approx 45 \times 0{,}732 \approx 32{,}9$ m; waktu $\approx \dfrac{32{,}9}{0{,}5} \approx 65{,}9$ detik, lebih dari 1 menit → **Salah**.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  // ---- Data ----
  {
    kode_subdomain: "SMA-MTK-D5-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Data luas lahan yang terbakar di 40 desa selama musim kemarau disajikan pada tabel berikut.

| Luas lahan terbakar (hektare) | Banyak desa |
|---|---|
| 1–5 | 4 |
| 6–10 | 10 |
| 11–15 | 12 |
| 16–20 | 9 |
| 21–25 | 5 |

Median data tersebut adalah ....`,
    opsi_a: "12,0 hektare",
    opsi_b: "12,5 hektare",
    opsi_c: "12,75 hektare",
    opsi_d: "13,0 hektare",
    opsi_e: "13,5 hektare",
    kunci: "D",
    pembahasan: r`Letak median $= \frac{40}{2} = 20$. Frekuensi kumulatif: 4, 14, 26, … → data ke-20 ada di kelas **11–15**.

Tepi bawah $T_b = 10{,}5$, frekuensi kumulatif sebelum kelas median $F = 14$, frekuensi kelas median $f = 12$, panjang kelas $p = 5$.

$$Me = T_b + \frac{\frac{n}{2} - F}{f} \times p = 10{,}5 + \frac{20 - 14}{12} \times 5 = 10{,}5 + 2{,}5 = 13$$`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    kode_subdomain: "SMA-MTK-D5-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: r`Sebuah posko pemadaman memiliki 6 petugas Manggala Agni dan 4 relawan MPA. Dari mereka akan dibentuk satu regu patroli beranggotakan 4 orang. Pilihlah **semua** pernyataan yang benar!`,
    opsi_a: "Tanpa syarat apa pun, banyak cara membentuk regu adalah 210.",
    opsi_b: "Banyak regu yang beranggotakan tepat 2 relawan adalah 36.",
    opsi_c: "Banyak regu yang memuat paling sedikit 1 relawan adalah 195.",
    opsi_d: "Jika dari 10 orang itu dipilih seorang ketua dan seorang wakil ketua posko, banyak cara memilihnya adalah 90.",
    kunci: "A,C,D",
    pembahasan: r`- $C(10, 4) = \dfrac{10!}{4!\,6!} = 210$ → benar.
- Tepat 2 relawan: $C(4, 2) \times C(6, 2) = 6 \times 15 = 90$, bukan 36 → salah.
- Paling sedikit 1 relawan $=$ semua regu $-$ regu tanpa relawan $= 210 - C(6, 4) = 210 - 15 = 195$ → benar.
- Ketua dan wakil berbeda jabatan (urutan diperhatikan): $P(10, 2) = 10 \times 9 = 90$ → benar.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  // ---- Grup 4: titik panas (data & peluang) ----
  {
    kode_stimulus: "SMA-MTK-P8-HOTSPOT",
    kode_subdomain: "SMA-MTK-D5-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Persentase titik panas yang terbukti kebakaran adalah ....`,
    opsi_a: "16%",
    opsi_b: "29%",
    opsi_c: "42%",
    opsi_d: "50%",
    opsi_e: "58%",
    kunci: "E",
    pembahasan: r`Titik panas yang terbukti kebakaran $= 116$ dari $200$.

$\dfrac{116}{200} \times 100\% = 58\%$.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    kode_stimulus: "SMA-MTK-P8-HOTSPOT",
    kode_subdomain: "SMA-MTK-D5-S2",
    bentuk_soal: "pg",
    pertanyaan: r`Dari titik panas yang **terbukti kebakaran**, dipilih satu lokasi secara acak untuk dijadikan lokasi penelitian dampak asap. Peluang lokasi yang terpilih berada di **lahan gambut** adalah ....`,
    opsi_a: r`$\dfrac{21}{50}$`,
    opsi_b: r`$\dfrac{3}{5}$`,
    opsi_c: r`$\dfrac{7}{10}$`,
    opsi_d: r`$\dfrac{21}{29}$`,
    opsi_e: r`$\dfrac{29}{50}$`,
    kunci: "D",
    pembahasan: r`Lokasi dipilih hanya dari titik panas yang terbukti kebakaran, jadi ruang sampelnya kolom "Terbukti kebakaran" (116 lokasi), bukan seluruh 200 titik.

$$P(\text{gambut} \mid \text{kebakaran}) = \frac{84}{116} = \frac{21}{29}$$

Pengecoh:
- $\frac{84}{200} = \frac{21}{50}$: dibagi seluruh titik panas.
- $\frac{120}{200} = \frac{3}{5}$: peluang titik panas di lahan gambut, tanpa syarat kebakaran.
- $\frac{84}{120} = \frac{7}{10}$: syaratnya terbalik (peluang kebakaran jika di lahan gambut).
- $\frac{116}{200} = \frac{29}{50}$: peluang titik panas terbukti kebakaran.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L3",
  },
  {
    kode_stimulus: "SMA-MTK-P8-HOTSPOT",
    kode_subdomain: "SMA-MTK-D5-S2",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: r`Tentukan **Benar** atau **Salah** setiap pernyataan berikut!`,
    opsi_a: r`Jika satu titik panas dipilih acak dari 200 titik, peluang titik itu berada di lahan mineral dan bukan kebakaran adalah $\dfrac{6}{25}$.`,
    opsi_b: "Titik panas di lahan gambut lebih mungkin terbukti kebakaran dibandingkan titik panas di lahan mineral.",
    opsi_c: r`Jika dua titik panas dipilih acak satu per satu tanpa pengembalian dari 80 titik di lahan mineral, peluang keduanya terbukti kebakaran lebih dari $\dfrac{1}{6}$.`,
    kunci: "B,B,S",
    pembahasan: r`- $P(\text{mineral dan bukan kebakaran}) = \frac{48}{200} = \frac{6}{25}$ → **Benar**.
- Lahan gambut: $\frac{84}{120} = 0{,}7$; lahan mineral: $\frac{32}{80} = 0{,}4$. Karena $0{,}7 > 0{,}4$ → **Benar**.
- $\frac{32}{80} \times \frac{31}{79} = \frac{992}{6.320} \approx 0{,}157$, sedangkan $\frac{1}{6} \approx 0{,}167$. Peluangnya **kurang** dari $\frac{1}{6}$ → **Salah**.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
];

export default {
  title: "TKA SMA Matematika — Paket 8",
  description:
    "25 soal bertema kebakaran hutan dan lahan: titik panas, penjalaran api, menara pantau, embung pemadam, dan sekat bakar. Mencakup bilangan, aljabar, geometri, trigonometri, statistika, dan peluang, dilengkapi 4 gambar.",
  jenjang: "SMA",
  subjectCode: "SMA-MTK",
  durationMinutes: 70,
  isPremium: true,
  isFullSimulation: true,
  createdByEmail: "kpbgalimka@gmail.com",
  stimuli,
  rows,
  images: {
    embung: { title: "Embung balok 20 m × 15 m × 3 m", svg: imgEmbung() },
    menara: { title: "Sudut depresi dari menara pantau api", svg: imgMenara() },
    pohon: { title: "Tongkat dan pohon kering beserta bayangannya", svg: imgPohon() },
    kubus: { title: "Kubus ABCD.EFGH dengan bidang BDE", svg: imgKubus() },
  },
};
