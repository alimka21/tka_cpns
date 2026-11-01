// TKA SD Bahasa Indonesia — Paket 5 (ditulis Claude). 6 bacaan × 5 soal: 18 PG · 6 MCMA · 6 Kategori;
// 10/10 subtopik (3 soal masing-masing); mudah 6 · sedang 16 · sulit 8. 2 gambar SVG baru: label kemasan
// susu & surat undangan pentas seni. Bacaan ±150–200 kata, kalimat pendek (kerangka SD).
// Pembahasan membahas setiap pilihan (kenapa benar / salah).
const FONT = `font-family="Arial, Helvetica, sans-serif"`;
const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" ${FONT}><rect width="${w}" height="${h}" fill="#fff"/>${body}</svg>`;
const text = (x: number, y: number, t: string, o: { size?: number; anchor?: string; weight?: string; fill?: string } = {}) =>
  `<text x="${x}" y="${y}" font-size="${o.size ?? 18}" text-anchor="${o.anchor ?? "middle"}" font-weight="${o.weight ?? "normal"}" fill="${o.fill ?? "#111"}">${t}</text>`;
const left = (x: number, y: number, t: string, o: { size?: number; weight?: string; fill?: string } = {}) => text(x, y, t, { ...o, anchor: "start" });

// ---------- Gambar ----------

// Stimulus label kemasan susu (fiktif). Baik digunakan sebelum 15 01 2027; habiskan 2 hari setelah dibuka.
function imgLabel() {
  let s = `<rect x="10" y="10" width="740" height="620" rx="16" fill="#fff7ed" stroke="#7c2d12" stroke-width="4"/>`;
  s += `<rect x="10" y="10" width="740" height="110" rx="16" fill="#7c2d12"/><rect x="10" y="90" width="740" height="30" fill="#7c2d12"/>`;
  s += text(380, 62, "SUSU COKELAT SAPI CERIA", { size: 34, weight: "bold", fill: "#fff" });
  s += text(380, 102, "Isi bersih: 200 ml", { size: 22, fill: "#fed7aa" });
  const head = (y: number, t: string) => left(40, y, t, { size: 21, weight: "bold", fill: "#9a3412" });
  s += head(165, "Komposisi:");
  s += left(40, 195, "susu sapi segar, gula, bubuk kakao, penstabil.", { size: 19 });
  s += head(245, "Cara penyimpanan:");
  s += left(40, 275, "• Simpan di tempat sejuk dan kering.", { size: 19 });
  s += left(40, 305, "• Jauhkan dari sinar matahari langsung.", { size: 19 });
  s += left(40, 335, "• Setelah dibuka, simpan di lemari es dan", { size: 19 });
  s += left(58, 362, "habiskan dalam 2 hari.", { size: 19 });
  s += head(412, "Saran penyajian:");
  s += left(40, 442, "Kocok dahulu sebelum diminum. Lebih nikmat disajikan dingin.", { size: 19 });
  s += `<rect x="40" y="470" width="680" height="62" rx="10" fill="#fee2e2" stroke="#dc2626" stroke-width="2"/>`;
  s += left(60, 508, "⚠ Jangan diminum jika kemasan menggembung atau bocor.", { size: 19, weight: "bold", fill: "#991b1b" });
  s += `<rect x="40" y="552" width="680" height="56" rx="10" fill="#fff" stroke="#111" stroke-width="2"/>`;
  s += left(60, 588, "Baik digunakan sebelum:", { size: 20, weight: "bold" }) + left(330, 589, "15 01 2027", { size: 24, weight: "bold" });
  return svg(760, 640, s);
}

// Stimulus surat undangan pentas seni — Sabtu, 12 Desember 2026.
function imgUndangan() {
  let s = `<rect x="10" y="10" width="740" height="860" rx="10" fill="#f8fafc" stroke="#1e3a8a" stroke-width="4"/>`;
  s += `<rect x="26" y="26" width="708" height="828" rx="6" fill="none" stroke="#93c5fd" stroke-width="2" stroke-dasharray="8 6"/>`;
  s += text(380, 80, "UNDANGAN", { size: 36, weight: "bold", fill: "#1e3a8a" });
  s += left(60, 135, "Yth. Bapak/Ibu Orang Tua/Wali Murid", { size: 20, weight: "bold" });
  s += left(60, 162, "Kelas I–VI SD Harapan", { size: 20, weight: "bold" });
  s += left(60, 210, "Dengan hormat,", { size: 19 });
  s += left(60, 245, "Kami mengundang Bapak/Ibu untuk menghadiri Pentas Seni", { size: 19 });
  s += left(60, 272, "Akhir Semester yang akan dilaksanakan pada:", { size: 19 });
  const row = (y: number, a: string, b: string) => left(90, y, a, { size: 19 }) + left(250, y, `: ${b}`, { size: 19 });
  s += row(315, "hari, tanggal", "Sabtu, 12 Desember 2026");
  s += row(345, "pukul", "08.00–11.00");
  s += row(375, "tempat", "Aula SD Harapan");
  s += left(90, 418, "Susunan acara:", { size: 19, weight: "bold" });
  ["1. Pembukaan", "2. Tari daerah oleh siswa kelas IV", "3. Paduan suara oleh siswa kelas V", "4. Drama oleh siswa kelas VI", "5. Pembagian hadiah lomba"].forEach(
    (t, i) => (s += left(110, 450 + i * 30, t, { size: 19 })),
  );
  s += left(60, 630, "Mengingat pentingnya acara ini, kami mohon Bapak/Ibu", { size: 19 });
  s += left(60, 657, "hadir tepat waktu. Atas perhatian Bapak/Ibu, kami", { size: 19 });
  s += left(60, 684, "ucapkan terima kasih.", { size: 19 });
  s += left(470, 740, "Kepala SD Harapan,", { size: 19 });
  s += `<path d="M480,790 q20,-30 40,0 t40,0 t40,-10" fill="none" stroke="#1e3a8a" stroke-width="2"/>`;
  s += left(470, 830, "Ratna Dewi", { size: 19, weight: "bold" });
  return svg(760, 880, s);
}

