import type { Metadata } from "next";
import Link from "next/link";
import { ContactLine, LegalPage, type LegalSection } from "@/components/legal/legal-page";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description: `Bagaimana ${SITE_NAME} mengumpulkan, memakai, menyimpan, dan melindungi data pribadi pengguna.`,
};

const sections: LegalSection[] = [
  {
    id: "data",
    title: "Data yang kami kumpulkan",
    body: (
      <>
        <p>Kami hanya mengumpulkan data yang diperlukan untuk menjalankan layanan latihan TKA:</p>
        <ul>
          <li>
            <strong>Data akun:</strong> nama, alamat email, jenjang (SD/SMP/SMA), dan kata sandi. Kata sandi disimpan dalam bentuk
            terenkripsi satu arah (hash) sehingga tidak dapat dibaca oleh siapa pun, termasuk admin.
          </li>
          <li>
            <strong>Data dari Google</strong> (bila masuk dengan Google): nama, alamat email, dan foto profil. Kami tidak meminta
            akses ke Gmail, Drive, kontak, atau data Google lainnya.
          </li>
          <li>
            <strong>Data belajar:</strong> jawaban tes dan latihan, skor, waktu pengerjaan, hasil analisis per subtopik, serta laporan
            soal yang kamu kirim.
          </li>
          <li>
            <strong>Data transaksi:</strong> paket langganan yang dibeli, nominal, status, waktu, dan metode pembayaran (mis. QRIS).
            Kami <strong>tidak</strong> menyimpan data rekening, kartu, atau PIN — pembayaran diproses oleh DOKU.
          </li>
          <li>
            <strong>Data teknis sesi:</strong> alamat IP dan jenis peramban/perangkat saat masuk, untuk keamanan akun.
          </li>
          <li>
            <strong>API key Gemini</strong> (opsional, bila kamu menyimpannya untuk fitur Latihan AI): disimpan terenkripsi dan hanya
            dipakai untuk memanggil layanan Gemini atas permintaanmu.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "penggunaan",
    title: "Cara kami memakai data",
    body: (
      <ul>
        <li>Membuat dan mengelola akun, termasuk konfirmasi pendaftar oleh admin bila diaktifkan.</li>
        <li>Menampilkan paket tes sesuai jenjang, menyimpan jawaban, menghitung skor, dan menyusun analisis kemampuan per subtopik.</li>
        <li>Menyusun latihan yang berfokus pada kelemahanmu.</li>
        <li>Memproses langganan Premium dan menampilkan riwayat transaksi.</li>
        <li>Menjaga keamanan layanan, mencegah penyalahgunaan, dan menindaklanjuti laporan soal.</li>
        <li>Meningkatkan mutu soal secara agregat (mis. soal yang paling sering salah), tanpa menampilkan identitasmu.</li>
      </ul>
    ),
  },
  {
    id: "pihak-ketiga",
    title: "Berbagi data dengan pihak ketiga",
    body: (
      <>
        <p>Kami tidak menjual atau menyewakan data pribadimu, dan tidak memasang iklan atau pelacak iklan. Data dibagikan hanya sebatas yang diperlukan kepada:</p>
        <ul>
          <li>
            <strong>DOKU</strong> — penyedia jasa pembayaran, untuk memproses transaksi (nomor invoice, nominal, nama, dan email).
          </li>
          <li>
            <strong>Google</strong> — bila kamu memilih masuk dengan Google, dan layanan Gemini bila kamu memakai Latihan AI dengan API
            key milikmu (yang dikirim adalah topik dan tingkat soal, bukan data pribadimu).
          </li>
          <li>
            <strong>Penyedia hosting</strong> (Hostinger) — tempat aplikasi dan basis data dijalankan.
          </li>
          <li>Pihak berwenang, bila diwajibkan oleh peraturan perundang-undangan.</li>
        </ul>
      </>
    ),
  },
  {
    id: "anak",
    title: "Pengguna di bawah umur",
    body: (
      <p>
        {SITE_NAME} ditujukan bagi siswa SD, SMP, dan SMA. Bagi pengguna yang belum berusia 18 tahun, pendaftaran dan penggunaan
        layanan — terutama pembelian Premium — harus dengan sepengetahuan dan persetujuan orang tua atau wali, sesuai Undang-Undang
        Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi. Orang tua atau wali dapat menghubungi kami untuk melihat, memperbaiki,
        atau menghapus data anaknya.
      </p>
    ),
  },
  {
    id: "keamanan",
    title: "Penyimpanan & keamanan",
    body: (
      <ul>
        <li>Koneksi ke situs memakai HTTPS (terenkripsi).</li>
        <li>Kata sandi disimpan sebagai hash; API key Gemini disimpan terenkripsi; kunci jawaban tidak dikirim ke peramban selama tes berlangsung.</li>
        <li>Akses admin dibatasi dan diperlukan untuk mengelola akun serta soal.</li>
        <li>Meski kami berupaya maksimal, tidak ada sistem yang sepenuhnya bebas risiko. Bila terjadi kebocoran data yang berdampak padamu, kami akan memberi tahu sesuai ketentuan yang berlaku.</li>
      </ul>
    ),
  },
  {
    id: "retensi",
    title: "Lama penyimpanan",
    body: (
      <p>
        Data akun dan data belajar disimpan selama akunmu aktif agar riwayat dan analisis kemampuanmu tetap tersedia. Data transaksi
        dapat disimpan lebih lama bila diwajibkan untuk keperluan pembukuan. Bila akun dihapus, data pribadi terkait akan dihapus atau
        dianonimkan, kecuali yang wajib disimpan menurut hukum.
      </p>
    ),
  },
  {
    id: "hak",
    title: "Hakmu atas data pribadi",
    body: (
      <>
        <p>Kamu berhak untuk:</p>
        <ul>
          <li>mengakses dan memperoleh salinan data pribadimu;</li>
          <li>memperbaiki data yang keliru — nama, jenjang, dan kata sandi dapat diubah sendiri di menu Pengaturan;</li>
          <li>meminta penghapusan akun dan data pribadimu;</li>
          <li>menarik persetujuan, mis. menghapus API key Gemini yang tersimpan kapan saja di Pengaturan.</li>
        </ul>
        <p>
          Ajukan permintaan melalui <ContactLine />. Kami akan menanggapinya dalam waktu yang wajar dan dapat meminta verifikasi
          bahwa permintaan berasal dari pemilik akun.
        </p>
      </>
    ),
  },
  {
    id: "cookie",
    title: "Cookie",
    body: (
      <p>
        Kami memakai cookie yang diperlukan agar kamu tetap masuk (cookie sesi) dan agar layanan berfungsi dengan aman. Kami tidak
        memakai cookie iklan atau pelacak pihak ketiga. Bila cookie dimatikan di peramban, kamu tidak dapat masuk ke akun.
      </p>
    ),
  },
  {
    id: "perubahan",
    title: "Perubahan kebijakan",
    body: (
      <p>
        Kebijakan ini dapat diperbarui sewaktu-waktu. Tanggal berlaku di bagian atas halaman akan disesuaikan, dan perubahan penting
        akan kami umumkan di situs. Dengan tetap memakai layanan setelah perubahan, kamu dianggap menyetujui kebijakan yang baru.
      </p>
    ),
  },
  {
    id: "kontak",
    title: "Hubungi kami",
    body: (
      <p>
        Pertanyaan tentang kebijakan privasi ini dapat disampaikan melalui <ContactLine />. Baca juga{" "}
        <Link href="/syarat" className="font-semibold text-primary hover:underline">
          Syarat & Ketentuan
        </Link>
        .
      </p>
    ),
  },
];

export default function PrivasiPage() {
  return (
    <LegalPage
      title="Kebijakan Privasi"
      effectiveDate="7 Oktober 2026"
      other={{ href: "/syarat", label: "Syarat & Ketentuan" }}
      intro={
        <p>
          Kebijakan ini menjelaskan bagaimana {SITE_NAME} (&ldquo;kami&rdquo;) mengumpulkan, memakai, menyimpan, dan melindungi data
          pribadi pengguna (&ldquo;kamu&rdquo;) saat memakai platform latihan Tes Kemampuan Akademik kami. Kami berpedoman pada
          Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi.
        </p>
      }
      sections={sections}
    />
  );
}
