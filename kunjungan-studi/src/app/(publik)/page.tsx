import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatTanggal, rentangWaktu } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface BarisJadwal {
  tanggal: string;
  waktu_mulai: string;
  waktu_selesai: string;
  nama_kelompok: string;
  nama_ruangan: string;
  status: string;
}

/** Halaman Informasi Kunjungan Studi — Bab 7 dokumen analisis. */
export default async function HalamanInformasi() {
  const jadwal = await db
    .prepare(
      `SELECT s.tanggal, s.waktu_mulai, s.waktu_selesai, s.status,
              a.nama_kelompok, r.nama AS nama_ruangan
         FROM visit_schedules s
         JOIN visit_applications a ON a.id = s.application_id
         JOIN rooms r ON r.id = s.room_id
        WHERE s.status IN ('TERJADWAL','BERLANGSUNG')
          AND s.tanggal >= date('now')
        ORDER BY s.tanggal, s.waktu_mulai
        LIMIT 6`
    )
    .all() as BarisJadwal[];

  const jumlahRuangan = (
    await db.prepare(`SELECT COUNT(*) AS n FROM rooms WHERE status = 'TERSEDIA'`).get() as { n: number }
  ).n;

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(560px circle at 88% -10%, rgba(224,158,31,0.35), transparent 60%)",
          }}
          aria-hidden
        />
        <Image
          src="/logo.png"
          alt=""
          width={640}
          height={640}
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -right-16 h-[30rem] w-[30rem] rotate-12 select-none rounded-full object-cover opacity-[0.09] mix-blend-luminosity"
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div>
            <span className="inline-flex rounded-full bg-gold-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold-300 ring-1 ring-gold-400/30">
              Layanan Kunjungan Studi
            </span>
            <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl">
              Ajukan Kunjungan Studi Kelompok ke Balai Layanan Perpustakaan DPAD DIY
            </h1>
            <p className="mt-4 max-w-xl text-brand-200">
              Satu sistem untuk seluruh proses: pendaftaran kelompok, verifikasi admin,
              penjadwalan dan pembagian ruangan, daftar hadir digital di setiap ruangan,
              hingga pengaduan fasilitas melalui QR Code.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="btn-gold px-5 py-2.5">
                Daftar &amp; Ajukan Kunjungan
              </Link>
              <Link href="/alur" className="btn border border-white/25 bg-white/5 px-5 py-2.5 text-white shadow-none hover:bg-white/10">
                Lihat Alur Pendaftaran
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-gold-300">
              Tujuan Kunjungan Studi
            </p>
            <ul className="mt-4 space-y-3 text-sm text-brand-50">
              {[
                "Mengenalkan layanan dan koleksi perpustakaan kepada kelompok pelajar, mahasiswa, dan instansi.",
                "Memberikan edukasi literasi informasi dan cara penelusuran koleksi.",
                "Memperkenalkan fasilitas ruang baca, multimedia, dan layanan pendukung lainnya.",
                "Mendorong budaya baca melalui kegiatan kunjungan terstruktur.",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-0.5 text-gold-400">✓</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- Persyaratan & ketentuan ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-bold text-slate-900">Persyaratan &amp; Ketentuan Kelompok</h2>
        <p className="mt-2 max-w-3xl text-slate-600">
          Ketentuan berikut merupakan gambaran umum layanan. Detail akhir seperti kapasitas
          Jam layanan Grhatama Pustaka dan kanal kontak resmi Balai tersedia di bawah.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            {
              icon: "👥",
              judul: "Ketentuan Kelompok",
              butir: [
                "Kunjungan diajukan secara berkelompok/rombongan.",
                "Wajib mencantumkan penanggung jawab atau pendamping.",
                "Jumlah peserta menyesuaikan kapasitas ruangan yang tersedia.",
                "Daftar peserta dilengkapi sebelum jadwal ditetapkan.",
              ],
            },
            {
              icon: "📄",
              judul: "Dokumen Pendukung",
              butir: [
                "Surat permohonan kunjungan dari instansi.",
                "Surat tugas atau surat pengantar bila diperlukan.",
                "Dokumen lain sesuai permintaan Balai.",
                "Status wajib/tidaknya dokumen dikonfirmasi oleh Balai.",
              ],
            },
            {
              icon: "🕘",
              judul: "Jadwal Layanan",
              butir: [
                "Senin: 08.00–15.30; istirahat 11.30–12.30.",
                "Selasa–Kamis: 08.00–15.30 tanpa istirahat.",
                "Jumat: 09.00–15.30; istirahat 11.00–13.00.",
                "Sabtu: 08.00–15.30; istirahat 11.30–12.30. Minggu tutup.",
                "Layanan yang buka: Layanan Informasi dan Aduan Masyarakat.",
                "Pengajuan disarankan minimal 7 hari sebelum tanggal kunjungan.",
                "Jadwal final ditetapkan admin setelah verifikasi.",
                "Satu ruangan tidak digunakan dua kelompok pada waktu bersamaan.",
              ],
            },
          ].map((k) => (
            <div key={k.judul} className="card-pad card-hover">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-xl">
                {k.icon}
              </span>
              <h3 className="mt-3 text-base font-bold text-slate-900">{k.judul}</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {k.butir.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Kontak & media sosial ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card-pad">
            <h2 className="text-xl font-bold text-slate-900">Kontak</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <span className="block font-semibold text-slate-700">Kirim pesan di WhatsApp</span>
                <a className="text-brand-700 hover:underline" href="https://wa.me/628812658192" target="_blank" rel="noreferrer">0881-2658-192</a>
              </li>
              <li><span className="block font-semibold text-slate-700">Telepon</span><span className="text-slate-600">Nomor telepon tidak tercantum.</span></li>
              <li>
                <span className="block font-semibold text-slate-700">Email</span>
                <a className="text-brand-700 hover:underline" href="mailto:balaiyanpus@jogjaprov.go.id">balaiyanpus@jogjaprov.go.id</a>
              </li>
            </ul>
          </div>
          <div className="card-pad">
            <h2 className="text-xl font-bold text-slate-900">Ikuti Kami di Media Sosial</h2>
            <ul className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              {[
                ["Instagram", "balaiyanpus.dpaddiy", "https://www.instagram.com/balaiyanpus.dpaddiy/"],
                ["Facebook", "balaiyanpus.dpaddiy", "https://www.facebook.com/balaiyanpus.dpaddiy/"],
                ["X", "balaiyanpus_diy", "https://x.com/balaiyanpus_diy"],
                ["TikTok", "balai_yanpus", "https://www.tiktok.com/@balai_yanpus"],
                ["YouTube", "Balai Yanpus DPAD DIY", "https://www.youtube.com/results?search_query=Balai+Yanpus+DPAD+DIY"],
                ["Website", "balaiyanpus.jogjaprov.go.id", "https://balaiyanpus.jogjaprov.go.id/"],
              ].map(([kanal, nama, url]) => (
                <li key={kanal}>
                  <a className="block rounded-lg border border-slate-200 p-3 hover:border-brand-400 hover:bg-brand-50" href={url} target="_blank" rel="noreferrer">
                    <span className="block font-semibold text-slate-700">{kanal}</span>
                    <span className="text-brand-700">{nama}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- Jadwal terdekat ---------- */}
      <section className="border-y border-slate-200 bg-white/80">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Jadwal Kunjungan Terdekat</h2>
              <p className="mt-1 text-slate-600">
                Daftar kunjungan yang telah dijadwalkan oleh admin Balai.
              </p>
            </div>
            <Link href="/ruangan" className="btn-secondary btn-sm">
              {jumlahRuangan} ruangan tersedia →
            </Link>
          </div>

          <div className="card mt-6 overflow-x-auto">
            {jadwal.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-slate-500">
                Belum ada jadwal kunjungan yang ditetapkan untuk saat ini.
              </p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Waktu</th>
                    <th>Kelompok</th>
                    <th>Ruangan</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {jadwal.map((j, i) => (
                    <tr key={i}>
                      <td className="whitespace-nowrap font-medium text-slate-900">
                        {formatTanggal(j.tanggal)}
                      </td>
                      <td className="whitespace-nowrap">
                        {rentangWaktu(j.waktu_mulai, j.waktu_selesai)}
                      </td>
                      <td>{j.nama_kelompok}</td>
                      <td>{j.nama_ruangan}</td>
                      <td>
                        <span className={j.status === "BERLANGSUNG" ? "badge-purple" : "badge-blue"}>
                          {j.status === "BERLANGSUNG" ? "Berlangsung" : "Terjadwal"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      {/* ---------- Fitur ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-bold text-slate-900">Yang Bisa Anda Lakukan di Sistem Ini</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: "📋", judul: "Pendaftaran Online", teks: "Ajukan kunjungan studi beserta data kelompok dan peserta." },
            { icon: "📅", judul: "Pantau Status & Jadwal", teks: "Lihat status verifikasi, tanggal kunjungan, dan pembagian ruangan." },
            { icon: "🕘", judul: "Daftar Hadir Digital", teks: "Peserta melakukan check-in di setiap ruangan yang dikunjungi." },
            { icon: "⚠️", judul: "Pengaduan via QR Code", teks: "Pindai QR Code di ruangan untuk melaporkan kendala fasilitas." },
          ].map((f) => (
            <div key={f.judul} className="card-pad card-hover">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-50 text-xl">
                {f.icon}
              </span>
              <h3 className="mt-3 text-sm font-bold text-slate-900">{f.judul}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{f.teks}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