// ---------- Stimulus ----------

const stimuli = [
  {
    code: "SD-BIND-P5-SUSU",
    title: "Label Kemasan Susu",
    content: "Perhatikan label kemasan susu berikut!",
    gambar: "label-susu",
  },
  {
    code: "SD-BIND-P5-UNDANGAN",
    title: "Undangan Pentas Seni",
    content: "Perhatikan surat undangan berikut!",
    gambar: "undangan-pentas",
  },
  {
    code: "SD-BIND-P5-ORANGUTAN",
    title: "Orang Utan, Petani Hutan",
    content: `Orang utan adalah kera besar yang hidup di hutan Indonesia. Hewan ini hanya ditemukan di Pulau Sumatra dan Kalimantan. Namanya berasal dari kata orang dan hutan. Artinya, manusia hutan.

Tubuh orang utan ditutupi rambut berwarna cokelat kemerahan. Lengannya sangat panjang. Panjang lengannya lebih dari panjang kakinya. Lengan itu membantunya berayun dari dahan ke dahan. Orang utan jarang turun ke tanah.

Orang utan suka makan buah-buahan. Ia juga makan daun, kulit kayu, dan serangga. Biji buah yang dimakan keluar bersama kotorannya. Biji itu tumbuh menjadi pohon baru. Karena itu, orang utan disebut petani hutan.

Setiap sore, orang utan membuat sarang di atas pohon. Sarang itu dibuat dari ranting dan daun. Ia tidur di sarang itu pada malam hari. Esoknya, ia membuat sarang baru di tempat lain.

Kini, orang utan terancam punah. Hutan tempat tinggalnya banyak ditebang. Hutan diubah menjadi kebun dan permukiman. Kita dapat membantu dengan menjaga hutan dan tidak memelihara orang utan.`,
  },
  {
    code: "SD-BIND-P5-BOLU",
    title: "Kue Bolu Nenek",
    content: `Minggu pagi, Nenek mengajakku membuat kue bolu. Aku senang sekali. Nenek menyiapkan tepung, telur, gula, dan mentega. Aku bertugas mengaduk adonan. Tanganku sampai pegal, tetapi aku tetap semangat.

Adonan dituang ke loyang. Nenek memasukkan loyang ke dalam oven. "Tolong jaga kuenya, ya. Empat puluh menit lagi angkat," pesan Nenek. Nenek lalu pergi ke warung.

Tak lama, Dodi memanggilku dari luar. Ia mengajakku bermain kelereng. Aku lupa pesan Nenek. Aku asyik bermain sampai siang.

Tiba-tiba, tercium bau hangus dari dapur. Aku berlari masuk. Kue bolu itu sudah hitam di bagian atas. Jantungku berdebar kencang. Aku takut Nenek marah.

Nenek pulang dan melihat kue itu. Aku menunduk. "Maaf, Nek. Aku lupa menjaga kue karena bermain," kataku jujur.

Nenek tersenyum. "Terima kasih sudah berkata jujur. Ayo, kita buat lagi," ajaknya.

Siang itu kami membuat kue lagi. Kali ini, aku duduk di depan oven sampai kue matang. Kue bolu kedua mengembang cantik. Rasanya manis dan lembut. Aku berjanji akan selalu menjalankan tugas dengan baik.`,
  },
  {
    code: "SD-BIND-P5-BELANG",
    title: "Si Belang",
    content: `Si Belang kucingku yang manis
bulunya putih bertotol hitam
setiap pagi ia mengeong tipis
membangunkanku dari tidur malam

Ia berlari mengejar bola benang
melompat tinggi lalu terguling
aku tertawa melihatnya senang
ekornya bergoyang ke kanan-kiri

Saat hujan ia tidur meringkuk
di atas keset depan pintu
kuelus kepalanya yang mengantuk
Belang, engkau sahabat setiaku`,
  },
  {
    code: "SD-BIND-P5-BUBU",
    title: "Bubu Si Burung Hantu",
    content: `Namaku Bubu. Aku seekor burung hantu. Aku tinggal di lubang pohon di tepi sawah. Pada siang hari, aku tidur. Mataku silau jika terkena cahaya matahari.

Ayam dan Bebek sering mengejekku. "Lihat si Bubu, pemalas! Siang-siang tidur terus," kata Ayam. Bebek tertawa keras. Hatiku sedih, tetapi aku diam saja.

Malam harinya, aku terbang mengelilingi sawah. Mataku dapat melihat dengan jelas dalam gelap. Telingaku dapat mendengar suara yang sangat pelan. Aku menangkap tikus-tikus yang merusak padi.

Suatu malam, Ayam terbangun karena berisik. Ia mengintip dari kandang. Ia melihatku menangkap seekor tikus besar. Tikus itu hampir masuk ke lumbung padi Pak Tani.

Esok paginya, Ayam bercerita kepada Bebek. Mereka menghampiri pohonku. "Bubu, maafkan kami. Ternyata kamu bekerja keras setiap malam," kata Ayam.

Aku tersenyum walau mataku masih mengantuk. "Tidak apa-apa. Setiap makhluk punya waktu kerjanya sendiri," jawabku.

Sejak itu, Ayam dan Bebek tidak pernah mengejekku lagi. Pak Tani pun senang karena padinya tidak dimakan tikus.`,
  },
];

// ---------- Soal ----------

type Row = {
  kode_stimulus: string;
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
};

const MCMA = "\n\n(Jawaban benar lebih dari satu.)";

