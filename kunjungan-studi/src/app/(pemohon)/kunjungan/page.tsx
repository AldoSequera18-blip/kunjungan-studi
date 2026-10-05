import Link from "next/link";
import { db } from "@/lib/db";
import { wajibPemohon } from "@/lib/auth";
import EmptyState from "@/components/EmptyState";
import {
  LABEL_STATUS_PERMOHONAN,
  formatTanggal,
  rentangWaktu,
  warnaStatusPermohonan,
} from "@/lib/utils";
import type { VisitApplication } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kunjungan Studi" };

export default function DaftarKunjungan({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const user = wajibPemohon();
  const filter = searchParams.status ?? "SEMUA";

  const semua = db
    .prepare(`SELECT * FROM visit_applications WHERE user_id = ? ORDER BY created_at DESC`)
    .all(user.id) as VisitApplication[];

  const daftar = filter === "SEMUA" ? semua : semua.filter((p) => p.status === filter);

  const tabFilter = [
    { key: "SEMUA", label: "Semua" },
    { key: "DRAFT", label: "Draft" },
    { key: "DIAJUKAN", label: "Diajukan" },
    { key: "DALAM_VERIFIKASI", label: "Verifikasi" },
    { key: "DIJADWALKAN", label: "Dijadwalkan" },
    { key: "SELESAI", label: "Selesai" },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kunjungan Studi</h1>
          <p className="mt-1 text-sm text-slate-600">
            Seluruh permohonan kunjungan studi yang Anda ajukan.
          </p>
        </div>
        <Link href="/kunjungan/baru" className="btn-primary">+ Ajukan Kunjungan</Link>
      </header>

      <nav className="flex flex-wrap gap-2">
        {tabFilter.map((t) => (
          <Link
            key={t.key}
            href={t.key === "SEMUA" ? "/kunjungan" : `/kunjungan?status=${t.key}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              filter === t.key
                ? "bg-brand-600 text-white"
                : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-xs opacity-75">
              {t.key === "SEMUA"
                ? semua.length
                : semua.filter((p) => p.status === t.key).length}
            </span>
          </Link>
        ))}
      </nav>

      {daftar.length === 0 ? (
        <EmptyState
          judul="Tidak ada permohonan pada filter ini"
          pesan="Ajukan permohonan kunjungan studi untuk memulai."
          aksi={<Link href="/kunjungan/baru" className="btn-primary">Ajukan Kunjungan</Link>}
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Nomor</th>
                <th>Kelompok</th>
                <th>Jenis</th>
                <th>Asal Instansi</th>
                <th>Usulan Waktu</th>
                <th>Peserta</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {daftar.map((p) => (
                <tr key={p.id}>
                  <td className="whitespace-nowrap font-mono text-xs">{p.nomor}</td>
                  <td className="font-medium text-slate-900">{p.nama_kelompok}</td>
                  <td><span className="badge-slate">{p.jenis_kunjungan === "TIDAK_RESMI" ? "Tidak Resmi" : "Resmi"}</span></td>
                  <td>{p.asal_instansi}</td>
                  <td className="whitespace-nowrap">
                    {formatTanggal(p.tanggal_usulan)}
                    <span className="block text-xs text-slate-500">
                      {rentangWaktu(p.waktu_mulai_usulan, p.waktu_selesai_usulan)}
                    </span>
                  </td>
                  <td>{p.jumlah_peserta}</td>
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
    </div>
  );
}
