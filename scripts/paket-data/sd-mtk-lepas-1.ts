// TKA SD Matematika — 3 soal lepas bergambar untuk bank soal (ditulis Claude), tanpa paket.
// Penggaris (pengukuran), simetri lipat (objek geometri), diagram batang (data).
const r = String.raw;

const FONT = `font-family="Arial, Helvetica, sans-serif"`;
const svg = (w: number, h: number, b: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" ${FONT}><rect width="${w}" height="${h}" fill="#fff"/>${b}</svg>`;
const text = (x: number, y: number, t: string, o: { size?: number; anchor?: string; weight?: string; fill?: string } = {}) => `<text x="${x}" y="${y}" font-size="${o.size ?? 18}" text-anchor="${o.anchor ?? "middle"}" font-weight="${o.weight ?? "normal"}" fill="${o.fill ?? "#111"}">${t}</text>`;
const line = (x1: number, y1: number, x2: number, y2: number, o: { stroke?: string; w?: number; dash?: string } = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.stroke ?? "#111"}" stroke-width="${o.w ?? 2}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ""}/>`;
// 1. Penggaris 0–12 cm; pensil dari 2 cm sampai 9,5 cm.
function penggaris() {
  const c = 55, ox = 30, top = 120;
  let s = `<rect x="${ox - 15}" y="${top}" width="${12 * c + 30}" height="80" rx="6" fill="#fef9c3" stroke="#a16207" stroke-width="2"/>`;
  for (let mm = 0; mm <= 120; mm++) {
    const x = ox + (mm * c) / 10, len = mm % 10 === 0 ? 30 : mm % 5 === 0 ? 20 : 11;
    s += line(x, top, x, top + len, { w: mm % 10 === 0 ? 2 : 1 });
    if (mm % 10 === 0) s += text(x, top + 52, String(mm / 10), { size: 18 });
  }
  s += text(ox + 12 * c, top + 72, "cm", { size: 15, anchor: "end" });
  const x1 = ox + 2 * c, x2 = ox + 9.5 * c, y = 70, h = 34;
  s += `<rect x="${x1}" y="${y - h / 2}" width="${x2 - x1 - 45}" height="${h}" fill="#f59e0b" stroke="#92400e" stroke-width="2"/>`;
  s += `<rect x="${x1}" y="${y - h / 2}" width="22" height="${h}" fill="#f9a8d4" stroke="#92400e" stroke-width="2"/>`;
  s += `<polygon points="${x2 - 45},${y - h / 2} ${x2},${y} ${x2 - 45},${y + h / 2}" fill="#fde7c8" stroke="#92400e" stroke-width="2"/>`;
  s += `<polygon points="${x2 - 14},${y - 5} ${x2},${y} ${x2 - 14},${y + 5}" fill="#111"/>`;
  s += line(x1, y + h / 2, x1, top, { stroke: "#2563eb", w: 1.5, dash: "5 4" }) + line(x2, y, x2, top, { stroke: "#2563eb", w: 1.5, dash: "5 4" });
  return svg(12 * c + 60, 220, s);
}

// 2. Empat bangun datar: K persegi panjang, L segitiga sama sisi, M jajargenjang, N layang-layang.
function bangun() {
  const st = `stroke="#1e3a8a" stroke-width="3" fill="#dbeafe"`;
  let s = "";
  s += `<rect x="30" y="60" width="150" height="90" ${st}/>` + text(105, 190, "K", { size: 26, weight: "bold" });
  const cx = 300, b = 140, hh = (b * Math.sqrt(3)) / 2;
  s += `<polygon points="${cx - b / 2},${150} ${cx + b / 2},${150} ${cx},${150 - hh}" ${st}/>` + text(cx, 190, "L", { size: 26, weight: "bold" });
  s += `<polygon points="420,150 540,150 590,60 470,60" ${st}/>` + text(505, 190, "M", { size: 26, weight: "bold" });
  s += `<polygon points="690,25 740,70 690,160 640,70" ${st}/>` + text(690, 190, "N", { size: 26, weight: "bold" });
  return svg(780, 210, s);
}

// 3. Diagram batang botol plastik Senin–Jumat: 25, 40, 35, 50, 30.
function diagram() {
  const data: [string, number][] = [["Senin", 25], ["Selasa", 40], ["Rabu", 35], ["Kamis", 50], ["Jumat", 30]];
  const ox = 80, base = 340, k = 5, bw = 60, gap = 40;
  let s = text(330, 30, "Banyak Botol Plastik yang Terkumpul", { size: 20, weight: "bold" });
  for (let v = 0; v <= 60; v += 5) {
    const y = base - v * k;
    s += line(ox, y, ox + 5 * (bw + gap) + 20, y, { stroke: v % 10 === 0 ? "#cbd5e1" : "#e5e7eb", w: 1 });
    if (v % 10 === 0) s += text(ox - 10, y + 6, String(v), { size: 16, anchor: "end" });
  }
  data.forEach(([d, v], i) => {
    const x = ox + 30 + i * (bw + gap);
    s += `<rect x="${x}" y="${base - v * k}" width="${bw}" height="${v * k}" fill="#16a34a"/>` + text(x + bw / 2, base + 26, d, { size: 16 });
  });
  s += line(ox, base, ox + 5 * (bw + gap) + 20, base) + line(ox, base, ox, base - 62 * k);
  s += `<text x="24" y="${base - 150}" font-size="16" text-anchor="middle" transform="rotate(-90 24 ${base - 150})">Banyak botol</text>`;
  s += text(ox + 260, base + 56, "Hari", { size: 16 });
  return svg(620, 410, s);
}

const MCMA = "\n\n(Jawaban benar lebih dari satu.)";

const rows = [
  {
    kode_subdomain: "SD-MTK-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: "Dayu mengukur pensilnya dengan penggaris seperti pada gambar. Panjang pensil Dayu adalah ....",
    opsi_a: "9,5 cm",
    opsi_b: "7 cm",
    opsi_c: "7,5 cm",
    opsi_d: "8 cm",
    opsi_e: "11,5 cm",
    kunci: "C",
    pembahasan: r`Pangkal pensil tidak berada di angka 0, tetapi di angka 2. Ujung pensil tepat di garis tengah antara 9 dan 10, yaitu 9,5. Panjang pensil $= 9,5 - 2 = 7,5$ cm.