const rows: Row[] = [
  // ---- Label Kemasan Susu ----
  {
    kode_stimulus: "SD-BIND-P5-SUSU",
    kode_subdomain: "SD-BIND-D1-S4",
    bentuk_soal: "pg",
    pertanyaan: "Sampai kapan susu tersebut baik diminum?",
    opsi_a: "15 Januari 2027",
    opsi_b: "1 Mei 2027",
    opsi_c: "15 Desember 2026",
    opsi_d: "2 hari setelah dibeli",
    opsi_e: "200 hari setelah dibuat",
    kunci: "A",
    pembahasan: `Label menuliskan "Baik digunakan sebelum: 15 01 2027". Angka itu dibaca tanggal 15, bulan 01 (Januari), tahun 2027.

Cek setiap pilihan:
- **A** — benar.
- **B** — salah, angka "01" adalah bulan Januari, bukan tanggal 1; dan tidak ada bulan Mei pada label.
- **C** — salah, tahunnya 2027, bukan 2026.
- **D** — salah, "2 hari" adalah batas setelah kemasan **dibuka**, bukan setelah dibeli.
- **E** — salah, angka 200 adalah isi susu (200 ml), bukan jumlah hari.`,
    tingkat_kesulitan: "mudah",
  },
  {
    kode_stimulus: "SD-BIND-P5-SUSU",
    kode_subdomain: "SD-BIND-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: "Kata \"komposisi\" pada label bermakna ....",
    opsi_a: "cara menyimpan susu",
    opsi_b: "bahan-bahan yang dipakai untuk membuat susu",
    opsi_c: "tanggal susu dibuat",
    opsi_d: "banyaknya isi susu",
    opsi_e: "cara menyajikan susu",
    kunci: "B",
    pembahasan: `Setelah kata "Komposisi" tertulis susu sapi segar, gula, bubuk kakao, dan penstabil. Semuanya bahan pembuat susu. Jadi, komposisi berarti susunan bahan.

Cek setiap pilihan:
- **A** — salah, cara menyimpan ditulis pada bagian "Cara penyimpanan".
- **B** — benar.
- **C** — salah, label tidak mencantumkan tanggal pembuatan; yang ada tanggal "baik digunakan sebelum".
- **D** — salah, banyaknya isi ditulis sebagai "Isi bersih: 200 ml".
- **E** — salah, cara menyajikan ditulis pada bagian "Saran penyajian".`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P5-SUSU",
    kode_subdomain: "SD-BIND-D1-S3",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Rafi membuat ringkasan isi label. Ringkasan manakah yang sesuai dengan label?${MCMA}`,
    opsi_a: "Isi susu dalam kemasan adalah 200 ml.",
    opsi_b: "Susu yang sudah dibuka disimpan di lemari es.",
    opsi_c: "Susu dikocok dahulu sebelum diminum.",
    opsi_d: "Susu tetap boleh diminum walaupun kemasannya menggembung.",
    opsi_e: "Susu paling nikmat diminum dalam keadaan panas.",
    kunci: "A,B,C",
    pembahasan: `- **A** — benar, tertulis "Isi bersih: 200 ml".
- **B** — benar, tertulis "Setelah dibuka, simpan di lemari es".
- **C** — benar, tertulis "Kocok dahulu sebelum diminum".
- **D** — salah, label justru memperingatkan "Jangan diminum jika kemasan menggembung atau bocor".
- **E** — salah, label menyebut "Lebih nikmat disajikan dingin".`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P5-SUSU",
    kode_subdomain: "SD-BIND-D3-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Sesuai/Tidak Sesuai",
    pertanyaan: "Tentukan **Sesuai** atau **Tidak Sesuai** setiap tindakan berikut dengan petunjuk pada label!",
    opsi_a: "Rina menyimpan susu yang belum dibuka di lemari dapur yang sejuk.",
    opsi_b: "Doni menjemur kotak susu di bawah sinar matahari agar hangat.",
    opsi_c: "Ibu tidak memberikan susu yang kemasannya bocor kepada adik.",
    kunci: "S,TS,S",
    pembahasan: `- **Sesuai** — label meminta susu disimpan "di tempat sejuk dan kering". Susu yang belum dibuka belum perlu dimasukkan ke lemari es.
- **Tidak Sesuai** — label meminta "Jauhkan dari sinar matahari langsung".
- **Sesuai** — label memperingatkan agar susu tidak diminum jika kemasan bocor.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P5-SUSU",
    kode_subdomain: "SD-BIND-D3-S2",
    bentuk_soal: "pg",
    pertanyaan: "Dina membuka kotak susu itu pada hari Senin pagi. Ia meminum setengahnya, lalu menyimpan sisanya di lemari es. Berdasarkan label, paling lambat kapan sisa susu sebaiknya dihabiskan?",
    opsi_a: "Senin sore",
    opsi_b: "Selasa pagi",
    opsi_c: "Rabu pagi",
    opsi_d: "Jumat pagi",
    opsi_e: "15 Januari 2027",
    kunci: "C",
    pembahasan: `Label menyebut "Setelah dibuka, simpan di lemari es dan habiskan dalam 2 hari". Dua hari setelah Senin pagi adalah **Rabu pagi**.

Cek setiap pilihan:
- **A** — salah, susu masih boleh disimpan di lemari es sampai 2 hari; tidak harus habis hari itu juga.
- **B** — salah, Selasa pagi baru 1 hari. Menghabiskan susu pada hari Selasa memang aman, tetapi itu bukan batas **paling lambat**.
- **C** — benar.
- **D** — salah, Jumat sudah 4 hari setelah dibuka, melewati batas 2 hari.
- **E** — salah, tanggal itu berlaku untuk susu yang **belum dibuka**. Setelah dibuka, berlaku aturan 2 hari.`,
    tingkat_kesulitan: "sulit",
  },
  // ---- Undangan Pentas Seni ----
  {
    kode_stimulus: "SD-BIND-P5-UNDANGAN",
    kode_subdomain: "SD-BIND-D1-S4",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Informasi manakah yang sesuai dengan surat undangan?${MCMA}`,
    opsi_a: "Acara diadakan pada hari Sabtu.",
    opsi_b: "Acara diadakan di aula sekolah.",
    opsi_c: "Undangan ditujukan kepada orang tua atau wali murid.",
    opsi_d: "Acara dimulai pukul 09.00.",
    opsi_e: "Paduan suara ditampilkan oleh siswa kelas IV.",
    kunci: "A,B,C",
    pembahasan: `- **A** — benar, "Sabtu, 12 Desember 2026".
- **B** — benar, "tempat: Aula SD Harapan".
- **C** — benar, undangan ditujukan kepada "Bapak/Ibu Orang Tua/Wali Murid".
- **D** — salah, acara dimulai pukul **08.00**.
- **E** — salah, paduan suara ditampilkan oleh siswa kelas **V**; kelas IV menampilkan tari daerah.`,
    tingkat_kesulitan: "mudah",
  },
  {
    kode_stimulus: "SD-BIND-P5-UNDANGAN",
    kode_subdomain: "SD-BIND-D1-S2",
    bentuk_soal: "pg",
    pertanyaan: "Siapa yang dimaksud dengan kata \"Bapak/Ibu\" dalam kalimat \"Kami mengundang Bapak/Ibu untuk menghadiri Pentas Seni Akhir Semester\"?",
    opsi_a: "guru-guru SD Harapan",
    opsi_b: "Kepala SD Harapan",
    opsi_c: "orang tua atau wali murid kelas I–VI",
    opsi_d: "siswa kelas IV, V, dan VI",
    opsi_e: "warga di sekitar sekolah",
    kunci: "C",
    pembahasan: `Bagian atas surat berbunyi "Yth. Bapak/Ibu Orang Tua/Wali Murid Kelas I–VI SD Harapan". Kata "Bapak/Ibu" di dalam isi surat merujuk kepada orang yang dituju itu.

Cek setiap pilihan:
- **A** — salah, guru tidak disebut sebagai yang diundang.
- **B** — salah, kepala sekolah adalah pengirim undangan (yang menandatangani), bukan yang diundang.
- **C** — benar.
- **D** — salah, siswa adalah pengisi acara, bukan yang diundang dengan surat ini.
- **E** — salah, warga sekitar tidak disebut.`,
    tingkat_kesulitan: "mudah",
  },
  {
    kode_stimulus: "SD-BIND-P5-UNDANGAN",
    kode_subdomain: "SD-BIND-D1-S3",
    bentuk_soal: "pg",
    pertanyaan: "Urutan acara yang sesuai dengan undangan adalah ....",
    opsi_a: "pembukaan – paduan suara – tari daerah – drama – pembagian hadiah",
    opsi_b: "pembukaan – tari daerah – paduan suara – drama – pembagian hadiah",
    opsi_c: "pembukaan – drama – tari daerah – paduan suara – pembagian hadiah",
    opsi_d: "pembagian hadiah – pembukaan – tari daerah – paduan suara – drama",
    opsi_e: "tari daerah – pembukaan – paduan suara – drama – pembagian hadiah",
    kunci: "B",
    pembahasan: `Susunan acara pada undangan bernomor: 1) pembukaan, 2) tari daerah, 3) paduan suara, 4) drama, 5) pembagian hadiah lomba.

