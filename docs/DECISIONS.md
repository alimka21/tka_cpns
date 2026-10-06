# Log Keputusan (ADR Ringkas)

Tambahkan entri baru di **atas** (terbaru dulu). Satu entri = beberapa
baris saja. Ini menggantikan penjelasan panjang di chat supaya sesi
Claude Code berikutnya tahu "kenapa" tanpa baca ulang riwayat percakapan.

Format:
```
## YYYY-MM-DD — Judul singkat
Keputusan: ...
Alasan: ...
Alternatif yang ditolak: ...
```

## 2026-10-06 — Paket TKA SMA Matematika — Paket 3 (#33, draf, ditulis Claude)
Pola sama dengan B. Indonesia Paket 2: 13 soal variasi soal bank (bilangan dan
konteks diganti, `source_question_id` = #152, 153, 154, 155, 156, 157, 172, 173, 175,
331, 333, 334, 339 — sumber dipilih yang tidak bergantung gambar) + 12 soal baru
dengan 3 grup stimulus (paket internet, data lama tidur, kolam taman). Soal #682–#706,
stimulus #72–#74. 15 PG + 4 MCMA + 6 Kategori, 75 menit, 10/10 subtopik, L1 12%,
L3 40%, sulit 32% — semua aturan wajib lolos; saran "mayoritas berbasis stimulus"
belum (10/25). Semua hitungan dicek ulang dan 157 rumus KaTeX valid. Catatan
tampilan: stimulus tidak merender tabel markdown — tabel ditulis sebagai baris teks.

## 2026-10-06 — Paket TKA SMA Bahasa Indonesia — Paket 2 (#32, draf, ditulis Claude)
Permintaan pemilik: 50% variasi soal bank, 50% soal baru. 6 bacaan × 5 soal (stimulus
#66–#71, soal #652–#681, `generated_by` manual). Variasi (15): 3 bacaan baru meniru pola
bacaan bank — "Uang Panaik" (pola Belis/Buwuhan), cerpen "Perahu Terakhir" (pola Roh
Meratus/Layur), "Remaja dan Jerat Gim Daring" (pola Interaksi Sosial di Era Digital) —
tiap soal meniru bentuk & indikator soal asal dan `source_question_id` diisi (#92, 97,
98, 99, 101, 103, 111–115, 117–120). Baru (15): eksplanasi penurunan muka tanah, puisi
"Di Dermaga Senja", dua teks opini ponsel di sekolah (antarteks). 18 PG + 6 MCMA +
6 Kategori, 75 menit, 11/11 subtopik, mudah 23%, sulit 20%, 6 grup × 5 — semua aturan
wajib & saran lolos. Data survei di bacaan gim berlabel ilustratif (Kota Ardana fiktif).

## 2026-10-06 — Paket TKA SMA Sosiologi — Paket 1 (#31, draf, lolos aturan)
PDF "SOAL TKA Sosiologi SMA 2025 Pilihan" 30 soal TANPA kunci (27 PG, 2 MCMA, 1 Kategori)
→ kunci & pembahasan Claude; soal #615–#651, 7 gambar dari PDF (infografis urbanisasi,
perempuan dalam politik [dipakai no. 7 & 8], grafik partisipasi, tabel informan,
tambang, jenis kelompok, hoaks). Paket butuh ≥ 10 non-PG → 7 soal tambahan Claude
("[Soal tambahan]": sifat sosiologi, agen sosialisasi, ciri masyarakat majemuk,
kesetaraan gender, bentuk akomodasi, perubahan sosial tol, sikap kritis globalisasi).
Paket #31 = 15 PG + 5 MCMA + 5 Kategori, 60 menit, 12/12 subtopik; no. 6, 10, 26
dilabeli sulit → mudah 32%, sulit 16%, L3 20%. Di bank saja (PG): no. 8, 13, 14, 15,
17, 19, 20, 22, 23, 25, 29, 30. Kunci paling bisa diperdebatkan: no. 10 (B, D — A & C
manfaat teoretis), no. 16 (E vs D), no. 25 (B), no. 15 (C arbitrase, bank).

## 2026-10-06 — Paket TKA SMA Sejarah — Paket 1 (#30, draf, lolos aturan)
PDF "SOAL TKA Sejarah SMA 2025 Pilihan" 29 halaman, 30 soal unik (Demak 0041 &
Teuku Abdul Jalil 0422 tercetak dua kali) TANPA kunci → kunci & pembahasan Claude;
soal #585–#614, 6 gambar/tabel (kapal Belanda, Tritura, relief Karmawibhangga 65,
poenale sanctie, ekonomi Demokrasi Liberal, dualisme kepemimpinan). Paket #30 =
14 PG + 6 MCMA + 5 Kategori, 60 menit, 13/16 subtopik; label no. 9, 12, 14, 23
dinaikkan ke L3 (9 & 23 sulit) → mudah 40%, sulit 16%, L3 24%. Di bank saja:
no. 2, 6, 13, 21, 24. Perbaikan PDF: Tepat/Tidak Tepat → Sesuai/Tidak Sesuai;
no. 27 tanggal Agresi II 10 → 19 Desember 1948; no. 24 pernyataan ketiga diganti
(ketiganya semula bernilai Benar); no. 25 frasa "akibat berbagai konflik" (tidak
didukung tabel) diperjelas. Kunci paling bisa diperdebatkan: no. 10 (E hama
tikus), no. 17 (E penindasan), no. 23 (A, C — Semarang melawan Jepang), no. 2 (A, C).

## 2026-10-06 — Paket TKA SMA Pendidikan Pancasila — Paket 1 (#29, draf, lolos aturan)
PDF "SOAL TKA PPKn SMA 2025 Pilihan" 29 soal (no. 21 belum ada) TANPA kunci → kunci
& pembahasan Claude; soal #555–#584 (tanpa gambar). PDF 20 PG / 9 non-PG → +1 Kategori
tambahan Claude (hoaks video suntingan & keutuhan NKRI). Paket #29 = 15 PG + 4 MCMA +
6 Kategori, 60 menit, 4/4 subtopik (kerangka PPKn hanya 1 subtopik per elemen).
Di bank saja (PG): no. 7, 18, 19, 30. Kesulitan no. 9 & 12 dinaikkan ke sulit, no. 13
ke sedang → mudah 40%, sulit 16%. Kunci paling bisa diperdebatkan: no. 9 (A
pemerataan vs D partisipasi), no. 12 (E vs C), no. 7 (D, bank), no. 8 (A, D, E),
no. 28 (B, C, E), no. 29 (A, C, E).

