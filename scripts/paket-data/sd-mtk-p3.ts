// TKA SD Matematika — Paket 3 (ditulis Claude, pola bentuk & sebaran mengikuti Paket 1 #43).
// 30 soal: 18 PG · 6 MCMA · 6 Kategori; 4/4 subtopik; L1 7 · L2 14 · L3 9.
// 3 stimulus: koperasi sekolah (bilangan), darmawisata (pengukuran), bank sampah (data).
const r = String.raw;

const stimuli = [
  {
    code: "SD-MTK-P3-KOPERASI",
    title: "Koperasi Sekolah",
    content: r`Koperasi SD Cendekia menjual alat tulis untuk siswa. Daftar harganya disajikan dalam tabel berikut.

| Barang | Harga |
|---|---|
| Buku tulis | Rp4.500,00 per buah |
| Pensil | Rp2.000,00 per batang |
| Penghapus | Rp1.500,00 per buah |
| Pulpen | Rp15.000,00 per kotak isi 6 batang |

Pembeli yang membeli buku tulis **lebih dari 10 buah** mendapat potongan 10% dari harga seluruh buku tulis yang dibeli.`,
  },
  {
    code: "SD-MTK-P3-DARMAWISATA",
    title: "Darmawisata ke Kebun Raya",
    content: r`Siswa kelas VI SD Cendekia berdarmawisata ke Kebun Raya. Bus berangkat dari sekolah pukul 07.30. Jarak sekolah ke Kebun Raya adalah 72 km. Di tengah perjalanan, bus berhenti di rumah makan selama 20 menit. Bus tiba di Kebun Raya pukul 09.20.

Di Kebun Raya, siswa berjalan mengelilingi taman bunga yang berbentuk persegi panjang dengan panjang 120 m dan lebar 80 m.`,
  },
  {
    code: "SD-MTK-P3-BANKSAMPAH",
    title: "Bank Sampah Kelas VI",
    content: r`Kelas VI mengumpulkan botol plastik bekas untuk bank sampah sekolah. Banyak botol yang terkumpul selama lima bulan disajikan dalam tabel berikut.

| Bulan | Banyak botol |
|---|---|
| Juli | 120 |
| Agustus | 150 |
| September | 90 |
| Oktober | 180 |
| November | 210 |

Setiap 30 botol dapat ditukar dengan uang Rp6.000,00.`,
  },
];

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
    pertanyaan: r`Di antara pecahan berikut, pecahan yang nilainya paling besar adalah ....`,
    opsi_a: r`$\dfrac{3}{5}$`,
    opsi_b: r`$\dfrac{5}{8}$`,
    opsi_c: r`$\dfrac{2}{3}$`,
    opsi_d: r`$\dfrac{7}{12}$`,
    opsi_e: r`$\dfrac{4}{7}$`,
    kunci: "C",
    pembahasan: r`Ubah ke bentuk desimal: $\dfrac{3}{5} = 0{,}6$; $\dfrac{5}{8} = 0{,}625$; $\dfrac{2}{3} \approx 0{,}667$; $\dfrac{7}{12} \approx 0{,}583$; $\dfrac{4}{7} \approx 0{,}571$. Nilai terbesar adalah $\dfrac{2}{3}$. Pecahan dengan penyebut paling besar ($\dfrac{7}{12}$) belum tentu bernilai paling besar.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 2
    kode_subdomain: "SD-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Bentuk desimal dari $\dfrac{7}{20}$ adalah ....`,
    opsi_a: r`$0{,}07$`,
    opsi_b: r`$0{,}14$`,
    opsi_c: r`$0{,}35$`,
    opsi_d: r`$0{,}72$`,
    opsi_e: r`$3{,}5$`,
    kunci: "C",
    pembahasan: r`Ubah penyebut menjadi 100: $\dfrac{7}{20} = \dfrac{7 \times 5}{20 \times 5} = \dfrac{35}{100} = 0{,}35$. Jawaban $3{,}5$ muncul bila koma diletakkan salah, dan $0{,}72$ hanya menuliskan angka 7 dan 2.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 3
    kode_subdomain: "SD-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Di sebuah taman ada tiga lampu hias. Lampu merah menyala setiap 6 detik, lampu kuning setiap 8 detik, dan lampu hijau setiap 10 detik. Pada suatu saat, ketiga lampu menyala bersamaan. Ketiga lampu itu akan menyala bersamaan lagi setelah ... detik.`,
    opsi_a: "24",
    opsi_b: "60",
    opsi_c: "80",
    opsi_d: "120",
    opsi_e: "480",
    kunci: "D",
    pembahasan: r`Ketiga lampu menyala bersamaan lagi setelah KPK dari 6, 8, dan 10.

- $6 = 2 \times 3$
- $8 = 2^3$
- $10 = 2 \times 5$

KPK $= 2^3 \times 3 \times 5 = 120$ detik. Jawaban 24 berasal dari $6 + 8 + 10$, dan 480 dari $6 \times 8 \times 10$ (kelipatan persekutuan, tetapi bukan yang terkecil).`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 4
    kode_subdomain: "SD-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Bu Sari memiliki 45 apel, 60 jeruk, dan 75 salak. Semua buah akan dimasukkan ke dalam keranjang sebanyak-banyaknya. Setiap keranjang berisi apel, jeruk, dan salak dengan banyak yang sama dan tidak ada buah yang tersisa. Banyak buah seluruhnya dalam setiap keranjang adalah ....`,
    opsi_a: "3 buah",
    opsi_b: "5 buah",
    opsi_c: "12 buah",
    opsi_d: "15 buah",
    opsi_e: "180 buah",
    kunci: "C",
    pembahasan: r`Banyak keranjang terbanyak = FPB dari 45, 60, dan 75, yaitu 15 keranjang. Isi setiap keranjang: $45 : 15 = 3$ apel, $60 : 15 = 4$ jeruk, dan $75 : 15 = 5$ salak. Jadi, setiap keranjang berisi $3 + 4 + 5 = 12$ buah. Angka 15 adalah banyak keranjang, bukan isi keranjang, dan 180 adalah banyak buah seluruhnya.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 5
    kode_subdomain: "SD-MTK-D1-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Tentukan **Benar** atau **Salah** setiap hasil operasi hitung berikut!",
    opsi_a: r`$\dfrac{3}{4} - \dfrac{1}{6} = \dfrac{7}{12}$`,
    opsi_b: r`$\dfrac{2}{5} + \dfrac{1}{3} = \dfrac{3}{8}$`,
    opsi_c: r`$4 \times \dfrac{2}{3} = \dfrac{8}{12}$`,
    opsi_d: r`$1\dfrac{1}{2} + \dfrac{2}{3} = 2\dfrac{1}{6}$`,
    kunci: "B,S,S,B",
    pembahasan: r`- $\dfrac{3}{4} - \dfrac{1}{6} = \dfrac{9}{12} - \dfrac{2}{12} = \dfrac{7}{12}$ (Benar).
