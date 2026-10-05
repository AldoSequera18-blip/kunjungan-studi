import { db } from "@/lib/db";
import { wajibAdmin } from "@/lib/auth";
import EmptyState from "@/components/EmptyState";
import { formatTanggalWaktu } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit Log" };

interface BarisAudit {
  id: number;
  aktor: string;
  aksi: string;
  entitas: string | null;
  entitas_id: string | null;
  detail: string | null;
  created_at: string;
  nama_user: string | null;
}

const WARNA_AKSI: Record<string, string> = {
  LOGIN: "badge-slate",
  LOGOUT: "badge-slate",
  REGISTRASI: "badge-blue",
  BUAT_PERMOHONAN: "badge-blue",
  AJUKAN_PERMOHONAN: "badge-blue",
  MULAI_VERIFIKASI: "badge-amber",
  KEPUTUSAN_PERMOHONAN: "badge-purple",
  BUAT_JADWAL: "badge-purple",
  CHECKIN: "badge-green",
  CHECKOUT: "badge-green",
  BUAT_PENGADUAN: "badge-red",
  TINDAK_LANJUT_PENGADUAN: "badge-amber",
};

/** Audit Log — Bab 39 dokumen analisis. */
export default function HalamanAuditLog({
  searchParams,
}: {
  searchParams: { aksi?: string; q?: string; hal?: string };
}) {
  wajibAdmin();

  const halaman = Math.max(1, Number(searchParams.hal ?? 1));
  const perHalaman = 50;
  const aksiFilter = searchParams.aksi ?? "";
  const q = (searchParams.q ?? "").trim().toLowerCase();

  const semua = db
    .prepare(
      `SELECT a.*, u.nama AS nama_user FROM audit_logs a
    LEFT JOIN users u ON u.id = a.user_id
        ORDER BY a.created_at DESC LIMIT 1000`
    )
    .all() as BarisAudit[];

  const daftarAksi = Array.from(new Set(semua.map((s) => s.aksi))).sort();

  let hasil = semua;
  if (aksiFilter) hasil = hasil.filter((h) => h.aksi === aksiFilter);
  if (q) {
    hasil = hasil.filter(
      (h) =>
        h.aktor.toLowerCase().includes(q) ||
        (h.detail ?? "").toLowerCase().includes(q) ||
        (h.entitas ?? "").toLowerCase().includes(q)
    );
  }

  const totalHalaman = Math.max(1, Math.ceil(hasil.length / perHalaman));
  const potongan = hasil.slice((halaman - 1) * perHalaman, halaman * perHalaman);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
        <p className="mt-1 text-sm text-slate-600">
          Riwayat aktivitas penting: pembuatan permohonan, perubahan status, penjadwalan,
          pencatatan kehadiran, pengaduan, dan tindakan admin.
        </p>
      </header>

      <form method="get" className="card-pad flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="aksi">Jenis Aksi</label>
          <select id="aksi" name="aksi" className="input" defaultValue={aksiFilter}>
            <option value="">Semua aksi</option>
            {daftarAksi.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="label" htmlFor="q">Cari</label>
          <input
            id="q"
            name="q"
            className="input"
            defaultValue={searchParams.q ?? ""}
            placeholder="Pelaku, entitas, atau detail"
          />
        </div>
        <button type="submit" className="btn-secondary">Filter</button>
      </form>

      {potongan.length === 0 ? (
        <EmptyState judul="Tidak ada catatan aktivitas" pesan="Tidak ada log yang sesuai filter." />
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Pelaku</th>
                  <th>Aksi</th>
                  <th>Entitas</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {potongan.map((l) => (
                  <tr key={l.id}>
                    <td className="whitespace-nowrap text-xs text-slate-500">
                      {formatTanggalWaktu(l.created_at)}
                    </td>
                    <td className="font-medium text-slate-900">
                      {l.nama_user ?? l.aktor}
                      {l.nama_user && l.nama_user !== l.aktor && (
                        <span className="block text-xs text-slate-500">{l.aktor}</span>
                      )}
                    </td>
                    <td>
                      <span className={WARNA_AKSI[l.aksi] ?? "badge-slate"}>{l.aksi}</span>
                    </td>
                    <td className="text-xs text-slate-600">
                      {l.entitas ?? "-"}
                      {l.entitas_id ? ` #${l.entitas_id}` : ""}
                    </td>
                    <td className="text-sm text-slate-600">{l.detail ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalHalaman > 1 && (
            <nav className="flex items-center justify-between text-sm">
              <span className="text-slate-500">
                Halaman {halaman} dari {totalHalaman} · {hasil.length} catatan
              </span>
              <div className="flex gap-2">
                {halaman > 1 && (
                  <a
                    href={`/admin/audit?hal=${halaman - 1}${aksiFilter ? `&aksi=${aksiFilter}` : ""}`}
                    className="btn-secondary btn-sm"
                  >
                    ← Sebelumnya
                  </a>
                )}
                {halaman < totalHalaman && (
                  <a
                    href={`/admin/audit?hal=${halaman + 1}${aksiFilter ? `&aksi=${aksiFilter}` : ""}`}
                    className="btn-secondary btn-sm"
                  >
                    Berikutnya →
                  </a>
                )}
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