Cek setiap pilihan:
- **A** — salah, tari daerah dan paduan suara tertukar.
- **B** — benar.
- **C** — salah, drama adalah acara keempat, bukan kedua.
- **D** — salah, pembagian hadiah adalah acara terakhir.
- **E** — salah, acara harus dibuka dengan pembukaan.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P5-UNDANGAN",
    kode_subdomain: "SD-BIND-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: "Tujuan utama surat tersebut adalah ....",
    opsi_a: "memberitahukan hasil lomba kepada siswa",
    opsi_b: "meminta orang tua membayar biaya pentas seni",
    opsi_c: "mengundang orang tua untuk menghadiri pentas seni",
    opsi_d: "mengajak siswa berlatih drama",
    opsi_e: "mengumumkan libur akhir semester",
    kunci: "C",
    pembahasan: `Inti surat ada pada kalimat "Kami mengundang Bapak/Ibu untuk menghadiri Pentas Seni Akhir Semester". Keterangan waktu, tempat, dan susunan acara mendukung tujuan itu.

Cek setiap pilihan:
- **A** — salah, surat hanya menyebut "pembagian hadiah lomba" sebagai salah satu acara, tanpa hasil lomba.
- **B** — salah, surat tidak menyebut biaya.
- **C** — benar.
- **D** — salah, surat ditujukan kepada orang tua, bukan ajakan latihan kepada siswa.
- **E** — salah, libur tidak disebut.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P5-UNDANGAN",
    kode_subdomain: "SD-BIND-D3-S2",
    bentuk_soal: "pgk_kategori",
    kategori: "Sesuai/Tidak Sesuai",
    pertanyaan: "Beberapa orang tua menyampaikan rencananya. Tentukan **Sesuai** atau **Tidak Sesuai** setiap rencana berikut dengan isi undangan!",
    opsi_a: "Ayah Rani akan tiba di Aula SD Harapan pukul 07.50.",
    opsi_b: "Ibu Doni akan datang pada hari Minggu, 12 Desember 2026.",
    opsi_c: "Ibu Sinta, yang anaknya kelas VI, ingin menonton drama anaknya.",
    opsi_d: "Ayah Beni akan menunggu acara di lapangan sekolah.",
    kunci: "S,TS,S,TS",
    pembahasan: `- **Sesuai** — acara mulai pukul 08.00 dan surat meminta hadir tepat waktu; datang pukul 07.50 sesuai permintaan itu.
- **Tidak Sesuai** — 12 Desember 2026 jatuh pada hari **Sabtu**, bukan Minggu. Hari dan tanggal harus dicocokkan dengan undangan.
- **Sesuai** — drama ditampilkan oleh siswa kelas VI (acara keempat).
- **Tidak Sesuai** — tempat acara di **aula** sekolah, bukan lapangan.`,
    tingkat_kesulitan: "sulit",
  },
  // ---- Orang Utan ----
  {
    kode_stimulus: "SD-BIND-P5-ORANGUTAN",
    kode_subdomain: "SD-BIND-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: "Kata \"terancam punah\" pada paragraf terakhir bermakna ....",
    opsi_a: "sedang berkembang biak dengan cepat",
    opsi_b: "dalam bahaya hilang seluruhnya dari muka bumi",
    opsi_c: "sedang berpindah ke pulau lain",
    opsi_d: "sedang membuat sarang baru",
    opsi_e: "sedang mencari makanan",
    kunci: "B",
    pembahasan: `Punah berarti habis atau hilang sama sekali. Terancam punah berarti dalam bahaya menjadi punah. Kalimat sesudahnya menjelaskan penyebabnya: hutan tempat tinggal orang utan banyak ditebang.

