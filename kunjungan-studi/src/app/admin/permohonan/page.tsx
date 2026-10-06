import Link from "next/link";
import { db } from "@/lib/db";
import { wajibAdmin } from "@/lib/auth";
import EmptyState from "@/components/EmptyState";
import {
  LABEL_STATUS_PERMOHONAN,
  formatTanggal,
  formatTanggalWaktu,
  rentangWaktu,
  warnaStatusPermohonan,
} from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Permohonan Kunjungan" };

interface Baris {
  id: number;
  nomor: string;
  jenis_kunjungan: "RESMI" | "TIDAK_RESMI";
  nama_kelompok: string;
  asal_instansi: string;
  jumlah_peserta: number;
  tanggal_usulan: string;
  waktu_mulai_usulan: string;
  waktu_selesai_usulan: string;
  status: string;
  created_at: string;
  nama_pemohon: string;
  terdaftar: number;
}

const FILTER = [
  { key: "SEMUA", label: "Semua" },
  { key: "DIAJUKAN", label: "Diajukan" },
  { key: "DALAM_VERIFIKASI", label: "Verifikasi" },
  { key: "PERLU_PERBAIKAN", label: "Perlu Perbaikan" },
  { key: "DITERIMA", label: "Diterima" },
  { key: "DIJADWALKAN", label: "Dijadwalkan" },
  { key: "DITOLAK", label: "Ditolak" },
  { key: "SELESAI", label: "Selesai" },
];

/** Modul Permohonan — Bab 31 dokumen analisis. */
export default async function DaftarPermohonanAdmin({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const query = await searchParams;
  await wajibAdmin();
  const status = query.status ?? "SEMUA";
  const q = (query.q ?? "").trim();

  const semua = await db
    .prepare(
      `SELECT a.id, a.nomor, a.jenis_kunjungan, a.nama_kelompok, a.asal_instansi, a.jumlah_peserta,
              a.tanggal_usulan, a.waktu_mulai_usulan, a.waktu_selesai_usulan,
              a.status, a.created_at, u.nama AS nama_pemohon,
              (SELECT COUNT(*) FROM visitors v WHERE v.application_id = a.id) AS terdaftar
         FROM visit_applications a JOIN users u ON u.id = a.user_id
        WHERE a.status != 'DRAFT'
        ORDER BY a.created_at DESC`
    )
    .all() as Baris[];

  let daftar = status === "SEMUA" ? semua : semua.filter((p) => p.status === status);
  if (q) {
    const cari = q.toLowerCase();
    daftar = daftar.filter(
      (p) =>
        p.nomor.toLowerCase().includes(cari) ||
        p.nama_kelompok.toLowerCase().includes(cari) ||
        p.asal_instansi.toLowerCase().includes(cari) ||
        p.nama_pemohon.toLowerCase().includes(cari)
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Permohonan Kunjungan</h1>
        <p className="mt-1 text-sm text-slate-600">
          Daftar, pencarian, dan verifikasi permohonan kunjungan studi.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <nav className="flex flex-wrap gap-2">
          {FILTER.map((f) => (
            <Link
              key={f.key}
              href={f.key === "SEMUA" ? "/admin/permohonan" : `/admin/permohonan?status=${f.key}`}
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

        <form method="get" className="ml-auto flex gap-2">
          {status !== "SEMUA" && <input type="hidden" name="status" value={status} />}
          <input
            name="q"
            defaultValue={q}
            className="input w-56"
            placeholder="Cari nomor / kelompok / instansi"
          />
          <button type="submit" className="btn-secondary">Cari</button>
        </form>
      </div>

      {daftar.length === 0 ? (
        <EmptyState
          judul="Tidak ada permohonan"
          pesan="Belum ada permohonan yang sesuai dengan filter atau kata kunci pencarian."
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Nomor</th>
                <th>Kelompok / Instansi</th>
                <th>Pemohon</th>
                <th>Jenis</th>
                <th>Usulan</th>
                <th>Peserta</th>
                <th>Status</th>
                <th>Masuk</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {daftar.map((p) => (
                <tr key={p.id}>
                  <td className="whitespace-nowrap font-mono text-xs">{p.nomor}</td>
                  <td>
                    <span className="font-medium text-slate-900">{p.nama_kelompok}</span>
                    <span className="block text-xs text-slate-500">{p.asal_instansi}</span>
                  </td>
                  <td className="text-sm">{p.nama_pemohon}</td>
                  <td><span className="badge-slate">{p.jenis_kunjungan === "TIDAK_RESMI" ? "Tidak Resmi" : "Resmi"}</span></td>
                  <td className="whitespace-nowrap text-sm">
                    {formatTanggal(p.tanggal_usulan)}
                    <span className="block text-xs text-slate-500">
                      {rentangWaktu(p.waktu_mulai_usulan, p.waktu_selesai_usulan)}
                    </span>
                  </td>
                  <td className="text-sm">
                    {p.terdaftar}/{p.jumlah_peserta}
                  </td>
                  <td>
                    <span className={warnaStatusPermohonan(p.status)}>
                      {LABEL_STATUS_PERMOHONAN[p.status as never] ?? p.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-xs text-slate-500">
                    {formatTanggalWaktu(p.created_at)}
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/admin/permohonan/${p.id}`}
                      className="text-sm font-semibold text-brand-700 hover:underline"
                    >
                      Periksa
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
