import Link from "next/link";

export const metadata = { title: "Alur Pendaftaran" };

/** Alur bisnis utama — Bab 6 & Bab 47 dokumen analisis. */
const LANGKAH = [
  {
    judul: "Informasi Kunjungan",
    teks: "Pemohon membaca informasi layanan, persyaratan, ketentuan kelompok, dan jadwal layanan pada halaman informasi.",
  },
  {
    judul: "Pendaftaran Kunjungan Studi",
    teks: "Pemohon membuat akun, lalu mengisi formulir pendaftaran berisi data pemohon, data kelompok, data peserta, dan dokumen bila diperlukan.",
  },
  {
    judul: "Verifikasi Admin",
    teks: "Admin memeriksa kelengkapan data, jumlah peserta, tujuan kunjungan, tanggal/waktu, dokumen, serta ketersediaan kapasitas dan ruangan.",
  },
  {
    judul: "Keputusan: Diterima atau Ditolak",
    teks: "Bila diterima, permohonan lanjut ke penjadwalan. Bila ditolak, alasan dicatat dan pemohon memperoleh notifikasi. Admin juga dapat meminta perbaikan data.",
  },
  {
    judul: "Penjadwalan Kunjungan",
    teks: "Admin menetapkan tanggal, waktu mulai, waktu selesai, dan penanggung jawab kunjungan.",
  },
  {
    judul: "Pembagian Ruangan",
    teks: "Admin menentukan ruangan yang digunakan. Sistem mencegah bentrokan jadwal pada ruangan yang sama.",
  },
  {
    judul: "Pelaksanaan Kunjungan",
    teks: "Kelompok datang sesuai jadwal dan mengikuti rangkaian kegiatan di ruangan yang telah ditetapkan.",
  },
  {
    judul: "Daftar Hadir per Ruangan",
    teks: "Setiap peserta melakukan check-in saat memasuki ruangan. Check-out dapat dilakukan ketika meninggalkan ruangan bila diperlukan.",
  },
  {
    judul: "Pengaduan Fasilitas melalui QR Code",
    teks: "Bila ada kendala fasilitas, pengunjung memindai QR Code di ruangan. Halaman pengaduan otomatis mencatat ruangan asal QR Code.",
  },
  {
    judul: "Tindak Lanjut Admin",
    teks: "Admin memverifikasi pengaduan, menetapkan petugas, menambahkan catatan tindak lanjut, dan memperbarui status hingga selesai.",
  },
  {
    judul: "Kunjungan Selesai",
    teks: "Status kunjungan diubah menjadi selesai dan seluruh data masuk ke rekap serta laporan.",
  },
];

export default function HalamanAlur() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">Alur Pendaftaran Kunjungan Studi</h1>
      <p className="mt-3 text-slate-600">
        Berikut urutan proses dari penyampaian informasi hingga kunjungan dinyatakan selesai.
      </p>

      <ol className="mt-10 space-y-4">
        {LANGKAH.map((l, i) => (
          <li key={l.judul} className="card flex gap-4 p-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
              {i + 1}
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">{l.judul}</h2>
              <p className="mt-1 text-sm text-slate-600">{l.teks}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="alert-info mt-10">
        <p className="font-semibold">Status permohonan yang akan Anda lihat</p>
        <p className="mt-1">
          Draft → Diajukan → Dalam Verifikasi → Diterima / Ditolak → Dijadwalkan → Berlangsung →
          Selesai. Status <em>Perlu Perbaikan</em> dan <em>Dibatalkan</em> digunakan sesuai kebutuhan.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/register" className="btn-primary">Daftar Sekarang</Link>
        <Link href="/ruangan" className="btn-secondary">Lihat Ruangan &amp; Fasilitas</Link>
      </div>
    </div>
  );
}