- $\dfrac{2}{5} + \dfrac{1}{3} = \dfrac{6}{15} + \dfrac{5}{15} = \dfrac{11}{15}$; hasil $\dfrac{3}{8}$ didapat bila pembilang dan penyebut langsung dijumlahkan (Salah).
- $4 \times \dfrac{2}{3} = \dfrac{8}{3} = 2\dfrac{2}{3}$; hasil $\dfrac{8}{12}$ didapat bila penyebut ikut dikalikan 4 (Salah).
- $1\dfrac{1}{2} + \dfrac{2}{3} = \dfrac{9}{6} + \dfrac{4}{6} = \dfrac{13}{6} = 2\dfrac{1}{6}$ (Benar).`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 6
    kode_subdomain: "SD-MTK-D1-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Manakah bilangan yang merupakan faktor dari 36 dan sekaligus kelipatan 3?${MCMA}`,
    opsi_a: "4",
    opsi_b: "6",
    opsi_c: "9",
    opsi_d: "15",
    opsi_e: "18",
    kunci: "B,C,E",
    pembahasan: r`Faktor dari 36 adalah 1, 2, 3, 4, 6, 9, 12, 18, dan 36. Di antara pilihan, yang juga kelipatan 3 adalah 6, 9, dan 18. Bilangan 4 memang faktor 36, tetapi bukan kelipatan 3. Bilangan 15 kelipatan 3, tetapi bukan faktor 36 ($36 : 15$ tidak habis).`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 7
    kode_subdomain: "SD-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Rina memiliki uang Rp60.000,00. Ia memakai $\dfrac{1}{4}$ bagian uangnya untuk membeli buku. Kemudian, ia memakai $\dfrac{2}{5}$ bagian dari **sisa** uangnya untuk membeli tas. Sisa uang Rina sekarang adalah ....`,
    opsi_a: "Rp18.000,00",
    opsi_b: "Rp21.000,00",
    opsi_c: "Rp27.000,00",
    opsi_d: "Rp33.000,00",
    opsi_e: "Rp39.000,00",
    kunci: "C",
    pembahasan: r`Uang untuk buku $= \dfrac{1}{4} \times 60.000 = 15.000$, sisa $60.000 - 15.000 = 45.000$.

Uang untuk tas $= \dfrac{2}{5} \times 45.000 = 18.000$, sisa $45.000 - 18.000 = 27.000$.

Jadi, sisa uang Rina Rp27.000,00. Jawaban Rp21.000,00 muncul bila $\dfrac{2}{5}$ dihitung dari seluruh uang ($\dfrac{2}{5} \times 60.000 = 24.000$), padahal yang dimaksud adalah sisa uang.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  // ---- Stimulus: Koperasi Sekolah ----
  {
    // 8
    kode_stimulus: "SD-MTK-P3-KOPERASI",
    kode_subdomain: "SD-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: "Harga satu batang pulpen di koperasi tersebut adalah ....",
    opsi_a: "Rp1.500,00",
    opsi_b: "Rp2.000,00",
    opsi_c: "Rp2.500,00",
    opsi_d: "Rp3.000,00",
    opsi_e: "Rp9.000,00",
    kunci: "C",
    pembahasan: r`Satu kotak berisi 6 batang pulpen seharga Rp15.000,00. Harga satu batang $= 15.000 : 6 = 2.500$, yaitu Rp2.500,00.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 9
    kode_stimulus: "SD-MTK-P3-KOPERASI",
    kode_subdomain: "SD-MTK-D1-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Dayu membawa uang Rp20.000,00 ke koperasi. Belanjaan manakah yang dapat dibeli Dayu tanpa kekurangan uang?${MCMA}`,
    opsi_a: "3 buku tulis dan 2 pensil",
    opsi_b: "1 kotak pulpen dan 3 penghapus",
    opsi_c: "4 buku tulis dan 1 pensil",
    opsi_d: "2 buku tulis, 3 pensil, dan 4 penghapus",
    opsi_e: "1 kotak pulpen dan 3 pensil",
    kunci: "A,B,C",
    pembahasan: r`- 3 buku tulis dan 2 pensil: $13.500 + 4.000 = 17.500$ (cukup).
- 1 kotak pulpen dan 3 penghapus: $15.000 + 4.500 = 19.500$ (cukup).
- 4 buku tulis dan 1 pensil: $18.000 + 2.000 = 20.000$ (tepat cukup, tidak kurang).
- 2 buku tulis, 3 pensil, dan 4 penghapus: $9.000 + 6.000 + 6.000 = 21.000$ (kurang Rp1.000,00).
- 1 kotak pulpen dan 3 pensil: $15.000 + 6.000 = 21.000$ (kurang Rp1.000,00).`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 10
    kode_stimulus: "SD-MTK-P3-KOPERASI",
    kode_subdomain: "SD-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: "Pak Guru membeli 12 buku tulis di koperasi untuk hadiah lomba. Uang yang harus dibayar Pak Guru adalah ....",
    opsi_a: "Rp5.400,00",
    opsi_b: "Rp43.200,00",
    opsi_c: "Rp48.600,00",
    opsi_d: "Rp49.500,00",
    opsi_e: "Rp54.000,00",
    kunci: "C",
    pembahasan: r`Harga 12 buku tulis $= 12 \times 4.500 = 54.000$. Karena membeli lebih dari 10 buah, Pak Guru mendapat potongan $10\% \times 54.000 = 5.400$. Uang yang dibayar $= 54.000 - 5.400 = 48.600$, yaitu Rp48.600,00.

Rp54.000,00 belum dikurangi potongan, Rp5.400,00 hanya besar potongannya, dan Rp49.500,00 muncul bila potongan dianggap seharga satu buku tulis.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  {
    // 11
    kode_stimulus: "SD-MTK-P3-KOPERASI",
    kode_subdomain: "SD-MTK-D1-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Tentukan **Benar** atau **Salah** setiap pernyataan berikut berdasarkan daftar harga koperasi!",
    opsi_a: "Membeli 1 kotak pulpen lebih murah daripada membeli 6 batang pensil.",
    opsi_b: "Uang Rp10.000,00 cukup untuk membeli 1 buku tulis dan 2 pensil.",
    opsi_c: "Harga 11 buku tulis setelah potongan lebih murah daripada harga 10 buku tulis.",
    kunci: "S,B,B",
    pembahasan: r`- 6 batang pensil $= 6 \times 2.000 = 12.000$, lebih murah daripada 1 kotak pulpen Rp15.000,00 (Salah).
