import Link from "next/link";
import { db } from "@/lib/db";
import { wajibPemohon } from "@/lib/auth";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import {
  LABEL_STATUS_PERMOHONAN,
  formatTanggal,
  formatTanggalWaktu,
  rentangWaktu,
  warnaStatusPermohonan,
} from "@/lib/utils";
import type { VisitApplication } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

/** Dashboard pemohon — Bab 23 dokumen analisis. */
export default function DashboardPemohon() {
  const user = wajibPemohon();

  const permohonan = db
    .prepare(`SELECT * FROM visit_applications WHERE user_id = ? ORDER BY created_at DESC`)
    .all(user.id) as VisitApplication[];

  const hitung = (daftar: string[]) =>
    permohonan.filter((p) => daftar.includes(p.status)).length;

  const jadwalMendatang = db
    .prepare(
      `SELECT s.tanggal, s.waktu_mulai, s.waktu_selesai, s.status,
              a.nomor, a.nama_kelompok, r.nama AS nama_ruangan, r.lokasi
         FROM visit_schedules s
         JOIN visit_applications a ON a.id = s.application_id
         JOIN rooms r ON r.id = s.room_id
        WHERE a.user_id = ? AND s.tanggal >= date('now') AND s.status != 'DIBATALKAN'
        ORDER BY s.tanggal, s.waktu_mulai LIMIT 5`
    )
    .all(user.id) as {
    tanggal: string;
    waktu_mulai: string;
    waktu_selesai: string;
    status: string;
    nomor: string;
    nama_kelompok: string;
    nama_ruangan: string;
    lokasi: string | null;
  }[];

  const kehadiranTerakhir = db
    .prepare(
      `SELECT t.nama_peserta, t.checkin_at, r.nama AS nama_ruangan, a.nomor
         FROM attendance t
         JOIN visit_applications a ON a.id = t.application_id
         JOIN rooms r ON r.id = t.room_id
        WHERE a.user_id = ? ORDER BY t.checkin_at DESC LIMIT 5`
    )
    .all(user.id) as {
    nama_peserta: string;
    checkin_at: string;
    nama_ruangan: string;
    nomor: string;
  }[];

  const totalPeserta = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM visitors v
           JOIN visit_applications a ON a.id = v.application_id
          WHERE a.user_id = ?`
      )
      .get(user.id) as { n: number }
  ).n;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Selamat datang, {user.nama}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {user.instansi ?? "Pemohon kunjungan studi"} · {user.email}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Permohonan" value={permohonan.length} href="/kunjungan" />
        <StatCard
          label="Menunggu Verifikasi"
          value={hitung(["DIAJUKAN", "DALAM_VERIFIKASI"])}
          tone="amber"
          href="/kunjungan"
        />
        <StatCard
          label="Sudah Dijadwalkan"
          value={hitung(["DITERIMA", "DIJADWALKAN", "BERLANGSUNG"])}
          tone="brand"
          href="/jadwal"
        />
        <StatCard label="Total Peserta Terdaftar" value={totalPeserta} href="/peserta" />
      </section>

      {/* ---- Jadwal mendatang ---- */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">Jadwal Kunjungan Mendatang</h2>
          <Link href="/jadwal" className="text-sm font-semibold text-brand-700 hover:underline">
            Lihat semua
          </Link>
        </div>

        {jadwalMendatang.length === 0 ? (
          <EmptyState
            judul="Belum ada jadwal kunjungan"
            pesan="Jadwal akan muncul di sini setelah permohonan Anda diverifikasi dan dijadwalkan oleh admin Balai."
            aksi={<Link href="/kunjungan/baru" className="btn-primary">Ajukan Kunjungan</Link>}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {jadwalMendatang.map((j, i) => (
              <div key={i} className="card-pad">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-slate-500">{j.nomor}</p>
                    <p className="mt-0.5 font-bold text-slate-900">{j.nama_kelompok}</p>
                  </div>
                  <span className={j.status === "BERLANGSUNG" ? "badge-purple" : "badge-blue"}>
                    {j.status === "BERLANGSUNG" ? "Berlangsung" : "Terjadwal"}
                  </span>
                </div>
                <dl className="mt-4 space-y-1.5 text-sm">
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 text-slate-500">Tanggal</dt>
                    <dd className="font-medium text-slate-800">{formatTanggal(j.tanggal)}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 text-slate-500">Waktu</dt>
                    <dd className="text-slate-700">
                      {rentangWaktu(j.waktu_mulai, j.waktu_selesai)}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 text-slate-500">Ruangan</dt>
                    <dd className="text-slate-700">
                      {j.nama_ruangan}
                      {j.lokasi ? ` · ${j.lokasi}` : ""}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---- Permohonan terakhir ---- */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">Permohonan Terakhir</h2>
          <Link href="/kunjungan/baru" className="btn-primary btn-sm">+ Ajukan Kunjungan</Link>
        </div>

        {permohonan.length === 0 ? (
          <EmptyState
            judul="Belum ada permohonan"
            pesan="Mulai dengan mengajukan permohonan kunjungan studi."
            aksi={<Link href="/kunjungan/baru" className="btn-primary">Ajukan Sekarang</Link>}
          />
        ) : (
          <div className="card overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Nomor</th>
                  <th>Kelompok</th>
                  <th>Tanggal Usulan</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {permohonan.slice(0, 5).map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap font-mono text-xs">{p.nomor}</td>
                    <td className="font-medium text-slate-900">{p.nama_kelompok}</td>
                    <td className="whitespace-nowrap">{formatTanggal(p.tanggal_usulan)}</td>
                    <td>
                      <span className={warnaStatusPermohonan(p.status)}>
                        {LABEL_STATUS_PERMOHONAN[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/kunjungan/${p.id}`}
                        className="text-sm font-semibold text-brand-700 hover:underline"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ---- Riwayat kehadiran ---- */}
      {kehadiranTerakhir.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="section-title">Daftar Hadir Terakhir</h2>
            <Link href="/kehadiran" className="text-sm font-semibold text-brand-700 hover:underline">
              Lihat semua
            </Link>
          </div>
          <div className="card divide-y divide-slate-100">
            {kehadiranTerakhir.map((k, i) => (
              <div key={i} className="flex items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{k.nama_peserta}</p>
                  <p className="text-xs text-slate-500">
                    {k.nama_ruangan} · <span className="font-mono">{k.nomor}</span>
                  </p>
                </div>
                <p className="text-xs text-slate-500">{formatTanggalWaktu(k.checkin_at)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
