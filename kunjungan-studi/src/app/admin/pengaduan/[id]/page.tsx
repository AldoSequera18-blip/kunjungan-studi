import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { wajibAdmin } from "@/lib/auth";
import {
  LABEL_STATUS_PENGADUAN,
  LABEL_URGENSI,
  formatTanggalWaktu,
  warnaStatusPengaduan,
  warnaUrgensi,
} from "@/lib/utils";
import FormTindakLanjut from "./FormTindakLanjut";

export const dynamic = "force-dynamic";

interface Detail {
  id: number;
  nomor: string;
  kategori: string;
  deskripsi: string;
  urgensi: string;
  status: string;
  sumber: string;
  pelapor_nama: string | null;
  pelapor_kontak: string | null;
  anonim: number;
  foto_url: string | null;
  petugas: string | null;
  selesai_at: string | null;
  created_at: string;
  application_id: number | null;
  nama_ruangan: string;
  kode_ruangan: string;
  lokasi: string | null;
  nomor_kunjungan: string | null;
  nama_kelompok: string | null;
}

export default async function DetailPengaduanAdmin({ params }: { params: Promise<{ id: string }> }) {
  await wajibAdmin();
  const { id: idParam } = await params;
  const id = Number(idParam);

  const p = await db
    .prepare(
      `SELECT f.*, r.nama AS nama_ruangan, r.kode AS kode_ruangan, r.lokasi,
              a.nomor AS nomor_kunjungan, a.nama_kelompok
         FROM facility_reports f
         JOIN rooms r ON r.id = f.room_id
    LEFT JOIN visit_applications a ON a.id = f.application_id
        WHERE f.id = ?`
    )
    .get(id) as Detail | undefined;
  if (!p) notFound();

  const riwayat = await db
    .prepare(
      `SELECT ra.*, u.nama AS nama_admin FROM report_actions ra
    LEFT JOIN users u ON u.id = ra.admin_id
        WHERE ra.report_id = ? ORDER BY ra.created_at`
    )
    .all(id) as {
    id: number;
    status_dari: string | null;
    status_ke: string;
    petugas: string | null;
    catatan: string | null;
    created_at: string;
    nama_admin: string | null;
  }[];

  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/pengaduan" className="text-sm font-semibold text-brand-700 hover:underline">
          ← Kembali ke daftar pengaduan
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-sm text-slate-500">{p.nomor}</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              {p.kategori} — {p.nama_ruangan}
            </h1>
            <p className="text-sm text-slate-600">
              {p.kode_ruangan}
              {p.lokasi ? ` · ${p.lokasi}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <span className={warnaUrgensi(p.urgensi)}>
              {LABEL_URGENSI[p.urgensi as never] ?? p.urgensi}
            </span>
            <span className={warnaStatusPengaduan(p.status)}>
              {LABEL_STATUS_PENGADUAN[p.status as never] ?? p.status}
            </span>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card-pad">
            <h2 className="section-title">Detail Pengaduan</h2>

            <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3">
              <p className="text-sm text-slate-800">{p.deskripsi}</p>
            </div>

            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                ["Lokasi Ruangan", `${p.nama_ruangan} (${p.kode_ruangan})`],
                ["Kategori Fasilitas", p.kategori],
                ["Waktu Pengaduan", formatTanggalWaktu(p.created_at)],
                ["Sumber", p.sumber === "QR" ? "QR Code ruangan" : "Menu pengaduan"],
                [
                  "Pelapor",
                  p.anonim ? "Anonim" : p.pelapor_nama ?? "-",
                ],
                ["Kontak Pelapor", p.anonim ? "-" : p.pelapor_kontak ?? "-"],
                ["Petugas Ditugaskan", p.petugas ?? "Belum ditetapkan"],
                ["Waktu Penyelesaian", p.selesai_at ? formatTanggalWaktu(p.selesai_at) : "-"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k}</dt>
                  <dd className="mt-1 text-sm text-slate-800">{v}</dd>
                </div>
              ))}
            </dl>

            {p.nomor_kunjungan && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Terkait Kunjungan
                </p>
                <Link
                  href={`/admin/permohonan/${p.application_id}`}
                  className="mt-1 inline-block text-sm font-semibold text-brand-700 hover:underline"
                >
                  {p.nomor_kunjungan} — {p.nama_kelompok}
                </Link>
              </div>
            )}

            {p.foto_url && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Foto / Bukti
                </p>
                <a
                  href={p.foto_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block break-all text-sm text-brand-700 hover:underline"
                >
                  {p.foto_url}
                </a>
              </div>
            )}
          </section>

          {/* ---- Riwayat tindak lanjut ---- */}
          <section className="card">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="section-title">Riwayat Penanganan</h2>
            </div>
            <ol className="divide-y divide-slate-100">
              {riwayat.map((r) => (
                <li key={r.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={warnaStatusPengaduan(r.status_ke)}>
                      {LABEL_STATUS_PENGADUAN[r.status_ke as never] ?? r.status_ke}
                    </span>
                    {r.status_dari && (
                      <span className="text-xs text-slate-400">dari {r.status_dari}</span>
                    )}
                    <span className="ml-auto text-xs text-slate-500">
                      {formatTanggalWaktu(r.created_at)}
                    </span>
                  </div>
                  {r.catatan && <p className="mt-2 text-sm text-slate-700">{r.catatan}</p>}
                  <p className="mt-1.5 text-xs text-slate-500">
                    {r.nama_admin ? `Oleh ${r.nama_admin}` : "Oleh sistem"}
                    {r.petugas ? ` · petugas: ${r.petugas}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside>
          <div className="card-pad">
            <h2 className="section-title mb-4">Tindak Lanjut</h2>
            <FormTindakLanjut id={p.id} statusSaatIni={p.status} petugasSaatIni={p.petugas} />
          </div>
        </aside>
      </div>
    </div>
  );
}