Cek setiap pilihan:
- **A** — salah, maknanya berlawanan.
- **B** — benar.
- **C** — salah, teks tidak menyebut orang utan berpindah pulau.
- **D, E** — salah, membuat sarang dan mencari makan adalah kegiatan sehari-hari (paragraf 3 dan 4), tidak berkaitan dengan punah.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P5-ORANGUTAN",
    kode_subdomain: "SD-BIND-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: "Simpulan yang tepat tentang hubungan orang utan dengan hutan berdasarkan teks adalah ....",
    opsi_a: "Orang utan merusak hutan karena memakan daun dan kulit kayu.",
    opsi_b: "Orang utan dan hutan saling membutuhkan.",
    opsi_c: "Hutan tidak lagi dibutuhkan orang utan.",
    opsi_d: "Orang utan lebih suka tinggal di permukiman.",
    opsi_e: "Hutan tumbuh tanpa bantuan hewan apa pun.",
    kunci: "B",
    pembahasan: `Simpulan diambil dari beberapa bagian teks sekaligus:
- Orang utan **membutuhkan** hutan sebagai tempat tinggal, tempat membuat sarang, dan sumber makanan.
- Hutan **dibantu** orang utan: biji buah yang dimakan tumbuh menjadi pohon baru, sehingga orang utan disebut petani hutan.

Cek setiap pilihan:
- **A** — salah, teks tidak menyebut orang utan merusak hutan; justru menumbuhkan pohon baru.
- **B** — benar.
- **C** — salah, orang utan terancam punah justru karena hutannya ditebang.
- **D** — salah, permukiman adalah hasil penebangan hutan yang mengancam orang utan.
- **E** — salah, bertentangan dengan peran orang utan sebagai petani hutan.`,
    tingkat_kesulitan: "sulit",
  },
  {
    kode_stimulus: "SD-BIND-P5-ORANGUTAN",
    kode_subdomain: "SD-BIND-D1-S3",
    bentuk_soal: "pgk_kategori",
    kategori: "Sesuai/Tidak Sesuai",
    pertanyaan: "Lina membuat bagan tentang orang utan. Tentukan **Sesuai** atau **Tidak Sesuai** setiap isi bagan berikut dengan teks!",
    opsi_a: "Tempat hidup: Pulau Sumatra dan Kalimantan.",
    opsi_b: "Makanan: buah-buahan, daun, kulit kayu, dan serangga.",
    opsi_c: "Sarang: dibuat sekali lalu dipakai bertahun-tahun.",
    opsi_d: "Ciri tubuh: lengan lebih pendek daripada kaki.",
    kunci: "S,S,TS,TS",
    pembahasan: `- **Sesuai** — paragraf 1: "hanya ditemukan di Pulau Sumatra dan Kalimantan".
- **Sesuai** — paragraf 3 menyebut keempat jenis makanan itu.
- **Tidak Sesuai** — paragraf 4: "Esoknya, ia membuat sarang baru di tempat lain." Sarang dibuat setiap hari, tidak dipakai bertahun-tahun.
- **Tidak Sesuai** — paragraf 2: "Panjang lengannya lebih dari panjang kakinya." Isi bagan terbalik.`,
    tingkat_kesulitan: "sulit",
  },
  {
    kode_stimulus: "SD-BIND-P5-ORANGUTAN",
    kode_subdomain: "SD-BIND-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: "Perubahan apa yang terjadi pada hutan tempat tinggal orang utan menurut teks?",
    opsi_a: "Hutan menjadi makin lebat karena banyak pohon baru.",
    opsi_b: "Hutan banyak ditebang lalu diubah menjadi kebun dan permukiman.",
    opsi_c: "Hutan dipindahkan ke pulau lain.",
    opsi_d: "Hutan berubah menjadi tempat wisata.",
    opsi_e: "Hutan tidak mengalami perubahan apa pun.",
    kunci: "B",
    pembahasan: `Paragraf terakhir: "Hutan tempat tinggalnya banyak ditebang. Hutan diubah menjadi kebun dan permukiman."

Cek setiap pilihan:
- **A** — salah, orang utan memang menumbuhkan pohon baru, tetapi teks menyebut hutan justru berkurang karena ditebang.
- **B** — benar.
- **C** — salah, hutan tidak dapat dipindahkan; teks tidak menyebutnya.
- **D** — salah, teks menyebut kebun dan permukiman, bukan tempat wisata.
- **E** — salah, perubahan itulah yang membuat orang utan terancam punah.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P5-ORANGUTAN",
    kode_subdomain: "SD-BIND-D3-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Tindakan apa saja dalam kehidupan sehari-hari yang sesuai dengan ajakan pada akhir teks?${MCMA}`,
    opsi_a: "Tidak membeli atau memelihara satwa liar seperti orang utan.",
    opsi_b: "Ikut kegiatan menanam pohon di sekolah.",
    opsi_c: "Menjaga kebersihan dan tidak merusak pohon saat berwisata ke hutan.",
    opsi_d: "Membakar sampah di hutan agar lebih bersih.",
    opsi_e: "Menangkap anak orang utan untuk dirawat di rumah.",
    kunci: "A,B,C",
    pembahasan: `Ajakan teks: "menjaga hutan dan tidak memelihara orang utan".

- **A** — benar, sesuai ajakan tidak memelihara orang utan.
- **B** — benar, menanam pohon membantu menjaga dan menambah hutan.
- **C** — benar, tidak merusak pohon adalah wujud menjaga hutan.
- **D** — salah, membakar sampah di hutan dapat menyebabkan kebakaran hutan.
- **E** — salah, bertentangan langsung dengan ajakan tidak memelihara orang utan; anak orang utan perlu hidup di hutan bersama induknya.`,
    tingkat_kesulitan: "sedang",
  },
  // ---- Kue Bolu Nenek ----
  {
    kode_stimulus: "SD-BIND-P5-BOLU",
    kode_subdomain: "SD-BIND-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: "Perubahan perasaan tokoh aku dari saat mencium bau hangus hingga akhir cerita adalah ....",
    opsi_a: "senang menjadi sedih",
    opsi_b: "takut menjadi lega dan senang",
    opsi_c: "marah menjadi sabar",
    opsi_d: "malu menjadi sombong",
    opsi_e: "bosan menjadi semangat",
    kunci: "B",
    pembahasan: `Saat mencium bau hangus, "jantungku berdebar kencang" dan "aku takut Nenek marah". Nenek ternyata tidak marah dan mengajak membuat kue lagi. Kue kedua berhasil, "manis dan lembut". Perasaan tokoh aku berubah dari takut menjadi lega dan senang.

Cek setiap pilihan:
- **A** — salah, urutannya terbalik; cerita berakhir bahagia.
- **B** — benar.
- **C** — salah, tokoh aku tidak marah.
- **D** — salah, tokoh aku memang malu (menunduk), tetapi tidak menjadi sombong.
- **E** — salah, tokoh aku tidak bosan; sejak awal ia senang membuat kue.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P5-BOLU",
    kode_subdomain: "SD-BIND-D2-S3",
    bentuk_soal: "pg",
    pertanyaan: "Makna ungkapan \"jantungku berdebar kencang\" dalam cerita tersebut adalah ....",
    opsi_a: "tokoh aku sedang sakit jantung",
    opsi_b: "tokoh aku sangat cemas dan takut",
    opsi_c: "tokoh aku sangat gembira",
    opsi_d: "tokoh aku baru selesai berlari",
    opsi_e: "tokoh aku merasa mengantuk",
    kunci: "B",
    pembahasan: `Ungkapan ini muncul ketika tokoh aku melihat kue sudah hitam, diikuti kalimat "Aku takut Nenek marah". Jantung berdebar kencang menggambarkan rasa cemas dan takut.

Cek setiap pilihan:
- **A** — salah, memaknai ungkapan secara harfiah; tokoh aku tidak sakit.
- **B** — benar.
- **C** — salah, saat itu tokoh aku tidak gembira karena kuenya gosong.
- **D** — salah, tokoh aku memang berlari masuk, tetapi kalimat sesudahnya menjelaskan rasa takut, bukan lelah berlari.
- **E** — salah, tidak ada petunjuk tokoh aku mengantuk.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P5-BOLU",
    kode_subdomain: "SD-BIND-D2-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Sesuai/Tidak Sesuai",
    pertanyaan: "Tentukan **Sesuai** atau **Tidak Sesuai** setiap pernyataan tentang tokoh dalam cerita berikut!",
    opsi_a: "Tokoh aku jujur mengakui kesalahannya.",
    opsi_b: "Tokoh aku malas membantu Nenek.",
    opsi_c: "Nenek pemaaf.",
    opsi_d: "Nenek memarahi tokoh aku karena kue gosong.",
    kunci: "S,TS,S,TS",
    pembahasan: `- **Sesuai** — "Maaf, Nek. Aku lupa menjaga kue karena bermain," kataku jujur.
- **Tidak Sesuai** — tokoh aku mengaduk adonan sampai pegal "tetapi aku tetap semangat". Kesalahannya adalah lupa, bukan malas.
- **Sesuai** — Nenek tersenyum, berterima kasih atas kejujuran cucunya, dan mengajak membuat kue lagi.
- **Tidak Sesuai** — tokoh aku memang **takut** Nenek marah, tetapi ternyata Nenek tidak marah.`,
    tingkat_kesulitan: "sulit",
  },
  {
    kode_stimulus: "SD-BIND-P5-BOLU",
    kode_subdomain: "SD-BIND-D3-S3",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Perasaan apa saja yang mungkin muncul pada pembaca ketika Nenek tersenyum dan berkata, "Terima kasih sudah berkata jujur"?${MCMA}`,
    opsi_a: "Lega.",
    opsi_b: "Terharu.",
    opsi_c: "Senang.",
    opsi_d: "Kesal kepada Nenek.",
    opsi_e: "Takut.",
    kunci: "A,B,C",
    pembahasan: `Sebelumnya pembaca ikut cemas karena tokoh aku takut dimarahi. Ternyata Nenek tersenyum dan menghargai kejujurannya.

- **A, B, C** — benar, pembaca wajar merasa lega, terharu, dan senang.
- **D** — salah, Nenek bersikap baik; tidak ada alasan kesal.
- **E** — salah, ketegangan justru berakhir pada bagian ini.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P5-BOLU",
    kode_subdomain: "SD-BIND-D1-S2",
    bentuk_soal: "pg",
    pertanyaan: "Tempat adonan dituang sebelum dimasukkan ke dalam oven disebut ....",
    opsi_a: "oven",
    opsi_b: "loyang",
    opsi_c: "mangkuk",
    opsi_d: "piring",
    opsi_e: "panci",
    kunci: "B",
    pembahasan: `Paragraf kedua: "Adonan dituang ke loyang. Nenek memasukkan loyang ke dalam oven."

Cek setiap pilihan:
- **A** — salah, oven adalah alat untuk memanggang; loyang yang dimasukkan ke dalamnya.
- **B** — benar.
- **C, D, E** — salah, mangkuk, piring, dan panci tidak disebut dalam cerita.`,
    tingkat_kesulitan: "mudah",
  },
  // ---- Puisi Si Belang ----
  {
    kode_stimulus: "SD-BIND-P5-BELANG",
    kode_subdomain: "SD-BIND-D2-S3",
    bentuk_soal: "pg",
    pertanyaan: "Maksud larik \"Belang, engkau sahabat setiaku\" adalah ....",
    opsi_a: "Si Belang adalah kucing milik tetangga",
    opsi_b: "penyair menganggap Si Belang teman dekat yang selalu menemaninya",
    opsi_c: "Si Belang sering pergi meninggalkan rumah",
    opsi_d: "penyair ingin memberikan Si Belang kepada temannya",
    opsi_e: "Si Belang adalah nama sahabat penyair di sekolah",
    kunci: "B",
    pembahasan: `Sahabat setia berarti teman dekat yang selalu ada. Sepanjang puisi, Si Belang membangunkan penyair, bermain di dekatnya, dan dielus kepalanya. Penyair menganggap kucingnya sebagai teman dekat.

Cek setiap pilihan:
- **A** — salah, bait pertama menyebut "kucingku", jadi Si Belang milik penyair.
- **B** — benar.
- **C** — salah, Si Belang justru selalu berada di rumah (di keset depan pintu).
- **D** — salah, tidak ada petunjuk penyair ingin memberikan kucingnya.
- **E** — salah, Si Belang adalah kucing, bukan teman sekolah.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P5-BELANG",
    kode_subdomain: "SD-BIND-D1-S2",
    bentuk_soal: "pg",
    pertanyaan: "Ciri Si Belang menurut puisi tersebut adalah ....",
    opsi_a: "bulunya hitam polos",
    opsi_b: "bulunya putih bertotol hitam",
    opsi_c: "bulunya cokelat bergaris",
    opsi_d: "ekornya pendek",
    opsi_e: "matanya biru",
    kunci: "B",
    pembahasan: `Bait pertama: "bulunya putih bertotol hitam". Ciri itu juga sesuai dengan namanya, "belang" (bercorak dua warna).

Cek setiap pilihan:
- **A, C** — salah, warna bulu tidak sesuai puisi.
- **B** — benar.
- **D, E** — salah, puisi tidak menyebut panjang ekor maupun warna mata; puisi hanya menyebut ekornya bergoyang.`,
    tingkat_kesulitan: "mudah",
  },
  {
    kode_stimulus: "SD-BIND-P5-BELANG",
    kode_subdomain: "SD-BIND-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: "Kata \"meringkuk\" pada bait ketiga bermakna ....",
    opsi_a: "tidur dengan tubuh melingkar",
    opsi_b: "berlari dengan cepat",
    opsi_c: "melompat tinggi",
    opsi_d: "mengeong dengan keras",
    opsi_e: "makan dengan lahap",
    kunci: "A",
    pembahasan: `Larik "Saat hujan ia tidur meringkuk" menjelaskan cara Si Belang tidur. Meringkuk berarti berbaring dengan tubuh melingkar atau menekuk, biasanya karena dingin.

Cek setiap pilihan:
- **A** — benar.
- **B, C** — salah, berlari dan melompat ada di bait kedua dan berkaitan dengan bermain, bukan tidur.
- **D** — salah, mengeong adalah suara kucing, ada di bait pertama.
- **E** — salah, puisi tidak menyebut Si Belang makan.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P5-BELANG",
    kode_subdomain: "SD-BIND-D3-S3",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Perasaan apa saja yang mungkin muncul pada pembaca ketika membaca bait kedua puisi tersebut?${MCMA}`,
    opsi_a: "Gembira.",
    opsi_b: "Geli melihat tingkah kucing yang lucu.",
    opsi_c: "Sayang kepada Si Belang.",
    opsi_d: "Sedih.",
    opsi_e: "Takut kepada Si Belang.",
    kunci: "A,B,C",
    pembahasan: `Bait kedua menggambarkan Si Belang mengejar bola benang, melompat, lalu terguling, sampai penyair tertawa.

- **A, B, C** — benar, tingkah lucu kucing yang sedang bermain menimbulkan rasa gembira, geli, dan sayang.
- **D** — salah, tidak ada kejadian sedih pada bait kedua.
- **E** — salah, Si Belang digambarkan lucu dan jinak, tidak menakutkan.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P5-BELANG",
    kode_subdomain: "SD-BIND-D3-S2",
    bentuk_soal: "pgk_kategori",
    kategori: "Sesuai/Tidak Sesuai",
    pertanyaan: "Tentukan **Sesuai** atau **Tidak Sesuai** setiap pernyataan berikut dengan isi puisi!",
    opsi_a: "Si Belang membangunkan penyair setiap pagi.",
    opsi_b: "Si Belang bermain dengan bola plastik.",
    opsi_c: "Saat hujan, Si Belang tidur di atas kasur penyair.",
    opsi_d: "Penyair mengelus kepala Si Belang.",
    kunci: "S,TS,TS,S",
    pembahasan: `- **Sesuai** — bait pertama: "setiap pagi ia mengeong tipis / membangunkanku dari tidur malam".
- **Tidak Sesuai** — bait kedua menyebut "bola **benang**", bukan bola plastik.
- **Tidak Sesuai** — bait ketiga: Si Belang tidur "di atas **keset** depan pintu", bukan di kasur.
- **Sesuai** — bait ketiga: "kuelus kepalanya yang mengantuk".`,
    tingkat_kesulitan: "sulit",
  },
  // ---- Bubu Si Burung Hantu ----
  {
    kode_stimulus: "SD-BIND-P5-BUBU",
    kode_subdomain: "SD-BIND-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: "Perubahan sikap Ayam terhadap Bubu dari awal hingga akhir cerita adalah ....",
    opsi_a: "menghargai Bubu menjadi mengejeknya",
    opsi_b: "mengejek Bubu menjadi meminta maaf dan menghargainya",
    opsi_c: "takut kepada Bubu menjadi berani",
    opsi_d: "membantu Bubu menjadi menjauhinya",
    opsi_e: "tidak berubah sama sekali",
    kunci: "B",
    pembahasan: `Di awal, Ayam mengejek Bubu "pemalas". Setelah melihat Bubu menangkap tikus pada malam hari, Ayam meminta maaf dan tidak pernah mengejek lagi.

Cek setiap pilihan:
- **A** — salah, urutannya terbalik.
- **B** — benar.
- **C** — salah, Ayam tidak digambarkan takut kepada Bubu.
- **D** — salah, Ayam tidak pernah membantu Bubu, dan di akhir justru menghampirinya.
- **E** — salah, sikap Ayam jelas berubah.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P5-BUBU",
    kode_subdomain: "SD-BIND-D2-S3",
    bentuk_soal: "pg",
    pertanyaan: "Maksud ucapan Bubu, \"Setiap makhluk punya waktu kerjanya sendiri\", adalah ....",
    opsi_a: "semua hewan harus bekerja pada siang hari",
    opsi_b: "ada makhluk yang bekerja siang dan ada yang bekerja malam, jadi jangan menilai dari waktu tidurnya",
    opsi_c: "burung hantu tidak perlu bekerja",
    opsi_d: "Ayam dan Bebek harus bekerja pada malam hari",
    opsi_e: "setiap makhluk boleh tidur sepanjang hari",
    kunci: "B",
    pembahasan: `Bubu dianggap pemalas karena tidur pada siang hari, padahal ia bekerja menangkap tikus pada malam hari. Ucapannya berarti setiap makhluk memiliki waktu kerja yang berbeda, sehingga tidak adil menilai seseorang hanya dari kapan ia tidur.

Cek setiap pilihan:
- **A** — salah, justru Bubu bekerja malam hari.
- **B** — benar.
- **C** — salah, Bubu bekerja keras setiap malam.
- **D** — salah, Bubu tidak meminta Ayam dan Bebek mengubah waktu kerjanya.
- **E** — salah, maksud Bubu bukan membolehkan tidur sepanjang hari.`,
    tingkat_kesulitan: "sulit",
  },
  {
    kode_stimulus: "SD-BIND-P5-BUBU",
    kode_subdomain: "SD-BIND-D3-S3",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Perasaan apa saja yang mungkin muncul pada pembaca ketika Ayam dan Bebek mengejek Bubu?${MCMA}`,
    opsi_a: "Kasihan kepada Bubu.",
    opsi_b: "Kesal kepada Ayam dan Bebek.",
    opsi_c: "Ikut sedih.",
    opsi_d: "Senang.",
    opsi_e: "Bangga kepada Ayam.",
    kunci: "A,B,C",
    pembahasan: `Bubu diejek "pemalas" padahal ia bekerja keras pada malam hari. "Hatiku sedih, tetapi aku diam saja."

- **A** — benar, Bubu diejek padahal tidak bersalah.
- **B** — benar, ejekan Ayam dan Bebek tidak adil.
- **C** — benar, pembaca ikut merasakan kesedihan Bubu.
- **D** — salah, tidak ada hal menyenangkan saat seseorang diejek.
- **E** — salah, mengejek bukan perbuatan yang patut dibanggakan.`,
    tingkat_kesulitan: "sulit",
  },
  {
    kode_stimulus: "SD-BIND-P5-BUBU",
    kode_subdomain: "SD-BIND-D3-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Sesuai/Tidak Sesuai",
    pertanyaan: "Cerita tersebut dapat dihubungkan dengan kehidupan sehari-hari. Tentukan **Sesuai** atau **Tidak Sesuai** setiap tindakan berikut dengan pelajaran dari cerita!",
    opsi_a: "Tidak mengejek teman sebelum mengetahui keadaannya.",
    opsi_b: "Menilai teman pemalas hanya dari apa yang terlihat sekilas.",
    opsi_c: "Meminta maaf setelah berbuat salah kepada teman.",
    kunci: "S,TS,S",
    pembahasan: `- **Sesuai** — Ayam dan Bebek mengejek Bubu sebelum tahu bahwa Bubu bekerja malam hari. Pelajarannya: cari tahu dulu keadaan teman.
- **Tidak Sesuai** — inilah kesalahan Ayam dan Bebek dalam cerita.
- **Sesuai** — Ayam dan Bebek meminta maaf setelah tahu mereka salah.`,
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P5-BUBU",
    kode_subdomain: "SD-BIND-D1-S4",
    bentuk_soal: "pg",
    pertanyaan: "Apa yang dilakukan Bubu pada malam hari?",
    opsi_a: "Tidur di lubang pohon.",
    opsi_b: "Bermain bersama Ayam dan Bebek.",
    opsi_c: "Terbang mengelilingi sawah dan menangkap tikus.",
    opsi_d: "Menjaga kandang Ayam.",
    opsi_e: "Memakan padi di lumbung.",
    kunci: "C",
    pembahasan: `Paragraf ketiga: "Malam harinya, aku terbang mengelilingi sawah ... Aku menangkap tikus-tikus yang merusak padi."

Cek setiap pilihan:
- **A** — salah, Bubu tidur pada **siang** hari.
- **B** — salah, tidak disebutkan dalam cerita.
- **C** — benar.
- **D** — salah, Bubu menjaga sawah dan lumbung dari tikus, bukan kandang Ayam.
- **E** — salah, yang hendak memakan padi adalah tikus.`,
    tingkat_kesulitan: "mudah",
  },
];

export default {
  title: "TKA SD Bahasa Indonesia — Paket 5",
  description: "30 soal dari 6 bacaan: label kemasan susu, surat undangan pentas seni, teks informasi tentang orang utan, cerita tentang kue bolu dan burung hantu, serta puisi tentang kucing. Dilengkapi gambar dan pembahasan setiap pilihan jawaban.",
  jenjang: "SD",
  subjectCode: "SD-BIND",
  durationMinutes: 75,
  isPremium: true,
  isFullSimulation: true,
  createdByEmail: "kpbgalimka@gmail.com",
  stimuli,
  rows,
  images: {
    "label-susu": { title: "Label kemasan susu cokelat", svg: imgLabel() },
    "undangan-pentas": { title: "Surat undangan pentas seni akhir semester", svg: imgUndangan() },
  },
};
