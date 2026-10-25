// TKA SMA Bahasa Arab — Paket 1 (soal baru, ditulis untuk Pakar TKA).
// Acuan: Kerangka Asesmen SMA-BARB (fokus membaca/al-qirā'ah, 3 domain, 8 subdomain), teks fusha
// pendek (25–50 kata per paragraf, dialog 5–6 tanya jawab), topik kehidupan sehari-hari.
// 25 soal / 50 menit (mapel pilihan): 15 PG, 4 MCMA, 6 Kategori; 4 grup stimulus; 3 gambar (SVG).
// Sebaran: D1-S1 4 · D1-S2 3 · D1-S3 3 · D2-S1 3 · D2-S2 2 · D3-S1 4 · D3-S2 3 · D3-S3 3.
// Kesulitan 5 mudah / 13 sedang / 7 sulit. Mapel bahasa tidak memakai level kognitif.
const r = String.raw;
const FONT = `font-family="Geeza Pro, Arial, sans-serif"`;
const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" ${FONT}><rect width="${w}" height="${h}" fill="#fff"/>${body}</svg>`;
// Teks Arab: arah kanan-ke-kiri agar tanda baca & angka di sisi yang benar. Pada RTL, "start" = sisi
// kanan, jadi anchor "end" (rata kanan, cara pikir LTR) dipetakan ke "start".
const text = (x: number, y: number, t: string, o: { size?: number; anchor?: string; weight?: string; fill?: string } = {}) => {
  const anchor = o.anchor === "end" ? "start" : o.anchor === "start" ? "end" : (o.anchor ?? "middle");
  return `<text x="${x}" y="${y}" direction="rtl" unicode-bidi="embed" font-size="${o.size ?? 22}" text-anchor="${anchor}" font-weight="${o.weight ?? "normal"}" fill="${o.fill ?? "#111"}">${t}</text>`;
};

// ---------- Gambar ----------

// Papan aturan perpustakaan sekolah.
function imgPapanPerpus() {
  let s = `<rect x="20" y="20" width="560" height="300" rx="18" fill="#fef3c7" stroke="#92400e" stroke-width="6"/>`;
  s += `<rect x="20" y="20" width="560" height="70" rx="18" fill="#92400e"/><rect x="20" y="70" width="560" height="20" fill="#92400e"/>`;
  s += text(300, 68, "إرشادات المكتبة", { size: 32, weight: "bold", fill: "#fff" });
  const rows = ["حافظ على الهدوء.", "ممنوع الأكل والشرب.", "أرجِع الكتاب بعد سبعة أيام."];
  rows.forEach((t, i) => {
    const y = 150 + i * 62;
    s += `<circle cx="530" cy="${y - 9}" r="20" fill="#92400e"/>` + text(530, y - 1, String(i + 1), { size: 22, weight: "bold", fill: "#fff" });
    s += text(490, y, t, { size: 28, anchor: "end" });
  });
  // ikon larangan makan
  s += `<g transform="translate(95 205)"><circle r="52" fill="#fff" stroke="#dc2626" stroke-width="9"/>`;
  s += `<path d="M-22 -26 v52 M-30 -26 v18 q8 10 16 0 v-18 M14 -28 q14 10 0 30 v24" stroke="#374151" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  s += `<line x1="-37" y1="-37" x2="37" y2="37" stroke="#dc2626" stroke-width="9"/></g>`;
  return svg(600, 340, s);
}

// Poster pengumuman Hari Lingkungan Sekolah.
function imgPosterBiah() {
  let s = `<rect x="16" y="16" width="568" height="608" rx="22" fill="#ecfdf5" stroke="#15803d" stroke-width="6"/>`;
  s += text(300, 82, "إعلان", { size: 30, weight: "bold", fill: "#15803d" });
  s += text(300, 136, "يوم البيئة المدرسي", { size: 42, weight: "bold", fill: "#14532d" });
  // pohon kecil
  s += `<g transform="translate(300 205)"><rect x="-7" y="10" width="14" height="40" fill="#92400e"/><circle cy="-6" r="34" fill="#22c55e"/><circle cx="-26" cy="12" r="22" fill="#16a34a"/><circle cx="26" cy="12" r="22" fill="#16a34a"/></g>`;
  const info: [string, string][] = [
    ["اليوم:", "السبت، 15 نوفمبر"],
    ["الوقت:", "7.00 – 10.00 صباحًا"],
    ["المكان:", "ساحة المدرسة"],
  ];
  info.forEach(([k, v], i) => {
    const y = 305 + i * 46;
    s += text(520, y, k, { size: 26, weight: "bold", anchor: "end", fill: "#14532d" }) + text(420, y, v, { size: 26, anchor: "end" });
  });
  s += `<rect x="50" y="430" width="500" height="2" fill="#86efac"/>`;
  s += text(520, 474, "الأنشطة: تنظيف الفصول – غرس الأشجار – مسابقة إعادة التدوير", { size: 21, anchor: "end" });
  s += text(520, 530, "أحضِرْ: قفّازات وكيس قمامة", { size: 24, anchor: "end", weight: "bold", fill: "#15803d" });
  s += text(520, 580, "لا تُحضِرْ: زجاجات بلاستيكية", { size: 24, anchor: "end", weight: "bold", fill: "#dc2626" });
  return svg(600, 640, s);
}

// Jadwal pelajaran tiga hari.
function imgJadwal() {
  const cols = ["اليوم", "الحصة الأولى", "الحصة الثانية", "الحصة الثالثة"];
  const rows = [
    ["الاثنين", "الرياضيات", "اللغة العربية", "الرياضة"],
    ["الثلاثاء", "العلوم", "اللغة الإنجليزية", "التاريخ"],
    ["الأربعاء", "اللغة العربية", "الفن", "الرياضيات"],
  ];
  const W = 190, H = 64, x0 = 20, y0 = 70, right = x0 + W * 4;
  let s = text(right / 2 + 10, 46, "جدول الدروس", { size: 30, weight: "bold", fill: "#1e3a8a" });
  // kolom dari kanan ke kiri (tabel Arab)
  const cx = (c: number) => right - W * c - W / 2;
  cols.forEach((c, i) => {
    s += `<rect x="${right - W * (i + 1)}" y="${y0}" width="${W}" height="${H}" fill="#1e3a8a" stroke="#fff" stroke-width="2"/>`;
    s += text(cx(i), y0 + 41, c, { size: 22, weight: "bold", fill: "#fff" });
  });
  rows.forEach((row, ri) => {
    row.forEach((c, i) => {
      const y = y0 + H * (ri + 1);
      s += `<rect x="${right - W * (i + 1)}" y="${y}" width="${W}" height="${H}" fill="${i === 0 ? "#dbeafe" : ri % 2 ? "#f8fafc" : "#fff"}" stroke="#94a3b8" stroke-width="1.5"/>`;
      s += text(cx(i), y + 41, c, { size: 22, weight: i === 0 ? "bold" : "normal" });
    });
  });
  return svg(right + 20, y0 + H * 4 + 20, s);
}

