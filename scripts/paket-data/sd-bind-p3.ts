// TKA SD Bahasa Indonesia — Paket 3 (ditulis Claude, pola mengikuti Paket 1 #44).
// 6 bacaan × 5 soal: 18 PG · 6 MCMA · 6 Kategori; 10/10 subtopik; mudah 6 · sedang 16 · sulit 8.
// Bacaan ±150–200 kata, kalimat pendek (kerangka SD); tema tidak mengulang Paket 1/2 & bank.

const stimuli = [
  {
    code: "SD-BIND-P3-ANGKLUNG",
    title: "Angklung, Alat Musik dari Bambu",
    content: `Angklung adalah alat musik tradisional dari Jawa Barat. Alat musik ini terbuat dari bambu. Angklung dimainkan dengan cara digoyangkan. Saat digoyang, tabung bambu saling beradu. Benturan itu menghasilkan bunyi yang merdu.

Satu angklung terdiri atas dua sampai empat tabung bambu. Tabung-tabung itu dipasang pada sebuah bingkai. Ukuran tabungnya berbeda-beda. Tabung yang besar menghasilkan nada rendah. Tabung yang kecil menghasilkan nada tinggi.

Setiap angklung hanya memiliki satu nada. Karena itu, angklung dimainkan bersama-sama. Setiap pemain memegang angklung dengan nada yang berbeda. Pemain menggoyangkan angklungnya saat nadanya tiba. Mereka harus kompak agar lagu terdengar indah. Pemain juga harus memperhatikan aba-aba dari pemimpin.

Bambu untuk angklung tidak sembarangan. Bambu harus sudah tua dan kering. Bambu biasanya ditebang pada musim kemarau. Bambu yang masih muda mudah retak. Bambu itu lalu dijemur selama berbulan-bulan.

Pada tahun 2010, UNESCO menetapkan angklung sebagai warisan budaya dunia. Kini, angklung dimainkan di banyak negara. Kita patut bangga dan ikut melestarikannya.`,
  },
  {
    code: "SD-BIND-P3-CELENGAN",
    title: "Celengan Ayam",
    content: `Aku punya celengan ayam dari tanah liat. Celengan itu hadiah dari Ayah. Setiap hari aku menyisihkan uang jajan. Aku ingin membeli sepeda baru. Sepeda lamaku sudah berkarat.

Tiga bulan berlalu. Celenganku sudah terasa berat. Aku mengguncangnya pelan. Bunyinya gemerincing. Aku tersenyum membayangkan sepeda biru di toko.

Suatu sore, Bu Guru membawa kabar sedih. Rumah Dimas, teman sekelasku, terbakar. Buku dan seragamnya ikut hangus. Aku ikut sedih mendengarnya. Kelas kami akan mengumpulkan sumbangan.

Malam itu aku sulit tidur. Aku memandangi celengan ayam di meja. Hatiku bimbang. Jika uang itu kusumbangkan, sepedaku batal. Namun, aku teringat wajah Dimas yang murung.

Esok paginya, aku memecahkan celengan itu. Aku menghitung uangnya bersama Ibu. Separuhnya kumasukkan ke kotak sumbangan. Ibu memelukku erat. "Ibu bangga padamu, Nak," bisiknya.

Seminggu kemudian, Dimas datang ke sekolah. Ia memakai seragam baru. Ia tersenyum dan berterima kasih kepada kami. Hatiku terasa ringan. Sepeda baru memang harus menunggu. Namun, aku tidak menyesal.`,
  },
  {
    code: "SD-BIND-P3-BAKAU",
    title: "Hutan Bakau Penjaga Pantai",
    content: `Hutan bakau tumbuh di pantai yang berlumpur. Hutan ini juga disebut hutan mangrove. Air di sana bercampur antara air laut dan air sungai. Air campuran itu disebut air payau.

Pohon bakau memiliki akar yang unik. Akarnya mencuat dari dalam lumpur. Bentuknya mirip kaki laba-laba. Akar itu mencengkeram lumpur dengan kuat. Karena itu, pohon bakau tidak mudah tumbang diterjang ombak.

Hutan bakau sangat bermanfaat. Akar bakau menahan tanah pantai. Tanah pantai jadi tidak terkikis ombak. Pengikisan pantai oleh ombak disebut abrasi. Hutan bakau juga menahan angin kencang dari laut. Rumah warga di pesisir pun lebih aman.

Hutan bakau juga menjadi rumah bagi banyak hewan. Ikan, udang, dan kepiting bertelur di sela akarnya. Burung-burung bersarang di dahannya. Nelayan di sekitar hutan bakau mudah mendapat ikan.

Sayangnya, banyak hutan bakau ditebang. Lahannya diubah menjadi tambak atau bangunan. Akibatnya, abrasi makin sering terjadi. Kini, banyak warga dan pelajar menanam bibit bakau. Mereka ingin pantai kembali terjaga.`,
  },
  {
    code: "SD-BIND-P3-PERAHU",
    title: "Perahu Ayah",
    content: `Fajar baru membuka mata
Ayah mendorong perahu ke laut
dayung dikayuh penuh tenaga
ombak berbuih ikut menyambut

Siang terik membakar kulit
jala ditebar berkali-kali
walau tangkapan kadang sedikit
senyum Ayah tetap berseri

Senja jingga di ujung dermaga
aku menunggu sambil bernyanyi
perahu Ayah tampak di sana
ikan segar dibawa pulang lagi`,
  },
  {
    code: "SD-BIND-P3-CUCITANGAN",
    title: "Mencuci Tangan dengan Benar",
    content: `Tangan kita menyentuh banyak benda setiap hari. Tanpa disadari, kuman menempel di tangan. Kuman itu dapat masuk ke tubuh. Akibatnya, kita bisa sakit perut atau flu. Karena itu, kita perlu mencuci tangan dengan benar.

Cara mencuci tangan cukup mudah. Pertama, basahi kedua tangan dengan air mengalir. Kedua, tuangkan sabun secukupnya ke telapak tangan. Ketiga, gosok kedua telapak tangan. Gosok juga punggung tangan dan sela-sela jari. Jangan lupa membersihkan ujung jari dan kuku. Lakukan selama kurang lebih dua puluh detik. Keempat, bilas tangan dengan air mengalir hingga bersih. Terakhir, keringkan tangan dengan handuk bersih atau tisu.

Kapan kita harus mencuci tangan? Cucilah tangan sebelum makan. Cuci juga tangan sesudah buang air. Setelah bermain di luar, tangan juga harus dicuci. Begitu pula setelah memegang hewan atau sampah.

Mencuci tangan dengan air dalam baskom tidak dianjurkan. Air itu biasanya dipakai bergantian. Kuman dari tangan orang lain bisa tertinggal di air. Jadi, gunakan air yang mengalir dari keran.`,
  },
  {
    code: "SD-BIND-P3-KIKI",
    title: "Kiki Si Anak Bebek",
    content: `Namaku Kiki. Aku seekor anak bebek. Aku tinggal di dekat kolam bersama Ibu dan empat saudaraku. Setiap pagi, saudara-saudaraku berenang riang. Aku hanya menonton dari tepi kolam. Aku takut air. Aku takut tenggelam.

"Ayo, Kiki! Airnya segar!" seru Kaka, kakakku. Aku menggeleng. Kakiku gemetar.

Ibu mendekatiku dengan lembut. "Bulumu tahan air, Nak. Kakimu juga berselaput. Kamu pasti bisa berenang," kata Ibu. Ibu mengajakku ke bagian kolam yang dangkal. Ia berenang di sampingku. Mula-mula aku hanya berdiri di air. Lalu, aku mengayuh kakiku pelan-pelan. Ternyata, tubuhku mengapung!

Suatu siang, seekor anak ayam terpeleset ke kolam. Ia menciap-ciap minta tolong. Saudara-saudaraku sedang tidur siang. Ibu sedang mencari makan. Tanpa berpikir panjang, aku melompat ke air. Aku berenang secepat mungkin. Anak ayam itu berpegangan pada punggungku. Aku membawanya ke tepi kolam.

Induk ayam berlari menghampiri kami. Ia berterima kasih berkali-kali. Ibu pulang dan mendengar ceritanya. Ibu tersenyum bangga. Sejak hari itu, aku tidak takut air lagi.`,
  },
];

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
  // ---- Angklung ----
  {
    kode_stimulus: "SD-BIND-P3-ANGKLUNG",
    kode_subdomain: "SD-BIND-D1-S4",
    bentuk_soal: "pg",
    pertanyaan: "Bagaimana cara memainkan angklung?",
    opsi_a: "Ditiup.",
    opsi_b: "Dipetik.",
    opsi_c: "Digoyangkan.",
    opsi_d: "Dipukul dengan kayu.",
    opsi_e: "Digesek.",
    kunci: "C",
    pembahasan: "Paragraf pertama menyebutkan, \"Angklung dimainkan dengan cara digoyangkan.\" Saat digoyang, tabung bambu saling beradu dan menghasilkan bunyi.",
    tingkat_kesulitan: "mudah",
  },
  {
    kode_stimulus: "SD-BIND-P3-ANGKLUNG",
    kode_subdomain: "SD-BIND-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: "Kata \"nada\" yang banyak digunakan dalam teks termasuk istilah dalam bidang ....",
    opsi_a: "pertanian",
    opsi_b: "musik",
    opsi_c: "kesehatan",
    opsi_d: "olahraga",
    opsi_e: "perdagangan",
    kunci: "B",
    pembahasan: "Nada adalah tinggi rendahnya bunyi dalam lagu atau alat musik. Kata itu dipakai teks untuk menjelaskan bunyi angklung (nada rendah, nada tinggi), sehingga termasuk istilah bidang musik.",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P3-ANGKLUNG",
    kode_subdomain: "SD-BIND-D1-S3",
    bentuk_soal: "pgk_kategori",
    kategori: "Sesuai/Tidak Sesuai",
    pertanyaan: "Lani membuat bagan tentang angklung. Tentukan **Sesuai** atau **Tidak Sesuai** setiap isi bagan berikut dengan teks!",
    opsi_a: "Bahan: bambu yang sudah tua dan kering.",
    opsi_b: "Tabung kecil: menghasilkan nada rendah.",
    opsi_c: "Cara bermain: bersama-sama karena setiap angklung hanya memiliki satu nada.",
    opsi_d: "Pengakuan dunia: ditetapkan UNESCO pada tahun 2001.",
    kunci: "S,TS,S,TS",
    pembahasan: "- Bambu harus sudah tua dan kering (paragraf 4) — Sesuai.\n- Tabung kecil menghasilkan nada **tinggi**; nada rendah dari tabung besar (paragraf 2) — Tidak Sesuai.\n- Angklung dimainkan bersama-sama karena setiap angklung hanya memiliki satu nada (paragraf 3) — Sesuai.\n- UNESCO menetapkan angklung sebagai warisan budaya dunia pada tahun **2010**, bukan 2001 (paragraf 5) — Tidak Sesuai.",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P3-ANGKLUNG",
    kode_subdomain: "SD-BIND-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: "Ide pokok paragraf ketiga teks tersebut adalah ....",
    opsi_a: "Pemain harus memperhatikan aba-aba dari pemimpin.",
    opsi_b: "Tabung angklung memiliki ukuran yang berbeda-beda.",
    opsi_c: "Angklung dimainkan bersama-sama karena setiap angklung hanya memiliki satu nada.",
    opsi_d: "Lagu terdengar indah jika dimainkan satu orang.",
    opsi_e: "Angklung kini dimainkan di banyak negara.",
    kunci: "C",
    pembahasan: "Paragraf ketiga membahas cara memainkan angklung secara bersama-sama karena setiap angklung hanya bernada satu. Kalimat tentang aba-aba pemimpin hanya gagasan pendukung. Ukuran tabung adalah isi paragraf kedua, dan angklung di banyak negara adalah isi paragraf kelima.",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P3-ANGKLUNG",
    kode_subdomain: "SD-BIND-D3-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Pemain angklung harus kompak agar lagu terdengar indah. Kegiatan sehari-hari manakah yang juga membutuhkan kekompakan seperti bermain angklung?${MCMA}`,
    opsi_a: "Lomba tarik tambang antarkelas.",
    opsi_b: "Membaca buku sendirian di perpustakaan.",
    opsi_c: "Bernyanyi dalam paduan suara sekolah.",
    opsi_d: "Kerja bakti membersihkan kelas sesuai pembagian tugas.",
    opsi_e: "Mengerjakan ulangan secara mandiri.",
    kunci: "A,C,D",
    pembahasan: "Bermain angklung berhasil bila setiap orang mengerjakan bagiannya pada saat yang tepat bersama orang lain. Tarik tambang, paduan suara, dan kerja bakti juga menuntut kerja sama dan kekompakan. Membaca sendirian dan mengerjakan ulangan secara mandiri adalah kegiatan perorangan.",
    tingkat_kesulitan: "sulit",
  },
  // ---- Celengan Ayam ----
  {
    kode_stimulus: "SD-BIND-P3-CELENGAN",
    kode_subdomain: "SD-BIND-D1-S2",
    bentuk_soal: "pg",
    pertanyaan: `Perhatikan ciri-ciri berikut!
- Terbuat dari tanah liat.
- Hadiah dari Ayah.
- Berbunyi gemerincing saat diguncang.

Benda yang dimaksud dalam cerita adalah ....`,
    opsi_a: "sepeda biru",
    opsi_b: "kotak sumbangan",
    opsi_c: "celengan ayam",
    opsi_d: "seragam baru",
    opsi_e: "sepeda lama",
    kunci: "C",
    pembahasan: "Paragraf pertama menyebutkan celengan ayam dari tanah liat yang merupakan hadiah dari Ayah. Paragraf kedua menceritakan celengan itu berbunyi gemerincing saat diguncang.",
    tingkat_kesulitan: "mudah",
  },
  {
    kode_stimulus: "SD-BIND-P3-CELENGAN",
    kode_subdomain: "SD-BIND-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: "Perubahan perasaan tokoh aku dari malam sebelum menyumbang hingga akhir cerita adalah ....",
    opsi_a: "senang menjadi kecewa",
    opsi_b: "marah menjadi sabar",
    opsi_c: "takut menjadi berani",
    opsi_d: "bimbang menjadi lega",
    opsi_e: "sedih menjadi menyesal",
    kunci: "D",
    pembahasan: "Malam itu tokoh aku sulit tidur dan \"hatiku bimbang\" karena harus memilih antara sepeda dan menyumbang. Di akhir cerita, \"hatiku terasa ringan\" dan ia \"tidak menyesal\". Jadi, perasaannya berubah dari bimbang menjadi lega.",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P3-CELENGAN",
    kode_subdomain: "SD-BIND-D2-S3",
    bentuk_soal: "pg",
    pertanyaan: "Makna ungkapan \"hatiku terasa ringan\" dalam cerita tersebut adalah ....",
    opsi_a: "badanku tidak terasa lelah",
    opsi_b: "perasaanku lega dan tenang",
    opsi_c: "hatiku mudah tersinggung",
    opsi_d: "aku mudah melupakan sesuatu",
    opsi_e: "aku merasa sangat lapar",
    kunci: "B",
    pembahasan: "Hati yang terasa ringan berarti tidak ada lagi beban pikiran. Tokoh aku merasa lega dan tenang setelah melihat Dimas tersenyum memakai seragam baru hasil sumbangan.",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P3-CELENGAN",
    kode_subdomain: "SD-BIND-D2-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Sesuai/Tidak Sesuai",
    pertanyaan: "Tentukan **Sesuai** atau **Tidak Sesuai** setiap pernyataan tentang watak tokoh aku berikut dengan isi cerita!",
    opsi_a: "Tokoh aku rajin menabung.",
    opsi_b: "Tokoh aku peduli kepada teman yang kesusahan.",
    opsi_c: "Tokoh aku hanya mementingkan keinginannya sendiri.",
    opsi_d: "Tokoh aku menyembunyikan uang tabungannya dari Ibu.",
    kunci: "S,S,TS,TS",
    pembahasan: "- Tokoh aku menyisihkan uang jajan setiap hari selama tiga bulan — rajin menabung (Sesuai).\n- Ia menyumbangkan separuh tabungannya untuk Dimas — peduli (Sesuai).\n- Ia rela menunda keinginan membeli sepeda demi temannya, jadi tidak mementingkan diri sendiri (Tidak Sesuai).\n- Ia justru menghitung uangnya bersama Ibu (Tidak Sesuai).",
    tingkat_kesulitan: "sulit",
  },
  {
    kode_stimulus: "SD-BIND-P3-CELENGAN",
    kode_subdomain: "SD-BIND-D3-S3",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Perasaan apa saja yang mungkin muncul pada pembaca ketika membaca bagian Dimas datang memakai seragam baru dan berterima kasih?${MCMA}`,
    opsi_a: "Ikut senang.",
    opsi_b: "Terharu.",
    opsi_c: "Kesal.",
    opsi_d: "Bangga kepada tokoh aku.",
    opsi_e: "Takut.",
    kunci: "A,B,D",
    pembahasan: "Bagian itu menunjukkan Dimas yang semula murung kini tersenyum berkat bantuan teman-temannya, termasuk tokoh aku yang rela memecahkan celengannya. Pembaca wajar ikut senang, terharu, dan bangga. Tidak ada kejadian yang membuat kesal atau takut pada bagian itu.",
    tingkat_kesulitan: "sedang",
  },
  // ---- Hutan Bakau ----
  {
    kode_stimulus: "SD-BIND-P3-BAKAU",
    kode_subdomain: "SD-BIND-D1-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Manakah kata dalam teks yang termasuk istilah khusus tentang alam dan lingkungan pantai?${MCMA}`,
    opsi_a: "abrasi",
    opsi_b: "payau",
    opsi_c: "rumah",
    opsi_d: "mangrove",
    opsi_e: "warga",
    kunci: "A,B,D",
    pembahasan: "Abrasi (pengikisan pantai oleh ombak), payau (air campuran laut dan sungai), dan mangrove (nama lain hutan bakau) adalah istilah khusus yang dijelaskan maknanya di dalam teks. Rumah dan warga adalah kosakata umum yang dipakai sehari-hari.",
    tingkat_kesulitan: "sulit",
  },
  {
    kode_stimulus: "SD-BIND-P3-BAKAU",
    kode_subdomain: "SD-BIND-D1-S4",
    bentuk_soal: "pg",
    pertanyaan: "Mengapa pohon bakau tidak mudah tumbang diterjang ombak?",
    opsi_a: "Pohonnya tumbuh di air payau.",
    opsi_b: "Akarnya mencengkeram lumpur dengan kuat.",
    opsi_c: "Burung-burung bersarang di dahannya.",
    opsi_d: "Pohonnya ditanam oleh para pelajar.",
    opsi_e: "Lahannya diubah menjadi tambak.",
    kunci: "B",
    pembahasan: "Paragraf kedua menyebutkan, \"Akar itu mencengkeram lumpur dengan kuat. Karena itu, pohon bakau tidak mudah tumbang diterjang ombak.\" Pilihan lain ada di teks, tetapi bukan penyebab pohon bakau kokoh.",
    tingkat_kesulitan: "mudah",
  },
  {
    kode_stimulus: "SD-BIND-P3-BAKAU",
    kode_subdomain: "SD-BIND-D1-S3",
    bentuk_soal: "pg",
    pertanyaan: `Bayu membuat ikhtisar manfaat hutan bakau berikut.

Manfaat hutan bakau:
1) menahan tanah pantai agar tidak terkikis ombak;
2) menahan angin kencang dari laut;
3) ....

Isi yang tepat untuk melengkapi nomor 3) adalah ....`,
    opsi_a: "menghasilkan air payau",
    opsi_b: "menjadi tempat hidup dan bertelur berbagai hewan",
    opsi_c: "diubah menjadi tambak dan bangunan",
    opsi_d: "membuat abrasi makin sering terjadi",
    opsi_e: "membuat akar berbentuk kaki laba-laba",
    kunci: "B",
    pembahasan: "Manfaat ketiga ada di paragraf keempat: hutan bakau menjadi rumah bagi ikan, udang, kepiting, dan burung. Air payau bukan dihasilkan hutan bakau, tambak dan abrasi justru akibat penebangan, dan bentuk akar adalah ciri pohon bakau, bukan manfaatnya.",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P3-BAKAU",
    kode_subdomain: "SD-BIND-D3-S2",
    bentuk_soal: "pgk_kategori",
    kategori: "Sesuai/Tidak Sesuai",
    pertanyaan: "Tentukan **Sesuai** atau **Tidak Sesuai** setiap hubungan sebab dan akibat berikut dengan isi teks!",
    opsi_a: "Banyak hutan bakau ditebang, akibatnya abrasi makin sering terjadi.",
    opsi_b: "Akar bakau mencengkeram lumpur dengan kuat, akibatnya pohon bakau mudah tumbang.",
    opsi_c: "Ikan dan udang bertelur di sela akar bakau, akibatnya nelayan sekitar mudah mendapat ikan.",
    kunci: "S,TS,S",
    pembahasan: "- Paragraf kelima: penebangan hutan bakau membuat abrasi makin sering terjadi (Sesuai).\n- Akar yang mencengkeram kuat justru membuat pohon bakau **tidak** mudah tumbang (Tidak Sesuai).\n- Paragraf keempat: hewan bertelur di sela akar bakau, dan nelayan di sekitarnya mudah mendapat ikan (Sesuai).",
    tingkat_kesulitan: "sulit",
  },
  {
    kode_stimulus: "SD-BIND-P3-BAKAU",
    kode_subdomain: "SD-BIND-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: "Simpulan yang tepat dari seluruh isi teks tersebut adalah ....",
    opsi_a: "Hutan bakau hanya bermanfaat bagi para nelayan.",
    opsi_b: "Hutan bakau sebaiknya diubah menjadi tambak agar menghasilkan uang.",
    opsi_c: "Pohon bakau memiliki akar berbentuk kaki laba-laba.",
    opsi_d: "Hutan bakau bermanfaat bagi pantai, hewan, dan manusia sehingga perlu dijaga.",
    opsi_e: "Abrasi terjadi karena banyak pelajar menanam bibit bakau.",
    kunci: "D",
    pembahasan: "Teks menjelaskan manfaat hutan bakau untuk pantai (menahan abrasi dan angin), hewan (tempat hidup dan bertelur), dan manusia (rumah pesisir aman, nelayan mudah mendapat ikan), lalu ditutup ajakan menjaganya dengan menanam bibit. Pilihan A terlalu sempit, C hanya satu rincian, dan B serta E bertentangan dengan isi teks.",
    tingkat_kesulitan: "sulit",
  },
  // ---- Puisi Perahu Ayah ----
  {
    kode_stimulus: "SD-BIND-P3-PERAHU",
    kode_subdomain: "SD-BIND-D2-S3",
    bentuk_soal: "pg",
    pertanyaan: "Maksud larik \"Fajar baru membuka mata\" adalah ....",
    opsi_a: "Ayah baru bangun dari tidur",
    opsi_b: "hari baru saja pagi dan matahari mulai terbit",
    opsi_c: "laut mulai pasang",
    opsi_d: "Ayah pulang dari melaut",
    opsi_e: "hari sudah senja",
    kunci: "B",
    pembahasan: "Fajar adalah cahaya pagi sebelum matahari terbit. Fajar tidak benar-benar memiliki mata. Ungkapan \"membuka mata\" menggambarkan hari yang baru dimulai, yaitu pagi-pagi sekali saat Ayah mulai melaut.",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P3-PERAHU",
    kode_subdomain: "SD-BIND-D1-S2",
    bentuk_soal: "pg",
    pertanyaan: "Kata \"jala\" pada bait kedua menunjukkan alat yang dipakai Ayah untuk ....",
    opsi_a: "mendayung perahu",
    opsi_b: "mengikat perahu di dermaga",
    opsi_c: "menangkap ikan",
    opsi_d: "menjemur ikan",
    opsi_e: "menahan ombak",
    kunci: "C",
    pembahasan: "Jala adalah jaring penangkap ikan. Larik berikutnya, \"walau tangkapan kadang sedikit\", menunjukkan bahwa jala ditebar untuk menangkap ikan. Alat untuk mendayung disebut dayung.",
    tingkat_kesulitan: "mudah",
  },
  {
    kode_stimulus: "SD-BIND-P3-PERAHU",
    kode_subdomain: "SD-BIND-D3-S3",
    bentuk_soal: "pg",
    pertanyaan: "Suasana yang paling terasa pada bait ketiga puisi tersebut adalah ....",
    opsi_a: "sedih dan sepi",
    opsi_b: "tegang dan menakutkan",
    opsi_c: "marah dan kesal",
    opsi_d: "senang dan penuh harapan",
    opsi_e: "ramai dan gaduh",
    kunci: "D",
    pembahasan: "Bait ketiga menggambarkan tokoh aku menunggu Ayah di dermaga \"sambil bernyanyi\", lalu perahu Ayah tampak membawa ikan segar. Gambaran itu menimbulkan suasana senang dan penuh harapan.",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P3-PERAHU",
    kode_subdomain: "SD-BIND-D2-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Sikap Ayah manakah yang dapat diteladani dari puisi tersebut?${MCMA}`,
    opsi_a: "Bekerja keras dengan penuh tenaga.",
    opsi_b: "Tetap ceria meskipun hasil tangkapan sedikit.",
    opsi_c: "Mudah menyerah ketika cuaca panas.",
    opsi_d: "Suka bermalas-malasan di dermaga.",
    opsi_e: "Mudah marah ketika tangkapan sedikit.",
    kunci: "A,B",
    pembahasan: "Larik \"dayung dikayuh penuh tenaga\" dan \"jala ditebar berkali-kali\" menunjukkan kerja keras. Larik \"walau tangkapan kadang sedikit / senyum Ayah tetap berseri\" menunjukkan Ayah tetap ceria dan tidak mengeluh. Pilihan lain bertentangan dengan isi puisi.",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P3-PERAHU",
    kode_subdomain: "SD-BIND-D3-S2",
    bentuk_soal: "pgk_kategori",
    kategori: "Sesuai/Tidak Sesuai",
    pertanyaan: "Tentukan **Sesuai** atau **Tidak Sesuai** setiap pernyataan berikut dengan isi puisi!",
    opsi_a: "Ayah berangkat melaut pada pagi hari.",
    opsi_b: "Ayah selalu mendapat ikan yang banyak.",
    opsi_c: "Tokoh aku menunggu Ayah di dermaga pada sore hari.",
    kunci: "S,TS,S",
    pembahasan: "- Bait pertama: saat fajar Ayah mendorong perahu ke laut (Sesuai).\n- Bait kedua menyebut \"tangkapan kadang sedikit\", jadi Ayah tidak selalu mendapat banyak ikan (Tidak Sesuai).\n- Bait ketiga: \"Senja jingga di ujung dermaga / aku menunggu\" (Sesuai).",
    tingkat_kesulitan: "sedang",
  },
  // ---- Mencuci Tangan ----
  {
    kode_stimulus: "SD-BIND-P3-CUCITANGAN",
    kode_subdomain: "SD-BIND-D1-S4",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Menurut teks, kapan saja kita harus mencuci tangan?${MCMA}`,
    opsi_a: "Sebelum makan.",
    opsi_b: "Sesudah buang air.",
    opsi_c: "Sebelum berangkat tidur.",
    opsi_d: "Setelah memegang hewan.",
    opsi_e: "Setelah mandi.",
    kunci: "A,B,D",
    pembahasan: "Paragraf ketiga menyebutkan waktu mencuci tangan: sebelum makan, sesudah buang air, setelah bermain di luar, serta setelah memegang hewan atau sampah. Sebelum tidur dan setelah mandi tidak disebutkan dalam teks.",
    tingkat_kesulitan: "mudah",
  },
  {
    kode_stimulus: "SD-BIND-P3-CUCITANGAN",
    kode_subdomain: "SD-BIND-D1-S3",
    bentuk_soal: "pgk_kategori",
    kategori: "Sesuai/Tidak Sesuai",
    pertanyaan: "Nisa membuat bagan langkah mencuci tangan. Tentukan **Sesuai** atau **Tidak Sesuai** setiap isi bagan berikut dengan teks!",
    opsi_a: "Langkah 1: membasahi kedua tangan dengan air mengalir.",
    opsi_b: "Langkah 2: menggosok punggung tangan dan sela-sela jari.",
    opsi_c: "Langkah 4: membilas tangan dengan air mengalir hingga bersih.",
    opsi_d: "Langkah 5: mengeringkan tangan dengan handuk bersih atau tisu.",
    kunci: "S,TS,S,S",
    pembahasan: "Urutan dalam teks: (1) basahi tangan dengan air mengalir, (2) tuangkan sabun, (3) gosok telapak, punggung tangan, sela jari, ujung jari, dan kuku, (4) bilas dengan air mengalir, (5) keringkan. Menggosok punggung tangan adalah langkah ketiga, bukan kedua (Tidak Sesuai). Isi bagan lainnya Sesuai.",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P3-CUCITANGAN",
    kode_subdomain: "SD-BIND-D3-S2",
    bentuk_soal: "pg",
    pertanyaan: "Raka dan tiga temannya mencuci tangan secara bergantian di satu baskom berisi air. Berdasarkan teks, cara tersebut kurang tepat karena ....",
    opsi_a: "air dalam baskom terlalu dingin",
    opsi_b: "mereka tidak memakai handuk",
    opsi_c: "kuman dari tangan orang lain bisa tertinggal di air",
    opsi_d: "mencuci tangan harus dilakukan sendirian",
    opsi_e: "baskom tidak boleh dipakai di sekolah",
    kunci: "C",
    pembahasan: "Paragraf keempat menjelaskan bahwa air dalam baskom biasanya dipakai bergantian, sehingga kuman dari tangan orang lain bisa tertinggal di air. Itulah sebabnya teks menganjurkan air mengalir dari keran. Pilihan lain tidak disebutkan dalam teks.",
    tingkat_kesulitan: "sulit",
  },
  {
    kode_stimulus: "SD-BIND-P3-CUCITANGAN",
    kode_subdomain: "SD-BIND-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: "Kata \"dianjurkan\" pada kalimat \"Mencuci tangan dengan air dalam baskom tidak dianjurkan\" bermakna sama dengan kata ....",
    opsi_a: "disarankan",
    opsi_b: "dilarang",
    opsi_c: "diwajibkan",
    opsi_d: "disediakan",
    opsi_e: "dipaksakan",
    kunci: "A",
    pembahasan: "Dianjurkan berarti disarankan atau dinasihatkan untuk dilakukan. Kalimat itu berarti mencuci tangan di baskom tidak disarankan. Dilarang dan diwajibkan bermakna lebih keras daripada dianjurkan.",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P3-CUCITANGAN",
    kode_subdomain: "SD-BIND-D3-S1",
    bentuk_soal: "pg",
    pertanyaan: "Kebiasaan di sekolah yang paling sesuai dengan isi teks adalah ....",
    opsi_a: "Siswa langsung makan bekal setelah bermain bola di lapangan.",
    opsi_b: "Siswa mencuci tangan dengan sabun di keran wastafel sebelum makan bekal.",
    opsi_c: "Siswa mengelap tangan yang kotor ke baju seragam.",
    opsi_d: "Siswa mencuci tangan bergantian di satu ember berisi air.",
    opsi_e: "Siswa mencuci tangan hanya dengan air selama dua detik.",
    kunci: "B",
    pembahasan: "Teks mengajarkan mencuci tangan memakai sabun dan air mengalir, terutama sebelum makan. Pilihan A dan C membiarkan tangan kotor, D memakai air yang dipakai bergantian, dan E tanpa sabun serta terlalu singkat (teks menyebut sekitar dua puluh detik).",
    tingkat_kesulitan: "sedang",
  },
  // ---- Kiki Si Anak Bebek ----
  {
    kode_stimulus: "SD-BIND-P3-KIKI",
    kode_subdomain: "SD-BIND-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: "Perubahan Kiki dari awal hingga akhir cerita adalah ....",
    opsi_a: "pemberani menjadi penakut",
    opsi_b: "takut air menjadi berani berenang dan menolong",
    opsi_c: "pemalas menjadi rajin",
    opsi_d: "sombong menjadi rendah hati",
    opsi_e: "pemarah menjadi penyabar",
    kunci: "B",
    pembahasan: "Di awal cerita, Kiki hanya menonton dari tepi kolam karena takut air dan takut tenggelam. Setelah belajar bersama Ibu, ia berani melompat ke kolam untuk menolong anak ayam, dan \"sejak hari itu, aku tidak takut air lagi\".",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SD-BIND-P3-KIKI",
    kode_subdomain: "SD-BIND-D2-S3",
    bentuk_soal: "pg",
    pertanyaan: "Ungkapan \"tanpa berpikir panjang\" dalam cerita menunjukkan bahwa Kiki ....",
    opsi_a: "tidak pandai berpikir",
    opsi_b: "lupa bahwa ia takut air",
    opsi_c: "segera bertindak tanpa ragu-ragu",
    opsi_d: "berpikir sangat lama sebelum menolong",
    opsi_e: "menunggu Ibu pulang terlebih dahulu",
    kunci: "C",
    pembahasan: "Tanpa berpikir panjang berarti langsung bertindak tanpa ragu atau menimbang-nimbang lama. Kiki melihat anak ayam minta tolong, sementara saudara-saudaranya tidur dan Ibu sedang pergi, sehingga ia segera melompat ke air untuk menolong.",
    tingkat_kesulitan: "sulit",
  },
  {
    kode_stimulus: "SD-BIND-P3-KIKI",
    kode_subdomain: "SD-BIND-D3-S3",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Perasaan apa saja yang mungkin muncul pada pembaca ketika membaca bagian anak ayam terpeleset ke kolam hingga Kiki membawanya ke tepi?${MCMA}`,
    opsi_a: "Cemas akan keselamatan anak ayam.",
    opsi_b: "Bosan karena ceritanya lambat.",
    opsi_c: "Tegang menunggu apakah Kiki berhasil.",
    opsi_d: "Kagum pada keberanian Kiki.",
    opsi_e: "Geli karena kejadiannya lucu.",
    kunci: "A,C,D",
    pembahasan: "Anak ayam yang menciap-ciap minta tolong membuat pembaca cemas. Kiki yang dulu takut air melompat dan berenang secepat mungkin, sehingga pembaca tegang lalu kagum. Bagian itu berlangsung cepat dan menegangkan, bukan membosankan atau lucu.",
    tingkat_kesulitan: "sulit",
  },
  {
    kode_stimulus: "SD-BIND-P3-KIKI",
    kode_subdomain: "SD-BIND-D1-S2",
    bentuk_soal: "pg",
    pertanyaan: "Kata \"menciap-ciap\" dalam cerita menunjukkan suara ....",
    opsi_a: "anak bebek",
    opsi_b: "Kaka",
    opsi_c: "induk ayam",
    opsi_d: "anak ayam",
    opsi_e: "Ibu bebek",
    kunci: "D",
    pembahasan: "Paragraf keempat menyebutkan, \"seekor anak ayam terpeleset ke kolam. Ia menciap-ciap minta tolong.\" Ciap adalah bunyi anak ayam.",
    tingkat_kesulitan: "mudah",
  },
  {
    kode_stimulus: "SD-BIND-P3-KIKI",
    kode_subdomain: "SD-BIND-D3-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Sesuai/Tidak Sesuai",
    pertanyaan: "Pengalaman Kiki dapat dihubungkan dengan kehidupan sehari-hari. Tentukan **Sesuai** atau **Tidak Sesuai** setiap tindakan berikut dengan pelajaran dari cerita!",
    opsi_a: "Belajar berenang di kolam yang dangkal dengan didampingi orang dewasa.",
    opsi_b: "Langsung melompat ke kolam yang dalam padahal belum bisa berenang agar terlihat berani.",
    opsi_c: "Segera menolong atau mencari bantuan ketika melihat teman dalam kesulitan.",
    kunci: "S,TS,S",
    pembahasan: "- Kiki belajar di bagian kolam yang dangkal sambil didampingi Ibu (Sesuai).\n- Kiki baru menolong setelah bisa berenang; melompat ke kolam dalam tanpa bisa berenang berbahaya dan tidak diajarkan cerita (Tidak Sesuai).\n- Kiki segera menolong anak ayam yang kesulitan (Sesuai).",
    tingkat_kesulitan: "sedang",
  },
];

export default {
  title: "TKA SD Bahasa Indonesia — Paket 3",
  description: "30 soal dari 6 bacaan: teks informasi tentang angklung, hutan bakau, dan cara mencuci tangan; cerita tentang celengan ayam dan anak bebek; serta puisi tentang nelayan.",
  jenjang: "SD",
  subjectCode: "SD-BIND",
  durationMinutes: 75,
  isPremium: true,
  isFullSimulation: true,
  createdByEmail: "kpbgalimka@gmail.com",
  stimuli,
  rows,
};
