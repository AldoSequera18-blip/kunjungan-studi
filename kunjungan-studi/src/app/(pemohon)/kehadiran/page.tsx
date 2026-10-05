import { db } from "@/lib/db";
import { wajibPemohon } from "@/lib/auth";
import EmptyState from "@/components/EmptyState";
import { formatTanggal, formatJam } from "@/lib/utils";
import PemindaiQr from "./PemindaiQr";

export const dynamic = "force-dynamic";
export const metadata = { title: "Daftar Hadir" };

interface BarisHadir {
  id: number;
  nama_peserta: string;
  metode: string;
  checkin_at: string;
  checkout_at: string | null;
  nama_ruangan: string;
  kode_ruangan: string;
  nomor: string;
  nama_kelompok: string;
  tanggal: string;
}

/** Menu Daftar Hadir pemohon — Bab 27 dokumen analisis. */
export default function HalamanKehadiranPemohon() {
  const user = wajibPemohon();

  const baris = db
    .prepare(
      `SELECT t.id, t.nama_peserta, t.metode, t.checkin_at, t.checkout_at,
              r.nama AS nama_ruangan, r.kode AS kode_ruangan,
              a.nomor, a.nama_kelompok, s.tanggal
         FROM attendance t
         JOIN visit_applications a ON a.id = t.application_id
         JOIN visit_schedules s ON s.id = t.schedule_id
         JOIN rooms r ON r.id = t.room_id
        WHERE a.user_id = ?
        ORDER BY t.checkin_at DESC`
    )
    .all(user.id) as BarisHadir[];

  // Dikelompokkan per kunjungan + ruangan
  const grup = new Map<string, BarisHadir[]>();
  for (const b of baris) {
    const kunci = `${b.nomor}|${b.kode_ruangan}|${b.tanggal}`;
    if (!grup.has(kunci)) grup.set(kunci, []);
    grup.get(kunci)!.push(b);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Daftar Hadir</h1>
        <p className="mt-1 text-sm text-slate-600">
          Riwayat kehadiran peserta pada setiap ruangan yang dikunjungi.
        </p>
      </header>

      <PemindaiQr />

      {baris.length === 0 ? (
        <EmptyState
          judul="Belum ada catatan kehadiran"
          pesan="Kehadiran tercatat ketika peserta melakukan check-in pada ruangan saat kunjungan berlangsung."
        />
      ) : (
        <div className="space-y-5">
          {Array.from(grup.entries()).map(([kunci, isi]) => {
            const pertama = isi[0];
            const selesai = isi.filter((i) => i.checkout_at).length;
            return (
              <section key={kunci} className="card">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
                  <div>
                    <p className="font-mono text-xs text-slate-500">{pertama.nomor}</p>
                    <h2 className="mt-0.5 font-bold text-slate-900">{pertama.nama_ruangan}</h2>
                    <p className="text-xs text-slate-500">
                      {pertama.nama_kelompok} · {formatTanggal(pertama.tanggal)}
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p className="text-sm font-bold text-brand-700">{isi.length} check-in</p>
                    <p>{selesai} sudah check-out</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Nama Peserta</th>
                        <th>Metode</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isi.map((b) => (
                        <tr key={b.id}>
                          <td className="font-medium text-slate-900">{b.nama_peserta}</td>
                          <td className="text-xs text-slate-500">
                            {b.metode === "PILIH_NAMA"
                              ? "Pilih nama"
                              : b.metode === "QR"
                              ? "QR Code"
                              : "Kode kunjungan"}
                          </td>
                          <td>{formatJam(b.checkin_at.slice(11, 16))}</td>
                          <td>
                            {b.checkout_at ? (
                              formatJam(b.checkout_at.slice(11, 16))
                            ) : (
                              <span className="text-slate-400">belum</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
