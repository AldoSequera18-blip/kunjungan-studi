import Link from "next/link";
import { db } from "@/lib/db";
import { wajibAdmin } from "@/lib/auth";
import EmptyState from "@/components/EmptyState";
import {
  LABEL_STATUS_PENGADUAN,
  LABEL_URGENSI,
  formatTanggalWaktu,
  potong,
  warnaStatusPengaduan,
  warnaUrgensi,
} from "@/lib/utils";
import { KATEGORI_FASILITAS, type Room } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pengaduan Fasilitas" };

interface BarisPengaduan {
  id: number;
  room_id: number;
  nomor: string;
  kategori: string;
  deskripsi: string;
  urgensi: string;
  status: string;
  sumber: string;
  pelapor_nama: string | null;
  anonim: number;
  petugas: string | null;
  created_at: string;
  nama_ruangan: string;
  kode_ruangan: string;
}

const STATUS_FILTER = [
  { key: "SEMUA", label: "Semua" },
  { key: "DIAJUKAN", label: "Diajukan" },
  { key: "DIVERIFIKASI", label: "Diverifikasi" },
  { key: "DITINDAKLANJUTI", label: "Ditindaklanjuti" },
  { key: "SELESAI", label: "Selesai" },
  { key: "DITOLAK", label: "Ditolak" },
];

/** Modul Pengaduan — Bab 36 dokumen analisis. */
export default async function DaftarPengaduanAdmin({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; ruangan?: string; kategori?: string }>;
}) {
  const query = await searchParams;
  await wajibAdmin();

  const status = query.status ?? "SEMUA";
  const ruanganId = query.ruangan ? Number(query.ruangan) : 0;
  const kategori = query.kategori ?? "";

  const ruangan = await db.prepare(`SELECT * FROM rooms ORDER BY kode`).all() as Room[];

  const semua = await db
    .prepare(
      `SELECT f.id, f.room_id, f.nomor, f.kategori, f.deskripsi, f.urgensi, f.status, f.sumber,
              f.pelapor_nama, f.anonim, f.petugas, f.created_at,
              r.nama AS nama_ruangan, r.kode AS kode_ruangan
         FROM facility_reports f JOIN rooms r ON r.id = f.room_id
        ORDER BY
          CASE f.urgensi WHEN 'TINGGI' THEN 1 WHEN 'SEDANG' THEN 2 ELSE 3 END,
          f.created_at DESC`
    )
    .all() as BarisPengaduan[];

  let daftar = semua;
  if (status !== "SEMUA") daftar = daftar.filter((p) => p.status === status);
  if (ruanganId) daftar = daftar.filter((p) => p.room_id === ruanganId);
  if (kategori) daftar = daftar.filter((p) => p.kategori === kategori);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Pengaduan Fasilitas</h1>
        <p className="mt-1 text-sm text-slate-600">
          Daftar pengaduan dari QR Code ruangan maupun menu pemohon, diurutkan berdasarkan
          urgensi.
        </p>
      </header>

      <nav className="flex flex-wrap gap-2">
        {STATUS_FILTER.map((f) => (
          <Link
            key={f.key}
            href={f.key === "SEMUA" ? "/admin/pengaduan" : `/admin/pengaduan?status=${f.key}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              status === f.key
                ? "bg-brand-600 text-white"
                : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            {f.label}
            <span className="ml-1.5 text-xs opacity-75">
              {f.key === "SEMUA" ? semua.length : semua.filter((p) => p.status === f.key).length}
            </span>
          </Link>
        ))}
      </nav>

      <form method="get" className="card-pad flex flex-wrap items-end gap-3">
        {status !== "SEMUA" && <input type="hidden" name="status" value={status} />}
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
        <div>
          <label className="label" htmlFor="kategori">Kategori</label>
          <select id="kategori" name="kategori" className="input" defaultValue={kategori}>
            <option value="">Semua kategori</option>
            {KATEGORI_FASILITAS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-secondary">Filter</button>
      </form>

      {daftar.length === 0 ? (
        <EmptyState judul="Tidak ada pengaduan" pesan="Tidak ada pengaduan yang sesuai filter." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Nomor</th>
                <th>Ruangan</th>
                <th>Kategori &amp; Masalah</th>
                <th>Pelapor</th>
                <th>Urgensi</th>
                <th>Status</th>
                <th>Waktu</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {daftar.map((p) => (
                <tr key={p.id}>
                  <td className="whitespace-nowrap font-mono text-xs">{p.nomor}</td>
                  <td>
                    {p.nama_ruangan}
                    <span className="block text-xs text-slate-500">{p.kode_ruangan}</span>
                  </td>
                  <td className="max-w-xs">
                    <span className="font-medium text-slate-900">{p.kategori}</span>
                    <span className="block text-xs text-slate-500">{potong(p.deskripsi, 70)}</span>
                  </td>
                  <td className="text-sm">
                    {p.anonim ? (
                      <span className="text-slate-400">Anonim</span>
                    ) : (
                      p.pelapor_nama ?? "-"
                    )}
                    <span className="block text-xs text-slate-400">
                      {p.sumber === "QR" ? "via QR Code" : "via menu"}
                    </span>
                  </td>
                  <td>
                    <span className={warnaUrgensi(p.urgensi)}>
                      {LABEL_URGENSI[p.urgensi as never] ?? p.urgensi}
                    </span>
                  </td>
                  <td>
                    <span className={warnaStatusPengaduan(p.status)}>
                      {LABEL_STATUS_PENGADUAN[p.status as never] ?? p.status}
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
    </div>
  );
}
