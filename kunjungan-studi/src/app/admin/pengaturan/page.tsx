import { db } from "@/lib/db";
import { wajibAdmin } from "@/lib/auth";
import { formatTanggalWaktu } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pengaturan" };

/**
 * Halaman Pengaturan — Bab 30.
 * Berisi informasi sistem serta daftar hal yang menurut Bab 46 masih
 * memerlukan konfirmasi resmi dari Balai sebelum dijadikan aturan wajib.
 */
export default function HalamanPengaturan() {
  wajibAdmin();

  const hitung = (sql: string) => (db.prepare(sql).get() as { n: number }).n;

  const statistik = [
    ["Pengguna terdaftar", hitung(`SELECT COUNT(*) AS n FROM users`)],
    ["Admin", hitung(`SELECT COUNT(*) AS n FROM users WHERE role = 'ADMIN'`)],
    ["Ruangan", hitung(`SELECT COUNT(*) AS n FROM rooms`)],
    ["QR Code aktif", hitung(`SELECT COUNT(*) AS n FROM room_qr_codes WHERE aktif = 1`)],
    ["Permohonan", hitung(`SELECT COUNT(*) AS n FROM visit_applications`)],
    ["Jadwal", hitung(`SELECT COUNT(*) AS n FROM visit_schedules`)],
    ["Catatan kehadiran", hitung(`SELECT COUNT(*) AS n FROM attendance`)],
    ["Pengaduan", hitung(`SELECT COUNT(*) AS n FROM facility_reports`)],
    ["Catatan audit", hitung(`SELECT COUNT(*) AS n FROM audit_logs`)],
  ] as const;

  const pengguna = db
    .prepare(`SELECT id, nama, email, role, instansi, created_at FROM users ORDER BY role, nama`)
    .all() as {
    id: number;
    nama: string;
    email: string;
    role: string;
    instansi: string | null;
    created_at: string;
  }[];

  const perluKonfirmasi = [
    "Format final formulir pendaftaran dan daftar field wajib.",
    "Kapasitas maksimal setiap ruangan untuk kegiatan kunjungan studi.",
    "Aturan bentrokan: apakah satu ruangan boleh dipakai dua kelompok bersamaan.",
    "Mekanisme check-in/check-out peserta dan apakah check-out wajib.",
    "Apakah daftar hadir menggunakan QR Code atau metode lain.",
    "Apakah pengaduan fasilitas boleh dikirim secara anonim.",
    "Daftar kategori fasilitas resmi pada formulir pengaduan.",
    "Petugas tindak lanjut dan SLA penyelesaian pengaduan.",
    "Dokumen yang benar-benar diwajibkan pada saat pendaftaran.",
    "Kebijakan notifikasi, masa retensi, dan penghapusan data.",
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Pengaturan</h1>
        <p className="mt-1 text-sm text-slate-600">
          Informasi sistem, daftar pengguna, dan hal-hal yang masih memerlukan konfirmasi resmi
          dari Balai.
        </p>
      </header>

      <section className="card-pad">
        <h2 className="section-title">Statistik Sistem</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {statistik.map(([label, nilai]) => (
            <div key={label} className="rounded-lg bg-slate-50 px-3 py-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {label}
              </dt>
              <dd className="mt-1 text-xl font-bold text-slate-900">{nilai}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="section-title">Hak Akses Pengguna</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Instansi</th>
                <th>Peran</th>
                <th>Terdaftar</th>
              </tr>
            </thead>
            <tbody>
              {pengguna.map((u) => (
                <tr key={u.id}>
                  <td className="font-medium text-slate-900">{u.nama}</td>
                  <td>{u.email}</td>
                  <td>{u.instansi ?? "-"}</td>
                  <td>
                    <span className={u.role === "ADMIN" ? "badge-purple" : "badge-slate"}>
                      {u.role === "ADMIN" ? "Admin" : "Pemohon"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-xs text-slate-500">
                    {formatTanggalWaktu(u.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card-pad">
        <h2 className="section-title">Hal yang Masih Perlu Dikonfirmasi</h2>
        <p className="hint mt-1">
          Mengacu Bab 46 dokumen analisis — detail berikut belum boleh diasumsikan sebagai
          aturan wajib di aplikasi.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-slate-700">
          {perluKonfirmasi.map((t) => (
            <li key={t} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card-pad">
        <h2 className="section-title">Keamanan Data</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li>Password disimpan dalam bentuk hash bcrypt, tidak pernah plaintext.</li>
          <li>Sesi login menggunakan cookie httpOnly dengan masa berlaku 7 hari.</li>
          <li>Pemohon hanya dapat mengakses data kunjungan miliknya sendiri.</li>
          <li>Seluruh aktivitas penting tercatat pada Audit Log beserta pelaku dan waktunya.</li>
        </ul>
      </section>
    </div>
  );
}
