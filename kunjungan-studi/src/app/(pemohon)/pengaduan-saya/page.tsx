import { db } from "@/lib/db";
import { wajibPemohon } from "@/lib/auth";
import {
  LABEL_STATUS_PENGADUAN,
  LABEL_URGENSI,
  formatTanggalWaktu,
  warnaStatusPengaduan,
  warnaUrgensi,
} from "@/lib/utils";
import type { Room } from "@/lib/types";
import FormPengaduanMenu from "./FormPengaduanMenu";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pengaduan Fasilitas" };

interface BarisPengaduan {
  id: number;
  nomor: string;
  kategori: string;
  deskripsi: string;
  urgensi: string;
  status: string;
  sumber: string;
  petugas: string | null;
  created_at: string;
  nama_ruangan: string;
}

/** Menu Pengaduan Fasilitas pemohon — Bab 28 dokumen analisis. */
export default function HalamanPengaduanPemohon() {
  const user = wajibPemohon();

  const ruangan = db
    .prepare(`SELECT * FROM rooms WHERE status != 'TIDAK_AKTIF' ORDER BY kode`)
    .all() as Room[];

  const kunjungan = db
    .prepare(
      `SELECT id, nomor, nama_kelompok FROM visit_applications
        WHERE user_id = ? AND status IN ('DITERIMA','DIJADWALKAN','BERLANGSUNG','SELESAI')
        ORDER BY created_at DESC`
    )
    .all(user.id) as { id: number; nomor: string; nama_kelompok: string }[];

  const pengaduan = db
    .prepare(
      `SELECT f.id, f.nomor, f.kategori, f.deskripsi, f.urgensi, f.status, f.sumber,
              f.petugas, f.created_at, r.nama AS nama_ruangan
         FROM facility_reports f
         JOIN rooms r ON r.id = f.room_id
    LEFT JOIN visit_applications a ON a.id = f.application_id
        WHERE f.pelapor_nama = ? OR a.user_id = ?
        ORDER BY f.created_at DESC`
    )
    .all(user.nama, user.id) as BarisPengaduan[];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Pengaduan Fasilitas</h1>
        <p className="mt-1 text-sm text-slate-600">
          Laporkan kendala fasilitas pada ruangan kunjungan. Pengaduan juga dapat dibuat langsung
          dengan memindai QR Code yang tersedia di setiap ruangan.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="card-pad">
            <h2 className="section-title mb-4">Buat Pengaduan Baru</h2>
            <FormPengaduanMenu ruangan={ruangan} kunjungan={kunjungan} />
          </div>
        </div>

        <div className="lg:col-span-3">
          <h2 className="section-title mb-3">Riwayat Pengaduan ({pengaduan.length})</h2>

          {pengaduan.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
              Belum ada pengaduan yang Anda sampaikan.
            </p>
          ) : (
            <div className="space-y-4">
              {pengaduan.map((p) => (
                <article key={p.id} className="card-pad">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-xs text-slate-500">{p.nomor}</p>
                      <h3 className="mt-0.5 font-bold text-slate-900">
                        {p.kategori} — {p.nama_ruangan}
                      </h3>
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

                  <p className="mt-3 text-sm text-slate-700">{p.deskripsi}</p>

                  <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                    Dilaporkan {formatTanggalWaktu(p.created_at)} ·{" "}
                    {p.sumber === "QR" ? "melalui QR Code ruangan" : "melalui menu pengaduan"}
                    {p.petugas ? ` · petugas: ${p.petugas}` : ""}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
