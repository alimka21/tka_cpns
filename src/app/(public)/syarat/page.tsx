import type { Metadata } from "next";
import Link from "next/link";
import { ContactLine, LegalPage, type LegalSection } from "@/components/legal/legal-page";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description: `Ketentuan penggunaan layanan latihan TKA ${SITE_NAME}, termasuk langganan Premium dan pembayaran.`,
};

const sections: LegalSection[] = [
  {
    id: "layanan",
    title: "Tentang layanan",
    body: (
      <>
        <p>
          {SITE_NAME} adalah platform latihan Tes Kemampuan Akademik (TKA) untuk siswa SD, SMP, dan SMA: paket tes online berwaktu,
          skor dan pembahasan, analisis kemampuan per subtopik, serta latihan terarah.
        </p>
        <p>
          Soal disusun mengikuti Kerangka Asesmen TKA yang dipublikasikan pemerintah, tetapi {SITE_NAME}{" "}
          <strong>bukan</strong> penyelenggara TKA resmi dan tidak berafiliasi dengan Kementerian Pendidikan Dasar dan Menengah
          maupun BSKAP. Hasil latihan di sini tidak menjamin hasil TKA yang sebenarnya.
        </p>
      </>
    ),
  },
  {
    id: "akun",
    title: "Akun pengguna",
    body: (
      <ul>
        <li>Data pendaftaran (nama, email, jenjang) harus benar. Satu akun untuk satu orang.</li>
        <li>Pengguna di bawah 18 tahun wajib memakai layanan dengan sepengetahuan dan persetujuan orang tua atau wali.</li>
        <li>Kamu bertanggung jawab menjaga kerahasiaan kata sandi. Jangan meminjamkan atau membagikan akun.</li>
        <li>Admin dapat meninjau dan menyetujui pendaftar baru sebelum akun aktif.</li>
        <li>Akun yang lupa kata sandinya dapat diatur ulang dengan bantuan admin; admin tidak pernah dapat melihat kata sandimu.</li>
      </ul>
    ),
  },
  {
    id: "penggunaan",
    title: "Penggunaan yang dilarang",
    body: (
      <>
        <p>Saat memakai {SITE_NAME}, kamu tidak diperbolehkan:</p>
        <ul>
          <li>menyalin, mengunduh massal, membagikan, atau menjual ulang soal, kunci jawaban, dan pembahasan;</li>
          <li>memakai bot, skrip, atau cara otomatis lain untuk mengakses atau mengerjakan tes;</li>
          <li>mencoba membobol keamanan, mengakses akun orang lain, atau mengganggu kinerja layanan;</li>
          <li>mengirim laporan soal atau konten yang menyesatkan, menghina, atau melanggar hukum.</li>
        </ul>
        <p>Pelanggaran dapat berakibat pembatasan, penangguhan, atau penghapusan akun tanpa pengembalian dana.</p>
      </>
    ),
  },
  {
    id: "premium",
    title: "Langganan Premium",
    body: (
      <ul>
        <li>Akun gratis dapat mengerjakan paket tes gratis. Premium membuka semua paket tes premium sesuai jenjang paket langganan serta fitur Latihan Kelemahan.</li>
        <li>Harga, jenjang, dan masa aktif tiap paket langganan tertera di halaman Premium sebelum kamu membayar.</li>
        <li>Masa aktif dihitung sejak pembayaran berhasil. Membeli lagi saat masih aktif akan memperpanjang masa aktif.</li>
        <li>Langganan <strong>tidak diperpanjang otomatis</strong> — tidak ada penagihan berulang tanpa pembelian baru.</li>
        <li>Isi paket tes dapat bertambah atau diperbarui dari waktu ke waktu selama masa aktif.</li>
      </ul>
    ),
  },
  {
    id: "pembayaran",
    title: "Pembayaran & pengembalian dana",
    body: (
      <>
        <ul>
          <li>Pembayaran diproses oleh DOKU melalui metode yang tersedia (mis. QRIS). Biaya dari bank atau dompet digital, bila ada, menjadi tanggungan pembayar.</li>
          <li>Premium aktif otomatis setelah pembayaran dikonfirmasi. Status transaksi dapat dilihat di halaman Premium.</li>
          <li>Karena berupa produk digital yang langsung dapat dipakai, pembayaran yang berhasil <strong>tidak dapat dibatalkan atau dikembalikan</strong>, kecuali:
            <ul>
              <li>pembayaran berhasil tetapi Premium tidak aktif dalam 1×24 jam dan tidak dapat kami aktifkan;</li>
              <li>terjadi pembayaran ganda untuk transaksi yang sama.</li>
            </ul>
          </li>
          <li>Untuk kendala pembayaran, hubungi kami melalui <ContactLine /> dengan menyertakan nomor transaksi (diawali &ldquo;WTP-&rdquo;).</li>
        </ul>
      </>
    ),
  },
  {
    id: "konten",
    title: "Hak atas konten",
    body: (
      <p>
        Soal, pembahasan, bacaan, gambar, logo, dan tampilan {SITE_NAME} dilindungi hak cipta dan hanya boleh dipakai untuk belajar
        pribadi. Sebagian bacaan dikutip atau diadaptasi dari sumber yang disebutkan pada bacaan tersebut. Bila kamu pemilik hak atas
        suatu konten dan berkeberatan, hubungi kami agar dapat segera ditindaklanjuti.
      </p>
    ),
  },
  {
    id: "ai",
    title: "Soal buatan AI",
    body: (
      <p>
        Sebagian soal disusun dengan bantuan kecerdasan buatan lalu ditinjau admin. Soal &ldquo;Latihan AI&rdquo; yang dibuat khusus
        untukmu memakai API key Gemini milikmu, tidak ditinjau admin, dan tidak dihitung ke skor tes resmi. Bila menemukan soal yang
        keliru, gunakan tombol &ldquo;Laporkan soal&rdquo; agar kami perbaiki.
      </p>
    ),
  },
  {
    id: "ketersediaan",
    title: "Ketersediaan & batas tanggung jawab",
    body: (
      <ul>
        <li>Kami berupaya menjaga layanan tetap tersedia, tetapi dapat terjadi gangguan atau pemeliharaan. Jawaban tes tersimpan otomatis untuk mengurangi risiko kehilangan jawaban.</li>
        <li>Layanan disediakan &ldquo;sebagaimana adanya&rdquo;. Sejauh diizinkan hukum, kami tidak bertanggung jawab atas kerugian tidak langsung akibat penggunaan layanan, termasuk hasil ujian yang sebenarnya.</li>
      </ul>
    ),
  },
  {
    id: "penghentian",
    title: "Penghentian akun",
    body: (
      <p>
        Kamu dapat meminta penghapusan akun kapan saja melalui <ContactLine />. Kami dapat menangguhkan atau menghapus akun yang
        melanggar ketentuan ini. Pengelolaan data saat akun dihapus mengikuti{" "}
        <Link href="/privasi" className="font-semibold text-primary hover:underline">
          Kebijakan Privasi
        </Link>
        .
      </p>
    ),
  },
  {
    id: "perubahan",
    title: "Perubahan ketentuan & hukum yang berlaku",
    body: (
      <p>
        Ketentuan ini dapat diperbarui sewaktu-waktu; tanggal berlaku di atas akan disesuaikan dan perubahan penting akan diumumkan di
        situs. Ketentuan ini tunduk pada hukum Republik Indonesia. Perselisihan diupayakan diselesaikan secara musyawarah terlebih
        dahulu.
      </p>
    ),
  },
];

export default function SyaratPage() {
  return (
    <LegalPage
      title="Syarat & Ketentuan"
      effectiveDate="7 Oktober 2026"
      other={{ href: "/privasi", label: "Kebijakan Privasi" }}
      intro={
        <p>
          Dengan mendaftar atau memakai {SITE_NAME}, kamu menyetujui Syarat & Ketentuan berikut serta{" "}
          <Link href="/privasi" className="font-semibold text-primary hover:underline">
            Kebijakan Privasi
          </Link>{" "}
          kami. Bila kamu belum berusia 18 tahun, pastikan orang tua atau wali telah membaca dan menyetujuinya.
        </p>
      }
      sections={sections}
    />
  );
}
