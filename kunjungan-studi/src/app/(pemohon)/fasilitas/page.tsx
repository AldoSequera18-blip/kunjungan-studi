import { db } from "@/lib/db";
import { wajibPemohon } from "@/lib/auth";
import { LABEL_STATUS_RUANGAN, warnaStatusRuangan } from "@/lib/utils";
import type { Room } from "@/lib/types";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ruangan & Fasilitas" };

export default async function RuanganFasilitasPemohon({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = await searchParams;
  await wajibPemohon();
  const q = (query.q ?? "").trim().toLocaleLowerCase("id-ID");

  const semuaRuangan = await db
    .prepare(`SELECT * FROM rooms WHERE status != 'TIDAK_AKTIF' ORDER BY kode`)
    .all() as Room[];
  const ruangan = q ? semuaRuangan.filter((r) => [r.kode, r.nama, r.lokasi ?? "", r.fasilitas ?? ""].some((v) => v.toLocaleLowerCase("id-ID").includes(q))) : semuaRuangan;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Ruangan &amp; Fasilitas</h1>
        <p className="mt-1 text-sm text-slate-600">
          Ruangan yang dapat digunakan untuk kegiatan kunjungan studi. Pembagian ruangan
          ditetapkan oleh admin Balai.
        </p>
      </header>

      <form method="get" className="flex flex-wrap gap-2">
        <input name="q" className="input max-w-md" defaultValue={query.q ?? ""} placeholder="Cari nama, kode, lokasi, fasilitas" />
        <button type="submit" className="btn-secondary">Cari ruangan</button>
        {q && <Link href="/fasilitas" className="btn-secondary">Reset</Link>}
      </form>

      {ruangan.length === 0 ? <p className="hint">Tidak ada ruangan yang cocok dengan pencarian.</p> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {ruangan.map((r) => (
          <article key={r.id} className="card-pad">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                  {r.kode}
                </p>
                <h2 className="mt-1 font-bold text-slate-900">{r.nama}</h2>
              </div>
              <span className={warnaStatusRuangan(r.status)}>
                {LABEL_STATUS_RUANGAN[r.status] ?? r.status}
              </span>
            </div>

            <p className="mt-3 text-sm text-slate-600">
              Kapasitas <strong>{r.kapasitas}</strong> orang
              {r.lokasi ? ` · ${r.lokasi}` : ""}
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {(r.fasilitas ?? "")
                .split(",")
                .map((f) => f.trim())
                .filter(Boolean)
                .map((f) => (
                  <span key={f} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                    {f}
                  </span>
                ))}
            </div>

            {r.keterangan && (
              <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                {r.keterangan}
              </p>
            )}
          </article>
        ))}
      </div>}

      <div className="alert-warning">
        <p className="font-semibold">Menemukan kendala fasilitas?</p>
        <p className="mt-1">
          Pindai QR Code pengaduan yang tersedia di ruangan, atau buat pengaduan melalui menu
          Pengaduan Fasilitas.
        </p>
      </div>
    </div>
  );
}
