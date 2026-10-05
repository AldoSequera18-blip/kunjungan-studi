import { db } from "@/lib/db";
import { LABEL_STATUS_RUANGAN, warnaStatusRuangan } from "@/lib/utils";
import type { Room } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ruangan & Fasilitas" };

export default async function HalamanRuanganPublik() {
  const ruangan = await db
    .prepare(`SELECT * FROM rooms WHERE status != 'TIDAK_AKTIF' ORDER BY kode`)
    .all() as Room[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">Ruangan &amp; Fasilitas</h1>
      <p className="mt-3 max-w-3xl text-slate-600">
        Ruangan berikut dapat digunakan untuk kegiatan kunjungan studi. Pembagian
        ruangan ditetapkan oleh admin Balai setelah permohonan diverifikasi.
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {ruangan.map((r) => (
          <article key={r.id} className="card-pad flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                  {r.kode}
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">{r.nama}</h2>
              </div>
              <span className={warnaStatusRuangan(r.status)}>
                {LABEL_STATUS_RUANGAN[r.status] ?? r.status}
              </span>
            </div>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-slate-500">Kapasitas</dt>
                <dd className="font-medium text-slate-800">{r.kapasitas} orang</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-slate-500">Lokasi</dt>
                <dd className="text-slate-700">{r.lokasi ?? "-"}</dd>
              </div>
            </dl>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Fasilitas
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(r.fasilitas ?? "")
                  .split(",")
                  .map((f) => f.trim())
                  .filter(Boolean)
                  .map((f) => (
                    <span
                      key={f}
                      className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700"
                    >
                      {f}
                    </span>
                  ))}
              </div>
            </div>

            {r.keterangan && (
              <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                {r.keterangan}
              </p>
            )}
          </article>
        ))}
      </div>

      <div className="alert-warning mt-10">
        <p className="font-semibold">Menemukan kendala fasilitas saat berkunjung?</p>
        <p className="mt-1">
          Pindai QR Code pengaduan yang tersedia di setiap ruangan. Halaman pengaduan akan
          otomatis mencatat ruangan tempat Anda berada, sehingga Anda tidak perlu memilih
          ruangan secara manual.
        </p>
      </div>
    </div>
  );
}
