import Link from "next/link";
import { db } from "@/lib/db";
import { wajibAdmin } from "@/lib/auth";
import EmptyState from "@/components/EmptyState";
import StatCard from "@/components/StatCard";
import { formatJam, formatTanggal, hariIniISO } from "@/lib/utils";
import type { Room } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Daftar Hadir" };

interface BarisHadir {
  id: number;
  nama_peserta: string;
  metode: string;
  checkin_at: string;
  checkout_at: string | null;
  tanggal: string;
  nomor: string;
  nama_kelompok: string;
  asal_instansi: string;
  nama_ruangan: string;
  kode_ruangan: string;
}

/** Modul Daftar Hadir — Bab 35 dokumen analisis. */
export default async function HalamanKehadiranAdmin({
  searchParams,
}: {
  searchParams: Promise<{ tanggal?: string; ruangan?: string; q?: string }>;
}) {
  const query = await searchParams;
  await wajibAdmin();

  const tanggal = query.tanggal || hariIniISO();
  const ruanganId = query.ruangan ? Number(query.ruangan) : 0;
  const q = (query.q ?? "").trim().toLowerCase();

  const ruangan = await db.prepare(`SELECT * FROM rooms ORDER BY kode`).all() as Room[];

  let baris = await db
    .prepare(
      `SELECT t.id, t.nama_peserta, t.metode, t.checkin_at, t.checkout_at,
              s.tanggal, a.nomor, a.nama_kelompok, a.asal_instansi,
              r.nama AS nama_ruangan, r.kode AS kode_ruangan
         FROM attendance t
         JOIN visit_schedules s ON s.id = t.schedule_id
         JOIN visit_applications a ON a.id = t.application_id
         JOIN rooms r ON r.id = t.room_id
        WHERE s.tanggal = ? AND (? = 0 OR t.room_id = ?)
        ORDER BY t.checkin_at DESC`
    )
    .all(tanggal, ruanganId, ruanganId) as BarisHadir[];

  if (q) {
    baris = baris.filter(
      (b) =>
        b.nama_peserta.toLowerCase().includes(q) ||
        b.nama_kelompok.toLowerCase().includes(q) ||
        b.nomor.toLowerCase().includes(q)
    );
  }

  const sudahKeluar = baris.filter((b) => b.checkout_at).length;
  const kelompokUnik = new Set(baris.map((b) => b.nomor)).size;
  const ruanganUnik = new Set(baris.map((b) => b.kode_ruangan)).size;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Daftar Hadir</h1>
        <p className="mt-1 text-sm text-slate-600">
          Rekap kehadiran berdasarkan tanggal, kunjungan, kelompok, peserta, dan ruangan.
        </p>
      </header>

      <form method="get" className="card-pad flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="tanggal">Tanggal</label>
          <input id="tanggal" name="tanggal" type="date" className="input" defaultValue={tanggal} />
        </div>
        <div>
          <label className="label" htmlFor="ruangan">Ruangan</label>
          <select id="ruangan" name="ruangan" className="input" defaultValue={String(ruanganId)}>
            <option value="0">Semua ruangan</option>
            {ruangan.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nama} ({r.kode})
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="label" htmlFor="q">Cari</label>
          <input
            id="q"
            name="q"
            className="input"
            defaultValue={query.q ?? ""}
            placeholder="Nama peserta / kelompok / nomor kunjungan"
          />
        </div>
        <button type="submit" className="btn-primary">Terapkan</button>
      </form>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total Check-in" value={baris.length} tone="brand" />
        <StatCard label="Sudah Check-out" value={sudahKeluar} />
        <StatCard label="Kelompok" value={kelompokUnik} tone="violet" />
        <StatCard label="Ruangan Digunakan" value={ruanganUnik} tone="sky" />
      </div>

      {baris.length === 0 ? (
        <EmptyState
          judul="Belum ada kehadiran"
          pesan={`Tidak ada catatan check-in pada ${formatTanggal(tanggal)} untuk filter yang dipilih.`}
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Nama Peserta</th>
                <th>Kelompok</th>
                <th>Ruangan</th>
                <th>Metode</th>
                <th>Check-in</th>
                <th>Check-out</th>
              </tr>
            </thead>
            <tbody>
              {baris.map((b) => (
                <tr key={b.id}>
                  <td className="font-medium text-slate-900">{b.nama_peserta}</td>
                  <td>
                    {b.nama_kelompok}
                    <span className="block text-xs text-slate-500">
                      {b.asal_instansi} · <span className="font-mono">{b.nomor}</span>
                    </span>
                  </td>
                  <td>
                    {b.nama_ruangan}
                    <span className="block text-xs text-slate-500">{b.kode_ruangan}</span>
                  </td>
                  <td className="text-xs text-slate-500">
                    {b.metode === "PILIH_NAMA"
                      ? "Pilih nama"
                      : b.metode === "QR"
                      ? "QR Code"
                      : "Kode kunjungan"}
                  </td>
                  <td className="whitespace-nowrap">{formatJam(b.checkin_at.slice(11, 16))}</td>
                  <td className="whitespace-nowrap">
                    {b.checkout_at ? (
                      formatJam(b.checkout_at.slice(11, 16))
                    ) : (
                      <span className="text-slate-400">belum</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="hint">
        Rekap lengkap per periode tersedia pada halaman{" "}
        <Link href="/admin/laporan" className="font-semibold text-brand-700 hover:underline">
          Laporan &amp; Rekap
        </Link>
        .
      </p>
    </div>
  );
}
