import Link from "next/link";
import { db } from "@/lib/db";
import { wajibAdmin } from "@/lib/auth";
import EmptyState from "@/components/EmptyState";
import { LABEL_STATUS_PERMOHONAN, formatTanggal, warnaStatusPermohonan } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kelompok & Peserta" };

interface BarisKelompok {
  id: number;
  nomor: string;
  nama_kelompok: string;
  asal_instansi: string;
  jenis_instansi: string | null;
  jumlah_peserta: number;
  status: string;
  tanggal_usulan: string;
  nama_pemohon: string;
  email: string;
  telepon: string | null;
  terdaftar: number;
  pendamping: number;
  jumlah_jadwal: number;
  jumlah_hadir: number;
}

/** Modul Kelompok & Peserta — Bab 32 dokumen analisis. */
export default async function HalamanKelompokAdmin({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  await wajibAdmin();
  const q = (searchParams.q ?? "").trim().toLowerCase();

  const semua = await db
    .prepare(
      `SELECT a.id, a.nomor, a.nama_kelompok, a.asal_instansi, a.jenis_instansi,
              a.jumlah_peserta, a.status, a.tanggal_usulan,
              u.nama AS nama_pemohon, u.email, u.telepon,
              (SELECT COUNT(*) FROM visitors v WHERE v.application_id = a.id) AS terdaftar,
              (SELECT COUNT(*) FROM visitors v WHERE v.application_id = a.id AND v.jenis = 'PENDAMPING') AS pendamping,
              (SELECT COUNT(*) FROM visit_schedules s WHERE s.application_id = a.id) AS jumlah_jadwal,
              (SELECT COUNT(*) FROM attendance t WHERE t.application_id = a.id) AS jumlah_hadir
         FROM visit_applications a JOIN users u ON u.id = a.user_id
        WHERE a.status != 'DRAFT'
        ORDER BY a.created_at DESC`
    )
    .all() as BarisKelompok[];

  const daftar = q
    ? semua.filter(
        (k) =>
          k.nama_kelompok.toLowerCase().includes(q) ||
          k.asal_instansi.toLowerCase().includes(q) ||
          k.nomor.toLowerCase().includes(q) ||
          k.nama_pemohon.toLowerCase().includes(q)
      )
    : semua;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kelompok &amp; Peserta</h1>
          <p className="mt-1 text-sm text-slate-600">
            Data pemohon, kelompok, jumlah peserta, jadwal, dan riwayat kehadiran.
          </p>
        </div>
        <form method="get" className="flex gap-2">
          <input
            name="q"
            defaultValue={searchParams.q ?? ""}
            className="input w-64"
            placeholder="Cari kelompok / instansi / pemohon"
          />
          <button type="submit" className="btn-secondary">Cari</button>
        </form>
      </header>

      {daftar.length === 0 ? (
        <EmptyState judul="Tidak ada data kelompok" pesan="Belum ada kelompok yang sesuai pencarian." />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {daftar.map((k) => (
            <article key={k.id} className="card-pad">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-slate-500">{k.nomor}</p>
                  <h2 className="mt-0.5 font-bold text-slate-900">{k.nama_kelompok}</h2>
                  <p className="text-sm text-slate-600">
                    {k.asal_instansi}
                    {k.jenis_instansi ? ` · ${k.jenis_instansi}` : ""}
                  </p>
                </div>
                <span className={warnaStatusPermohonan(k.status)}>
                  {LABEL_STATUS_PERMOHONAN[k.status as never] ?? k.status}
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                {[
                  ["Peserta", `${k.terdaftar}/${k.jumlah_peserta}`],
                  ["Pendamping", String(k.pendamping)],
                  ["Jadwal", String(k.jumlah_jadwal)],
                  ["Check-in", String(k.jumlah_hadir)],
                ].map(([label, nilai]) => (
                  <div key={label} className="rounded-lg bg-slate-50 px-3 py-2">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {label}
                    </dt>
                    <dd className="mt-0.5 font-bold text-slate-900">{nilai}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-600">
                <p>
                  <span className="text-slate-500">Pemohon:</span> {k.nama_pemohon} · {k.email}
                  {k.telepon ? ` · ${k.telepon}` : ""}
                </p>
                <p className="mt-0.5">
                  <span className="text-slate-500">Usulan kunjungan:</span>{" "}
                  {formatTanggal(k.tanggal_usulan)}
                </p>
              </div>

              <div className="mt-4">
                <Link href={`/admin/permohonan/${k.id}`} className="btn-secondary btn-sm">
                  Lihat Detail Lengkap
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
