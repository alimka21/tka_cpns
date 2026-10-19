// TKA SMA Bahasa Indonesia — Paket 7 (bacaan & soal baru, ditulis untuk Pakar TKA).
// 30 soal dari 6 bacaan × 5 soal: 18 PG, 6 MCMA, 6 Kategori; 2 gambar baru (grafik).
const FONT = `font-family="Arial, Helvetica, sans-serif"`;
const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" ${FONT}><rect width="${w}" height="${h}" fill="#fff"/>${body}</svg>`;
const text = (x: number, y: number, t: string, o: { size?: number; anchor?: string; weight?: string; fill?: string } = {}) =>
  `<text x="${x}" y="${y}" font-size="${o.size ?? 16}" text-anchor="${o.anchor ?? "middle"}" font-weight="${o.weight ?? "normal"}" fill="${o.fill ?? "#111"}">${t}</text>`;
const line = (x1: number, y1: number, x2: number, y2: number, stroke = "#111", w = 2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${w}"/>`;

// Grafik garis suhu udara pusat kota vs desa.
function imgSuhu() {
  const ox = 80, oy = 380, ux = 100, uy = 22, base = 22; // suhu 22–36 °C
  const jam = ["06.00", "09.00", "12.00", "15.00", "18.00", "21.00"];
  const kota = [27, 31, 34, 35, 32, 30], desa = [24, 28, 31, 32, 28, 25];
  const X = (i: number) => ox + 40 + i * ux, Y = (t: number) => oy - (t - base) * uy;
  let s = text(370, 32, "Suhu Udara Kota Mentari dan Desa Sukasari (Agustus 2026)", { weight: "bold", size: 18 });
  for (let t = 22; t <= 36; t += 2) s += line(ox, Y(t), ox + 590, Y(t), "#e5e7eb", 1) + text(ox - 10, Y(t) + 5, String(t), { anchor: "end", size: 14 });
  s += line(ox, oy, ox + 590, oy) + line(ox, oy, ox, Y(36) - 10);
  jam.forEach((j, i) => (s += text(X(i), oy + 24, j, { size: 14 })));
  const series = (data: number[], color: string) =>
    `<polyline points="${data.map((t, i) => `${X(i)},${Y(t)}`).join(" ")}" fill="none" stroke="${color}" stroke-width="3"/>` +
    data.map((t, i) => `<circle cx="${X(i)}" cy="${Y(t)}" r="5" fill="${color}"/>` + text(X(i), Y(t) - 11, String(t), { size: 14, weight: "bold", fill: color })).join("");
  s += series(kota, "#dc2626") + series(desa, "#16a34a");
  s += `<text transform="translate(28 ${Y(29)}) rotate(-90)" font-size="15" font-weight="bold" text-anchor="middle">Suhu (°C)</text>`;
  s += text(ox + 300, oy + 50, "Pukul (WIB)", { weight: "bold", size: 15 });
  s += `<rect x="${ox + 380}" y="58" width="16" height="4" fill="#dc2626"/>` + text(ox + 402, 65, "Pusat Kota Mentari", { anchor: "start", size: 14 });
  s += `<rect x="${ox + 380}" y="80" width="16" height="4" fill="#16a34a"/>` + text(ox + 402, 87, "Desa Sukasari", { anchor: "start", size: 14 });
  return svg(720, 450, s);
}

// Infografis survei sarapan (300 siswa).
function imgSarapan() {
  let s = text(450, 34, "Survei Kebiasaan Sarapan SMA Harapan Bangsa (300 siswa, September 2026)", { weight: "bold", size: 18 });
  // Panel kiri: frekuensi sarapan (batang tegak)
  const freq: [string, number][] = [["Setiap hari", 22], ["3–5 hari", 33], ["1–2 hari", 27], ["Tidak pernah", 18]];
  const ox = 70, oy = 360, bw = 70, gap = 25, uy = 7;
  s += text(ox + 175, 72, "Frekuensi sarapan dalam sepekan", { weight: "bold", size: 15 });
  s += line(ox, oy, ox + 4 * (bw + gap) + 10, oy);
  freq.forEach(([label, v], i) => {
    const x = ox + 15 + i * (bw + gap);
    s += `<rect x="${x}" y="${oy - v * uy}" width="${bw}" height="${v * uy}" fill="#f59e0b"/>` + text(x + bw / 2, oy - v * uy - 8, `${v}%`, { weight: "bold" });
    s += text(x + bw / 2, oy + 22, label, { size: 13 });
  });
  // Panel kanan: alasan tidak sarapan setiap hari (batang mendatar)
  const why: [string, number][] = [["Tidak sempat (berangkat terlalu pagi)", 46], ["Tidak merasa lapar", 28], ["Makanan tidak tersedia", 15], ["Menjaga berat badan", 11]];
  const lx = 480, ux = 7;
  s += text(lx + 190, 72, "Alasan tidak sarapan setiap hari", { weight: "bold", size: 15 });
  why.forEach(([label, v], i) => {
    const y = 100 + i * 66;
    s += text(lx, y + 4, label, { anchor: "start", size: 13 });
    s += `<rect x="${lx}" y="${y + 12}" width="${v * ux}" height="26" fill="#3b82f6"/>` + text(lx + v * ux + 8, y + 31, `${v}%`, { anchor: "start", weight: "bold" });
  });
  s += text(lx + 190, 380, "(dari siswa yang tidak sarapan setiap hari)", { size: 12, fill: "#4b5563" });
  return svg(900, 400, s);
}

const stimuli = [
  {
    code: "SMA-BIND-P7-PANAS",
    title: "Pulau Panas di Tengah Kota",
    gambar: "grafik-suhu",
    content: `Pernahkah kamu merasa udara di pusat kota lebih gerah daripada di desa, padahal jaraknya hanya beberapa kilometer? Fenomena ini disebut pulau panas perkotaan (urban heat island), yaitu kondisi ketika suhu udara di kawasan kota lebih tinggi daripada daerah di sekitarnya.

Penyebab utamanya adalah perbedaan permukaan. Di kota, permukaan tanah sebagian besar tertutup aspal, beton, dan atap bangunan. Material tersebut menyerap panas matahari pada siang hari, lalu melepaskannya secara perlahan pada malam hari. Sebaliknya, di desa, vegetasi dan tanah terbuka menguapkan air sehingga udara di sekitarnya menjadi lebih sejuk.

Aktivitas manusia memperparah kondisi itu. Kendaraan bermotor, pendingin ruangan, dan mesin pabrik menghasilkan panas buangan. Gedung-gedung tinggi yang berdekatan juga menghambat aliran angin sehingga panas terperangkap di antara bangunan. Akibatnya, selisih suhu antara kota dan desa paling terasa pada malam hari, ketika desa sudah mendingin, sedangkan kota masih menyimpan panas.

Pulau panas perkotaan berdampak pada kesehatan dan pengeluaran warga. Udara yang panas membuat tubuh mudah lelah dan berisiko mengalami dehidrasi. Penggunaan pendingin ruangan juga meningkat sehingga konsumsi listrik ikut naik.

Dampak tersebut dapat dikurangi dengan menambah ruang terbuka hijau, menanam pohon peneduh di tepi jalan, membuat atap hijau, dan menggunakan cat atap berwarna terang yang memantulkan sinar matahari. Grafik berikut menunjukkan hasil pengukuran suhu udara di pusat Kota Mentari dan Desa Sukasari pada suatu hari di bulan Agustus 2026.`,
  },
  {
    code: "SMA-BIND-P7-KAMUS",
    title: "Siswa SMA di Mataram Luncurkan Aplikasi Kamus Bahasa Sasak",
    content: `Mataram — Tiga siswa SMA Negeri 9 Mataram meluncurkan aplikasi kamus digital bahasa Sasak bernama Lisan Sasak pada Sabtu (10/10/2026) di aula sekolah mereka. Aplikasi tersebut dapat diunduh gratis melalui ponsel pintar dan memuat lebih dari 5.000 kosakata beserta contoh kalimatnya.

Ketua tim, Lalu Ardiansyah, mengatakan bahwa ide itu muncul karena banyak teman sebayanya tidak lagi fasih berbahasa Sasak. "Kami ingin bahasa ibu kami tetap hidup di ponsel anak muda," ujarnya.

Selama enam bulan, tim mengumpulkan kosakata dengan mewawancarai tokoh adat dan guru bahasa daerah. Setiap entri kemudian dikurasi oleh dua guru pembimbing sebelum dimasukkan ke basis data. Aplikasi itu juga dilengkapi fitur rekaman suara agar pengguna dapat mendengar pelafalan yang benar.

Kepala Dinas Pendidikan setempat mengapresiasi inovasi tersebut. Ia berencana merekomendasikan aplikasi itu sebagai media pembelajaran muatan lokal di sekolah-sekolah di Pulau Lombok.

Dalam sepekan sejak diluncurkan, aplikasi itu telah diunduh lebih dari 3.000 kali. Tim berencana menambahkan fitur permainan kosakata pada versi berikutnya.`,
  },
  {
    code: "SMA-BIND-P7-LAMPU",
    title: "Lampu Minyak Nenek",
    content: `Listrik di desa Nenek padam sejak magrib. Dinda menatap layar ponselnya yang tinggal menyisakan baterai lima persen. "Kenapa sih harus mati lampu sekarang," gerutunya sambil melempar ponsel ke kasur.

Dari dapur terdengar bunyi korek api. Nenek muncul membawa lampu minyak berkaca kusam. Cahaya kuningnya bergoyang-goyang, membuat bayangan lemari tampak memanjang di dinding papan. Di luar, jangkrik bersahutan dan angin membawa bau tanah basah sisa hujan sore.

"Dulu, sebelum listrik masuk desa, Nenek belajar dengan lampu seperti ini setiap malam," kata Nenek sambil meletakkan lampu di meja. Ia lalu duduk, mengambil jarum dan benang, dan mulai menambal seragam Dinda yang robek di bagian lengan. Gerakannya pelan, tetapi tidak sekali pun salah tusuk.

Dinda diam. Ia memperhatikan jemari Nenek yang keriput, tetapi cekatan. "Nek, enggak capek matanya?"

Nenek tertawa kecil. "Mata ini sudah biasa. Yang penting hati tidak gelap."

Dinda tidak sepenuhnya mengerti maksud kalimat itu. Namun, entah mengapa, ia malu mengingat gerutuannya tadi. Sudah tiga hari ia menginap di rumah Nenek, dan selama itu matanya lebih sering menatap layar daripada wajah perempuan yang selalu menyiapkan sarapan untuknya sebelum subuh.

Malam itu, untuk pertama kalinya, Dinda bertanya tentang masa kecil Nenek. Nenek bercerita tentang sungai tempat ia mencuci, tentang berjalan kaki lima kilometer ke sekolah, dan tentang buku pelajaran yang harus dipakai bergantian dengan tiga kakaknya. Dinda mendengarkan sambil memeluk lutut. Sesekali ia tertawa, sesekali ia terdiam lama.

Menjelang pukul sembilan, lampu rumah tiba-tiba menyala. Kulkas berdengung, dan ponsel Dinda yang sejak tadi diisi daya berbunyi menandakan pesan masuk. Dinda melirik ponselnya sebentar, lalu kembali menatap Nenek.

"Nek, besok ajari aku menjahit, ya."`,
  },
  {
    code: "SMA-BIND-P7-PONSEL",
    title: "Ponsel di Ruang Kelas: Dilarang atau Diatur?",
    content: `**Pendapat 1 — Ponsel Sebaiknya Dilarang**

Ponsel sebaiknya tidak dibawa ke ruang kelas. Survei yang dilakukan OSIS SMA Bakti Mulia terhadap 240 siswa menunjukkan bahwa 63% siswa mengaku memeriksa media sosial setidaknya sekali selama jam pelajaran. Kebiasaan itu memecah konsentrasi. Setiap kali perhatian beralih, siswa membutuhkan waktu untuk kembali fokus pada penjelasan guru. Selain itu, ponsel dapat memicu perundungan daring dan kecemburuan karena tidak semua siswa memiliki gawai yang sama canggihnya. Dengan melarang ponsel, sekolah memberi ruang bagi para siswa-siswa untuk berinteraksi secara langsung.

**Pendapat 2 — Ponsel Perlu Diatur, Bukan Dilarang**

Melarang ponsel sepenuhnya bukanlah solusi. Ponsel adalah alat belajar: siswa dapat mencari referensi, mengerjakan kuis daring, atau memotret catatan di papan tulis. Saya setuju bahwa ponsel dapat mengganggu konsentrasi bila digunakan sembarangan. Karena itu, yang diperlukan adalah aturan yang jelas, misalnya ponsel disimpan di loker selama pelajaran dan hanya boleh digunakan atas izin guru untuk kegiatan belajar. Larangan total justru membuat siswa tidak belajar mengendalikan diri, padahal kemampuan itu sangat dibutuhkan setelah lulus.`,
  },
  {
    code: "SMA-BIND-P7-GARAM",
    title: "Garam di Tangan Bapak",
    content: `Matahari menggantung di atas tambak,
memeras laut menjadi butir putih,
dan Bapak berdiri sejak subuh
dengan caping yang telah pudar warnanya.

Kakinya akrab dengan lumpur asin,
tangannya mengeras seperti papan perahu,
ia menggaruk kristal-kristal garam
seolah memanen bintang yang jatuh semalam.

"Garam ini untuk bukumu, Nak,"
katanya sambil menyeka peluh di kening,
padahal harga sekarung garam
tak cukup membeli sepasang sepatu.

Kini setiap kali kusentuh garam di meja makan,
aku mencium bau laut dan keringat,
dan kudengar lagi suara Bapak
memanggil senja pulang ke rumah.`,
  },
  {
    code: "SMA-BIND-P7-SARAPAN",
    title: "Kebiasaan Sarapan Siswa SMA Harapan Bangsa",
    gambar: "grafik-sarapan",
    content: `OSIS SMA Harapan Bangsa melakukan survei tentang kebiasaan sarapan siswa pada September 2026. Survei melibatkan 300 siswa kelas X–XII yang mengisi kuesioner daring secara sukarela.

Hasil survei menunjukkan bahwa hanya 22% siswa sarapan setiap hari. Sebanyak 33% siswa sarapan 3–5 hari dalam sepekan, 27% sarapan 1–2 hari, dan 18% tidak pernah sarapan. Alasan yang paling banyak disebutkan oleh siswa yang tidak sarapan setiap hari adalah tidak sempat karena berangkat terlalu pagi (46%), diikuti tidak merasa lapar (28%), makanan tidak tersedia di rumah (15%), dan sedang menjaga berat badan (11%).

Kebiasaan melewatkan sarapan dapat berpengaruh terhadap kegiatan belajar. Data daripada wawancara dengan wali kelas menunjukkan bahwa siswa yang tidak sarapan lebih sering mengeluh pusing dan mengantuk pada jam pelajaran pertama.

Berdasarkan hasil tersebut, OSIS mengusulkan dua hal: kantin sekolah dibuka lebih awal, yaitu pukul 06.15, dan sekolah mengadakan kampanye "Sarapan Dulu, Baru Belajar" melalui media sosial sekolah.`,
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
  kode_stimulus: string;
};

const rows: Row[] = [
  // ---- 1. Pulau panas ----
  {
    kode_stimulus: "SMA-BIND-P7-PANAS",
    kode_subdomain: "SMA-BIND-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: "Ide pokok paragraf ketiga teks tersebut adalah ....",
    opsi_a: "Kendaraan bermotor menghasilkan panas buangan di kota.",
    opsi_b: "Aktivitas manusia memperparah pulau panas perkotaan.",
    opsi_c: "Gedung tinggi menghambat aliran angin di kota.",
    opsi_d: "Desa lebih cepat mendingin pada malam hari.",
    opsi_e: "Pendingin ruangan banyak digunakan di kota.",
    kunci: "B",
    pembahasan: "Kalimat utama paragraf ketiga berada di awal: \"Aktivitas manusia memperparah kondisi itu.\" Kalimat-kalimat berikutnya (panas buangan kendaraan, gedung yang menghambat angin, selisih suhu malam hari) merupakan rincian atau penjelas.",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SMA-BIND-P7-PANAS",
    kode_subdomain: "SMA-BIND-D3-S2",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Bandingkan isi teks dengan grafik. Tentukan **Benar** atau **Salah** setiap pernyataan berikut!",
    opsi_a: "Grafik mendukung pernyataan teks bahwa selisih suhu kota dan desa paling terasa pada malam hari.",
    opsi_b: "Pada pukul 15.00, suhu pusat Kota Mentari 3 °C lebih tinggi daripada suhu Desa Sukasari.",
    opsi_c: "Suhu tertinggi di Desa Sukasari terjadi pada pukul 12.00.",
    kunci: "B,B,S",
    pembahasan: "Selisih suhu: pukul 06.00–15.00 masing-masing 3 °C, pukul 18.00 4 °C, dan pukul 21.00 5 °C (terbesar, malam hari), sehingga pernyataan 1 **Benar**. Pukul 15.00: 35 − 32 = 3 °C, **Benar**. Suhu tertinggi desa adalah 32 °C pada pukul 15.00, bukan pukul 12.00 (31 °C), sehingga pernyataan 3 **Salah**.",
    tingkat_kesulitan: "sulit",
  },
  {
    kode_stimulus: "SMA-BIND-P7-PANAS",
    kode_subdomain: "SMA-BIND-D2-S2",
    bentuk_soal: "pgk_mcma",
    pertanyaan: "Pasangan pernyataan yang menunjukkan hubungan sebab-akibat sesuai isi teks adalah .... (pilih semua jawaban yang benar)",
    opsi_a: "Aspal dan beton menyimpan panas siang hari → kota tetap hangat pada malam hari.",
    opsi_b: "Gedung tinggi yang berdekatan menghambat aliran angin → panas terperangkap di antara bangunan.",
    opsi_c: "Vegetasi dan tanah terbuka menguapkan air → udara desa menjadi lebih panas.",
    opsi_d: "Penggunaan pendingin ruangan meningkat → konsumsi listrik ikut naik.",
    kunci: "A,B,D",
    pembahasan: "A, B, dan D sesuai dengan paragraf kedua, ketiga, dan keempat. C keliru: penguapan oleh vegetasi justru membuat udara desa **lebih sejuk**.",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SMA-BIND-P7-PANAS",
    kode_subdomain: "SMA-BIND-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: "Makna kata serapan **vegetasi** dalam paragraf kedua adalah ....",
    opsi_a: "lapisan tanah gembur di permukaan bumi",
    opsi_b: "tumbuh-tumbuhan yang menutupi suatu wilayah",
    opsi_c: "sistem pengairan di lahan pertanian",
    opsi_d: "udara lembap di sekitar pepohonan",
    opsi_e: "kawasan hutan yang dilindungi pemerintah",
    kunci: "B",
    pembahasan: "Vegetasi (dari bahasa Inggris \"vegetation\") berarti tumbuh-tumbuhan yang menutupi suatu daerah. Dalam teks, vegetasi disandingkan dengan tanah terbuka sebagai permukaan di desa yang menguapkan air.",
    tingkat_kesulitan: "mudah",
  },
  {
    kode_stimulus: "SMA-BIND-P7-PANAS",
    kode_subdomain: "SMA-BIND-D3-S1",
    bentuk_soal: "pg",
    pertanyaan: "Upaya sekolah di tengah kota yang paling sesuai dengan isi teks untuk mengurangi panas di lingkungan sekolah adalah ....",
    opsi_a: "memasang pendingin ruangan di setiap kelas",
    opsi_b: "mengganti halaman berumput dengan lantai beton",
    opsi_c: "menanam pohon peneduh di halaman dan area parkir",
    opsi_d: "mengecat atap sekolah dengan warna gelap",
    opsi_e: "menutup jendela kelas sepanjang hari",
    kunci: "C",
    pembahasan: "Teks menyarankan ruang terbuka hijau, pohon peneduh, atap hijau, dan cat atap berwarna terang. A justru menambah panas buangan dan konsumsi listrik, B menambah permukaan penyerap panas, D kebalikan dari saran teks, dan E tidak dibahas.",
    tingkat_kesulitan: "sedang",
  },
  // ---- 2. Berita aplikasi kamus ----
  {
    kode_stimulus: "SMA-BIND-P7-KAMUS",
    kode_subdomain: "SMA-BIND-D1-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: "Kata serapan dari bahasa asing yang terdapat dalam berita tersebut adalah .... (pilih semua jawaban yang benar)",
    opsi_a: "aplikasi",
    opsi_b: "fitur",
    opsi_c: "diunduh",
    opsi_d: "pembimbing",
    kunci: "A,B",
    pembahasan: "Aplikasi (dari \"application\") dan fitur (dari \"feature\") diserap dari bahasa Inggris. Unduh merupakan kata serapan dari bahasa daerah (Jawa: \"ngunduh\"), bukan bahasa asing, sedangkan pembimbing adalah kata asli bahasa Indonesia (bimbing + pe-).",
    tingkat_kesulitan: "sulit",
  },
  {
    kode_stimulus: "SMA-BIND-P7-KAMUS",
    kode_subdomain: "SMA-BIND-D1-S3",
    bentuk_soal: "pg",
    pertanyaan: "Kerangka berita yang sesuai dengan urutan paragraf adalah ....",
    opsi_a: "peluncuran aplikasi → latar belakang ide → proses pembuatan → tanggapan pemerintah → capaian dan rencana",
    opsi_b: "latar belakang ide → peluncuran aplikasi → tanggapan pemerintah → proses pembuatan → capaian dan rencana",
    opsi_c: "peluncuran aplikasi → proses pembuatan → latar belakang ide → capaian dan rencana → tanggapan pemerintah",
    opsi_d: "proses pembuatan → peluncuran aplikasi → latar belakang ide → tanggapan pemerintah → capaian dan rencana",
    opsi_e: "peluncuran aplikasi → tanggapan pemerintah → latar belakang ide → proses pembuatan → capaian dan rencana",
    kunci: "A",
    pembahasan: "Paragraf 1: peluncuran aplikasi; paragraf 2: alasan munculnya ide; paragraf 3: proses mengumpulkan dan mengurasi kosakata; paragraf 4: apresiasi Dinas Pendidikan; paragraf 5: jumlah unduhan dan rencana fitur baru.",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SMA-BIND-P7-KAMUS",
    kode_subdomain: "SMA-BIND-D3-S2",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Tentukan **Benar** atau **Salah** setiap pernyataan tentang kelengkapan informasi dalam berita tersebut!",
    opsi_a: "Berita menyebutkan pihak yang membuat aplikasi.",
    opsi_b: "Berita menyebutkan lama waktu pengembangan aplikasi.",
    opsi_c: "Berita menjelaskan besarnya biaya pengembangan aplikasi.",
    kunci: "B,B,S",
    pembahasan: "Pembuat aplikasi disebutkan (tiga siswa SMA Negeri 9 Mataram) dan lama pengembangannya juga disebutkan (enam bulan). Biaya pengembangan tidak disebutkan sama sekali dalam berita.",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SMA-BIND-P7-KAMUS",
    kode_subdomain: "SMA-BIND-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: "Hubungan isi paragraf ketiga dengan paragraf kedua adalah ....",
    opsi_a: "Paragraf ketiga membantah alasan yang disampaikan pada paragraf kedua.",
    opsi_b: "Paragraf ketiga menjelaskan cara tim mewujudkan gagasan yang disampaikan pada paragraf kedua.",
    opsi_c: "Paragraf ketiga merupakan akibat dari tanggapan pemerintah pada paragraf kedua.",
    opsi_d: "Paragraf ketiga memberikan contoh kosakata yang disebutkan pada paragraf kedua.",
    opsi_e: "Paragraf ketiga mengulang informasi paragraf kedua dengan kalimat berbeda.",
    kunci: "B",
    pembahasan: "Paragraf kedua berisi gagasan atau alasan (agar bahasa Sasak tetap hidup di ponsel anak muda). Paragraf ketiga menjelaskan proses mewujudkannya: mewawancarai tokoh adat, mengurasi entri, dan menambahkan fitur rekaman suara.",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SMA-BIND-P7-KAMUS",
    kode_subdomain: "SMA-BIND-D3-S1",
    bentuk_soal: "pg",
    pertanyaan: "Pelajaran dari berita tersebut yang paling relevan bagi pelajar adalah ....",
    opsi_a: "Pelajar sebaiknya hanya menggunakan bahasa daerah dalam kehidupan sehari-hari.",
    opsi_b: "Pelajar dapat memanfaatkan teknologi untuk melestarikan bahasa dan budaya daerah.",
    opsi_c: "Aplikasi gratis selalu lebih bermanfaat daripada aplikasi berbayar.",
    opsi_d: "Pembuatan aplikasi hanya dapat dilakukan oleh siswa jurusan komputer.",
    opsi_e: "Pelajar harus membuat aplikasi agar mendapat penghargaan dari pemerintah.",
    kunci: "B",
    pembahasan: "Inti berita adalah inisiatif siswa memakai aplikasi digital untuk menjaga bahasa Sasak. Pilihan lain berlebihan atau tidak didukung isi berita.",
    tingkat_kesulitan: "mudah",
  },
  // ---- 3. Cerpen ----
  {
    kode_stimulus: "SMA-BIND-P7-LAMPU",
    kode_subdomain: "SMA-BIND-D1-S2",
    bentuk_soal: "pg",
    pertanyaan: "Kutipan yang menunjukkan latar waktu dan suasana malam di desa adalah ....",
    opsi_a: "Dinda menatap layar ponselnya yang tinggal menyisakan baterai lima persen.",
    opsi_b: "Di luar, jangkrik bersahutan dan angin membawa bau tanah basah sisa hujan sore.",
    opsi_c: "Ia memperhatikan jemari Nenek yang keriput, tetapi cekatan.",
    opsi_d: "Nenek bercerita tentang sungai tempat ia mencuci.",
    opsi_e: "\"Nek, besok ajari aku menjahit, ya.\"",
    kunci: "B",
    pembahasan: "Kosakata \"jangkrik bersahutan\" dan \"bau tanah basah sisa hujan sore\" menggambarkan suasana malam yang sunyi di desa setelah hujan. Kutipan lain tidak menunjukkan latar waktu dan suasana.",
    tingkat_kesulitan: "mudah",
  },
  {
    kode_stimulus: "SMA-BIND-P7-LAMPU",
    kode_subdomain: "SMA-BIND-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: "Konflik utama dalam cerpen tersebut adalah ....",
    opsi_a: "pertengkaran Dinda dan Nenek karena listrik padam",
    opsi_b: "pergulatan batin Dinda antara rasa kesal dan rasa malu karena kurang memperhatikan Nenek",
    opsi_c: "kesulitan Nenek menambal seragam Dinda di bawah cahaya lampu minyak",
    opsi_d: "perselisihan warga desa dengan petugas listrik",
    opsi_e: "kekhawatiran Dinda karena ponselnya rusak",
    kunci: "B",
    pembahasan: "Dinda awalnya kesal karena mati lampu, lalu merasa malu menyadari ia lebih sering menatap layar daripada memperhatikan Nenek. Konfliknya terjadi di dalam diri tokoh (konflik batin), bukan pertengkaran dengan tokoh lain.",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SMA-BIND-P7-LAMPU",
    kode_subdomain: "SMA-BIND-D2-S3",
    bentuk_soal: "pg",
    pertanyaan: "Prediksi lanjutan cerita yang paling sesuai dengan akhir cerpen tersebut adalah ....",
    opsi_a: "Dinda segera membalas semua pesan di ponselnya hingga larut malam.",
    opsi_b: "Dinda meminta pulang ke kota karena tidak betah di rumah Nenek.",
    opsi_c: "Keesokan harinya Dinda belajar menjahit bersama Nenek dan lebih jarang memegang ponsel.",
    opsi_d: "Nenek menolak mengajari Dinda karena menjahit pekerjaan yang sulit.",
    opsi_e: "Listrik kembali padam sehingga Dinda kembali menggerutu.",
    kunci: "C",
    pembahasan: "Dinda hanya melirik ponsel sebentar, lalu kembali menatap Nenek dan meminta diajari menjahit. Itu menunjukkan perubahan sikap, sehingga lanjutan yang logis adalah Dinda menghabiskan waktu bersama Nenek. A dan E bertentangan dengan perubahan sikap itu, sedangkan B dan D tidak didukung cerita.",
    tingkat_kesulitan: "sulit",
  },
  {
    kode_stimulus: "SMA-BIND-P7-LAMPU",
    kode_subdomain: "SMA-BIND-D3-S4",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Tentukan **Benar** jika kutipan berikut tepat menggambarkan watak Nenek yang tekun, sabar, dan bijak, atau **Salah** jika tidak!",
    opsi_a: "\"Gerakannya pelan, tetapi tidak sekali pun salah tusuk.\"",
    opsi_b: "\"Nenek tertawa kecil. 'Mata ini sudah biasa. Yang penting hati tidak gelap.'\"",
    opsi_c: "\"Kulkas berdengung, dan ponsel Dinda yang sejak tadi diisi daya berbunyi menandakan pesan masuk.\"",
    kunci: "B,B,S",
    pembahasan: "Kutipan 1 menggambarkan ketekunan dan ketelitian Nenek. Kutipan 2 menunjukkan kesabaran (tidak mengeluh) dan kebijaksanaan (nasihat tentang hati). Kutipan 3 hanya menggambarkan suasana saat listrik menyala, bukan watak Nenek.",
    tingkat_kesulitan: "sulit",
  },
  {
    kode_stimulus: "SMA-BIND-P7-LAMPU",
    kode_subdomain: "SMA-BIND-D3-S5",
    bentuk_soal: "pg",
    pertanyaan: "Respons emosional pembaca yang paling sesuai saat membaca bagian ketika Dinda merasa malu atas gerutuannya adalah ....",
    opsi_a: "marah karena Dinda bersikap tidak sopan kepada Nenek",
    opsi_b: "tersentuh sekaligus tersadar untuk lebih memperhatikan orang-orang terdekat",
    opsi_c: "takut karena suasana rumah Nenek gelap dan sepi",
    opsi_d: "bosan karena cerita tidak memiliki ketegangan",
    opsi_e: "iri karena Nenek memiliki keterampilan menjahit",
    kunci: "B",
    pembahasan: "Bagian itu memperlihatkan kesadaran Dinda bahwa ia mengabaikan Nenek yang selalu memperhatikannya. Respons yang sesuai adalah tersentuh (haru) dan ikut tersadar. Pilihan lain tidak sejalan dengan nada cerita yang hangat.",
    tingkat_kesulitan: "sedang",
  },
  // ---- 4. Dua opini ponsel ----
  {
    kode_stimulus: "SMA-BIND-P7-PONSEL",
    kode_subdomain: "SMA-BIND-D2-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: "Gagasan pendukung Pendapat 1 adalah .... (pilih semua jawaban yang benar)",
    opsi_a: "63% siswa mengaku memeriksa media sosial selama jam pelajaran.",
    opsi_b: "Siswa membutuhkan waktu untuk kembali fokus setiap kali perhatiannya beralih.",
    opsi_c: "Ponsel dapat digunakan untuk mengerjakan kuis daring.",
    opsi_d: "Ponsel dapat memicu perundungan daring dan kecemburuan.",
    kunci: "A,B,D",
    pembahasan: "A, B, dan D mendukung gagasan bahwa ponsel sebaiknya dilarang. C merupakan gagasan pendukung Pendapat 2 (ponsel sebagai alat belajar).",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SMA-BIND-P7-PONSEL",
    kode_subdomain: "SMA-BIND-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: "Hubungan isi kedua pendapat tersebut adalah ....",
    opsi_a: "Kedua pendapat sepenuhnya bertentangan dan tidak memiliki kesamaan sedikit pun.",
    opsi_b: "Kedua pendapat berbeda dalam solusi, tetapi sama-sama mengakui ponsel dapat mengganggu konsentrasi.",
    opsi_c: "Pendapat 2 merupakan data pendukung bagi Pendapat 1.",
    opsi_d: "Pendapat 1 merupakan kesimpulan dari Pendapat 2.",
    opsi_e: "Kedua pendapat sama-sama menolak penggunaan ponsel di sekolah.",
    kunci: "B",
    pembahasan: "Pendapat 1 mengusulkan larangan, sedangkan Pendapat 2 mengusulkan aturan. Keduanya berbeda solusi, tetapi Pendapat 2 secara tersurat menyatakan, \"Saya setuju bahwa ponsel dapat mengganggu konsentrasi bila digunakan sembarangan.\"",
    tingkat_kesulitan: "sulit",
  },
  {
    kode_stimulus: "SMA-BIND-P7-PONSEL",
    kode_subdomain: "SMA-BIND-D3-S2",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Tentukan **Benar** atau **Salah** setiap penilaian berikut terhadap kedua pendapat!",
    opsi_a: "Pendapat 1 didukung data hasil survei.",
    opsi_b: "Pendapat 2 didukung data dari sumber resmi pemerintah.",
    opsi_c: "Kedua pendapat sama-sama mengakui bahwa ponsel dapat mengganggu konsentrasi.",
    kunci: "B,S,B",
    pembahasan: "Pendapat 1 memakai data survei OSIS terhadap 240 siswa (**Benar**). Pendapat 2 hanya memakai alasan dan contoh tanpa data atau sumber resmi (**Salah**). Kedua pendapat menyebut ponsel dapat mengganggu konsentrasi (**Benar**).",
    tingkat_kesulitan: "sulit",
  },
  {
    kode_stimulus: "SMA-BIND-P7-PONSEL",
    kode_subdomain: "SMA-BIND-D3-S3",
    bentuk_soal: "pg",
    pertanyaan: "Kalimat terakhir Pendapat 1 tidak efektif. Perbaikan yang tepat adalah ....",
    opsi_a: "Dengan melarang ponsel, sekolah memberi ruang bagi para siswa untuk berinteraksi secara langsung.",
    opsi_b: "Dengan melarang ponsel, sekolah memberi ruang bagi para siswa-siswi untuk berinteraksi secara langsung.",
    opsi_c: "Dengan dilarangnya ponsel, sekolah memberikan ruang bagi siswa-siswa untuk berinteraksi.",
    opsi_d: "Dengan melarang ponsel, maka sekolah memberi ruang bagi para siswa untuk berinteraksi secara langsung.",
    opsi_e: "Dengan melarang ponsel sekolah memberi ruang, bagi para siswa-siswa berinteraksi langsung.",
    kunci: "A",
    pembahasan: "\"Para siswa-siswa\" berlebihan karena \"para\" dan bentuk ulang sama-sama menyatakan jamak; cukup \"para siswa\". Pilihan B dan C masih jamak ganda, D menambahkan \"maka\" yang tidak perlu setelah \"dengan\", dan E salah tanda baca serta masih jamak ganda.",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SMA-BIND-P7-PONSEL",
    kode_subdomain: "SMA-BIND-D3-S1",
    bentuk_soal: "pg",
    pertanyaan: "Kebijakan sekolah yang dapat menjawab kekhawatiran Pendapat 1 sekaligus mempertimbangkan Pendapat 2 adalah ....",
    opsi_a: "Siswa bebas menggunakan ponsel kapan saja selama pelajaran.",
    opsi_b: "Ponsel disita permanen bila ketahuan dibawa ke sekolah.",
    opsi_c: "Ponsel disimpan di loker selama pelajaran dan digunakan hanya atas izin guru untuk kegiatan belajar.",
    opsi_d: "Sekolah menghapus semua tugas yang memerlukan internet.",
    opsi_e: "Guru dilarang memberikan kuis daring kepada siswa.",
    kunci: "C",
    pembahasan: "C mengurangi gangguan konsentrasi (kekhawatiran Pendapat 1) tetapi tetap memungkinkan ponsel dipakai sebagai alat belajar (Pendapat 2). Pilihan lain hanya memihak satu pendapat secara ekstrem.",
    tingkat_kesulitan: "mudah",
  },
  // ---- 5. Puisi ----
  {
    kode_stimulus: "SMA-BIND-P7-GARAM",
    kode_subdomain: "SMA-BIND-D1-S2",
    bentuk_soal: "pg",
    pertanyaan: "Kosakata dalam puisi tersebut menunjukkan latar tempat ....",
    opsi_a: "sawah di lereng pegunungan",
    opsi_b: "tambak garam di tepi pantai",
    opsi_c: "pasar ikan di tengah kota",
    opsi_d: "pelabuhan kapal di pulau terpencil",
    opsi_e: "kebun kelapa di perbukitan",
    kunci: "B",
    pembahasan: "Kosakata \"tambak\", \"memeras laut menjadi butir putih\", \"lumpur asin\", dan \"kristal-kristal garam\" menunjukkan latar tambak garam di tepi pantai.",
    tingkat_kesulitan: "mudah",
  },
  {
    kode_stimulus: "SMA-BIND-P7-GARAM",
    kode_subdomain: "SMA-BIND-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: "Amanat yang paling tepat dari puisi tersebut adalah ....",
    opsi_a: "Kita harus menghemat garam di meja makan.",
    opsi_b: "Pekerjaan petani garam lebih mudah daripada nelayan.",
    opsi_c: "Hargailah kerja keras dan pengorbanan orang tua demi pendidikan anaknya.",
    opsi_d: "Anak sebaiknya meneruskan pekerjaan orang tuanya.",
    opsi_e: "Harga garam harus dinaikkan agar petani sejahtera.",
    kunci: "C",
    pembahasan: "Bapak bekerja sejak subuh dan berkata, \"Garam ini untuk bukumu, Nak,\" meskipun hasilnya kecil. Aku lirik mengenang pengorbanan itu. Amanatnya adalah menghargai kerja keras dan pengorbanan orang tua.",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SMA-BIND-P7-GARAM",
    kode_subdomain: "SMA-BIND-D3-S5",
    bentuk_soal: "pgk_mcma",
    pertanyaan: "Respons emosional pembaca yang sesuai dengan isi puisi tersebut adalah .... (pilih semua jawaban yang benar)",
    opsi_a: "haru melihat pengorbanan Bapak demi pendidikan anaknya",
    opsi_b: "iba karena kerja keras Bapak tidak sebanding dengan hasilnya",
    opsi_c: "gembira karena Bapak hidup berkecukupan dari hasil garam",
    opsi_d: "marah kepada anak yang melupakan jasa bapaknya",
    kunci: "A,B",
    pembahasan: "Bait ketiga (\"harga sekarung garam / tak cukup membeli sepasang sepatu\") memunculkan rasa iba, dan ucapan \"Garam ini untuk bukumu, Nak\" memunculkan rasa haru. C bertentangan dengan isi puisi, dan D keliru karena aku lirik justru mengenang Bapak dengan penuh rindu.",
    tingkat_kesulitan: "sulit",
  },
  {
    kode_stimulus: "SMA-BIND-P7-GARAM",
    kode_subdomain: "SMA-BIND-D3-S4",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Tentukan **Benar** jika larik berikut tepat menggambarkan kerja keras Bapak, atau **Salah** jika tidak!",
    opsi_a: "dan Bapak berdiri sejak subuh",
    opsi_b: "tangannya mengeras seperti papan perahu",
    opsi_c: "Kini setiap kali kusentuh garam di meja makan",
    kunci: "B,B,S",
    pembahasan: "Larik 1 menunjukkan Bapak bekerja sejak pagi buta, dan larik 2 menunjukkan tangan yang mengeras karena bekerja berat. Larik 3 menggambarkan aku lirik pada masa kini, bukan kerja keras Bapak.",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SMA-BIND-P7-GARAM",
    kode_subdomain: "SMA-BIND-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: "Hubungan bait keempat dengan bait-bait sebelumnya adalah ....",
    opsi_a: "Bait keempat membantah gambaran Bapak pada bait sebelumnya.",
    opsi_b: "Bait keempat berisi kenangan aku lirik pada masa kini tentang Bapak yang digambarkan pada bait sebelumnya.",
    opsi_c: "Bait keempat menceritakan Bapak yang berhenti menjadi petani garam.",
    opsi_d: "Bait keempat menggambarkan latar yang berbeda dan tidak berkaitan dengan bait sebelumnya.",
    opsi_e: "Bait keempat menjelaskan cara membuat garam dari air laut.",
    kunci: "B",
    pembahasan: "Kata \"Kini\" menandai perpindahan waktu ke masa sekarang. Garam di meja makan membangkitkan kenangan tentang Bapak di tambak (bait 1–3), sehingga bait keempat merupakan kenangan atau refleksi aku lirik.",
    tingkat_kesulitan: "sedang",
  },
  // ---- 6. Laporan survei sarapan ----
  {
    kode_stimulus: "SMA-BIND-P7-SARAPAN",
    kode_subdomain: "SMA-BIND-D1-S3",
    bentuk_soal: "pg",
    pertanyaan: "Kerangka laporan yang sesuai dengan urutan paragraf adalah ....",
    opsi_a: "pelaksanaan survei → hasil survei → dampak tidak sarapan → usulan OSIS",
    opsi_b: "hasil survei → pelaksanaan survei → usulan OSIS → dampak tidak sarapan",
    opsi_c: "usulan OSIS → pelaksanaan survei → hasil survei → dampak tidak sarapan",
    opsi_d: "dampak tidak sarapan → hasil survei → pelaksanaan survei → usulan OSIS",
    opsi_e: "pelaksanaan survei → usulan OSIS → hasil survei → dampak tidak sarapan",
    kunci: "A",
    pembahasan: "Paragraf 1: waktu, tujuan, dan responden survei; paragraf 2: hasil survei; paragraf 3: dampak melewatkan sarapan; paragraf 4: usulan OSIS.",
    tingkat_kesulitan: "mudah",
  },
  {
    kode_stimulus: "SMA-BIND-P7-SARAPAN",
    kode_subdomain: "SMA-BIND-D3-S2",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Berdasarkan teks dan grafik, tentukan **Benar** atau **Salah** setiap pernyataan berikut!",
    opsi_a: "Hampir separuh siswa yang tidak sarapan setiap hari beralasan tidak sempat karena berangkat terlalu pagi.",
    opsi_b: "Lebih dari separuh responden sarapan setiap hari.",
    opsi_c: "Banyak siswa yang tidak pernah sarapan adalah 54 orang.",
    kunci: "B,S,B",
    pembahasan: "Alasan \"tidak sempat\" sebesar 46%, mendekati separuh (**Benar**). Yang sarapan setiap hari hanya 22% (**Salah**). Tidak pernah sarapan: 18% × 300 = 54 siswa (**Benar**).",
    tingkat_kesulitan: "sulit",
  },
  {
    kode_stimulus: "SMA-BIND-P7-SARAPAN",
    kode_subdomain: "SMA-BIND-D2-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: "Simpulan yang sesuai dengan isi laporan tersebut adalah .... (pilih semua jawaban yang benar)",
    opsi_a: "Sebagian besar siswa tidak sarapan setiap hari.",
    opsi_b: "Alasan utama siswa tidak sarapan berkaitan dengan waktu berangkat yang terlalu pagi.",
    opsi_c: "Semua siswa yang tidak sarapan pasti mengantuk di kelas.",
    opsi_d: "Kantin sekolah selama ini sudah buka sebelum pukul 06.00.",
    kunci: "A,B",
    pembahasan: "Sebanyak 78% siswa (33% + 27% + 18%) tidak sarapan setiap hari (A benar), dan alasan terbanyak adalah tidak sempat karena berangkat terlalu pagi (B benar). C menggeneralisasi berlebihan (teks hanya menyebut \"lebih sering\"). D bertentangan dengan usulan agar kantin dibuka lebih awal, yaitu pukul 06.15.",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SMA-BIND-P7-SARAPAN",
    kode_subdomain: "SMA-BIND-D3-S3",
    bentuk_soal: "pg",
    pertanyaan: "Kalimat yang tidak baku dalam paragraf ketiga beserta perbaikannya yang tepat adalah ....",
    opsi_a: "\"Data daripada wawancara ...\" → \"Data dari wawancara ...\"",
    opsi_b: "\"Kebiasaan melewatkan sarapan ...\" → \"Kebiasaan meninggalkan sarapan ...\"",
    opsi_c: "\"... mengeluh pusing dan mengantuk ...\" → \"... mengeluhkan pusing dan ngantuk ...\"",
    opsi_d: "\"... pada jam pelajaran pertama.\" → \"... di jam pelajaran pertama.\"",
    opsi_e: "\"... dapat berpengaruh terhadap ...\" → \"... dapat berpengaruh kepada ...\"",
    kunci: "A",
    pembahasan: "Kata \"daripada\" dipakai untuk membandingkan. Untuk menyatakan asal atau sumber, gunakan \"dari\": \"Data dari wawancara ...\". Perbaikan pada pilihan lain tidak diperlukan atau justru tidak baku (\"ngantuk\").",
    tingkat_kesulitan: "sulit",
  },
  {
    kode_stimulus: "SMA-BIND-P7-SARAPAN",
    kode_subdomain: "SMA-BIND-D3-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: "Tindakan siswa yang relevan dengan isi laporan tersebut adalah .... (pilih semua jawaban yang benar)",
    opsi_a: "menyiapkan menu sarapan sederhana sejak malam sebelumnya",
    opsi_b: "membawa bekal sarapan ke sekolah bila berangkat terlalu pagi",
    opsi_c: "melewatkan sarapan agar tidak terlambat masuk sekolah",
    opsi_d: "sarapan di kantin yang dibuka lebih awal sebelum pelajaran dimulai",
    kunci: "A,B,D",
    pembahasan: "A, B, dan D mengatasi alasan utama (tidak sempat) dan sejalan dengan usulan OSIS. C justru melanjutkan kebiasaan yang ingin diubah oleh laporan.",
    tingkat_kesulitan: "sedang",
  },
];

export default {
  title: "TKA SMA Bahasa Indonesia — Paket 7",
  description: "30 soal dari 6 bacaan: teks eksplanasi bergrafik, berita, cerpen, dua opini, puisi, dan laporan survei bergrafik.",
  jenjang: "SMA",
  subjectCode: "SMA-BIND",
  durationMinutes: 60,
  isPremium: true,
  isFullSimulation: true,
  createdByEmail: "kpbgalimka@gmail.com",
  stimuli,
  rows,
  images: {
    "grafik-suhu": { title: "Grafik suhu kota dan desa", svg: imgSuhu() },
    "grafik-sarapan": { title: "Infografis survei sarapan siswa", svg: imgSarapan() },
  },
};
