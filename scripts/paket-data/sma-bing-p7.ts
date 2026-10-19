// TKA SMA Bahasa Inggris — Paket 7 (teks & soal baru, ditulis untuk Pakar TKA).
// 25 soal dari 5 teks × 5 soal: 15 PG, 5 MCMA, 5 Kategori; 3 gambar baru (poster, grafik, infografis).
const FONT = `font-family="Arial, Helvetica, sans-serif"`;
const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" ${FONT}><rect width="${w}" height="${h}" fill="#fff"/>${body}</svg>`;
const text = (x: number, y: number, t: string, o: { size?: number; anchor?: string; weight?: string; fill?: string } = {}) =>
  `<text x="${x}" y="${y}" font-size="${o.size ?? 16}" text-anchor="${o.anchor ?? "middle"}" font-weight="${o.weight ?? "normal"}" fill="${o.fill ?? "#111"}">${t}</text>`;
const line = (x1: number, y1: number, x2: number, y2: number, stroke = "#111", w = 2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${w}"/>`;

// Poster pengumuman renovasi perpustakaan.
function imgNotice() {
  let s = `<rect x="20" y="20" width="660" height="560" rx="18" fill="#fffbeb" stroke="#b45309" stroke-width="4"/>`;
  s += `<rect x="20" y="20" width="660" height="92" rx="18" fill="#b45309"/><rect x="20" y="90" width="660" height="22" fill="#b45309"/>`;
  s += text(350, 60, "SMA NUSANTARA LIBRARY", { size: 22, weight: "bold", fill: "#fff" }) + text(350, 94, "RENOVATION NOTICE", { size: 30, weight: "bold", fill: "#fde68a" });
  s += text(350, 150, "The library will be CLOSED from", { size: 19 }) + text(350, 180, "Monday, 9 November to Saturday, 21 November 2026", { size: 19, weight: "bold" });
  s += text(60, 225, "During the closure:", { size: 18, weight: "bold", anchor: "start" });
  const items = [
    ["Borrowed books are due on Friday, 6 November.", "No fines for books returned on Monday, 23 November."],
    ["A temporary reading corner is open in Room B-12,", "07.00–14.00 (Monday–Friday)."],
    ["E-books: library.smanusantara.sch.id", "(log in with your student ID)."],
    ["Study groups may book the school hall", "through Ms. Ratna (ext. 214)."],
  ];
  items.forEach(([a, b], i) => {
    const y = 262 + i * 62;
    s += `<circle cx="70" cy="${y - 6}" r="6" fill="#b45309"/>` + text(88, y, a, { size: 17, anchor: "start" }) + text(88, y + 24, b, { size: 17, anchor: "start" });
  });
  s += `<rect x="60" y="508" width="580" height="54" rx="10" fill="#fef3c7"/>`;
  s += text(350, 530, "REOPENING: Monday, 23 November 2026", { size: 18, weight: "bold", fill: "#92400e" }) + text(350, 553, "with a new digital catalogue and 40 more seats!", { size: 16, fill: "#92400e" });
  return svg(700, 600, s);
}

// Grafik screen time setelah pukul 21.00 vs rata-rata jam tidur.
function imgSleep() {
  const ox = 90, oy = 380, bw = 100, gap = 40, uy = 34;
  // Label SVG: "<" dan ">" harus di-escape.
  const data: [string, number, number][] = [["&lt; 1 hour", 8.1, 150], ["1–2 hours", 7.4, 210], ["2–3 hours", 6.6, 150], ["&gt; 3 hours", 5.9, 90]];
  let s = text(370, 34, "Screen Time after 9 p.m. and Average Sleep on School Nights", { size: 18, weight: "bold" });
  s += text(370, 58, "Survey of 600 students, SMA Cendekia", { size: 14, fill: "#4b5563" });
  for (let h = 0; h <= 9; h++) s += line(ox, oy - h * uy, ox + 4 * (bw + gap) + 20, oy - h * uy, "#e5e7eb", 1) + text(ox - 10, oy - h * uy + 5, String(h), { size: 14, anchor: "end" });
  s += line(ox, oy, ox + 4 * (bw + gap) + 20, oy) + line(ox, oy, ox, oy - 9 * uy - 10);
  data.forEach(([label, h, n], i) => {
    const x = ox + 30 + i * (bw + gap);
    s += `<rect x="${x}" y="${oy - h * uy}" width="${bw}" height="${h * uy}" fill="#6366f1"/>` + text(x + bw / 2, oy - h * uy - 8, `${h} h`, { weight: "bold" });
    s += text(x + bw / 2, oy + 22, label, { size: 15, weight: "bold" }) + text(x + bw / 2, oy + 42, `(n = ${n})`, { size: 13, fill: "#4b5563" });
  });
  s += `<text transform="translate(34 ${oy - 4.5 * uy}) rotate(-90)" font-size="15" font-weight="bold" text-anchor="middle">Average sleep (hours)</text>`;
  s += text(ox + 300, oy + 70, "Screen time after 9 p.m.", { size: 15, weight: "bold" });
  return svg(740, 470, s);
}

// Infografis prosedur membuat eco-brick.
function imgEcobrick() {
  const steps = [
    ["1", "Collect a clean, dry", "600 ml plastic bottle."],
    ["2", "Cut clean, dry plastic", "waste into small pieces."],
    ["3", "Push the pieces into the", "bottle with a stick."],
    ["4", "Fill until the bottle is hard", "(at least 200 g)."],
    ["5", "Close the cap, write the", "weight and date on it."],
  ];
  let s = text(450, 40, "HOW TO MAKE AN ECO-BRICK", { size: 26, weight: "bold", fill: "#166534" });
  steps.forEach(([n, a, b], i) => {
    const cx = 100 + i * 175;
    s += `<circle cx="${cx}" cy="110" r="30" fill="#16a34a"/>` + text(cx, 120, n, { size: 26, weight: "bold", fill: "#fff" });
    if (i < 4) s += `<path d="M${cx + 40},110 L${cx + 128},110" stroke="#86efac" stroke-width="6"/><path d="M${cx + 128},100 L${cx + 140},110 L${cx + 128},120 z" fill="#86efac"/>`;
    // ikon botol
    s += `<rect x="${cx - 16}" y="160" width="32" height="70" rx="8" fill="${i >= 3 ? "#22c55e" : "#dcfce7"}" stroke="#166534" stroke-width="2"/><rect x="${cx - 7}" y="148" width="14" height="14" fill="${i === 4 ? "#166534" : "#bbf7d0"}" stroke="#166534" stroke-width="2"/>`;
    s += text(cx, 262, a, { size: 13 }) + text(cx, 280, b, { size: 13 });
  });
  s += `<rect x="40" y="310" width="820" height="62" rx="10" fill="#fef2f2" stroke="#dc2626" stroke-width="2"/>`;
  s += text(450, 336, "DO NOT put in: paper, glass, metal, food waste, or wet/dirty plastic.", { size: 16, weight: "bold", fill: "#b91c1c" });
  s += text(450, 360, "Store finished eco-bricks in the shade — sunlight weakens the plastic.", { size: 15, fill: "#b91c1c" });
  return svg(900, 390, s);
}

const stimuli = [
  {
    code: "SMA-BING-P7-NOTICE",
    title: "Library Renovation Notice",
    gambar: "notice",
    content: `Read the following notice.

**SMA NUSANTARA LIBRARY — RENOVATION NOTICE**

The library will be closed from Monday, 9 November to Saturday, 21 November 2026.

During the closure:
- Borrowed books are due on Friday, 6 November. No fines will be charged for books returned on Monday, 23 November.
- A temporary reading corner is open in Room B-12, 07.00–14.00 (Monday–Friday).
- E-books can be accessed at library.smanusantara.sch.id with your student ID.
- Study groups may book the school hall through Ms. Ratna (ext. 214).

The library will reopen on Monday, 23 November 2026 with a new digital catalogue and 40 more seats.`,
  },
  {
    code: "SMA-BING-P7-SLEEP",
    title: "Screen Time and Sleep",
    gambar: "sleep-chart",
    content: `Many teenagers use their phones until late at night. The student health club of SMA Cendekia asked 600 students how long they used screens after 9 p.m. and how many hours they usually slept on school nights. The results are shown in the chart below.

The chart shows a clear pattern: the longer students used screens after 9 p.m., the shorter they slept. Students who used screens for less than one hour slept 8.1 hours on average, while those who used screens for more than three hours slept only 5.9 hours.

Experts explain that screens give off blue light, which tells the brain that it is still daytime. As a result, the body produces less melatonin, the hormone that makes us feel sleepy. In addition, exciting games and endless social media feeds keep the brain active, so it becomes harder to fall asleep.

Health experts recommend that teenagers sleep 8 to 10 hours every night. However, the survey only shows that screen time and sleep are related; it does not prove that screens are the only reason students sleep less. Homework, extracurricular activities, and noise at home may also play a role.

The club suggests a simple rule: put your phone away at least one hour before bedtime.`,
  },
  {
    code: "SMA-BING-P7-LIGHTHOUSE",
    title: "The Lighthouse Keeper's Daughter",
    content: `Mara was fifteen when her father, the keeper of Tanjung Batu lighthouse, fell ill with a high fever. On the third night of his illness, a storm swept in from the sea. The wind howled against the windows, and rain hit the glass like handfuls of gravel.

Just after midnight, the great lamp at the top of the tower flickered and went out. Mara knew what that meant. Somewhere out there, fishing boats were trying to find their way home, and without the light they could crash into the rocks below the cliff.

"Father, the lamp is out," she whispered. Her father tried to stand but fell back onto the bed. "The spare wick is in the green box," he said weakly. "Be careful on the stairs."

Mara took a lantern and climbed the one hundred and twelve steps. Her legs shook, and twice the wind almost blew the lantern out. At the top, her hands were so cold that she could barely open the green box. She replaced the burnt wick, filled the tank with oil, and struck a match. The first match broke. The second went out. On the third try, the flame caught, and the lamp began to turn, sending its beam across the dark water.

Mara stayed beside the lamp until dawn, wiping the salt from the glass whenever the beam grew dim. As the sky turned grey, she saw a small boat with a red sail moving slowly toward the harbour. On its deck, a man raised both arms and waved toward the lighthouse.`,
  },
  {
    code: "SMA-BING-P7-START",
    title: "Schools Should Start Later",
    content: `Most high schools in our city start at 6.30 a.m. I believe this is too early, and school should start at least one hour later.

First, teenagers' body clocks are different from those of children and adults. During puberty, the body releases melatonin later at night, so most teenagers do not feel sleepy until around 11 p.m. If they must wake up at 4.45 a.m. to reach school on time, they cannot possibly get the 8 to 10 hours of sleep they need.

Second, well-rested students learn better. A study conducted in several schools in the United States found that after school start times moved to 8.30 a.m., students' attendance rose and fewer students fell asleep in class. In my opinion, this is the most convincing reason of all.

Third, a later start would make the journey to school safer. Many students ride motorbikes or walk to school in the dark. Sleepy riders react more slowly, which increases the risk of accidents.

Some people argue that a later start would mean students go home later and have less time for extracurricular activities. This is a fair concern, but schools can adjust their timetables, for example by shortening breaks or moving some activities to Saturdays.

Therefore, starting school one hour later is a simple change that would bring great benefits. Our students deserve schools that work with their bodies, not against them.`,
  },
  {
    code: "SMA-BING-P7-ECOBRICK",
    title: "How to Make an Eco-Brick",
    gambar: "ecobrick",
    content: `An eco-brick is a plastic bottle packed tightly with clean, dry plastic waste. One eco-brick keeps about 200–300 grams of plastic out of landfills and rivers. Finished eco-bricks can be used to build benches, garden borders, and small walls.

**Steps**
1. Collect a clean, dry 600 ml plastic bottle.
2. Cut clean, dry plastic waste into small pieces so that it packs tightly.
3. Push the pieces into the bottle with a stick, layer by layer.
4. Keep filling until the bottle is hard and cannot be squeezed (at least 200 grams for a 600 ml bottle).
5. Close the cap, then write the weight and date on it so that others can check its quality.

**Notes**
- Do not put in paper, glass, metal, or food waste.
- Wet or dirty plastic can grow mould and smell bad.
- Store finished eco-bricks in the shade, because sunlight weakens the plastic.`,
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
  // ---- 1. Notice ----
  {
    kode_stimulus: "SMA-BING-P7-NOTICE",
    kode_subdomain: "SMA-BING-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: "When will the library open again?",
    opsi_a: "Friday, 6 November 2026",
    opsi_b: "Monday, 9 November 2026",
    opsi_c: "Saturday, 21 November 2026",
    opsi_d: "Monday, 23 November 2026",
    opsi_e: "Friday, 27 November 2026",
    kunci: "D",
    pembahasan: "Pengumuman menyebut \"The library will reopen on Monday, 23 November 2026\". Tanggal 9–21 November adalah masa penutupan, sedangkan 6 November adalah batas pengembalian buku.",
    tingkat_kesulitan: "mudah",
  },
  {
    kode_stimulus: "SMA-BING-P7-NOTICE",
    kode_subdomain: "SMA-BING-D3-S4",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Based on the notice, decide whether each statement is **Benar** (true) or **Salah** (false).",
    opsi_a: "A student can borrow a printed book from the library on 12 November.",
    opsi_b: "A student can read in Room B-12 at 1 p.m. on Wednesday, 11 November.",
    opsi_c: "A student who returns a borrowed book on 23 November will not be fined.",
    kunci: "S,B,B",
    pembahasan: "Pada 12 November perpustakaan tutup, sehingga tidak bisa meminjam buku cetak (**Salah**). Ruang B-12 buka pukul 07.00–14.00 pada Senin–Jumat, jadi pukul 13.00 hari Rabu termasuk (**Benar**). Buku yang dikembalikan pada 23 November tidak didenda (**Benar**).",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SMA-BING-P7-NOTICE",
    kode_subdomain: "SMA-BING-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: "What is the main purpose of the notice?",
    opsi_a: "To ask students to donate books to the library",
    opsi_b: "To inform students about the library closure and the services available during the renovation",
    opsi_c: "To announce the winners of a reading competition",
    opsi_d: "To explain how to use the new digital catalogue",
    opsi_e: "To invite students to help renovate the library",
    kunci: "B",
    pembahasan: "Seluruh isi pengumuman memberi tahu masa penutupan perpustakaan dan layanan pengganti selama renovasi. Pilihan lain tidak dibahas atau hanya detail kecil (katalog digital).",
    tingkat_kesulitan: "mudah",
  },
  {
    kode_stimulus: "SMA-BING-P7-NOTICE",
    kode_subdomain: "SMA-BING-D1-S2",
    bentuk_soal: "pgk_mcma",
    pertanyaan: "Which services are still available to students during the renovation? (Choose all correct answers.)",
    opsi_a: "Reading in a temporary reading corner",
    opsi_b: "Reading e-books online",
    opsi_c: "Booking the school hall for study groups",
    opsi_d: "Borrowing printed books from the library",
    kunci: "A,B,C",
    pembahasan: "Selama penutupan tersedia ruang baca sementara (B-12), e-book daring, dan peminjaman aula untuk kelompok belajar. Peminjaman buku cetak tidak tersedia karena perpustakaan tutup.",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SMA-BING-P7-NOTICE",
    kode_subdomain: "SMA-BING-D3-S5",
    bentuk_soal: "pg",
    pertanyaan: "Tari needs a reference book for a project that is due on 16 November. Based on the notice, what is the best thing for her to do?",
    opsi_a: "Wait until the library reopens and borrow the book then",
    opsi_b: "Ask Ms. Ratna to open the library for her",
    opsi_c: "Look for the book in the e-book collection or visit the temporary reading corner",
    opsi_d: "Borrow the book on 9 November before the library closes",
    opsi_e: "Book the school hall to read the book",
    kunci: "C",
    pembahasan: "Tenggat proyek (16 November) jatuh saat perpustakaan tutup, sehingga menunggu (A) terlambat. Pilihan D tidak mungkin karena perpustakaan mulai tutup 9 November, sedangkan B dan E tidak sesuai fungsi layanan. Pilihan yang tersedia adalah e-book atau ruang baca sementara.",
    tingkat_kesulitan: "sedang",
  },
  // ---- 2. Screen time & sleep ----
  {
    kode_stimulus: "SMA-BING-P7-SLEEP",
    kode_subdomain: "SMA-BING-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: "What is the main idea of the text?",
    opsi_a: "Teenagers should stop using phones completely.",
    opsi_b: "Using screens late at night is linked to shorter sleep among students.",
    opsi_c: "Blue light is the only reason teenagers sleep less.",
    opsi_d: "Homework is more harmful to sleep than screens.",
    opsi_e: "The health club of SMA Cendekia has 600 members.",
    kunci: "B",
    pembahasan: "Teks membahas hasil survei: makin lama penggunaan layar setelah pukul 21.00, makin pendek waktu tidur. A dan D tidak dinyatakan, C bertentangan dengan teks (\"does not prove that screens are the only reason\"), dan E keliru (600 adalah jumlah responden).",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SMA-BING-P7-SLEEP",
    kode_subdomain: "SMA-BING-D3-S3",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Decide whether each statement is **Benar** (valid) or **Salah** (not valid) based on the text and the chart.",
    opsi_a: "Students who used screens for more than three hours slept about 2.2 hours less than those who used them for less than one hour.",
    opsi_b: "The survey proves that screens are the only cause of students' short sleep.",
    opsi_c: "On average, students in the \"2–3 hours\" group did not get the amount of sleep recommended by health experts.",
    kunci: "B,S,B",
    pembahasan: "8,1 − 5,9 = 2,2 jam (**Benar**). Teks menegaskan survei hanya menunjukkan hubungan, bukan membuktikan layar sebagai satu-satunya penyebab (**Salah**). Kelompok 2–3 jam tidur 6,6 jam, di bawah anjuran 8–10 jam (**Benar**).",
    tingkat_kesulitan: "sulit",
  },
  {
    kode_stimulus: "SMA-BING-P7-SLEEP",
    kode_subdomain: "SMA-BING-D2-S5",
    bentuk_soal: "pg",
    pertanyaan: "According to the text, why does blue light make it harder to fall asleep?",
    opsi_a: "It makes the eyes too tired to close.",
    opsi_b: "It tells the brain that it is still daytime, so the body produces less melatonin.",
    opsi_c: "It increases the amount of melatonin in the body.",
    opsi_d: "It makes the room too bright for other family members.",
    opsi_e: "It causes noise at home that disturbs sleep.",
    kunci: "B",
    pembahasan: "Paragraf ketiga: blue light \"tells the brain that it is still daytime. As a result, the body produces less melatonin\". C kebalikan dari teks, sedangkan pilihan lain tidak disebutkan.",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SMA-BING-P7-SLEEP",
    kode_subdomain: "SMA-BING-D1-S4",
    bentuk_soal: "pg",
    pertanyaan: "Which of the following is the best summary of the text?",
    opsi_a: "A survey of 600 students found that longer screen use after 9 p.m. is related to shorter sleep, possibly because of blue light and an active brain, although other factors may also matter.",
    opsi_b: "Students at SMA Cendekia sleep 8 to 10 hours every night because they put their phones away early.",
    opsi_c: "Blue light from screens is dangerous, so teenagers must never use phones at night.",
    opsi_d: "Homework and extracurricular activities are the main reasons why students sleep less.",
    opsi_e: "The health club of SMA Cendekia sells special lamps that reduce blue light.",
    kunci: "A",
    pembahasan: "Ringkasan yang baik mencakup temuan utama (hubungan layar dan tidur), penjelasan penyebab, dan batasan survei. B keliru secara fakta, C berlebihan, D hanya bagian kecil, dan E tidak ada dalam teks.",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SMA-BING-P7-SLEEP",
    kode_subdomain: "SMA-BING-D2-S4",
    bentuk_soal: "pgk_mcma",
    pertanyaan: "Based on the chart, which comparisons are correct? (Choose all correct answers.)",
    opsi_a: "Students in the \"1–2 hours\" group slept longer than those in the \"2–3 hours\" group.",
    opsi_b: "The difference in sleep between the \"< 1 hour\" and \"1–2 hours\" groups is smaller than the difference between the \"2–3 hours\" and \"> 3 hours\" groups.",
    opsi_c: "The \"1–2 hours\" group had the largest number of students.",
    opsi_d: "Fewer students used screens for more than three hours than for less than one hour.",
    kunci: "A,C,D",
    pembahasan: "7,4 > 6,6 jam (A benar). Selisih 8,1 − 7,4 = 0,7 dan 6,6 − 5,9 = 0,7, jadi sama besar, bukan lebih kecil (B salah). Kelompok 1–2 jam berisi 210 siswa, terbanyak (C benar). 90 < 150 (D benar).",
    tingkat_kesulitan: "sulit",
  },
  // ---- 3. Narrative ----
  {
    kode_stimulus: "SMA-BING-P7-LIGHTHOUSE",
    kode_subdomain: "SMA-BING-D2-S6",
    bentuk_soal: "pg",
    pertanyaan: "Which words best describe Mara?",
    opsi_a: "careless and impatient",
    opsi_b: "brave and responsible",
    opsi_c: "shy and lazy",
    opsi_d: "proud and selfish",
    opsi_e: "funny and talkative",
    kunci: "B",
    pembahasan: "Meski takut (kakinya gemetar) dan cuaca buruk, Mara tetap menaiki 112 anak tangga, menyalakan lampu, dan menjaganya hingga subuh demi keselamatan para nelayan. Ia berani dan bertanggung jawab.",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SMA-BING-P7-LIGHTHOUSE",
    kode_subdomain: "SMA-BING-D2-S3",
    bentuk_soal: "pg",
    pertanyaan: "What did Mara do right after she replaced the burnt wick?",
    opsi_a: "She opened the green box.",
    opsi_b: "She struck a match.",
    opsi_c: "She filled the tank with oil.",
    opsi_d: "She wiped the salt from the glass.",
    opsi_e: "She climbed the stairs.",
    kunci: "C",
    pembahasan: "Urutannya: membuka kotak hijau → mengganti sumbu → mengisi tangki dengan minyak → menyalakan korek. Jadi tepat setelah mengganti sumbu, Mara mengisi tangki dengan minyak.",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SMA-BING-P7-LIGHTHOUSE",
    kode_subdomain: "SMA-BING-D2-S7",
    bentuk_soal: "pg",
    pertanyaan: "What will most likely happen next?",
    opsi_a: "The storm will destroy the lighthouse.",
    opsi_b: "Mara will leave the lighthouse and move to the city.",
    opsi_c: "The fishermen will come to the lighthouse to thank Mara for guiding them home.",
    opsi_d: "Mara's father will scold her for climbing the stairs.",
    opsi_e: "The lamp will go out again and the boat will hit the rocks.",
    kunci: "C",
    pembahasan: "Cerita berakhir dengan perahu yang selamat menuju pelabuhan dan seorang lelaki melambaikan tangan ke mercusuar, tanda terima kasih. Lanjutan yang paling logis adalah para nelayan datang berterima kasih kepada Mara. Badai sudah reda menjelang pagi, dan ayahnya sendiri berpesan agar ia hati-hati.",
    tingkat_kesulitan: "sulit",
  },
  {
    kode_stimulus: "SMA-BING-P7-LIGHTHOUSE",
    kode_subdomain: "SMA-BING-D3-S1",
    bentuk_soal: "pgk_kategori",
    kategori: "Ya/Tidak",
    pertanyaan: "Is each of the following a feature of realistic fiction that can be found in the story? Choose **Ya** (yes) or **Tidak** (no).",
    opsi_a: "The setting could exist in the real world.",
    opsi_b: "A character uses magic to solve the problem.",
    opsi_c: "The problem is solved through the character's own effort.",
    kunci: "Y,T,Y",
    pembahasan: "Latar (mercusuar di tanjung saat badai) bisa ada di dunia nyata, dan masalah diselesaikan dengan usaha Mara sendiri. Tidak ada unsur sihir dalam cerita.",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SMA-BING-P7-LIGHTHOUSE",
    kode_subdomain: "SMA-BING-D2-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: "Which details show that relighting the lamp was difficult for Mara? (Choose all correct answers.)",
    opsi_a: "Her legs shook as she climbed the steps.",
    opsi_b: "The wind almost blew her lantern out twice.",
    opsi_c: "The first two matches failed.",
    opsi_d: "She saw a small boat with a red sail.",
    kunci: "A,B,C",
    pembahasan: "Kaki gemetar, lentera hampir padam dua kali, dan dua korek pertama gagal adalah detail yang menunjukkan kesulitan. Melihat perahu berlayar merah terjadi setelah tugas selesai.",
    tingkat_kesulitan: "sulit",
  },
  // ---- 4. Analytical exposition ----
  {
    kode_stimulus: "SMA-BING-P7-START",
    kode_subdomain: "SMA-BING-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: "What is the writer's main purpose in writing the text?",
    opsi_a: "To describe a typical school day in the city",
    opsi_b: "To persuade readers that schools should start later",
    opsi_c: "To tell a story about a student who was late for school",
    opsi_d: "To explain how melatonin is produced",
    opsi_e: "To report the result of a study in the United States",
    kunci: "B",
    pembahasan: "Teks analytical exposition ini memuat tesis (\"school should start at least one hour later\"), argumen, dan penegasan ulang untuk meyakinkan pembaca.",
    tingkat_kesulitan: "mudah",
  },
  {
    kode_stimulus: "SMA-BING-P7-START",
    kode_subdomain: "SMA-BING-D3-S2",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Decide whether each sentence is an **opinion** (Benar) or **not an opinion** (Salah).",
    opsi_a: "In my opinion, this is the most convincing reason of all.",
    opsi_b: "Many students ride motorbikes or walk to school in the dark.",
    opsi_c: "Our students deserve schools that work with their bodies, not against them.",
    kunci: "B,S,B",
    pembahasan: "Kalimat 1 (\"In my opinion ...\") dan kalimat 3 (penilaian \"deserve\") adalah opini. Kalimat 2 adalah fakta yang dapat diamati atau dibuktikan.",
    tingkat_kesulitan: "sulit",
  },
  {
    kode_stimulus: "SMA-BING-P7-START",
    kode_subdomain: "SMA-BING-D3-S3",
    bentuk_soal: "pgk_mcma",
    pertanyaan: "Which statements correctly evaluate how the writer supports the argument? (Choose all correct answers.)",
    opsi_a: "The second argument is supported by the result of a study.",
    opsi_b: "The claim about accidents is supported by data from the police.",
    opsi_c: "The writer responds to a counterargument before the conclusion.",
    opsi_d: "The claim about teenagers' body clocks is supported by an explanation about melatonin.",
    kunci: "A,C,D",
    pembahasan: "Argumen kedua didukung studi di Amerika Serikat (A), ada tanggapan atas keberatan tentang kegiatan ekstrakurikuler (C), dan argumen pertama dijelaskan lewat melatonin (D). Klaim tentang kecelakaan tidak didukung data apa pun (B salah).",
    tingkat_kesulitan: "sulit",
  },
  {
    kode_stimulus: "SMA-BING-P7-START",
    kode_subdomain: "SMA-BING-D1-S3",
    bentuk_soal: "pg",
    pertanyaan: "Which outline best represents the organization of the text?",
    opsi_a: "Thesis → three arguments → counterargument and response → reiteration",
    opsi_b: "Orientation → complication → resolution → coda",
    opsi_c: "General statement → sequence of explanation → closing",
    opsi_d: "Goal → materials → steps",
    opsi_e: "Issue → arguments for → arguments against → recommendation",
    kunci: "A",
    pembahasan: "Paragraf 1 tesis; paragraf 2–4 argumen pertama sampai ketiga; paragraf 5 keberatan dan tanggapannya; paragraf 6 penegasan ulang. B adalah struktur narrative, C explanation, D procedure, dan E discussion.",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SMA-BING-P7-START",
    kode_subdomain: "SMA-BING-D1-S5",
    bentuk_soal: "pg",
    pertanyaan: "Based on both \"Screen Time and Sleep\" and \"Schools Should Start Later\", which conclusion is best supported by BOTH texts?",
    opsi_a: "Teenagers often do not get the recommended 8 to 10 hours of sleep, which can affect their daily activities.",
    opsi_b: "Schools in the United States start earlier than schools in Indonesia.",
    opsi_c: "Phones should be banned in all schools.",
    opsi_d: "Melatonin is produced only during the day.",
    opsi_e: "Students who ride motorbikes sleep longer than students who walk.",
    kunci: "A",
    pembahasan: "Kedua teks menyebut anjuran tidur 8–10 jam bagi remaja dan menunjukkan bahwa banyak remaja kurang tidur (karena layar atau jam masuk sekolah yang terlalu pagi). Pilihan lain tidak didukung salah satu atau kedua teks.",
    tingkat_kesulitan: "sulit",
  },
  // ---- 5. Eco-brick ----
  {
    kode_stimulus: "SMA-BING-P7-ECOBRICK",
    kode_subdomain: "SMA-BING-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: "At least how much plastic should a 600 ml eco-brick contain?",
    opsi_a: "100 grams",
    opsi_b: "150 grams",
    opsi_c: "200 grams",
    opsi_d: "300 grams",
    opsi_e: "600 grams",
    kunci: "C",
    pembahasan: "Langkah 4: \"at least 200 grams for a 600 ml bottle\".",
    tingkat_kesulitan: "mudah",
  },
  {
    kode_stimulus: "SMA-BING-P7-ECOBRICK",
    kode_subdomain: "SMA-BING-D2-S3",
    bentuk_soal: "pg",
    pertanyaan: "What should you do right before pushing the plastic into the bottle?",
    opsi_a: "Close the cap.",
    opsi_b: "Write the weight and date.",
    opsi_c: "Cut the plastic waste into small pieces.",
    opsi_d: "Store the bottle in the shade.",
    opsi_e: "Squeeze the bottle to check its hardness.",
    kunci: "C",
    pembahasan: "Langkah 2 (memotong plastik kecil-kecil) dilakukan tepat sebelum langkah 3 (memasukkan potongan plastik ke botol dengan tongkat).",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SMA-BING-P7-ECOBRICK",
    kode_subdomain: "SMA-BING-D3-S4",
    bentuk_soal: "pgk_kategori",
    kategori: "Benar/Salah",
    pertanyaan: "Decide whether each item is suitable (**Benar**) or not suitable (**Salah**) to be put into an eco-brick.",
    opsi_a: "Clean, dry snack wrappers",
    opsi_b: "Used paper",
    opsi_c: "Wet plastic bags",
    kunci: "B,S,S",
    pembahasan: "Bungkus makanan ringan yang bersih dan kering adalah plastik yang sesuai. Kertas termasuk bahan yang dilarang, dan plastik basah dapat berjamur serta berbau.",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SMA-BING-P7-ECOBRICK",
    kode_subdomain: "SMA-BING-D2-S5",
    bentuk_soal: "pgk_mcma",
    pertanyaan: "According to the text, which reasons for the steps and notes are correct? (Choose all correct answers.)",
    opsi_a: "The plastic must be clean and dry so that it does not grow mould or smell bad.",
    opsi_b: "Cutting the plastic into small pieces helps it pack tightly.",
    opsi_c: "Writing the weight on the cap lets others check the eco-brick's quality.",
    opsi_d: "Storing eco-bricks in the sun makes them stronger.",
    kunci: "A,B,C",
    pembahasan: "A, B, dan C dinyatakan dalam teks. D bertentangan dengan catatan: simpan di tempat teduh karena sinar matahari melemahkan plastik.",
    tingkat_kesulitan: "sedang",
  },
  {
    kode_stimulus: "SMA-BING-P7-ECOBRICK",
    kode_subdomain: "SMA-BING-D3-S5",
    bentuk_soal: "pg",
    pertanyaan: "Your friend wants to put pieces of a broken glass jar into his eco-brick to make it heavier. What is the best response?",
    opsi_a: "\"Great idea! Heavier eco-bricks are always better.\"",
    opsi_b: "\"You should not do that. Glass is not allowed and could make the eco-brick dangerous.\"",
    opsi_c: "\"Only put in glass if it is clean and dry.\"",
    opsi_d: "\"Mix the glass with food waste so it sticks together.\"",
    opsi_e: "\"Put the glass in, but store the eco-brick in the sun.\"",
    kunci: "B",
    pembahasan: "Catatan menyebut kaca termasuk bahan yang tidak boleh dimasukkan. Tanggapan yang tepat adalah menolak dan memberi alasan. C, D, dan E tetap melanggar aturan.",
    tingkat_kesulitan: "mudah",
  },
];

export default {
  title: "TKA SMA Bahasa Inggris — Paket 7",
  description: "25 soal dari 5 teks: pengumuman, laporan bergrafik, narrative, analytical exposition, dan prosedur bergambar.",
  jenjang: "SMA",
  subjectCode: "SMA-BING",
  durationMinutes: 50,
  isPremium: true,
  isFullSimulation: true,
  createdByEmail: "kpbgalimka@gmail.com",
  stimuli,
  rows,
  images: {
    notice: { title: "Library renovation notice", svg: imgNotice() },
    "sleep-chart": { title: "Screen time and sleep chart", svg: imgSleep() },
    ecobrick: { title: "How to make an eco-brick", svg: imgEcobrick() },
  },
};