## 2026-10-06 — Paket TKA SMA Kimia — Paket 1 (#28, draf, lolos aturan)
PDF "SOAL TKA Kimia SMA 2025 Pilihan" 25 soal TANPA kunci → kunci & pembahasan
Claude (semua hitungan dicek ulang); soal #524–#554, 16 gambar/tabel/grafik dari PDF.
PDF 21 PG / 4 non-PG dan tanpa soal Struktur Atom & Ikatan Kimia → 6 soal tambahan
Claude ("[Soal tambahan]": ion X²⁺/Y⁻, bentuk & kepolaran molekul, ΔHc metana,
penyangga asetat, sel Zn–Cu, faktor laju CaCO₃). Paket #28 = 15 PG + 4 MCMA +
6 Kategori, 60 menit, 8/8 subtopik, L3 56%. Di bank saja (PG): no. 1, 4, 10, 17, 18, 20.
Perbaikan PDF: no. 4 R ditambahkan; no. 12 massa jenis 1 g/mL ditambahkan (kunci
1,6%); no. 10 opsi "₃O⁺" → H₃O⁺; no. 24 H₂O di kedua ruas (tidak setara) dihapus;
no. 25 "X₂⁺" → X²⁺; no. 17 "jumlah sama" → "jumlah mol sama"; no. 8 struktur
zig-zag ditulis CH₃–CH₂–CH₂–CH₃; no. 11 opsi tabel ditulis sebagai teks.
Kunci yang paling perlu dicek: no. 7 (A, B, D — S = parafin/lilin), no. 9 (B, B, S),
no. 25 (B — arah panah elektron Y → X), no. 22 (B).

## 2026-10-05 — Paket TKA SMA Geografi — Paket 1 (#27, draf, lolos aturan)
PDF "SOAL TKA Geografi SMA 2025 Pilihan" 49 halaman, 30 soal unik (soal Arjuno
250249-0328 tercetak dua kali) TANPA kunci → kunci & pembahasan Claude; soal
#494–#523, 27 gambar dipotong dari PDF (peta DSP + tabel dan ShakeMap + skala MMI
masing-masing digabung jadi satu gambar). Paket #27 = 13 PG + 4 MCMA + 8 Kategori,
60 menit, 11/11 subtopik. Di bank saja (paling ambigu): no. 8 (lokasi X), 9
(strategi Papua), 12 (Arjuno), 20 (fakta/opini Sigi), 26 (PLTS terapung).
Penyesuaian: Fakta/Opini → Ya/Tidak ("apakah fakta?"); narasi no. 19 menyebut
Pasaman Barat padahal peta/judul/koordinat Tapanuli Utara → diselaraskan.
Kunci paling bisa diperdebatkan: no. 7 (TS, S, S), no. 11 (A, C, D, E — usia
pensiun dihitung benar), no. 25 (A, B, C — petak persegi = tambak).

## 2026-10-05 — Paket TKA SMA Bahasa Inggris Tingkat Lanjut — Paket 1 (#26, draf, lolos aturan)
PDF "SOAL TKA Bahasa Inggris SMA 2025 Pilihan" (SMA-BING-L) 41 halaman; hlm. 32–41
mengulang 10 soal pertama (kode soal sama) → 30 soal unik TANPA kunci. Diimpor
#463–#493 (30 + 1 PG tambahan Claude "digital dissonance"), stimulus #54–#65.
PDF hanya punya 12 PG (paket butuh ≥13) → tambah 1 PG; 6 non-PG (no. 5, 9, 15,
20, 22, 29 — paling ambigu) ke bank dengan salinan bacaan sendiri agar 6 grup paket
tetap utuh (4–5 soal/grup). Paket #26 = 13 PG + 8 MCMA + 4 Kategori, 60 menit,
13/16 subtopik. Penyesuaian: pasangan kategori di luar yang didukung (Digital
Dissonance/Mindful, Increased Stress/Loss of Authenticity, Cause/Effect,
Argument/Explanation) dijadikan pernyataan Benar/Salah, Agree/Disagree → Ya/Tidak,
Suitable → Sesuai/Tidak Sesuai; no. 28 pilihan gambar diagram alir ditranskripsi
jadi teks; no. 30 kalimat opini yang dirujuk tidak ada di PDF → ditambahkan
("Fast fashion encourages people to buy more clothes than they actually need").
Kunci paling bisa diperdebatkan: no. 23 (A, B, C — D bertentangan angka 90%),
no. 24 (B, D, E), no. 4 (A).

## 2026-10-05 — Paket TKA SMA Bahasa Indonesia Tingkat Lanjut — Paket 1 (#25, draf, lolos aturan)
PDF "SOAL TKA Bahasa Indonesia SMA 2025 Pilihan" = mapel SMA-BIND-L. 30 soal
(label "1–4 / 27–30 OTW" di PDF hanya catatan; yang ada lengkap 30) TANPA kunci →
kunci & pembahasan Claude; soal #433–#462, stimulus #41–#53, 3 tabel dipotong
dari PDF (kemiskinan, bobot inflasi, tarif pantai; screenshot ulasan pantai
ditranskrip jadi teks). Paket #25 = 15 PG + 5 MCMA + 5 Kategori, 60 menit,
12/15 subtopik. Semua soal berbasis bacaan, sehingga paket hanya bisa dikurangi
per grup utuh — no. 24, 26, 27, 29, 30 (PG) dibuat dengan bacaan tunggal (tabel
pantai / satu wacana) agar bisa disisihkan ke bank; dua-wacana menjadi grup 2 soal.
Perbaikan PDF: no. 17 opsi D dan E identik → E diganti "Bobot Makassar lebih
tinggi daripada Palembang" (salah). Kunci yang paling bisa diperdebatkan: no. 5
(A, C, E), no. 25 (S, B, B), no. 22 (B, B, S), no. 23 (S, B, B).

## 2026-10-04 — Paket TKA SMA Ekonomi — Paket 1 (#24, draf, lolos aturan)
PDF "SOAL TKA Ekonomi SMA 2025 Pilihan" 30 soal TANPA kunci → kunci & pembahasan
Claude; soal #403–#432 (`pending_review`), 10 tabel/grafik dipotong dari PDF.
Paket #24 = 15 PG + 8 MCMA + 2 Kategori, 60 menit, 10/10 subtopik (outline DB),
sulit 16%, L3 48%. Di bank saja: no. 3, 4, 16 (PG) dan no. 11, 19 (MCMA yang
tafsirannya paling bisa diperdebatkan). Perbaikan atas PDF: no. 6 pajak Rp25 →
Rp15/unit (dengan 25 tidak ada opsi benar; dengan 15 opsi C, D, E cocok);
no. 28 diperjelas "JUMLAH (total) aset maupun kewajiban" (kunci 1, 3, 4, 5);
no. 10 kalimat menggantung dilengkapi "meningkat"; no. 19 opsi E "dengan
pengawasan" → "tanpa pengawasan". Keputusan kunci yang perlu dicek admin:
no. 2 biaya peluang = alternatif terbaik (Rp10 juta), no. 9 A, B, C, E
(stabilitas harga dihitung faktor), no. 11 A, C, E, no. 18 A, B.

## 2026-10-04 — Soal TKA Fisika SMA 2025 (impor PDF ke bank, belum dipaketkan)
PDF "SOAL TKA Fisika SMA 2025 Pilihan" berisi 24 soal (no. 6 belum ada) TANPA
kunci → kunci & pembahasan Claude. Diimpor sebagai soal #379–#402
(`pending_review`), 16 gambar dipotong dari PDF, 2 grup bacaan: "Uji Coba
Mobil" (#39, no. 3–4) dan "Percobaan Konduksi Kalor" (#40, no. 18–19; teks
alat & langkah dipindah ke stimulus). 15/15 subtopik Fisika terwakili;
komposisi 20 PG / 3 MCMA / 1 Kategori → untuk paket 25 soal (PG ≤ 15) masih
perlu ±6 soal non-PG. Penyesuaian: no. 2 di PDF tidak menyebut jarak & waktu
berangkat → ditambah "berangkat pukul 08.00, Pulau B 10 km di timur" agar kunci
(timur 8 km/jam) dapat dihitung; no. 17 pasangan Tepat/Tidak Tepat → Ya/Tidak
(pasangan yang didukung). Mikrometer no. 1 dibaca dari render 4×: luar 10,95 mm,
tebal 0,80 mm → dalam 9,35 mm. Catatan: data no. 7 (basket) tidak konsisten
secara numerik dengan premis "bola masuk" — kunci C ditetapkan dari
perbandingan relatif (bola Bisma ±0,6 m lebih rendah).

