import Link from "next/link";
import { db } from "@/lib/db";
import { wajibAdmin } from "@/lib/auth";
import StatCard from "@/components/StatCard";
import {
  LABEL_STATUS_PERMOHONAN,
  LABEL_URGENSI,
  formatTanggal,
  formatTanggalWaktu,
  rentangWaktu,
  warnaStatusPermohonan,
  warnaUrgensi,
} from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard Admin" };

/** Dashboard admin — Bab 29 dokumen analisis. */
export default function DashboardAdmin() {
  const admin = wajibAdmin();
  const n = (sql: string) => (db.prepare(sql).get() as { n: number }).n;

  const permohonanBaru = n(
    `SELECT COUNT(*) AS n FROM visit_applications WHERE status = 'DIAJUKAN'`
  );
  const dalamVerifikasi = n(
    `SELECT COUNT(*) AS n FROM visit_applications WHERE status = 'DALAM_VERIFIKASI'`
  );
  const diterima = n(
    `SELECT COUNT(*) AS n FROM visit_applications WHERE status IN ('DITERIMA','DIJADWALKAN')`
  );
  const ditolak = n(`SELECT COUNT(*) AS n FROM visit_applications WHERE status = 'DITOLAK'`);

  const kunjunganHariIni = n(
    `SELECT COUNT(*) AS n FROM visit_schedules WHERE tanggal = date('now') AND status != 'DIBATALKAN'`
  );
  const kunjunganMendatang = n(
    `SELECT COUNT(*) AS n FROM visit_schedules WHERE tanggal > date('now') AND status != 'DIBATALKAN'`
  );
  const pengunjungHariIni = n(
    `SELECT COUNT(*) AS n FROM attendance WHERE date(checkin_at) = date('now')`
  );
  const ruanganTerpakaiHariIni = n(
    `SELECT COUNT(DISTINCT room_id) AS n FROM visit_schedules
      WHERE tanggal = date('now') AND status != 'DIBATALKAN'`
  );

  const pengaduanBaru = n(
    `SELECT COUNT(*) AS n FROM facility_reports WHERE status = 'DIAJUKAN'`
  );
  const pengaduanProses = n(
    `SELECT COUNT(*) AS n FROM facility_reports WHERE status IN ('DIVERIFIKASI','DITINDAKLANJUTI')`
  );
  const pengaduanSelesai = n(
    `SELECT COUNT(*) AS n FROM facility_reports WHERE status = 'SELESAI'`
  );

  const antrianVerifikasi = db
    .prepare(
      `SELECT id, nomor, nama_kelompok, asal_instansi, jumlah_peserta,
              tanggal_usulan, status, created_at
         FROM visit_applications
        WHERE status IN ('DIAJUKAN','DALAM_VERIFIKASI')
        ORDER BY created_at LIMIT 6`
    )
    .all() as {
    id: number;
    nomor: string;
    nama_kelompok: string;
    asal_instansi: string;
    jumlah_peserta: number;
    tanggal_usulan: string;
    status: string;
    created_at: string;
  }[];

  const agendaHariIni = db
    .prepare(
      `SELECT s.id, s.waktu_mulai, s.waktu_selesai, s.status,
              a.nomor, a.nama_kelompok, a.jumlah_peserta, r.nama AS nama_ruangan,
              (SELECT COUNT(*) FROM attendance t WHERE t.schedule_id = s.id) AS hadir
         FROM visit_schedules s
         JOIN visit_applications a ON a.id = s.application_id
         JOIN rooms r ON r.id = s.room_id
        WHERE s.tanggal = date('now') AND s.status != 'DIBATALKAN'
        ORDER BY s.waktu_mulai`
    )
    .all() as {
    id: number;
    waktu_mulai: string;
    waktu_selesai: string;
    status: string;
    nomor: string;
    nama_kelompok: string;
    jumlah_peserta: number;
    nama_ruangan: string;
    hadir: number;
  }[];

  const pengaduanTerbaru = db
    .prepare(
      `SELECT f.id, f.nomor, f.kategori, f.urgensi, f.status, f.created_at,
              r.nama AS nama_ruangan
         FROM facility_reports f JOIN rooms r ON r.id = f.room_id
        WHERE f.status NOT IN ('SELESAI','DITOLAK','TIDAK_VALID')
        ORDER BY f.created_at DESC LIMIT 6`
    )
    .all() as {
    id: number;
    nomor: string;
    kategori: string;
    urgensi: string;
    status: string;
    created_at: string;
    nama_ruangan: string;
  }[];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Admin</h1>
        <p className="mt-1 text-sm text-slate-600">
          Ringkasan permohonan, kunjungan, kehadiran, dan pengaduan fasilitas. Masuk sebagai{" "}
          {admin.nama}.
        </p>
      </header>

      <section>
        <h2 className="section-title mb-3">Permohonan</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Permohonan Baru" value={permohonanBaru} tone="sky" href="/admin/permohonan?status=DIAJUKAN" />
          <StatCard label="Dalam Verifikasi" value={dalamVerifikasi} tone="amber" href="/admin/permohonan?status=DALAM_VERIFIKASI" />
          <StatCard label="Diterima / Dijadwalkan" value={diterima} tone="brand" href="/admin/permohonan?status=DIJADWALKAN" />
          <StatCard label="Ditolak" value={ditolak} tone="rose" href="/admin/permohonan?status=DITOLAK" />
        </div>
      </section>

      <section>
        <h2 className="section-title mb-3">Kunjungan &amp; Kehadiran</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Kunjungan Hari Ini" value={kunjunganHariIni} tone="brand" href="/admin/jadwal" />
          <StatCard label="Kunjungan Mendatang" value={kunjunganMendatang} href="/admin/jadwal" />
          <StatCard label="Pengunjung Check-in Hari Ini" value={pengunjungHariIni} tone="violet" href="/admin/kehadiran" />
          <StatCard label="Ruangan Terpakai Hari Ini" value={ruanganTerpakaiHariIni} href="/admin/ruangan" />
        </div>
      </section>

      <section>
        <h2 className="section-title mb-3">Pengaduan Fasilitas</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Pengaduan Baru" value={pengaduanBaru} tone="rose" href="/admin/pengaduan?status=DIAJUKAN" />
          <StatCard label="Dalam Proses" value={pengaduanProses} tone="amber" href="/admin/pengaduan?status=DITINDAKLANJUTI" />
          <StatCard label="Selesai" value={pengaduanSelesai} tone="brand" href="/admin/pengaduan?status=SELESAI" />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---- Antrian verifikasi ---- */}
        <section className="card">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="section-title">Antrian Verifikasi</h2>
            <Link href="/admin/permohonan" className="text-sm font-semibold text-brand-700 hover:underline">
              Lihat semua
            </Link>
          </div>
          {antrianVerifikasi.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500">
              Tidak ada permohonan yang menunggu verifikasi.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {antrianVerifikasi.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/permohonan/${p.id}`}
                    className="flex items-start justify-between gap-3 px-5 py-3 transition hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-slate-500">{p.nomor}</p>
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {p.nama_kelompok}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {p.asal_instansi} · {p.jumlah_peserta} peserta · usulan{" "}
                        {formatTanggal(p.tanggal_usulan)}
                      </p>
                    </div>
                    <span className={warnaStatusPermohonan(p.status)}>
                      {LABEL_STATUS_PERMOHONAN[p.status as never] ?? p.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ---- Agenda hari ini ---- */}
        <section className="card">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="section-title">Agenda Hari Ini</h2>
            <Link href="/admin/jadwal" className="text-sm font-semibold text-brand-700 hover:underline">
              Kelola jadwal
            </Link>
          </div>
          {agendaHariIni.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500">
              Tidak ada kunjungan terjadwal hari ini.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {agendaHariIni.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{a.nama_kelompok}</p>
                    <p className="truncate text-xs text-slate-500">
                      {rentangWaktu(a.waktu_mulai, a.waktu_selesai)} · {a.nama_ruangan} ·{" "}
                      <span className="font-mono">{a.nomor}</span>
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-xs font-semibold text-brand-700">
                    {a.hadir}/{a.jumlah_peserta} hadir
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ---- Pengaduan terbaru ---- */}
      <section className="card">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="section-title">Pengaduan Perlu Ditangani</h2>
          <Link href="/admin/pengaduan" className="text-sm font-semibold text-brand-700 hover:underline">
            Lihat semua
          </Link>
        </div>
        {pengaduanTerbaru.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            Tidak ada pengaduan yang perlu ditangani.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Nomor</th>
                  <th>Ruangan</th>
                  <th>Kategori</th>
                  <th>Urgensi</th>
                  <th>Waktu</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pengaduanTerbaru.map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap font-mono text-xs">{p.nomor}</td>
                    <td className="font-medium text-slate-900">{p.nama_ruangan}</td>
                    <td>{p.kategori}</td>
                    <td>
                      <span className={warnaUrgensi(p.urgensi)}>
                        {LABEL_URGENSI[p.urgensi as never] ?? p.urgensi}
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-xs text-slate-500">
                      {formatTanggalWaktu(p.created_at)}
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/admin/pengaduan/${p.id}`}
                        className="text-sm font-semibold text-brand-700 hover:underline"
                      >
                        Tindak lanjut
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
