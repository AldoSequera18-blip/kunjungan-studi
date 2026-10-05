import Link from "next/link";
import { db } from "@/lib/db";
import { wajibAdmin } from "@/lib/auth";
import { LABEL_STATUS_RUANGAN, warnaStatusRuangan } from "@/lib/utils";
import type { Room } from "@/lib/types";
import FormRuangan from "./FormRuangan";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ruangan" };

interface BarisRuangan extends Room {
  jumlah_jadwal: number;
  pengaduan_aktif: number;
}

export default async function HalamanRuanganAdmin() {
  await wajibAdmin();

  const ruangan = await db
    .prepare(
      `SELECT r.*,
              (SELECT COUNT(*) FROM visit_schedules s
                WHERE s.room_id = r.id AND s.status != 'DIBATALKAN') AS jumlah_jadwal,
              (SELECT COUNT(*) FROM facility_reports f
                WHERE f.room_id = r.id AND f.status NOT IN ('SELESAI','DITOLAK','TIDAK_VALID')) AS pengaduan_aktif
         FROM rooms r ORDER BY r.kode`
    )
    .all() as BarisRuangan[];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Ruangan</h1>
        <p className="mt-1 text-sm text-slate-600">
          Kelola nama ruangan, kapasitas, fasilitas, status, jadwal penggunaan, dan QR Code.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {ruangan.map((r) => (
            <article key={r.id} className="card-pad">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-brand-600">{r.kode}</p>
                  <h2 className="mt-0.5 font-bold text-slate-900">{r.nama}</h2>
                  <p className="text-sm text-slate-600">
                    Kapasitas {r.kapasitas} orang{r.lokasi ? ` · ${r.lokasi}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {r.pengaduan_aktif > 0 && (
                    <span className="badge-red">{r.pengaduan_aktif} pengaduan aktif</span>
                  )}
                  <span className={warnaStatusRuangan(r.status)}>
                    {LABEL_STATUS_RUANGAN[r.status] ?? r.status}
                  </span>
                </div>
              </div>

              {r.fasilitas && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {r.fasilitas
                    .split(",")
                    .map((f) => f.trim())
                    .filter(Boolean)
                    .map((f) => (
                      <span key={f} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                        {f}
                      </span>
                    ))}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-500">{r.jumlah_jadwal} jadwal tercatat</p>
                <Link href={`/admin/ruangan/${r.id}`} className="btn-secondary btn-sm">
                  Kelola &amp; QR Code
                </Link>
              </div>
            </article>
          ))}
        </div>

        <aside>
          <div className="card-pad">
            <h2 className="section-title mb-4">Tambah Ruangan Baru</h2>
            <FormRuangan />
          </div>
        </aside>
      </div>
    </div>
  );
}