- 1 buku tulis dan 2 pensil $= 4.500 + 4.000 = 8.500$, kurang dari Rp10.000,00 (Benar).
- 11 buku tulis $= 49.500$, mendapat potongan $10\% = 4.950$, sehingga dibayar $44.550$. Sepuluh buku tulis tidak mendapat potongan (harus **lebih dari** 10), harganya $45.000$. Jadi, 11 buku justru lebih murah (Benar).`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  // ---- Objek geometri ----
  {
    // 12
    kode_subdomain: "SD-MTK-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: `Sebuah bangun datar memiliki ciri-ciri berikut.
- Memiliki 4 sisi.
- Hanya memiliki sepasang sisi yang sejajar.
- Dua sudutnya siku-siku.

Bangun datar tersebut adalah ....`,
    opsi_a: "persegi panjang",
    opsi_b: "trapesium siku-siku",
    opsi_c: "jajargenjang",
    opsi_d: "layang-layang",
    opsi_e: "belah ketupat",
    kunci: "B",
    pembahasan: "Segi empat yang hanya memiliki sepasang sisi sejajar adalah trapesium. Trapesium yang memiliki dua sudut siku-siku disebut trapesium siku-siku. Persegi panjang dan jajargenjang memiliki dua pasang sisi sejajar, sedangkan layang-layang tidak memiliki sisi sejajar.",
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 13
    kode_subdomain: "SD-MTK-D2-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Manakah bangun datar yang memiliki **lebih dari 2** sumbu simetri?${MCMA}`,
    opsi_a: "Persegi",
    opsi_b: "Persegi panjang",
    opsi_c: "Segitiga sama sisi",
    opsi_d: "Jajargenjang",
    opsi_e: "Segi enam beraturan",
    kunci: "A,C,E",
    pembahasan: "Persegi memiliki 4 sumbu simetri, segitiga sama sisi 3 sumbu simetri, dan segi enam beraturan 6 sumbu simetri. Persegi panjang hanya memiliki 2 sumbu simetri (tidak lebih dari 2), sedangkan jajargenjang tidak memiliki sumbu simetri.",
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 14
    kode_subdomain: "SD-MTK-D2-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Beni menyusun kubus-kubus kecil yang sama besar menjadi sebuah balok. Bagian depan balok terdiri atas 4 kubus ke samping. Ke belakang ada 3 kubus, dan tingginya 2 kubus.

