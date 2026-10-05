import { db } from "@/lib/db";
import { wajibAdmin } from "@/lib/auth";
import StatCard from "@/components/StatCard";
import { formatTanggal } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Laporan & Rekap" };

/** Laporan & Rekap — Bab 37 dokumen analisis. */
export default function HalamanLaporan({
  searchParams,
}: {
  searchParams: { dari?: string; sampai?: string };
}) {
  wajibAdmin();

  const tahunIni = new Date().getFullYear();
  const dari = searchParams.dari || `${tahunIni}-01-01`;
  const sampai = searchParams.sampai || `${tahunIni}-12-31`;

  const satu = <T,>(sql: string, ...p: unknown[]) => db.prepare(sql).get(...p) as T;
  const banyak = <T,>(sql: string, ...p: unknown[]) => db.prepare(sql).all(...p) as T[];

  const ringkas = satu<{
    jumlah_kunjungan: number;
    total_peserta: number;
  }>(
    `SELECT COUNT(*) AS jumlah_kunjungan,
            COALESCE(SUM(a.jumlah_peserta), 0) AS total_peserta
       FROM visit_schedules s JOIN visit_applications a ON a.id = s.application_id
      WHERE s.tanggal BETWEEN ? AND ? AND s.status != 'DIBATALKAN'`,
    dari,
    sampai
  );

  const totalHadir = satu<{ n: number }>(
    `SELECT COUNT(*) AS n FROM attendance t JOIN visit_schedules s ON s.id = t.schedule_id
      WHERE s.tanggal BETWEEN ? AND ?`,
    dari,
    sampai
  ).n;

  const totalPengaduan = satu<{ n: number }>(
    `SELECT COUNT(*) AS n FROM facility_reports WHERE date(created_at) BETWEEN ? AND ?`,
    dari,
    sampai
  ).n;

  const perInstansi = banyak<{
    asal_instansi: string;
    jenis_instansi: string | null;
    jumlah: number;
    peserta: number;
  }>(
    `SELECT a.asal_instansi, a.jenis_instansi, COUNT(DISTINCT s.id) AS jumlah,
            SUM(a.jumlah_peserta) AS peserta
       FROM visit_schedules s JOIN visit_applications a ON a.id = s.application_id
      WHERE s.tanggal BETWEEN ? AND ? AND s.status != 'DIBATALKAN'
      GROUP BY a.asal_instansi ORDER BY jumlah DESC, peserta DESC`,
    dari,
    sampai
  );

  const perRuangan = banyak<{
    nama: string;
    kode: string;
    kapasitas: number;
    jumlah_jadwal: number;
    jumlah_hadir: number;
    jumlah_pengaduan: number;
  }>(
    `SELECT r.nama, r.kode, r.kapasitas,
            (SELECT COUNT(*) FROM visit_schedules s
              WHERE s.room_id = r.id AND s.tanggal BETWEEN ? AND ? AND s.status != 'DIBATALKAN') AS jumlah_jadwal,
            (SELECT COUNT(*) FROM attendance t JOIN visit_schedules s2 ON s2.id = t.schedule_id
              WHERE t.room_id = r.id AND s2.tanggal BETWEEN ? AND ?) AS jumlah_hadir,
            (SELECT COUNT(*) FROM facility_reports f
              WHERE f.room_id = r.id AND date(f.created_at) BETWEEN ? AND ?) AS jumlah_pengaduan
       FROM rooms r ORDER BY jumlah_jadwal DESC, r.kode`,
    dari, sampai, dari, sampai, dari, sampai
  );

  const perBulan = banyak<{ bulan: string; jumlah: number }>(
    `SELECT substr(s.tanggal, 1, 7) AS bulan, COUNT(*) AS jumlah
       FROM visit_schedules s
      WHERE s.tanggal BETWEEN ? AND ? AND s.status != 'DIBATALKAN'
      GROUP BY bulan ORDER BY bulan`,
    dari,
    sampai
  );

  const pengaduanStatus = banyak<{ status: string; jumlah: number }>(
    `SELECT status, COUNT(*) AS jumlah FROM facility_reports
      WHERE date(created_at) BETWEEN ? AND ? GROUP BY status ORDER BY jumlah DESC`,
    dari,
    sampai
  );

  const pengaduanKategori = banyak<{ kategori: string; jumlah: number }>(
    `SELECT kategori, COUNT(*) AS jumlah FROM facility_reports
      WHERE date(created_at) BETWEEN ? AND ? GROUP BY kategori ORDER BY jumlah DESC`,
    dari,
    sampai
  );

  const maxBulan = Math.max(1, ...perBulan.map((b) => b.jumlah));

  return (
    <div className="space-y-8">
      <header className="no-print">
        <h1 className="text-2xl font-bold text-slate-900">Laporan &amp; Rekap</h1>
        <p className="mt-1 text-sm text-slate-600">
          Rekap kunjungan, asal instansi, penggunaan ruangan, kehadiran, dan pengaduan fasilitas.
        </p>
      </header>

      <form method="get" className="card-pad no-print flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="dari">Periode dari</label>
          <input id="dari" name="dari" type="date" className="input" defaultValue={dari} />
        </div>
        <div>
          <label className="label" htmlFor="sampai">Sampai</label>
          <input id="sampai" name="sampai" type="date" className="input" defaultValue={sampai} />
        </div>
        <button type="submit" className="btn-primary">Terapkan</button>
      </form>

      <p className="text-sm text-slate-600">
        Periode laporan: <strong>{formatTanggal(dari)}</strong> sampai{" "}
        <strong>{formatTanggal(sampai)}</strong>
      </p>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Jumlah Kunjungan" value={ringkas.jumlah_kunjungan} tone="brand" />
        <StatCard label="Peserta Direncanakan" value={ringkas.total_peserta} />
        <StatCard label="Check-in Tercatat" value={totalHadir} tone="violet" />
        <StatCard label="Pengaduan Fasilitas" value={totalPengaduan} tone="rose" />
      </section>

      {/* ---- Kunjungan per bulan ---- */}
      <section className="card-pad">
        <h2 className="section-title">Kunjungan per Bulan</h2>
        {perBulan.length === 0 ? (
          <p className="hint mt-3">Belum ada data pada periode ini.</p>
        ) : (
          <div className="mt-5 space-y-3">
            {perBulan.map((b) => (
              <div key={b.bulan} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs font-medium text-slate-600">{b.bulan}</span>
                <div className="h-6 flex-1 overflow-hidden rounded-md bg-slate-100">
                  <div
                    className="h-full rounded-md bg-brand-500"
                    style={{ width: `${(b.jumlah / maxBulan) * 100}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-sm font-bold text-slate-800">
                  {b.jumlah}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---- Asal instansi ---- */}
      <section className="card">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="section-title">Rekap Asal Instansi</h2>
        </div>
        {perInstansi.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">Belum ada data.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Asal Instansi</th>
                  <th>Jenis</th>
                  <th>Jumlah Kunjungan</th>
                  <th>Total Peserta</th>
                </tr>
              </thead>
              <tbody>
                {perInstansi.map((i) => (
                  <tr key={i.asal_instansi}>
                    <td className="font-medium text-slate-900">{i.asal_instansi}</td>
                    <td>{i.jenis_instansi ?? "-"}</td>
                    <td>{i.jumlah}</td>
                    <td>{i.peserta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ---- Penggunaan ruangan ---- */}
      <section className="card">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="section-title">Tingkat Penggunaan Ruangan</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Ruangan</th>
                <th>Kapasitas</th>
                <th>Jumlah Penggunaan</th>
                <th>Check-in Tercatat</th>
                <th>Pengaduan</th>
              </tr>
            </thead>
            <tbody>
              {perRuangan.map((r) => (
                <tr key={r.kode}>
                  <td className="font-medium text-slate-900">
                    {r.nama}
                    <span className="block font-mono text-xs text-slate-500">{r.kode}</span>
                  </td>
                  <td>{r.kapasitas}</td>
                  <td>{r.jumlah_jadwal}</td>
                  <td>{r.jumlah_hadir}</td>
                  <td className={r.jumlah_pengaduan > 0 ? "font-semibold text-rose-600" : ""}>
                    {r.jumlah_pengaduan}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---- Pengaduan ---- */}
      <div className="grid gap-6 md:grid-cols-2">
        <section className="card">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="section-title">Pengaduan per Status</h2>
          </div>
          {pengaduanStatus.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">Belum ada pengaduan.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th className="text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {pengaduanStatus.map((s) => (
                  <tr key={s.status}>
                    <td className="font-medium text-slate-900">{s.status}</td>
                    <td className="text-right">{s.jumlah}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="section-title">Pengaduan per Kategori Fasilitas</h2>
          </div>
          {pengaduanKategori.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">Belum ada pengaduan.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Kategori</th>
                  <th className="text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {pengaduanKategori.map((k) => (
                  <tr key={k.kategori}>
                    <td className="font-medium text-slate-900">{k.kategori}</td>
                    <td className="text-right">{k.jumlah}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <p className="hint no-print">
        Export Excel/PDF termasuk pengembangan lanjutan (Bab 37). Sementara ini laporan dapat
        dicetak melalui fitur cetak peramban (Ctrl/Cmd + P).
      </p>
    </div>
  );
}