// ---------- Stimulus ----------
const stimuli = [
  {
    code: "SMA-BARB-P1-MAKTABAH",
    title: "مكتبة المدرسة",
    content: r`في مدرستنا مكتبة كبيرة وجميلة. تقع المكتبة بجانب المسجد، وتُفتح من الساعة السابعة صباحًا إلى الساعة الثالثة بعد الظهر. فيها كتب كثيرة في العلوم والتاريخ واللغات، وفيها أيضًا حواسيب للطلاب.

يذهب أحمد إلى المكتبة كل يوم بعد الاستراحة الأولى. هو يحب قراءة القصص، ويستعير كتابين كل أسبوع. يجب على الطلاب أن يُرجِعوا الكتب بعد سبعة أيام، ولا يجوز لهم أن يأكلوا في المكتبة.`,
    gambar: "papan",
  },
  {
    code: "SMA-BARB-P1-SHAIDALIYAH",
    title: "في الصيدلية",
    content: r`**الصيدلي:** السلام عليكم، كيف أساعدكِ؟

**فاطمة:** وعليكم السلام. أشعر بصداع وحرارة منذ أمس.

**الصيدلي:** هل ذهبتِ إلى الطبيب؟

**فاطمة:** نعم، وهذه وصفة الطبيب.

**الصيدلي:** حسنًا، خذي هذا الدواء ثلاث مرات في اليوم بعد الأكل، ولا تتناوليه قبل الأكل.

**فاطمة:** موافقة. وهل أستطيع أن أذهب إلى المدرسة غدًا؟

**الصيدلي:** لا تذهبي إلى المدرسة حتى تنخفض الحرارة، واشربي ماءً كثيرًا.

**فاطمة:** شكرًا جزيلًا.`,
  },
  {
    code: "SMA-BARB-P1-BIAH",
    title: "إعلان يوم البيئة المدرسي",
    content: r`Perhatikan pengumuman berikut!`,
    gambar: "poster",
  },
  {
    code: "SMA-BARB-P1-UTHLAH",
    title: "يوم العطلة",
    content: r`في يوم الأحد خرجت أسرتي إلى الحديقة العامة. حمل أبي سلة الطعام، وحملت أمي الحصير. لعبت أنا وأخي الصغير كرة القدم، أما أختي فرسمت الأزهار الجميلة لأن هوايتها الرسم.

بعد الظهر جلسنا تحت شجرة كبيرة وأكلنا معًا. كان الجو حارًّا، لكننا فرحنا كثيرًا. رجعنا إلى البيت قبل المغرب.`,
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
  kode_stimulus?: string;
  gambar?: string;
};

const rows: Row[] = [
  // ---- Grup 1: perpustakaan sekolah ----
  {
    kode_stimulus: "SMA-BARB-P1-MAKTABAH",
    kode_subdomain: "SMA-BARB-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Berdasarkan teks, perpustakaan sekolah buka pada pukul ....`,
    opsi_a: "07.00–13.00",
    opsi_b: "07.00–15.00",
    opsi_c: "09.00–15.00",
    opsi_d: "setelah istirahat pertama",
    opsi_e: "07.00–12.00",
    kunci: "B",
    pembahasan: r`Teks menyebutkan: «وتُفتح من الساعة السابعة صباحًا إلى الساعة الثالثة بعد الظهر» = buka dari pukul tujuh pagi sampai pukul tiga siang (15.00).

"Setelah istirahat pertama" adalah waktu Ahmad pergi ke perpustakaan, bukan jam buka perpustakaan.`,
    tingkat_kesulitan: "mudah",
  },
  {
    kode_stimulus: "SMA-BARB-P1-MAKTABAH",
    kode_subdomain: "SMA-BARB-D1-S3",
    bentuk_soal: "pg",
    pertanyaan: r`Arti kata «يستعير» dalam kalimat «ويستعير كتابين كل أسبوع» adalah ....`,
    opsi_a: "membeli",
    opsi_b: "membaca",
    opsi_c: "menulis",
    opsi_d: "meminjam",
    opsi_e: "mengembalikan",
    kunci: "D",
    pembahasan: r`«استعار – يستعير» artinya **meminjam**. Konteksnya: Ahmad meminjam dua buku setiap minggu, lalu wajib mengembalikannya (يُرجِع) setelah tujuh hari.

Pengecoh: membaca = يقرأ, membeli = يشتري, mengembalikan = يُرجِع.`,
    tingkat_kesulitan: "mudah",
  },
  {
    kode_stimulus: "SMA-BARB-P1-MAKTABAH",
    kode_subdomain: "SMA-BARB-D3-S2",
    bentuk_soal: "pg",
    pertanyaan: r`Ide pokok paragraf pertama adalah ....`,
    opsi_a: "keadaan dan fasilitas perpustakaan sekolah",
    opsi_b: "kebiasaan Ahmad membaca cerita",
    opsi_c: "aturan meminjam buku di perpustakaan",
    opsi_d: "letak masjid di sekolah",
    opsi_e: "jadwal istirahat para siswa",
    kunci: "A",
    pembahasan: r`Paragraf pertama menjelaskan perpustakaan: besar dan indah, letaknya di samping masjid, jam bukanya, koleksi buku, dan komputer. Semuanya menggambarkan **keadaan dan fasilitas perpustakaan**.

Kebiasaan Ahmad dan aturan meminjam buku ada di paragraf kedua.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SMA-BARB-P1-MAKTABAH",
    kode_subdomain: "SMA-BARB-D3-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Sesuai/Tidak Sesuai",
    pertanyaan: r`Berdasarkan teks dan papan aturan perpustakaan, tentukan **Sesuai** atau **Tidak Sesuai** setiap kesimpulan berikut!`,
    opsi_a: "Ahmad mengembalikan buku pinjamannya setiap minggu.",
    opsi_b: "Siswa boleh menghabiskan bekal makan siang sambil membaca di perpustakaan.",
    opsi_c: "Ahmad pergi ke perpustakaan sebelum istirahat pertama.",
    kunci: "S,TS,TS",
    pembahasan: r`- Ahmad meminjam dua buku setiap minggu, dan buku wajib dikembalikan setelah tujuh hari (أرجِع الكتاب بعد سبعة أيام). Jadi ia mengembalikan bukunya setiap minggu → **Sesuai**.
- Makan dan minum dilarang di perpustakaan (ممنوع الأكل والشرب / لا يجوز لهم أن يأكلوا) → **Tidak Sesuai**.
- Ahmad pergi **setelah** istirahat pertama (بعد الاستراحة الأولى) → **Tidak Sesuai**.`,
    tingkat_kesulitan: "sedang",
  },
  // ---- Grup 2: dialog di apotek ----
  {
    kode_stimulus: "SMA-BARB-P1-SHAIDALIYAH",
    kode_subdomain: "SMA-BARB-D1-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: r`Pilihlah **semua** informasi yang sesuai dengan dialog!`,
    opsi_a: "Fatimah sakit kepala dan demam sejak kemarin.",
    opsi_b: "Fatimah belum memeriksakan diri ke dokter.",
    opsi_c: "Obat diminum tiga kali sehari setelah makan.",
    opsi_d: "Apoteker menyarankan Fatimah banyak minum air.",
    kunci: "A,C,D",
    pembahasan: r`- «أشعر بصداع وحرارة منذ أمس» = sakit kepala dan demam sejak kemarin → benar.
- Fatimah menjawab «نعم، وهذه وصفة الطبيب»: ia **sudah** ke dokter dan membawa resep → salah.
- «ثلاث مرات في اليوم بعد الأكل» = tiga kali sehari setelah makan → benar.
- «واشربي ماءً كثيرًا» = minumlah air yang banyak → benar.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SMA-BARB-P1-SHAIDALIYAH",
    kode_subdomain: "SMA-BARB-D3-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Dari dialog tersebut dapat disimpulkan bahwa Fatimah ....`,
    opsi_a: "membeli obat tanpa resep dokter",
    opsi_b: "sudah sembuh dari sakitnya",
    opsi_c: "kemungkinan besar tidak masuk sekolah besok",
    opsi_d: "bekerja di apotek tersebut",
    opsi_e: "harus kembali ke dokter besok pagi",
    kunci: "C",
    pembahasan: r`Apoteker berkata «لا تذهبي إلى المدرسة حتى تنخفض الحرارة» (jangan pergi ke sekolah sampai demammu turun). Demam Fatimah baru muncul sejak kemarin, jadi besok ia kemungkinan besar belum masuk sekolah.

Pilihan lain bertentangan dengan dialog: Fatimah membawa resep, masih sakit, dan ia pembeli, bukan pegawai apotek. Kembali ke dokter tidak disebutkan.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SMA-BARB-P1-SHAIDALIYAH",
    kode_subdomain: "SMA-BARB-D3-S3",
    bentuk_soal: "pg",
    pertanyaan: r`Ungkapan «لا تذهبي إلى المدرسة» dalam dialog merupakan ....`,
    opsi_a: "perintah (fi'il amr) untuk laki-laki",
    opsi_b: "larangan (nahyu) untuk perempuan",
    opsi_c: "larangan (nahyu) untuk laki-laki",
    opsi_d: "perintah (fi'il amr) untuk perempuan",
    opsi_e: "kalimat berita (khabar) tentang perempuan",
    kunci: "B",
    pembahasan: r`- «لا» di sini adalah **lā nāhiyah** (larangan) yang menjazmkan fi'il muḍāri'.
- Bentuk asal untuk perempuan adalah «تذهبين». Karena dijazmkan, huruf nun dibuang menjadi «تذهبي».
- Akhiran «ي» menunjukkan lawan bicara **perempuan** (Fatimah). Untuk laki-laki bentuknya «لا تذهبْ».

Bandingkan dengan perintah untuk perempuan: «اشربي» (minumlah).`,
    tingkat_kesulitan: "sulit",
  },
  {
    kode_stimulus: "SMA-BARB-P1-SHAIDALIYAH",
    kode_subdomain: "SMA-BARB-D1-S2",
    bentuk_soal: "pg",
    pertanyaan: r`Sinonim (murādif) kata «أستطيع» dalam kalimat «وهل أستطيع أن أذهب إلى المدرسة غدًا؟» adalah ....`,
    opsi_a: "أريد",
    opsi_b: "أحب",
    opsi_c: "أذهب",
    opsi_d: "أعرف",
    opsi_e: "أقدر",
    kunci: "E",
    pembahasan: r`«أستطيع» = saya mampu/bisa. Sinonimnya «أقدر» (saya sanggup/mampu).

Pengecoh: «أريد» = saya ingin, «أحب» = saya suka, «أعرف» = saya tahu.`,
    tingkat_kesulitan: "mudah",
  },
  // ---- Grup 3: poster Hari Lingkungan Sekolah ----
  {
    kode_stimulus: "SMA-BARB-P1-BIAH",
    kode_subdomain: "SMA-BARB-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Berdasarkan pengumuman, siswa diminta membawa ....`,
    opsi_a: "sarung tangan dan kantong sampah",
    opsi_b: "botol plastik untuk lomba daur ulang",
    opsi_c: "bibit pohon dari rumah",
    opsi_d: "buku catatan dan alat tulis",
    opsi_e: "makanan untuk dimakan bersama",
    kunci: "A",
    pembahasan: r`Pengumuman menyebutkan «أحضِرْ: قفّازات وكيس قمامة» = bawalah sarung tangan dan kantong sampah.

Botol plastik justru dilarang dibawa: «لا تُحضِرْ: زجاجات بلاستيكية».`,
    tingkat_kesulitan: "mudah",
  },
  {
    kode_stimulus: "SMA-BARB-P1-BIAH",
    kode_subdomain: "SMA-BARB-D3-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: r`Tentukan **Benar** atau **Salah** setiap kesimpulan berikut berdasarkan pengumuman!`,
    opsi_a: "Kegiatan berlangsung lebih dari tiga jam.",
    opsi_b: "Larangan membawa botol plastik sejalan dengan tujuan kegiatan, yaitu menjaga lingkungan.",
    opsi_c: "Siswa yang membawa air minum dalam botol plastik tidak mematuhi pengumuman.",
    kunci: "S,B,B",
    pembahasan: r`- Kegiatan pukul 7.00–10.00, jadi tepat tiga jam, tidak lebih → **Salah**.
- Hari Lingkungan (يوم البيئة) bertujuan menjaga kebersihan lingkungan, dan mengurangi sampah plastik mendukung tujuan itu → **Benar**.
- Pengumuman melarang membawa botol plastik (لا تُحضِرْ: زجاجات بلاستيكية) → **Benar**.`,
    tingkat_kesulitan: "sulit",
  },
  {
    kode_stimulus: "SMA-BARB-P1-BIAH",
    kode_subdomain: "SMA-BARB-D1-S3",
    bentuk_soal: "pg",
    pertanyaan: r`Arti «غرس الأشجار» pada pengumuman adalah ....`,
    opsi_a: "memotong pohon",
    opsi_b: "menyiram tanaman",
    opsi_c: "menanam pohon",
    opsi_d: "memetik buah",
    opsi_e: "membersihkan taman",
    kunci: "C",
    pembahasan: r`«غرس – يغرس» = menanam, «الأشجار» = pohon-pohon (jamak dari «شجرة»). Jadi «غرس الأشجار» = **menanam pohon**, sesuai tema Hari Lingkungan.`,
    tingkat_kesulitan: "sedang",
  },
  // ---- Grup 4: hari libur keluarga ----
  {
    kode_stimulus: "SMA-BARB-P1-UTHLAH",
    kode_subdomain: "SMA-BARB-D3-S2",
    bentuk_soal: "pg",
    pertanyaan: r`Tema yang paling tepat untuk teks tersebut adalah ....`,
    opsi_a: "hobi menggambar kakak perempuan",
    opsi_b: "cuaca panas pada hari Minggu",
    opsi_c: "makanan kesukaan keluarga",
    opsi_d: "pertandingan sepak bola dua bersaudara",
    opsi_e: "kegiatan keluarga berlibur di taman",
    kunci: "E",
    pembahasan: r`Seluruh teks menceritakan satu keluarga yang pergi ke taman umum pada hari Minggu: membawa bekal, bermain, menggambar, makan bersama, lalu pulang. Temanya **kegiatan keluarga berlibur di taman**.

Pilihan lain hanya bagian kecil dari cerita.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SMA-BARB-P1-UTHLAH",
    kode_subdomain: "SMA-BARB-D1-S2",
    bentuk_soal: "pg",
    pertanyaan: r`Antonim (ḍidd) kata «قبل» dalam kalimat «رجعنا إلى البيت قبل المغرب» adalah ....`,
    opsi_a: "عند",
    opsi_b: "بعد",
    opsi_c: "مع",
    opsi_d: "تحت",
    opsi_e: "فوق",
    kunci: "B",
    pembahasan: r`«قبل» = sebelum, lawannya «بعد» = sesudah. Kata «بعد» juga muncul di teks: «بعد الظهر» (sesudah zuhur).

«تحت» (di bawah) berlawanan dengan «فوق» (di atas), bukan dengan «قبل».`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SMA-BARB-P1-UTHLAH",
    kode_subdomain: "SMA-BARB-D3-S3",
    bentuk_soal: "pgk_mcma",
    pertanyaan: r`Pilihlah **semua** pernyataan kebahasaan yang benar tentang teks!`,
    opsi_a: "Kata «خرجت» dalam «خرجت أسرتي» adalah fi'il māḍī.",
    opsi_b: "Kata «الأزهار» adalah bentuk jamak.",
    opsi_c: "Kata «جلسنا» menunjukkan pelaku tunggal (saya).",
    opsi_d: "Kata «أبي» berarti \"ayah saya\".",
    kunci: "A,B,D",
    pembahasan: r`- «خرجت» adalah fi'il māḍī (lampau), dan ta' sākinah menunjukkan pelaku perempuan («أسرة» muannats) → benar.
- «الأزهار» adalah jamak taksīr dari «زَهْرة/زَهْر» (bunga) → benar.
- «جلسنا»: akhiran «نا» berarti **kami**, bukan saya → salah.
- «أبي» = «أب» + «ي» (ḍamīr mutakallim) = ayah saya → benar.`,
    tingkat_kesulitan: "sulit",
  },
  // ---- Soal tunggal ----
  {
    kode_subdomain: "SMA-BARB-D1-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: r`Perhatikan jadwal pelajaran berikut. Tentukan **Benar** atau **Salah** setiap pernyataan!`,
    gambar: "jadwal",
    opsi_a: "Pelajaran bahasa Arab ada pada hari Senin dan Rabu.",
    opsi_b: "Pada hari Selasa, jam pelajaran pertama adalah sejarah.",
    opsi_c: "Pelajaran olahraga ada pada jam ketiga hari Senin.",
    kunci: "B,S,B",
    pembahasan: r`- «اللغة العربية» ada pada «الاثنين» (Senin, jam kedua) dan «الأربعاء» (Rabu, jam pertama) → **Benar**.
- Jam pertama «الثلاثاء» (Selasa) adalah «العلوم» (IPA), sedangkan «التاريخ» (sejarah) ada di jam ketiga → **Salah**.
- «الرياضة» (olahraga) ada di jam ketiga hari Senin → **Benar**. Jangan tertukar dengan «الرياضيات» (matematika).`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_subdomain: "SMA-BARB-D1-S3",
    bentuk_soal: "pgk_mcma",
    pertanyaan: r`Pilihlah **semua** arti kata bergaris bawah yang tepat sesuai konteks kalimatnya!`,
    opsi_a: "«يعمل أبي **مهندسًا** في شركة كبيرة» → **مهندسًا** = insinyur",
    opsi_b: "«تعمل أمي **ممرضةً** في المستشفى» → **ممرضة** = dokter",
    opsi_c: "«يبيع **التاجر** الفواكه في السوق» → **التاجر** = pedagang",
    opsi_d: "«يزرع الفلاح الأرز في **الحقل**» → **الحقل** = sawah/ladang",
    kunci: "A,C,D",
    pembahasan: r`- «مهندس» = insinyur → benar.
- «ممرضة» = perawat (perempuan), sedangkan dokter = «طبيبة» → salah.
- «تاجر» = pedagang, yang menjual buah di pasar → benar.
- «حقل» = sawah/ladang, tempat petani (فلاح) menanam padi (أرز) → benar.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_subdomain: "SMA-BARB-D1-S2",
    bentuk_soal: "pgk_kategori",
    kategori: "Sesuai/Tidak Sesuai",
    pertanyaan: r`Tentukan **Sesuai** atau **Tidak Sesuai** hubungan makna pasangan kata berikut!`,
    opsi_a: "«كبير» adalah antonim dari «صغير».",
    opsi_b: "«جميل» adalah sinonim dari «قبيح».",
    opsi_c: "«سريع» adalah antonim dari «بطيء».",
    kunci: "S,TS,S",
    pembahasan: r`- «كبير» (besar) >< «صغير» (kecil): antonim → **Sesuai**.
- «جميل» (indah) dan «قبيح» (jelek) maknanya berlawanan, jadi antonim, bukan sinonim → **Tidak Sesuai**.
- «سريع» (cepat) >< «بطيء» (lambat): antonim → **Sesuai**.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_subdomain: "SMA-BARB-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Susunlah kata-kata berikut menjadi kalimat yang benar!

(1) المدرسة (2) إلى (3) يذهب (4) الطالب (5) صباحًا

Susunan yang benar adalah ....`,
    opsi_a: "3 – 4 – 2 – 1 – 5",
    opsi_b: "4 – 3 – 1 – 2 – 5",
    opsi_c: "3 – 2 – 1 – 4 – 5",
    opsi_d: "5 – 4 – 3 – 1 – 2",
    opsi_e: "1 – 2 – 3 – 4 – 5",
    kunci: "A",
    pembahasan: r`Kalimat fi'liyyah: fi'il – fā'il – keterangan tempat – keterangan waktu.

«يذهب (3) الطالب (4) إلى (2) المدرسة (1) صباحًا (5)» = Siswa itu pergi ke sekolah pada pagi hari.

Huruf jar «إلى» harus berada **sebelum** «المدرسة», sehingga pilihan B dan D salah.`,
    tingkat_kesulitan: "mudah",
  },
  {
    kode_subdomain: "SMA-BARB-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Lengkapilah dialog berikut dengan menyusun kata-kata yang tersedia!

**سعيد:** ماذا تفعل في وقت الفراغ؟

**خالد:** ..........

(1) القصص (2) أحب (3) قراءة (4) العربية

Susunan jawaban Khalid yang benar adalah ....`,
    opsi_a: "3 – 1 – 2 – 4",
    opsi_b: "2 – 1 – 3 – 4",
    opsi_c: "1 – 4 – 2 – 3",
    opsi_d: "2 – 3 – 1 – 4",
    opsi_e: "2 – 3 – 4 – 1",
    kunci: "D",
    pembahasan: r`«أحب (2) قراءة (3) القصص (1) العربية (4)» = Saya suka membaca cerita-cerita berbahasa Arab.

- «قراءة القصص» adalah susunan iḍāfah (membaca cerita).
- «العربية» adalah na'at (sifat) bagi «القصص», jadi diletakkan **sesudahnya**. Pilihan E salah karena na'at mendahului man'ūt-nya.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_subdomain: "SMA-BARB-D2-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: r`Tentukan **Benar** atau **Salah** susunan kalimat berikut!`,
    opsi_a: "«ذهبت فاطمة إلى السوق مع أمها.»",
    opsi_b: "«هذه سيارة جديد.»",
    opsi_c: "«الطلاب المجتهدون في الفصل.»",
    kunci: "B,S,B",
    pembahasan: r`- «ذهبت فاطمة إلى السوق مع أمها» = Fatimah pergi ke pasar bersama ibunya. Fi'il «ذهبت» sesuai dengan fā'il perempuan → **Benar**.
- «سيارة» muannats, maka sifatnya harus muannats juga: «سيارة جديدة» → **Salah**.
- «الطلاب المجتهدون في الفصل» = Para siswa yang rajin ada di kelas. Na'at «المجتهدون» sesuai dengan «الطلاب» (jamak, ma'rifah) → **Benar**.`,
    tingkat_kesulitan: "sulit",
  },
  {
    kode_subdomain: "SMA-BARB-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: r`Urutkan kalimat-kalimat berikut menjadi paragraf yang padu!

(1) بعد ذلك أتوضأ وأصلي الصبح.
(2) أستيقظ من النوم في الساعة الرابعة والنصف.
(3) ثم أذهب إلى المدرسة بالدراجة.
(4) وبعد الصلاة أتناول الفطور مع أسرتي.

Urutan yang tepat adalah ....`,
    opsi_a: "1 – 2 – 4 – 3",
    opsi_b: "2 – 4 – 1 – 3",
    opsi_c: "2 – 1 – 4 – 3",
    opsi_d: "2 – 1 – 3 – 4",
    opsi_e: "4 – 2 – 1 – 3",
    kunci: "C",
    pembahasan: r`Urutan kegiatan pagi: bangun tidur (2) → «بعد ذلك» berwudu dan salat Subuh (1) → «وبعد الصلاة» sarapan (4) → «ثم» berangkat ke sekolah (3).

Kata penghubung «بعد ذلك», «وبعد الصلاة», dan «ثم» menunjukkan bahwa kalimat itu melanjutkan kegiatan sebelumnya. Kalimat (2) tidak memakai penghubung, jadi menjadi pembuka.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_subdomain: "SMA-BARB-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: r`Urutkan kalimat-kalimat berikut menjadi teks yang padu!

(1) ثم يزن الموظف الرسالة ويكتب ثمنها.
(2) يدخل خالد مكتب البريد ويقف في الصف.
(3) وأخيرًا يدفع خالد الثمن ويخرج من المكتب.
(4) عندما يصل دوره، يعطي الموظفَ الرسالةَ.

Urutan yang tepat adalah ....`,
    opsi_a: "2 – 1 – 4 – 3",
    opsi_b: "4 – 2 – 1 – 3",
    opsi_c: "2 – 4 – 3 – 1",
    opsi_d: "1 – 2 – 4 – 3",
    opsi_e: "2 – 4 – 1 – 3",
    kunci: "E",
    pembahasan: r`Khalid masuk kantor pos dan antre (2) → «عندما يصل دوره» saat gilirannya tiba, ia menyerahkan surat kepada petugas (4) → «ثم» petugas menimbang surat dan menulis biayanya (1) → «وأخيرًا» akhirnya Khalid membayar lalu keluar (3).

Kalimat (1) tidak bisa mendahului (4), karena petugas baru bisa menimbang surat setelah menerimanya.`,
    tingkat_kesulitan: "sulit",
  },
  {
    kode_subdomain: "SMA-BARB-D3-S2",
    bentuk_soal: "pg",
    pertanyaan: r`Bacalah teks berikut!

النظافة من الإيمان. يجب علينا أن نحافظ على نظافة البيئة. لا نرمي القمامة في النهر، ونزرع الأشجار حول البيت، ونستخدم الكيس القماشي بدلًا من الكيس البلاستيكي.

Ide pokok teks tersebut adalah ....`,
    opsi_a: "larangan membuang sampah ke sungai",
    opsi_b: "manfaat menanam pohon di sekitar rumah",
    opsi_c: "bahaya kantong plastik bagi lingkungan",
    opsi_d: "kewajiban menjaga kebersihan lingkungan",
    opsi_e: "cara mendaur ulang sampah plastik",
    kunci: "D",
    pembahasan: r`Kalimat utamanya: «يجب علينا أن نحافظ على نظافة البيئة» (kita wajib menjaga kebersihan lingkungan). Kalimat sesudahnya adalah contoh cara menjaganya: tidak membuang sampah ke sungai, menanam pohon, dan memakai tas kain.

Pilihan A, B, dan C hanya contoh (gagasan pendukung). Daur ulang tidak dibahas.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_subdomain: "SMA-BARB-D3-S3",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: r`Tentukan **Benar** atau **Salah** setiap pernyataan tentang bentuk kata (ṣarf) berikut!`,
    opsi_a: "«كاتب» adalah isim fā'il dari «كتب» yang berarti \"penulis\".",
    opsi_b: "«المدرّسون» adalah jamak mużakkar sālim dari «مدرّس».",
    opsi_c: "«مكتوب» berarti \"orang yang menulis\".",
    kunci: "B,B,S",
    pembahasan: r`- Pola «فاعل» dari «كتب» → «كاتب» = penulis (pelaku) → **Benar**.
- «مدرّس» + «ون» → «المدرّسون» = para guru laki-laki (jamak mużakkar sālim) → **Benar**.
- «مكتوب» berpola «مفعول» (isim maf'ūl) = **yang ditulis**/surat, bukan orang yang menulis → **Salah**.`,
    tingkat_kesulitan: "sulit",
  },
  {
    kode_subdomain: "SMA-BARB-D3-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: r`Bacalah teks berikut!

يعمل عمّي طبيبًا في مستشفى القرية. يخرج من البيت قبل طلوع الشمس، ويرجع في الليل. في يوم الجمعة يفحص المرضى الفقراء بدون أجرة. يقول عمّي: «صحة الناس أهم من المال».

Pilihlah **semua** kesimpulan yang tepat!`,
    opsi_a: "Paman bekerja dalam waktu yang panjang setiap hari.",
    opsi_b: "Paman peduli kepada orang yang kurang mampu.",
    opsi_c: "Paman bekerja di rumah sakit kota.",
    opsi_d: "Paman lebih mementingkan uang daripada kesehatan orang lain.",
    kunci: "A,B",
    pembahasan: r`- Berangkat sebelum matahari terbit dan pulang malam hari → jam kerjanya panjang → tepat.
- Memeriksa pasien miskin tanpa bayaran setiap Jumat → peduli kepada orang yang kurang mampu → tepat.
- Ia bekerja di rumah sakit **desa** (مستشفى القرية), bukan kota → tidak tepat.
- Ia berkata «صحة الناس أهم من المال» (kesehatan orang lebih penting daripada uang), kebalikan dari pilihan D → tidak tepat.`,
    tingkat_kesulitan: "sulit",
  },
];

export default {
  title: "TKA SMA Bahasa Arab — Paket 1",
  description:
    "25 soal membaca bahasa Arab: teks dan dialog sehari-hari (perpustakaan sekolah, apotek, keluarga, lingkungan), kosakata, sinonim–antonim, menyusun kata dan kalimat, serta nahwu–sharaf dasar. Dilengkapi 3 gambar dan pembahasan berbahasa Indonesia.",
  jenjang: "SMA",
  subjectCode: "SMA-BARB",
  durationMinutes: 50,
  isPremium: true,
  isFullSimulation: true,
  createdByEmail: "kpbgalimka@gmail.com",
  stimuli,
  rows,
  images: {
    papan: { title: "Papan aturan perpustakaan (إرشادات المكتبة)", svg: imgPapanPerpus() },
    poster: { title: "Poster Hari Lingkungan Sekolah (يوم البيئة المدرسي)", svg: imgPosterBiah() },
    jadwal: { title: "Jadwal pelajaran (جدول الدروس)", svg: imgJadwal() },
  },
};