Manakah pernyataan yang benar tentang susunan tersebut?${MCMA}`,
    opsi_a: "Banyak kubus kecil seluruhnya adalah 24.",
    opsi_b: "Jika dilihat dari depan, tampak 8 persegi.",
    opsi_c: "Jika dilihat dari atas, tampak 12 persegi.",
    opsi_d: "Jika dilihat dari samping kanan, tampak 8 persegi.",
    opsi_e: "Jika dilihat dari atas, tampak 24 persegi.",
    kunci: "A,B,C",
    pembahasan: r`- Banyak kubus $= 4 \times 3 \times 2 = 24$ (benar).
- Tampak depan: 4 ke samping dan 2 ke atas, $4 \times 2 = 8$ persegi (benar).
- Tampak atas: 4 ke samping dan 3 ke belakang, $4 \times 3 = 12$ persegi (benar), bukan 24, karena kubus yang bertumpuk hanya terlihat sekali.
- Tampak samping kanan: 3 ke belakang dan 2 ke atas, $3 \times 2 = 6$ persegi, bukan 8.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 15
    kode_subdomain: "SD-MTK-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Sebuah kubus besar disusun dari 27 kubus kecil yang sama besar ($3 \times 3 \times 3$). Seluruh permukaan luar kubus besar dicat merah. Banyak kubus kecil yang terkena cat **tepat pada satu sisi** saja adalah ....`,
    opsi_a: "1",
    opsi_b: "6",
    opsi_c: "8",
    opsi_d: "12",
    opsi_e: "27",
    kunci: "B",
    pembahasan: r`Kubus besar memiliki 6 sisi. Pada setiap sisi ada $3 \times 3 = 9$ kubus kecil yang tampak.

- 8 kubus di titik sudut terkena cat pada 3 sisi.
- 12 kubus di tengah rusuk terkena cat pada 2 sisi.
- Kubus di tengah setiap sisi hanya terkena cat pada 1 sisi, banyaknya 1 kubus per sisi, jadi $6 \times 1 = 6$ kubus.
- 1 kubus di pusat tidak terkena cat.

Periksa: $8 + 12 + 6 + 1 = 27$.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  {
    // 16
    kode_subdomain: "SD-MTK-D2-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Tentukan **Benar** atau **Salah** setiap pernyataan tentang bangun datar berikut!",
    opsi_a: "Segitiga yang ketiga sudutnya lancip disebut segitiga lancip.",
    opsi_b: "Segi enam memiliki 6 sisi dan 6 titik sudut.",
    opsi_c: "Setiap trapesium memiliki dua pasang sisi yang sejajar.",
    opsi_d: "Setiap belah ketupat pasti memiliki empat sudut siku-siku.",
    kunci: "B,B,S,S",
    pembahasan: "- Segitiga lancip adalah segitiga yang ketiga sudutnya kurang dari 90° (Benar).\n- Segi enam memiliki 6 sisi dan 6 titik sudut (Benar).\n- Trapesium hanya memiliki **sepasang** sisi sejajar; yang memiliki dua pasang adalah jajargenjang, persegi panjang, persegi, dan belah ketupat (Salah).\n- Belah ketupat umumnya memiliki dua sudut lancip dan dua sudut tumpul. Hanya belah ketupat yang berbentuk persegi yang sudutnya siku-siku (Salah).",
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 17
    kode_subdomain: "SD-MTK-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: `Pak Budi menyusun kardus berbentuk kubus yang sama besar di gudang. Susunannya terdiri atas 4 kardus ke samping, 3 baris ke belakang, dan 3 tingkat ke atas, sehingga berbentuk balok.

