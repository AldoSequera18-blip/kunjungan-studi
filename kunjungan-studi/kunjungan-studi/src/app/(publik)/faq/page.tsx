export const metadata = { title: "FAQ" };

const FAQ = [
  {
    t: "Siapa saja yang dapat mengajukan kunjungan studi?",
    j: "Kelompok pelajar, mahasiswa, komunitas, maupun instansi yang ingin mengenal layanan dan koleksi Balai Layanan Perpustakaan DPAD DIY. Pengajuan dilakukan secara berkelompok dengan penanggung jawab yang jelas.",
  },
  {
    t: "Berapa lama proses verifikasi permohonan?",
    j: "Permohonan diverifikasi oleh admin Balai setelah data dan dokumen lengkap. Pemohon dapat memantau status permohonan secara langsung melalui dashboard akun masing-masing.",
  },
  {
    t: "Apakah dokumen surat permohonan wajib diunggah?",
    j: "Dokumen seperti surat permohonan atau surat tugas ditetapkan wajib hanya setelah dikonfirmasi oleh Balai. Admin akan menyampaikan kebutuhan dokumen melalui catatan verifikasi bila diperlukan.",
  },
  {
    t: "Bagaimana ruangan kunjungan ditentukan?",
    j: "Ruangan ditetapkan oleh admin saat penjadwalan, dengan mempertimbangkan jumlah peserta, kapasitas ruangan, dan ketersediaan. Sistem mencegah dua kelompok menggunakan satu ruangan pada waktu yang bersamaan.",
  },
  {
    t: "Bagaimana cara peserta melakukan daftar hadir?",
    j: "Saat memasuki ruangan, peserta membuka halaman daftar hadir ruangan tersebut, memilih namanya dari daftar peserta atau memasukkan nomor kunjungan, lalu check-in tercatat beserta waktunya.",
  },
  {
    t: "Apa bedanya QR Code pengaduan dan QR Code daftar hadir?",
    j: "Keduanya dibedakan agar fungsinya jelas. QR Code pengaduan mengarah ke formulir pengaduan fasilitas ruangan, sedangkan QR Code daftar hadir mengarah ke halaman check-in peserta pada ruangan tersebut.",
  },
  {
    t: "Apakah pengaduan fasilitas boleh anonim?",
    j: "Formulir menyediakan pilihan anonim. Penerapan kebijakan anonim mengikuti ketentuan resmi Balai.",
  },
  {
    t: "Apakah data peserta masih bisa diubah setelah dikirim?",
    j: "Data peserta dapat diubah selama permohonan masih berada pada status yang mengizinkan perubahan. Setelah jadwal ditetapkan atau kunjungan berlangsung, perubahan mengikuti aturan admin.",
  },
];

export default function HalamanFaq() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">Pertanyaan yang Sering Diajukan</h1>
      <p className="mt-3 text-slate-600">
        Jawaban berikut bersifat umum. Ketentuan final mengikuti kebijakan resmi Balai.
      </p>

      <div className="mt-10 space-y-3">
        {FAQ.map((f) => (
          <details key={f.t} className="card group px-5 py-4">
            <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
              <span className="mr-2 text-brand-600 group-open:hidden">+</span>
              <span className="mr-2 hidden text-brand-600 group-open:inline">−</span>
              {f.t}
            </summary>
            <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">{f.j}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