## 2026-10-03 — Landing page: kerangka asesmen, angka live, testimoni admin, FAQ
Keputusan: section "Disusun mengikuti Kerangka Asesmen TKA" (BSKAP No.
047/H/AN/2025 SD & SMP, No. 045/H/AN/2025 SMA/SMK; bentuk soal, subtopik ≥80%,
level L1–L3, aturan komposisi, pembahasan, review admin) — angka live (soal/
paket/mapel) sempat ditambah lalu dihapus atas permintaan pemilik; FAQ jujur ("bukan soal
resmi TKA"). Testimoni disimpan di `app_settings` key `landing.testimonials`
(maks 12, dikelola di Pengaturan Sistem), section tersembunyi bila kosong.
Alasan: aturan halaman — semua klaim harus faktual; testimoni karangan
menyesatkan calon pembeli (UU Perlindungan Konsumen). Angka & testimoni hanya
dari data asli; DB tidak tersedia → landing tetap tampil tanpa angka.
Alternatif yang ditolak: testimoni contoh/dummy di kode.

## 2026-10-03 — Paket TKA SMA Biologi — Paket 1 (#23, draf, lolos aturan)
PDF "SOAL TKA Biologi SMA 2025 Pilihan" berisi 27 soal (no. 25–27 belum ada)
TANPA kunci → kunci & pembahasan ditentukan Claude. Diimpor sebagai soal
#341–#370 (`pending_review`), 10 gambar/tabel dipotong dari PDF (pdfjs-dist +
@napi-rs/canvas, galeri #30–#39). Komposisi PDF 20 PG / 7 non-PG, sedangkan
mapel pilihan 25 soal & PG ≤ 15 → ditambah 3 soal Claude ("[Soal tambahan]":
pewarnaan Gram, rancangan percobaan garam–perkecambahan, interaksi ekosistem
sawah). Paket #23 = 15 PG + 10 non-PG, 60 menit, 11/11 subtopik, sebaran
L1 20% / L3 36%. Lima PG (no. 11, 21, 22, 23, 24) di bank, belum dipaketkan.
Kunci yang paling perlu dicek admin: no. 15 (PCOS) dianggap C, D, E — bayi
tabung (E) dihitung benar; no. 4 kunci E (glikolisis: fosforilasi gula);
no. 14 kunci A (vasokonstriksi → tekanan darah naik).

## 2026-10-03 — Paket #22 "Matematika SMA — Paket Otomatis 3/10/2026" dilengkapi
Paket otomatis berisi 24 soal (batch AI sebagian gagal sebelum perbaikan level
kognitif) → satu-satunya aturan wajib yang gagal: jumlah soal 25. Claude
memeriksa 12 soal AI `pending_review` (#328–#339): 12/12 kunci benar; #335
opsi D diperjelas ("Lama penggunaan … tidak mungkin sama", sebelumnya
"Jumlah jam …" ambigu) + alasan pembahasan diluruskan (x = y = 12,5 membuat
median 12). Ditambah #340 (Transformasi Geometri, PG, L3 sulit: dilatasi
luas ×k² + translasi, "[Soal tambahan]") di urutan 18 → 25 soal, PG 14,
10/10 subtopik, semua aturan wajib lolos. Saran SMA (mayoritas berbasis
stimulus, soal grup 3–5) belum terpenuhi — tidak memblokir.

## 2026-10-03 — Admin bisa membuat akun siswa
Keputusan: tombol "Tambah user" di Manajemen User (`createUserAction`): nama,
email, jenjang, kata sandi awal (diketik admin atau "Buat acak"). Akun selalu
role siswa, langsung `active`; kata sandi di-hash lewat
`(await auth.$context).password.hash` dan disimpan sebagai akun `credential`
(sama seperti daftar biasa). Kata sandi tampil sekali di layar admin setelah
dibuat (dari isian form, tidak dari DB) untuk disalin ke siswa.
Alasan: sekolah/guru sering mendaftarkan siswa sekaligus. Role admin tetap
hanya lewat `npm run user:role` (DECISIONS 2026-09-25).
Alternatif yang ditolak: `auth.api.signUpEmail` dari server action — plugin
nextCookies akan memasang sesi akun baru di browser admin.

## 2026-10-03 — Index query panas + optimasi jalur ujian (Fase 4)
Keputusan: migrasi 0016 menambah 12 index komposit sesuai pola query:
attempts (user+paket+status, user+started_at, status+submitted_at), questions
(subtopik+status, created_at), users (status, created_at), question_reports
(status+created_at), practice_sessions (user+started_at), practice_questions
(owner+subtopik), ai_generation_logs (user+purpose+created_at), orders
(created_at). Jalur ujian: autosave menggabungkan cek attempt + soal milik
paket jadi 1 query (5 → 4 query), dan detail paket tayang di-cache di memori
30 dtk (`getPackageDetailCached`, dikosongkan tiap mutasi paket/soal/stimulus).
Hasil load test 150 siswa: buka ujian p50 3,7 → 0,46 dtk, submit 9,4 → 2,0 dtk,
autosave 37 → 55/dtk, tanpa error.
Alasan: data masih kecil, jadi index ditentukan dari pola akses (bukan
EXPLAIN data nyata). Cache hanya untuk paket tayang & jalur siswa; admin
selalu membaca langsung.
Alternatif yang ditolak: `session.cookieCache` Better Auth (hemat 1–2 query
per request) — jenjang/status user yang diubah langsung di DB (pilih jenjang,
setujui pendaftar) bisa basi hingga TTL dan memicu redirect berulang.
Menyusul: Manajemen User memuat semua user tanpa paginasi (GROUP BY
entitlements) — perlu paginasi server sebelum ribuan siswa.

## 2026-10-03 — Halaman Pratinjau Paket sebelum terbit
Keputusan: satu halaman `/admin/paket-tes/[id]/pratinjau` dengan dua mode —
"Tinjau kunci & pembahasan" (ReviewCard `keyOnly` + metadata status/asal/
level/kesulitan/laporan, tombol Setujui per soal = `updateQuestionStatusAction`)
dan "Tampilan siswa" (QuestionView + StimulusPanel asli; data lewat
`toExamQuestion`, jadi kunci tidak pernah dikirim ke browser). Vonis kesiapan:
merah bila aturan wajib gagal; kuning bila ada laporan terbuka/tanpa
pembahasan; soal "menunggu tinjauan" tidak memblokir karena ikut terbit lewat
dialog Terbitkan.
Alasan: admin butuh satu tempat untuk memeriksa paket utuh seperti siswa
melihatnya sebelum launching, tanpa membuat attempt sungguhan.
Alternatif yang ditolak: admin mengerjakan tes sungguhan (`/tes/[id]`) —
membuat attempt & skor palsu di statistik.

## 2026-10-03 — Buat Paket Otomatis: target level kognitif & kesulitan
Keputusan (permintaan pemilik produk): soal AI di paket otomatis tidak boleh
L1/mudah semua. Target sebaran paket ±20/50/30 (mudah·L1/sedang·L2/sulit·L3),
dihitung bersama soal bank; cek saran baru di aturan paket (mudah ≤ 40%, sulit
≥ 15%; L1 ≤ 40%, L3 ≥ 20%). Prompt Gemini diberi ciri konkret per tingkat.
Sekaligus memperbaiki bug: batch paket otomatis untuk mapel ber-level dikirim
tanpa level kognitif sehingga selalu ditolak.
Alasan: angka 20/50/30 = asumsi wajar (TKA menekankan penalaran), bukan angka
resmi BSKAP — ubah di `QUALITY_TARGET` bila ada acuan resmi. Level & tingkat
dikopel (L1↔mudah, L3↔sulit) agar jumlah batch Gemini tetap kecil.
Alternatif yang ditolak: level/kesulitan per soal dalam satu prompt campuran
(validator & penyimpanan memakai satu level per batch).

## 2026-10-02 — Paket TKA SMP Matematika — Paket 1 (#20, draf, lolos aturan)
"30 Soal Variasi" e-ujian (semua PG, kunci & pembahasan PDF dicek Claude —
benar) diimpor sebagai soal #291–#320; 4 soal MCMA/Kategori buatan Claude
(#321–#324, pembahasan diawali "[Soal tambahan]": translasi/pencerminan,
bentuk aljabar, pola barisan, volume balok) karena gabungan PDF hanya punya
8 non-PG sedangkan PG maksimal 18. Paket #20 = 16 PG variasi + 10 soal impor
sebelumnya (8 non-PG + grup panen mangga no. 24–26) + 4 tambahan → 18 PG /
6 MCMA / 6 Kategori, 4/4 topik, 10/10 subtopik — semua aturan wajib & saran
lolos. PDF "Soal-TKA-SMP-Matematika-1" = PDF yang sudah diimpor (#255–#284),
tidak diimpor ulang. V15 (sudut berpelurus 72°) hampir sama dengan #270 —
sengaja tidak dimasukkan ke paket yang sama. V24 aslinya merujuk "diagram
garis" tanpa gambar → kalimat diubah jadi "data jumlah buku".

## 2026-10-02 — Soal TKA SMP Bahasa Indonesia: diperiksa, tidak diimpor ulang
PDF yang sama sudah diimpor lewat Impor PDF (stimulus #32–#36, soal
#210–#239, paket draf #18) — tidak diimpor ulang agar tidak dobel. Diperiksa
Claude: 30/30 kunci cocok dengan lembar kunci PDF, semua punya pembahasan.
Dipindah subtopik: #228 "tertumbuk" (bahasa kias) D1-S1 → D2-S4; #233 "jauh
lebih erat daripada biasanya" (respons emosional) D3-S1 → D3-S3 → cakupan
8/11 subtopik (wajib ≥8). Komposisi 20 PG / 5 MCMA / 5 Kategori melebihi
batas PG 18 → paket draf #18 dihapus (atas persetujuan pemilik; belum ada
attempt/entitlement) supaya 30 soalnya bisa dipakai "Buat Paket Otomatis". Catatan: opsi E
no. 22 (warna kesukaan Ibu) kurang kuat sebagai bukti keinginan Ibu atas
syal — kunci PDF dipertahankan.

## 2026-10-02 — Soal TKA SMP Matematika (impor PDF, bank saja)
Keputusan: 30 soal PDF masuk bank sebagai `pending_review` (soal #255–#284,
stimulus #37 "Hasil Panen Mangga" untuk no. 24–26), **tanpa paket draf**
supaya bisa dipakai "Buat Paket Otomatis" (soal yang sudah di paket tidak
diambil). Kunci PDF dicek ulang Claude — semua benar; pembahasan ditulis
Claude. Komposisi PDF: 22 PG / 4 MCMA / 4 Kategori → melebihi batas PG 18,
jadi tidak bisa jadi satu paket utuh. Pemetaan menurut isi, bukan judul bab
PDF: no. 5 (sisi persegi → keliling) → Pengukuran; no. 8 (keliling bentuk
aljabar) → Bentuk Aljabar; no. 22 (sifat segi empat) → Objek Geometri;
no. 29 (diagram Venn, di luar cakupan kerangka) → Data. 9/10 subtopik
terwakili (Transformasi Geometri kosong).

## 2026-10-02 — Buat paket otomatis: bank belum terpakai + AI menambal
Keputusan (pemilik produk): soal hasil impor yang tidak memenuhi aturan tetap
masuk bank; tombol "Buat Paket Otomatis" mengambil soal yang **belum masuk
paket mana pun** (tayang + menunggu tinjauan), lalu AI menambal kekurangan
per topik/subtopik/bentuk dengan memodifikasi soal bank (variasi) atau soal
baru. Rencana dipratinjau dulu sebelum token Gemini terpakai.
Alasan: tiap paket berisi soal segar; pratinjau mengontrol biaya. Batch
dijalankan dari client (3 paralel) karena satu panggilan Gemini 30–60 dtk —
satu server action panjang rawan timeout di Hostinger. Soal bergambar tidak
dijadikan sumber variasi karena AI tidak melihat gambarnya.
Alternatif yang ditolak: memakai ulang soal paket lain (hemat token tapi
paket saling tumpang-tindih); AI langsung jalan tanpa pratinjau.

## 2026-10-02 — Ganti/buat kata sandi tanpa layanan email
Keputusan: ganti kata sandi di Pengaturan (siswa) & Profil (admin) lewat
server action `changeMyPasswordAction` → `auth.api.changePassword`
(wajib kata sandi lama, opsi keluarkan perangkat lain). Akun Google-only
(tanpa baris `accounts` provider `credential`) mendapat "Buat kata sandi"
lewat `auth.api.setPassword` (server-only). Lupa kata sandi (link reset
via email) ditunda sampai SMTP diatur (WORKFLOW §10).
Alasan: ganti kata sandi tidak butuh email sehingga bisa langsung jalan;
`hasCredentialPassword` sengaja di `server/services`, bukan file
`"use server"`, supaya tidak terbuka sebagai action publik.
Alternatif yang ditolak: `authClient.changePassword` langsung dari client
— konvensi proyek: mutasi lewat server action + Zod, pesan error Indonesia.

## 2026-10-02 — Impor PDF lewat Gemini, render halaman di browser
Keputusan: PDF dirender jadi gambar di browser admin (pdf.js) lalu dikirim ke Gemini milik admin; potongan gambar juga dibuat di browser dari kotak 0–1000 yang dikembalikan Gemini, lalu diunggah ke galeri seperti unggahan biasa.
Alasan: impor PDF lewat Claude memakan ±100–250 ribu token per paket; Gemini flash jauh lebih murah dan bisa dipakai admin kapan saja. Render di browser menghindari pustaka native (canvas/poppler) yang sulit di Hostinger, dan gambar halaman memberi kotak gambar yang lebih akurat daripada mengirim PDF mentah.
Alternatif yang ditolak: kirim PDF langsung ke Gemini (kotak gambar kurang presisi & tetap butuh render untuk memotong); render di server (dependensi native).

## 2026-10-02 — Paket contoh TKA SMA Bahasa Inggris 2025 (impor PDF)
Keputusan: 25 soal PDF (5 bacaan × 5) diimpor jadi paket draf #16 (soal 176–205, gambar galeri #22–#24: infografis, ilustrasi, tabel). Aturan BING = 30 soal & PG ≥15, PDF hanya 25 soal/10 PG → ditambah 5 soal PG buatan Claude (1 per bacaan, pembahasan diawali "[Soal tambahan]"), sehingga grup jadi 6 soal (saran 3–5 tidak terpenuhi, tidak memblokir). 2 soal Kategori (Time/Self Management, Short/Long-term) diubah ke pasangan Ya/Tidak karena pasangan aslinya tidak didukung. Subtopik dipetakan menurut isi soal agar 17/17 terwakili.
Alasan: PDF tanpa kunci → kunci & pembahasan dari Claude, status `pending_review`.

## 2026-10-01 — Paket contoh TKA SMA Matematika 2025 (impor PDF)
Keputusan: 25 soal PDF diimpor jadi paket draf #15 (soal 151–175, gambar galeri #6–#21, rumus KaTeX). Q6 (barisan aritmetika) & Q24 (peluang angpao) diubah PG → PGK Kategori supaya PG 15/25. Opsi Q14 yang berupa gambar titik ditulis sebagai koordinat; opsi ke-5 Q15 terpotong di PDF → diisi "15 m". Trigonometri dipetakan ke SMA-MTK-D4-S1 (PDF menaruhnya di Geometri).
Alasan: PDF tanpa kunci; kunci & pembahasan dihitung Claude → `pending_review`. Paling perlu dicek: Q5 (komposisi fungsi, "pasti" = Dini), Q11 (dinding BCGF & ADHE), Q19 (Rp270.000 = lembar digabung).

## 2026-10-01 — Paket contoh TKA SMA Bahasa Indonesia 2025 (impor PDF)
Keputusan: 33 soal dari PDF resmi-adaptasi diimpor jadi paket draf #13 (30 soal, 9 bacaan). Dibuang 3: "makna kata diunduh" (kata tidak ada di teks Interaksi Sosial), Tari Hudoq no. 21, Belis no. 23 (D2-S1 berlebih). 10 soal PG diubah jadi PGK (5 MCMA, 5 Kategori) memakai isi opsi asli supaya rasio PG 18/30 lolos aturan. Beberapa subtopik dipetakan menurut isi soal, bukan label PDF (hubungan antarparagraf → D2-S2; kesimpulan teks nonfiksi → D3-S3).
Alasan: PDF tidak memuat kunci; kunci & pembahasan ditetapkan Claude, jadi soal berstatus `pending_review` sampai diverifikasi admin.
Alternatif yang ditolak: impor 100% PG apa adanya (paket tidak bisa terbit, 28 PG).

## 2026-10-01 — Aturan paket TKA ditegakkan sistem
Keputusan: setiap paket = 1 jenjang + 1 mata pelajaran (`test_packages.subject_id`,
migrasi 0015). Aturan di `docs/ATURAN_PAKET.md` / `lib/package-rules.ts`:
**wajib** (memblokir penerbitan, dicek ulang di server dengan data DB):
jumlah soal & durasi per mapel, PG sederhana 50–60%, semua soal dari mapel
paket; **disarankan** (peringatan): ada MCMA & Kategori, SMA mayoritas
berbasis stimulus/gambar & grup 3–5 soal. Durasi terisi otomatis & terkunci
sesuai aturan. Pasangan kategori **Ya/Tidak** ditambahkan (import: Y/T).
Cakupan materi (opsi B, dipilih pemilik produk setelah analisa): semua
**topik** wajib ≥1 soal; **subtopik wajib ≥80%** (100% disarankan); untuk
mapel < 2 soal/subtopik disarankan satu stimulus berisi subtopik berbeda.
Wajib 100% ditolak karena bertabrakan dengan grup stimulus 3–5 soal di
mapel padat (Antropologi 25 soal/17 subtopik). Mode AI grup kini bisa
multi-subtopik (`extraSubdomainCodes`, tiap soal `subtopicCode`).
Paket lama tanpa mapel tetap tampil, tetapi harus diberi mapel & memenuhi
aturan sebelum bisa diterbitkan ulang.
Alasan: permintaan pemilik produk — setiap paket harus sesuai format TKA resmi.
Alternatif yang ditolak: aturan hanya sebagai dokumen/peringatan (admin bisa
lupa); simpan aturan di DB (belum perlu diubah-ubah, cukup kode + dokumen).

## 2026-10-01 — API key Gemini divalidasi dengan tes ping, bukan format
Keputusan: tidak ada aturan format/awalan key (Google punya `AIza…` & `AQ.…`
dan bisa berubah). Saat disimpan, key di-ping ke Google
(`GET /v1beta/models?pageSize=1`, tanpa kuota generate, tidak bergantung
model). Di aplikasi hanya pengaman teknis: trim, 10–500 karakter, tanpa
spasi/baris baru/karakter tak terlihat (key dikirim sebagai header HTTP).
Error Google dibaca dari `error.details[].reason` (400 API_KEY_INVALID /
401 → key ditolak; 403 → API tidak aktif / key dibatasi; 429 → kuota).
Alasan: key asli user format `AQ.` ditolak regex lama padahal diterima Google.

## 2026-10-01 — Login Google (Better Auth social provider)
Keputusan: Google aktif hanya bila env `GOOGLE_CLIENT_ID`/`SECRET` diisi
(tombol disembunyikan bila tidak). `prompt=select_account`. Account linking
otomatis untuk Google (email terverifikasi) supaya tidak ada akun ganda.
Callback kembali ke `/masuk` yang mengarahkan sesuai role/status; akun baru
tanpa jenjang → `/pilih-jenjang`. Hook konfirmasi pendaftar berlaku sama.
Alasan: daftar lebih cepat untuk siswa; tetap memakai alur jenjang &
konfirmasi yang sudah ada.

## 2026-10-01 — Premium via Midtrans Snap (membership, bukan per paket)
Keputusan: model akses = akun gratis (paket `is_premium = false`) vs
Premium (membership per jenjang dengan masa aktif) yang membuka semua paket
premium jenjangnya + Latihan Kelemahan. Paket langganan (harga/durasi/
jenjang) diatur admin di `/admin/langganan`. Pembayaran: Midtrans Snap
**redirect** (tanpa snap.js → tanpa client key & masalah CSP). Order dibuat
di DB dulu, lalu transaksi Snap. Webhook `/api/midtrans/notification`:
verifikasi signature SHA-512, lalu **ambil ulang status dari Status API**
(payload palsu/nominal diubah tidak berpengaruh), terapkan idempoten
(unique `memberships.order_id`); status final tidak mundur. Halaman finish
`/langganan/selesai` juga menyinkronkan status (cadangan bila webhook
telat). Server Key hanya di env (`MIDTRANS_SERVER_KEY`,
`MIDTRANS_IS_PRODUCTION`). Pool MySQL: idleTimeout 10 dtk + keep-alive
(wait_timeout Hostinger 20 dtk; ECONNRESET terlihat saat uji).
Alasan: sesuai konsep user ("bayar → semua terbuka otomatis"); redirect
paling sederhana & aman.
Alternatif yang ditolak: entitlement per paket per pembelian (tidak
membuka Latihan Kelemahan, rumit saat paket baru ditambah); Snap popup
(butuh client key + skrip pihak ketiga).

## 2026-10-01 — Jenjang per akun & konfirmasi pendaftar
Keputusan: setiap siswa punya `users.jenjang` (wajib saat daftar; akun lama
dipaksa memilih di `/pilih-jenjang`). Siswa hanya melihat & bisa mengerjakan
paket jenjangnya; admin melihat semua. Jenjang bisa diganti siswa di
Pengaturan atau oleh admin. Konfirmasi pendaftar opsional lewat pengaturan
sistem (`/admin/pengaturan`): bila aktif, akun siswa baru `pending` →
`/menunggu-konfirmasi` sampai disetujui di `/admin/users`; ditolak = sesi
dihapus. Pemeriksaan ada di `requireUser` (halaman) & `getActiveSession`
(server action siswa). Pembayaran otomatis belum dibangun — rencana: payment
gateway → webhook → entitlement `granted_by = purchase` (lihat ROADMAP Fase 3).
Alasan: soal & kerangka asesmen berbeda per jenjang; sekolah/penyelenggara
perlu menyaring pendaftar.
Alternatif yang ditolak: jenjang per paket saja tanpa di akun (siswa bisa
salah pilih paket); blokir login pending di Better Auth (pesan error kurang
jelas dibanding halaman tunggu).

## 2026-09-30 — Latihan AI, laporan soal, mode grup, nama FK ≤ 64
Keputusan: (1) Latihan AI dibuat saat sesi dimulai bila bank kurang,
memakai key siswa, maks 10 soal/sesi & 10 panggilan Gemini/24 jam; soal
disimpan privat (`practice_questions`), ikut diagnosa, tidak ikut skor
resmi. (2) Laporan soal satu tabel untuk soal bank & Latihan AI; soal
Latihan AI hanya bisa dilaporkan pemiliknya. (3) Mode grup: bentuk
"campuran" hanya untuk grup; bacaan AI disimpan sebagai stimulus Draft
(kode `AI-yymmdd-xxxxx`), percobaan ulang memakai bacaan yang sama.
(4) Semua FK harus bernama ≤ 64 karakter — bila nama otomatis Drizzle
terlalu panjang, pakai `foreignKey({ name })` (migrasi 0012 sempat gagal).
(5) Gemini 3: temperature dibiarkan default model.
Alasan: sesuai AI_GENERATION.md §5–7; MariaDB tidak transaksional untuk
DDL, jadi migrasi gagal di tengah harus diselesaikan manual.
Alternatif yang ditolak: soal AI latihan di bank resmi (tanpa review →
berisiko untuk tes resmi); limit per sesi saja (kuota key siswa bisa habis).

## 2026-09-30 — AI admin: 3 mode, gambar di DB, Gemini via REST
Keputusan: generate soal admin punya 3 mode — soal baru dari subdomain,
variasi (modifikasi soal bank; subdomain ikut soal asal, soal asal +
kuncinya masuk prompt), dan dari gambar (1 gambar galeri → beberapa soal,
dikirim inline ke Gemini). Semua hasil `pending_review`. Gambar disimpan
di MariaDB (MEDIUMBLOB, dikompres WebP ≤1600 px ±≤900 KB, dedup SHA-256),
disajikan `/gambar/[id]` hanya untuk user login. Gemini dipanggil via REST
(`fetch`, tanpa SDK), model dari env `GEMINI_MODEL` (default
`gemini-3-flash-preview` sejak 2026-09-30 — gemini-2.5-flash ditutup Google
untuk pengguna baru), key milik admin sendiri dari `/pengaturan`.
Alasan: pilihan user (gambar di DB: aman dari redeploy Hostinger, ikut
backup, tanpa akun storage tambahan); REST cukup untuk 1 endpoint & tidak
menambah dependensi.
Alternatif yang ditolak: simpan file di disk hosting (hilang saat
redeploy); cloud storage (butuh akun & key tambahan); key Gemini di env
server (bertentangan dengan SRS — key per user).

## 2026-09-30 — Latihan Kelemahan bank-only: aturan sesi & pemilihan soal
Keputusan: pemilihan soal = soal bank tayang di subdomain target, belum
pernah dikerjakan dulu (acak) lalu yang paling lama; bergiliran antar
subdomain; grup stimulus utuh (boleh membawa soal subdomain lain, tidak
dipotong). Satu sesi aktif per siswa. Jawaban dinilai per soal & terkunci
setelah diperiksa. Hasil latihan ikut diagnosa (satu record per sesi per
subdomain), tidak ikut skor tes resmi. Tanpa prioritas (soal per
subdomain < 3) → pilihan awal = subdomain berakurasi terendah yang ada
soalnya.
Alasan: sesuai rancangan AI_GENERATION.md §5; kunci terkunci mencegah
"coba-coba" jawaban yang membuat diagnosa palsu.
Alternatif yang ditolak: boleh ganti jawaban setelah melihat kunci;
banyak sesi paralel (membingungkan & membebani diagnosa).

## 2026-09-30 — Hasil demo dinilai di server via cookie; stimulus di atas soal
Keputusan: `/tes/demo` (10 soal, 5 subdomain asli SMP) mengirim semua
jawaban saat dikumpulkan → divalidasi Zod → disimpan di cookie httpOnly
(`path=/tes/demo`, 1 hari) → `/tes/demo/hasil` menilai ulang di server
(kunci di `src/server/demo/demo-test.ts`) dan menampilkan skor, radar per
subdomain, rencana belajar, pembahasan, dan ajakan daftar. Panel stimulus
soal grup dipindah ke atas soal di semua ukuran layar (permintaan user).
Alasan: demo adalah alat pemasaran — pengunjung harus merasakan analisis
kelemahan; tanpa DB & tanpa akun, cookie cukup dan kunci tetap di server.
Alternatif yang ditolak: simpan attempt demo di DB (butuh user/cleanup);
kirim kunci ke client & nilai di browser (bocor kunci, skor bisa diubah).

## 2026-09-29 — Edit/hapus soal yang sudah dipakai dikunci sebagian
Keputusan: soal yang **sudah dijawab siswa** hanya boleh diubah teks,
opsi (teksnya), pembahasan, kesulitan, level — bentuk, jumlah opsi, kunci,
pasangan kategori, subdomain, stimulus dikunci; opsi di-update di tempat
(id tetap). Soal yang **hanya masuk paket** dikunci stimulus & urutan
grupnya. Hapus hanya bila belum di paket & belum dijawab (selain itu:
jadikan draft). Aturan di `question-edit-rules.ts`, dicek ulang di server.
Alasan: hasil & pembahasan dihitung ulang dari jawaban tersimpan
(`attempt_answers.response` berisi id opsi) — ganti kunci/opsi diam-diam
membuat hasil lama berubah atau rusak, tidak cocok dengan
`attempt_subtopic_scores` yang sudah tersimpan.
Alternatif yang ditolak: versioning soal (terlalu berat untuk sekarang);
bebas edit (merusak riwayat siswa).

## 2026-09-29 — Build produksi pakai webpack, bukan Turbopack
Keputusan: script `build` = `next build --webpack`; `engines.node >=20.9.0` (Next 16).
Alasan: deploy Hostinger gagal — proses anak PostCSS Turbopack mati tanpa
pesan (exit 0) saat memproses `globals.css`, kemungkinan karena batas
memori/proses di build Hostinger. Webpack menjalankan PostCSS di proses
yang sama; build lokal & CSS Tailwind hasilnya utuh. Konfigurasi Tailwind v4
(`@tailwindcss/postcss`, `@import "tailwindcss"`) sudah benar, tidak diubah.
Alternatif yang ditolak: downgrade Tailwind ke v3 (tidak menyentuh akar
masalah). `next dev` tetap Turbopack.

## 2026-09-29 — Latihan adaptif: bank dulu, soal AI tanpa review, key siswa
Keputusan: fitur "Latihan Kelemahan" per siswa (Fase 2.5,
`docs/AI_GENERATION.md`) mengambil soal subdomain lemah dari bank soal
tayang terlebih dahulu; hanya kalau stok kurang, AI membuat soal
tambahan. Soal AI untuk latihan pribadi langsung dipakai tanpa review
admin — divalidasi otomatis, berlabel "Latihan AI", disimpan terpisah
(`practice_questions`, bukan bank), tidak dihitung ke skor tes resmi, dan
bisa dilaporkan siswa. Generate memakai API key Gemini **milik siswa**;
tanpa key, latihan tetap jalan dari bank saja.
Alasan: bank yang sudah direview menjaga kualitas & menghemat kuota;
latihan tidak boleh tertahan menunggu admin; tetap konsisten dengan SRS
(tidak ada key Gemini di server). Pengecualian review hanya untuk latihan
pribadi — soal AI untuk bank resmi & tes tetap wajib review.
Alternatif yang ditolak: selalu generate AI baru (boros kuota, tanpa
review); wajib review admin untuk latihan (siswa menunggu lama); key
admin/sekolah (biaya ditanggung pengelola, bertentangan dengan SRS).
Risiko yang diterima: sebagian besar siswa SD/SMP mungkin tanpa key →
fitur harus tetap berguna bank-only; tinjau ulang opsi key admin
berkuota bila data pemakaian menunjukkan perlu.

## 2026-09-29 — Entitlement per paket, bukan toggle per user
Keputusan: akses premium diatur dari halaman edit paket
(`/admin/paket-tes/[id]`, panel "Akses Premium" — cari user, beri/cabut
akses satu per satu), bukan toggle global "premium: ya/tidak" di halaman
Manajemen User. Manajemen User hanya menampilkan ringkasan ("N paket")
per user, tautan ke halaman paket untuk mengelolanya.
Alasan: skema `entitlements` adalah relasi user↔paket (banyak-ke-banyak);
satu switch boolean per user di tabel Users tidak bisa merepresentasikan
"punya akses ke paket A tapi tidak ke paket B". Mengelola dari sisi paket
juga lebih alami: admin biasanya berpikir "siapa yang boleh mengerjakan
paket premium ini", bukan "paket premium mana yang boleh dikerjakan user
ini".
Alternatif yang ditolak: toggle boolean per user yang menyalakan/mematikan
akses ke *semua* paket premium sekaligus — terlalu kasar begitu ada lebih
dari satu paket premium dengan target berbeda (mis. premium SMP vs SMA).

## 2026-09-29 — correct/wrong/blank dihitung ulang, bukan disimpan
Keputusan: halaman hasil (`getAttemptResult`) tidak menyimpan kolom
`correct_count`/`wrong_count`/`blank_count` di tabel `attempts`. Ketiganya
dihitung ulang saat halaman dibuka, dari `attempt_answers` + `scoreAttempt()`
— fungsi murni yang sama dipakai saat finalize. Yang disimpan permanen
hanya `total_score`, `max_score`, dan ringkasan per subtopik
(`attempt_subtopic_scores`, yang punya `correct_count`/`total_count` tapi
tidak membedakan salah vs kosong).
Alasan: satu sumber kebenaran untuk logika skor — kalau `scoreAttempt()`
berubah (mis. aturan skor baru), hasil lama otomatis konsisten tanpa
migrasi data, karena tidak ada angka correct/wrong/blank yang "membeku"
di tabel. Biayanya murah (re-join beberapa baris, bukan agregasi berat).
Alternatif yang ditolak: menambah kolom count ke `attempts` saat finalize
— lebih cepat baca, tapi bisa basi kalau logika skor berubah, dan
menduplikasi data yang sudah bisa diturunkan dari `attempt_answers`.

## 2026-09-29 — Role admin tetap hanya lewat CLI, bukan tombol di UI
Keputusan: halaman Manajemen User (dibangun ulang untuk memakai data DB
sungguhan) tidak diberi kontrol ubah role di UI. Role tetap dilihat
sebagai badge saja; satu-satunya cara menjadikan seseorang admin tetap
`npm run user:role -- <email> admin` (keputusan 2026-09-25, dipertahankan).
Alasan: konsisten dengan keputusan sebelumnya — menjadikan admin adalah
tindakan sensitif yang sebaiknya butuh akses terminal/server, bukan satu
klik dari sesama admin di browser.

## 2026-09-25 — Better Auth dengan ID serial & tabel auth terpisah
Keputusan: Better Auth memakai `generateId: "serial"` (id INT
auto-increment) dan tabel `users`/`sessions`/`accounts`/`verifications`.
Password disimpan Better Auth di `accounts.password` (scrypt); kolom
`users.password_hash` dihapus. `role` adalah additionalField dengan
`input: false` — tidak bisa diisi dari form daftar; admin ditetapkan lewat
`npm run user:role` (yang juga menghapus sesi lama). Proteksi di layout
(redirect) + cek ulang di setiap server action/route admin.
Alasan: FK yang sudah ada (questions.created_by, stimuli.created_by, dst.)
sudah INT; mengikuti skema bawaan Better Auth menghindari adapter kustom.
Alternatif yang ditolak: id string bawaan Better Auth (harus mengubah semua
FK ke varchar); menyimpan hash sendiri di users (menduplikasi logika auth).

## 2026-09-25 — Aturan bentuk soal PGK & soal grup stimulus
Keputusan: (1) Penskoran semua bentuk *benar penuh atau 0* — PGK MCMA
benar bila himpunan pilihan persis sama dengan kunci; PGK Kategori benar
bila semua pernyataan sesuai kunci. (2) MCMA: 4–5 opsi, kunci 1 s.d.
(jumlah opsi − 1). (3) Kategori: 3–5 pernyataan, pasangan Benar/Salah
atau Sesuai/Tidak Sesuai. (4) Satu stimulus boleh dipakai soal lintas
subdomain; analisis tetap per subdomain soal. Jawaban disimpan sebagai
JSON `attempt_answers.response` (bukan `selected_option_id`). Enum
`single_choice` → `pg` lewat migrasi 3 langkah (0004 tambah, 0005 data,
0006 hapus nilai lama) supaya aman bila tabel sudah berisi.
Alasan: kerangka BSKAP menyerahkan penskoran PGK ke pengelola dan
menyarankan benar penuh; aturan biner paling mudah dijelaskan ke siswa
dan konsisten dengan skor 0–100 yang sudah ada. Batas jumlah kunci MCMA
mencegah soal yang bisa dijawab "pilih semua".
Alternatif yang ditolak: skor parsial proporsional (menambah kerumitan
pelaporan & bisa menguntungkan tebakan acak); kolom jawaban terpisah per
bentuk (skema lebih lebar, validasi tersebar).

## 2026-09-24 — Kerangka asesmen TKA jadi sumber hierarki konten
Keputusan: `asesmen/tka-{sd,smp,sma}.json` (transkripsi kerangka BSKAP)
menjadi sumber kebenaran. Loader `src/server/asesmen/` memvalidasi &
menormalkan (4 varian bentuk level kognitif, preset SMA). Skema DB jadi 4
tingkat: categories(jenjang) → subjects(mata uji, baru) → topics(=domain)
→ subtopics(=subdomain), semua dengan `code` unik; `questions` dapat
`cognitive_level`. Import Excel pakai `kode_subdomain` (bukan nama
topik/subtopik). Isi JSON tidak diubah — transkripsi regulasi.
Alasan: kode baku membuat import, analisis, dan prompt AI presisi tanpa
salah ketik nama; kerangka sendiri mewajibkan soal tertaut ke subdomain.
Nama tabel topics/subtopics dipertahankan + migrasi dua langkah (0002
tambah, 0003 hapus kolom lama) supaya drizzle-kit tidak meminta konfirmasi
rename interaktif dan migrasi lama yang mungkin sudah jalan tidak disentuh.
Alternatif yang ditolak: menyalin cakupan/batasan ke kolom DB (duplikasi
data, rawan tidak sinkron); rename tabel ke domains/subdomains (butuh
rename interaktif + ubah semua kode analitik tanpa manfaat fungsional).

## 2026-09-24 — UI mengikuti Stitch "Web Tes Premium", konten disesuaikan TKA
Keputusan: 10 layar proyek Stitch "Web Tes Premium Landing Page"
diimplementasikan ke kode (peta di `docs/UI_UX.md` §8). Token: Plus
Jakarta Sans, radius card 16px, warna tetap dari UI_UX §2 (amber di kode
bernama `cta`). Semua konten CPNS/SNBT/BKN, statistik pengguna, testimoni,
dan harga dari mockup Stitch dibuang; diganti copy TKA SD/SMP/SMA yang
faktual. Proyek Stitch lain (CMS sekolah, portfolio, dsb.) tidak dipakai.
Halaman tanpa DB memakai `src/lib/demo-data.ts` + banner "data contoh";
pengerjaan tes dipindah ke grup route `(exam)` tanpa navigasi situs.
Import Excel sudah berfungsi sampai tahap pratinjau (server action).
Alasan: mockup Stitch dibuat sebelum scope CPNS dihapus dan berisi angka
contoh yang akan jadi klaim palsu kalau tayang.
Alternatif yang ditolak: menyalin HTML Stitch apa adanya (Tailwind CDN,
Material Symbols, konten CPNS) — tidak konsisten dengan shadcn/lucide dan
scope proyek.

---

## 2026-09-24 — Rumus KaTeX dirender di server
Keputusan: Teks soal/opsi diubah jadi HTML di server (`renderMathToHtml`,
teks biasa di-escape) dan dikirim ke client sebagai `html`. Komponen
client `RichHtml` hanya menampilkan HTML + memuat CSS KaTeX.
Alasan: library KaTeX ±270 KB (chunk JS terbesar) tidak lagi dikirim ke
browser peserta; CSS KaTeX hanya dimuat di halaman yang memakainya.
Catatan: preview rumus live di form admin nanti boleh pakai KaTeX di
client — itu halaman admin, bukan halaman ujian.
Alternatif yang ditolak: render KaTeX di client (lebih lambat di HP
murah milik siswa).

## 2026-09-24 — Fokus TKA sekolah saja, CPNS dihapus
Keputusan: Scope produk hanya TKA siswa SD/SMP/SMA. Semua bagian CPNS
dihapus: mode skor `twk_tiu`/`tkp`, tipe soal `tkp_weighted`, kolom
`question_options.score_weight`, dan field `scoring_mode` di paket tes.
Skor tinggal satu aturan: benar +1 (atau `points_override`), salah/kosong
0. `is_correct` jadi NOT NULL default false. Hierarki konten dipakai
sebagai Jenjang → Mata pelajaran → Materi (tabel tetap `categories` →
`topics` → `subtopics`).
Alasan: permintaan pemilik produk — fokus ke satu pasar.
Catatan: menggantikan "Catatan skor" TKP/TWK di entri sebelumnya. Kolom
`questions.type` tetap ada supaya tipe soal TKA lain (mis. pilihan ganda
kompleks) bisa ditambah tanpa ubah struktur.

## 2026-09-24 — Fase 1 dikerjakan dari lapisan non-DB dulu
Keputusan: Logika skor/analitik dibuat sebagai fungsi murni yang menerima
data (bukan query DB), UI ujian menerima server action lewat props
(`saveAnswer`, `submitAttempt`). Tipe client (`src/lib/exam.ts`) sengaja
tanpa `isCorrect`/`scoreWeight`. Unit test pakai Vitest 4 (Vitest 5
bentrok peer `@types/node@20`).
Alasan: database belum tersambung; dengan pola ini, begitu tabel siap
tinggal tulis server action yang memanggil fungsi yang sudah teruji.
Catatan skor: mode TKP menganggap "benar" (`correct_count`) = memilih opsi
berbobot tertinggi; `points_override` hanya berlaku di mode `standard`
(TWK/TIU selalu +5 sesuai aturan resmi).
Alternatif yang ditolak: menunggu DB siap dulu — memblokir semua progres.

## 2026-09-21 — Scaffold pakai Next.js 16, bukan 15
Keputusan: Scaffold proyek dengan `create-next-app@latest` yang meng-install
Next.js 16.3.5 (React 19.2, Tailwind v4), bukan Next.js 15 seperti yang
tertulis di draft awal `docs/ARCHITECTURE.md`.
Alasan: Next 16 adalah rilis stabil terbaru saat scaffold dilakukan; tidak
ada kebutuhan fitur yang mengharuskan Next 15. `docs/ARCHITECTURE.md`
sudah diupdate mengikuti versi aktual.
Alternatif yang ditolak: downgrade manual ke Next 15 supaya persis sama
dengan draft dokumen awal — dilewati karena tidak ada manfaat konkret.

## 2026-09-21 — Stack awal & scope fase 1
Keputusan: Next.js + TypeScript + Tailwind/shadcn + MySQL/Drizzle,
deploy ke Hostinger Node.js hosting dari GitHub. Payment gateway di-skip
dulu, entitlement premium diisi manual oleh admin. Gemini API key
disimpan per-user (terenkripsi), tidak pakai key server global.
Alasan: sesuai paket hosting Hostinger yang dimiliki user, dan supaya
biaya AI ditanggung masing-masing user/admin, bukan menumpuk di satu
akun Gemini.
Alternatif yang ditolak: Nuxt/SvelteKit (fungsional serupa, dipilih
Next.js karena ekosistem & referensi lebih luas untuk kolaborasi ke
depan).