Pak Budi mengambil semua kardus pada baris paling depan. Setelah itu, ia mengambil semua kardus pada tingkat paling atas dari kardus yang tersisa. Banyak kardus yang masih tersusun adalah ....`,
    opsi_a: "12",
    opsi_b: "16",
    opsi_c: "20",
    opsi_d: "24",
    opsi_e: "28",
    kunci: "B",
    pembahasan: r`Banyak kardus mula-mula $= 4 \times 3 \times 3 = 36$.

Baris paling depan berisi $4 \times 3 = 12$ kardus (4 ke samping, 3 tingkat). Setelah diambil, tersisa $36 - 12 = 24$ kardus, yaitu 4 ke samping, 2 baris, dan 3 tingkat.

Tingkat paling atas dari sisa itu berisi $4 \times 2 = 8$ kardus. Setelah diambil, tersisa $24 - 8 = 16$ kardus.

Jawaban 12 muncul bila tingkat atas dianggap masih berisi 12 kardus (3 baris), padahal baris depan sudah diambil.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  // ---- Stimulus: Darmawisata ----
  {
    // 18
    kode_stimulus: "SD-MTK-P3-DARMAWISATA",
    kode_subdomain: "SD-MTK-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: "Lama perjalanan bus dari berangkat hingga tiba di Kebun Raya adalah ....",
    opsi_a: "1 jam 20 menit",
    opsi_b: "1 jam 30 menit",
    opsi_c: "1 jam 50 menit",
    opsi_d: "2 jam 10 menit",
    opsi_e: "2 jam 50 menit",
    kunci: "C",
    pembahasan: "Dari pukul 07.30 ke pukul 09.30 adalah 2 jam. Bus tiba pukul 09.20, yaitu 10 menit lebih awal dari 09.30. Jadi, lama perjalanan 2 jam − 10 menit = 1 jam 50 menit. Jawaban 2 jam 10 menit muncul bila 10 menit itu ditambahkan, bukan dikurangkan.",
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 19
    kode_stimulus: "SD-MTK-P3-DARMAWISATA",
    kode_subdomain: "SD-MTK-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: "Kecepatan rata-rata bus selama bus berjalan (tidak termasuk waktu berhenti di rumah makan) adalah ....",
    opsi_a: "36 km/jam",
    opsi_b: "40 km/jam",
    opsi_c: "48 km/jam",
    opsi_d: "60 km/jam",
    opsi_e: "72 km/jam",
    kunci: "C",
    pembahasan: r`Lama perjalanan seluruhnya 1 jam 50 menit = 110 menit. Waktu bus berjalan $= 110 - 20 = 90$ menit $= 1{,}5$ jam.

Kecepatan rata-rata $= \dfrac{\text{jarak}}{\text{waktu}} = \dfrac{72}{1{,}5} = 48$ km/jam.

Jawaban 72 km/jam muncul bila waktu dianggap 1 jam, dan 36 km/jam bila waktu dianggap 2 jam.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  {
    // 20
    kode_stimulus: "SD-MTK-P3-DARMAWISATA",
    kode_subdomain: "SD-MTK-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: "Siswa berjalan mengelilingi tepi taman bunga sebanyak 3 kali putaran. Jarak yang ditempuh siswa adalah ....",
    opsi_a: "0,4 km",
    opsi_b: "400 m",
    opsi_c: "1,2 km",
    opsi_d: "2,4 km",
    opsi_e: "12 km",
    kunci: "C",
    pembahasan: r`Keliling taman $= 2 \times (120 + 80) = 2 \times 200 = 400$ m. Tiga putaran $= 3 \times 400 = 1.200$ m $= 1{,}2$ km (karena 1 km = 1.000 m). Pilihan 400 m dan 0,4 km hanya satu putaran.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 21
    kode_stimulus: "SD-MTK-P3-DARMAWISATA",
    kode_subdomain: "SD-MTK-D2-S2",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Tentukan **Benar** atau **Salah** setiap pernyataan berikut!",
    opsi_a: "Luas taman bunga adalah 9.600 m².",
    opsi_b: "Jarak sekolah ke Kebun Raya sama dengan 7.200 m.",
    opsi_c: "Bus pulang pukul 14.15. Jika lama perjalanan pulang sama dengan perjalanan pergi, bus tiba di sekolah pukul 16.05.",
    opsi_d: "Waktu berhenti di rumah makan sama dengan sepertiga jam.",
    kunci: "B,S,B,B",
    pembahasan: r`- Luas taman $= 120 \times 80 = 9.600$ m² (Benar).
- $72$ km $= 72 \times 1.000 = 72.000$ m, bukan 7.200 m (Salah).
- Pukul 14.15 + 1 jam 50 menit = pukul 16.05 (Benar).
- 20 menit $= \dfrac{20}{60}$ jam $= \dfrac{1}{3}$ jam (Benar).`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  // ---- Pengukuran (soal tunggal) ----
  {
    // 22
    kode_subdomain: "SD-MTK-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: r`$3 \text{ liter} + 250 \text{ ml} = \ldots \text{ ml}$`,
    opsi_a: "253",
    opsi_b: "3.025",
    opsi_c: "3.250",
    opsi_d: "5.500",
    opsi_e: "32.500",
    kunci: "C",
    pembahasan: r`$3$ liter $= 3 \times 1.000$ ml $= 3.000$ ml. Jadi, $3.000 + 250 = 3.250$ ml. Jawaban 253 dan 5.500 muncul bila liter tidak diubah ke mililiter terlebih dahulu.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 23
    kode_subdomain: "SD-MTK-D2-S2",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Manakah ukuran berat yang sama dengan 1,5 kg?${MCMA}`,
    opsi_a: "1.500 g",
    opsi_b: "15 hg",
    opsi_c: "150 dag",
    opsi_d: "15.000 g",
    opsi_e: "1.050 g",
    kunci: "A,B,C",
    pembahasan: r`1 kg = 1.000 g = 10 hg = 100 dag.

- $1{,}5$ kg $= 1{,}5 \times 1.000 = 1.500$ g.
- $1{,}5$ kg $= 1{,}5 \times 10 = 15$ hg.
- $1{,}5$ kg $= 1{,}5 \times 100 = 150$ dag.

15.000 g sama dengan 15 kg, sedangkan 1.050 g sama dengan 1,05 kg.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 24
    kode_subdomain: "SD-MTK-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: `Bak mandi berbentuk balok berukuran panjang 90 cm, lebar 60 cm, dan tinggi 70 cm. Mula-mula bak berisi air setinggi 20 cm. Bak itu akan diisi air sampai penuh menggunakan ember berisi 9 liter.

Banyak ember air yang diperlukan adalah ....

Ingat: 1 liter = 1.000 cm³.`,
    opsi_a: "12 ember",
    opsi_b: "28 ember",
    opsi_c: "30 ember",
    opsi_d: "42 ember",
    opsi_e: "50 ember",
    kunci: "C",
    pembahasan: r`Bagian bak yang belum terisi tingginya $70 - 20 = 50$ cm. Volume air yang diperlukan $= 90 \times 60 \times 50 = 270.000$ cm³ $= 270$ liter. Banyak ember $= 270 : 9 = 30$ ember.

Jawaban 42 ember adalah volume bak penuh ($378$ liter $: 9$) tanpa memperhitungkan air yang sudah ada, dan 12 ember adalah volume air yang sudah ada ($108$ liter $: 9$).`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  // ---- Stimulus: Bank Sampah ----
  {
    // 25
    kode_stimulus: "SD-MTK-P3-BANKSAMPAH",
    kode_subdomain: "SD-MTK-D3-S1",
    bentuk_soal: "pg",
    pertanyaan: "Pada bulan apakah botol plastik paling sedikit terkumpul?",
    opsi_a: "Juli",
    opsi_b: "Agustus",
    opsi_c: "September",
    opsi_d: "Oktober",
    opsi_e: "November",
    kunci: "C",
    pembahasan: "Bilangan paling kecil pada tabel adalah 90, yaitu pada bulan September. November (210 botol) adalah bulan dengan botol paling banyak.",
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 26
    kode_stimulus: "SD-MTK-P3-BANKSAMPAH",
    kode_subdomain: "SD-MTK-D3-S1",
    bentuk_soal: "pg",
    pertanyaan: "Rata-rata banyak botol yang terkumpul setiap bulan adalah ....",
    opsi_a: "140 botol",
    opsi_b: "150 botol",
    opsi_c: "160 botol",
    opsi_d: "180 botol",
    opsi_e: "750 botol",
    kunci: "B",
    pembahasan: r`Jumlah botol $= 120 + 150 + 90 + 180 + 210 = 750$. Rata-rata $= 750 : 5 = 150$ botol per bulan. 750 adalah jumlah seluruh botol, belum dibagi banyak bulan.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 27
    kode_stimulus: "SD-MTK-P3-BANKSAMPAH",
    kode_subdomain: "SD-MTK-D3-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: `Data tersebut akan disajikan dalam bentuk piktogram. Setiap 1 gambar botol mewakili 30 botol.

Manakah pernyataan yang benar?${MCMA}`,
    opsi_a: "Bulan Juli digambarkan dengan 4 gambar botol.",
    opsi_b: "Bulan Agustus digambarkan dengan 6 gambar botol.",
    opsi_c: "Bulan September digambarkan dengan 3 gambar botol.",
    opsi_d: "Bulan Oktober digambarkan dengan 5 gambar botol.",
    opsi_e: "Bulan November digambarkan dengan 7 gambar botol.",
    kunci: "A,C,E",
    pembahasan: r`Banyak gambar = banyak botol $: 30$.

- Juli $120 : 30 = 4$ gambar (benar).
- Agustus $150 : 30 = 5$ gambar, bukan 6.
- September $90 : 30 = 3$ gambar (benar).
- Oktober $180 : 30 = 6$ gambar, bukan 5.
- November $210 : 30 = 7$ gambar (benar).`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 28
    kode_stimulus: "SD-MTK-P3-BANKSAMPAH",
    kode_subdomain: "SD-MTK-D3-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Tentukan **Benar** atau **Salah** setiap pernyataan berikut!",
    opsi_a: "Uang yang diperoleh dari seluruh botol selama lima bulan adalah Rp150.000,00.",
    opsi_b: "Kenaikan banyak botol paling besar terjadi dari bulan September ke bulan Oktober.",
    opsi_c: "Banyak botol bulan Oktober tiga kali banyak botol bulan September.",
    kunci: "B,B,S",
    pembahasan: r`- Seluruh botol 750, dapat ditukar $750 : 30 = 25$ kali. Uangnya $25 \times 6.000 = 150.000$ (Benar).
- Perubahan tiap bulan: Juli–Agustus naik 30, Agustus–September turun 60, September–Oktober naik 90, Oktober–November naik 30. Kenaikan terbesar 90, dari September ke Oktober (Benar).
- $180 : 90 = 2$, jadi Oktober **dua** kali September, bukan tiga kali (Salah).`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  {
    // 29
    kode_stimulus: "SD-MTK-P3-BANKSAMPAH",
    kode_subdomain: "SD-MTK-D3-S1",
    bentuk_soal: "pg",
    pertanyaan: "Kelas VI ingin rata-rata botol yang terkumpul selama enam bulan (Juli sampai Desember) menjadi 160 botol per bulan. Banyak botol yang harus dikumpulkan pada bulan Desember paling sedikit adalah ....",
    opsi_a: "150 botol",
    opsi_b: "160 botol",
    opsi_c: "180 botol",
    opsi_d: "210 botol",
    opsi_e: "240 botol",
    kunci: "D",
    pembahasan: r`Agar rata-rata 6 bulan 160 botol, jumlah botol harus $6 \times 160 = 960$. Botol yang sudah terkumpul 750. Kekurangannya $960 - 750 = 210$ botol. Jawaban 160 botol keliru karena rata-rata lima bulan pertama (150) masih di bawah 160, sehingga Desember harus menutup kekurangannya.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  // ---- Data (soal tunggal) ----
  {
    // 30
    kode_subdomain: "SD-MTK-D3-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: `Hasil pendataan olahraga kesukaan 32 siswa kelas V disajikan dalam tabel berikut. Data renang belum ditulis.

| Olahraga | Banyak siswa |
|---|---|
| Sepak bola | 10 |
| Bulu tangkis | 8 |
| Renang | ... |
| Voli | 5 |
| Senam | 3 |

Tentukan **Benar** atau **Salah** setiap pernyataan berikut!`,
    opsi_a: "Banyak siswa yang menyukai renang adalah 6 orang.",
    opsi_b: "Banyak siswa yang menyukai sepak bola dua kali banyak siswa yang menyukai voli.",
    opsi_c: "Siswa yang menyukai bulu tangkis dan voli lebih banyak daripada siswa yang menyukai sepak bola dan senam.",
    kunci: "B,B,S",
    pembahasan: r`- Renang $= 32 - (10 + 8 + 5 + 3) = 32 - 26 = 6$ siswa (Benar).
- $2 \times 5 = 10$, sama dengan banyak penyuka sepak bola (Benar).
- Bulu tangkis + voli $= 8 + 5 = 13$, sepak bola + senam $= 10 + 3 = 13$. Keduanya sama banyak, tidak lebih banyak (Salah).`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
];

export default {
  title: "TKA SD Matematika — Paket 3",
  description: "30 soal: pecahan, KPK dan FPB, bangun datar dan bangun ruang, pengukuran waktu, jarak, berat, dan volume, serta pengolahan data dalam konteks koperasi sekolah, darmawisata, dan bank sampah.",
  jenjang: "SD",
  subjectCode: "SD-MTK",
  durationMinutes: 75,
  isPremium: true,
  isFullSimulation: true,
  createdByEmail: "kpbgalimka@gmail.com",
  stimuli,
  rows,
};