Cek setiap pilihan:
- **A. 9,5 cm** — salah, ini hanya angka di ujung pensil, seolah-olah pensil diukur mulai dari 0.
- **B. 7 cm** — salah, setengah sentimeter di ujung pensil (garis tengah antara 9 dan 10) tidak dihitung.
- **C. 7,5 cm** — benar.
- **D. 8 cm** — salah, ujung pensil dibulatkan ke 10, lalu $10 - 2 = 8$.
- **E. 11,5 cm** — salah, angka di pangkal dan ujung dijumlahkan ($2 + 9,5$), padahal seharusnya dikurangkan.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
    gambar: "penggaris",
    bankOnly: true,
  },
  {
    kode_subdomain: "SD-MTK-D2-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Perhatikan bangun K, L, M, dan N pada gambar. Tentukan **Benar** atau **Salah** setiap pernyataan berikut!",
    opsi_a: "Bangun K memiliki 2 sumbu simetri lipat.",
    opsi_b: "Bangun M memiliki 2 sumbu simetri lipat, yaitu kedua diagonalnya.",
    opsi_c: "Bangun N memiliki tepat 1 sumbu simetri lipat.",
    opsi_d: "Bangun L memiliki 1 sumbu simetri lipat.",
    kunci: "B,S,B,S",
    pembahasan: `Sumbu simetri lipat adalah garis lipatan yang membuat dua bagian bangun saling menutupi dengan tepat. K = persegi panjang, L = segitiga sama sisi, M = jajargenjang, N = layang-layang.

- **Benar** — persegi panjang bisa dilipat tepat di garis tengah mendatar dan garis tengah tegaknya. Lipatan pada diagonal tidak membuat kedua bagian saling menutupi.
- **Salah** — bila jajargenjang dilipat pada diagonalnya, sudut-sudutnya tidak bertemu. Jajargenjang tidak memiliki sumbu simetri lipat.
- **Benar** — layang-layang hanya bisa dilipat tepat pada diagonal tegak yang menghubungkan sudut atas dan sudut bawah.
- **Salah** — segitiga sama sisi memiliki **3** sumbu simetri lipat. Setiap sumbu menghubungkan satu titik sudut dengan titik tengah sisi di depannya.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
    gambar: "bangun-datar",
    bankOnly: true,
  },
  {
    kode_subdomain: "SD-MTK-D3-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Siswa kelas V mengumpulkan botol plastik bekas selama lima hari. Hasilnya disajikan dalam diagram batang pada gambar. Manakah pernyataan yang sesuai dengan diagram?${MCMA}`,
    opsi_a: "Botol paling banyak terkumpul pada hari Kamis.",
    opsi_b: "Selisih banyak botol hari Selasa dan hari Senin adalah 15 botol.",
    opsi_c: "Jumlah botol yang terkumpul selama lima hari adalah 170 botol.",
    opsi_d: "Rata-rata botol yang terkumpul setiap hari adalah 36 botol.",
    opsi_e: "Banyak botol hari Rabu dua kali banyak botol hari Senin.",
    kunci: "A,B,D",
    pembahasan: r`Setiap garis bantu bernilai 5. Dari diagram: Senin 25, Selasa 40, Rabu 35, Kamis 50, Jumat 30.

- **A** — benar, batang hari Kamis paling tinggi, yaitu 50 botol.
- **B** — benar, $40 - 25 = 15$ botol.
- **C** — salah, $25 + 40 + 35 + 50 + 30 = 180$ botol. Angka 170 muncul bila batang Senin dibaca 20 atau batang Rabu dibaca 30, karena garis bantu bernilai 5 terlewat.
- **D** — benar, $180 : 5 = 36$ botol.
- **E** — salah, dua kali hari Senin $= 2 \times 25 = 50$ botol, sedangkan hari Rabu hanya 35 botol. Nilai 50 justru milik hari Kamis.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
    gambar: "diagram-botol",
    bankOnly: true,
  },
];

export default {
  title: "Soal lepas SD Matematika bergambar (bank soal)",
  description: "",
  jenjang: "SD",
  subjectCode: "SD-MTK",
  durationMinutes: 75,
  isPremium: true,
  createdByEmail: "kpbgalimka@gmail.com",
  stimuli: [],
  rows,
  images: {
    penggaris: { title: "Pensil diukur dengan penggaris mulai angka 2", svg: penggaris() },
    "bangun-datar": { title: "Bangun K, L, M, N (simetri lipat)", svg: bangun() },
    "diagram-botol": { title: "Diagram batang botol plastik Senin–Jumat", svg: diagram() },
  },
};
