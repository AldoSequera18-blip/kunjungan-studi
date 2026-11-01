import Link from "next/link";
import { db } from "@/lib/db";
import { formatJam, formatTanggal, hariIniISO, rentangWaktu } from "@/lib/utils";
import type { Attendance, Room, RoomQrCode, Visitor } from "@/lib/types";
import PanelDaftarHadir from "./PanelDaftarHadir";

export const dynamic = "force-dynamic";
export const metadata = { title: "Daftar Hadir Ruangan" };

interface JadwalRuangan {
  id: number;
  tanggal: string;
  waktu_mulai: string;
  waktu_selesai: string;
  status: string;
  nomor: string;
  nama_kelompok: string;
  asal_instansi: string;
  jumlah_peserta: number;
}

export default async function HalamanDaftarHadir({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ jadwal?: string; kode?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const qr = await db
    .prepare(`SELECT * FROM room_qr_codes WHERE token = ? AND tipe = 'ABSENSI'`)
    .get(token) as RoomQrCode | undefined;

  const room = qr
    ? (await db.prepare(`SELECT * FROM rooms WHERE id = ?`).get(qr.room_id) as Room | undefined)
    : undefined;

  if (!qr || !qr.aktif || !room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="card-pad max-w-md text-center">
          <span className="text-4xl">🚫</span>
          <h1 className="mt-4 text-xl font-bold text-slate-900">QR Code Tidak Dikenali</h1>
          <p className="mt-2 text-sm text-slate-600">
            QR Code daftar hadir ini tidak terdaftar atau sudah tidak aktif. Silakan hubungi
            petugas Balai.
          </p>
          <Link href="/" className="btn-primary mt-6">Ke Halaman Informasi</Link>
        </div>
      </div>
    );
  }

  const hariIni = hariIniISO();

  // Kunjungan yang terjadwal di ruangan ini pada hari ini
  const jadwalHariIni = await db
    .prepare(
      `SELECT s.id, s.tanggal, s.waktu_mulai, s.waktu_selesai, s.status,
              a.nomor, a.nama_kelompok, a.asal_instansi, a.jumlah_peserta
         FROM visit_schedules s
         JOIN visit_applications a ON a.id = s.application_id
        WHERE s.room_id = ? AND s.tanggal = ? AND s.status != 'DIBATALKAN'
        ORDER BY s.waktu_mulai`
    )
    .all(room.id, hariIni) as JadwalRuangan[];

  // Pemilihan jadwal: lewat parameter ?jadwal= atau pencarian nomor kunjungan ?kode=
  let jadwalTerpilih: JadwalRuangan | undefined;
  if (query.jadwal) {
    jadwalTerpilih = jadwalHariIni.find((j) => String(j.id) === query.jadwal);
  } else if (query.kode) {
    const kode = query.kode.trim().toUpperCase();
    jadwalTerpilih = await db
      .prepare(
        `SELECT s.id, s.tanggal, s.waktu_mulai, s.waktu_selesai, s.status,
                a.nomor, a.nama_kelompok, a.asal_instansi, a.jumlah_peserta
           FROM visit_schedules s
           JOIN visit_applications a ON a.id = s.application_id
          WHERE s.room_id = ? AND a.nomor = ? AND s.status != 'DIBATALKAN'
          ORDER BY s.tanggal DESC LIMIT 1`
      )
      .get(room.id, kode) as JadwalRuangan | undefined;
  } else if (jadwalHariIni.length === 1) {
    jadwalTerpilih = jadwalHariIni[0];
  }

  const peserta = jadwalTerpilih
    ? (await db
        .prepare(
          `SELECT v.* FROM visitors v
            JOIN visit_schedules s ON s.application_id = v.application_id
           WHERE s.id = ? ORDER BY v.jenis DESC, v.nama`
        )
        .all(jadwalTerpilih.id) as Visitor[])
    : [];

  const kehadiran = jadwalTerpilih
    ? (await db
        .prepare(`SELECT * FROM attendance WHERE schedule_id = ? ORDER BY checkin_at DESC`)
        .all(jadwalTerpilih.id) as Attendance[])
    : [];

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-5 text-center">
          <span className="text-3xl">🕘</span>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Daftar Hadir Ruangan</h1>
          <p className="mt-1 text-sm text-slate-600">Balai Layanan Perpustakaan DPAD DIY</p>
        </header>

        <div className="card mb-5 border-brand-200 bg-brand-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            Ruangan terdeteksi otomatis
          </p>
          <p className="mt-1 text-lg font-bold text-brand-900">{room.nama}</p>
          <p className="text-sm text-brand-800">
            {room.kode} · {formatTanggal(hariIni)}
          </p>
        </div>

        {!jadwalTerpilih ? (
          <div className="card-pad">
            <h2 className="section-title">Pilih Kunjungan Anda</h2>
            {jadwalHariIni.length === 0 ? (
              <p className="alert-warning mt-4">
                Belum ada kunjungan yang dijadwalkan di ruangan ini untuk hari ini. Silakan
                masukkan nomor kunjungan Anda bila jadwal berada pada tanggal lain.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {jadwalHariIni.map((j) => (
                  <li key={j.id}>
                    <Link
                      href={`/hadir/${token}?jadwal=${j.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3 transition hover:border-brand-400 hover:bg-brand-50"
                    >
                      <span>
                        <span className="block text-sm font-semibold text-slate-900">
                          {j.nama_kelompok}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {j.asal_instansi} · {rentangWaktu(j.waktu_mulai, j.waktu_selesai)} ·{" "}
                          <span className="font-mono">{j.nomor}</span>
                        </span>
                      </span>
                      <span className="text-brand-600">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <form method="get" className="mt-6 border-t border-slate-100 pt-5">
              <label className="label" htmlFor="kode">
                Atau masukkan nomor kunjungan
              </label>
              <div className="flex gap-2">
                <input
                  id="kode"
                  name="kode"
                  className="input font-mono"
                  placeholder="KUN-2026-0001"
                  required
                />
                <button type="submit" className="btn-primary shrink-0">Cari</button>
              </div>
              {query.kode && (
                <p className="alert-error mt-3">
                  Nomor kunjungan <strong>{query.kode}</strong> tidak ditemukan pada
                  ruangan ini.
                </p>
              )}
            </form>
          </div>
        ) : (
          <>
            <div className="card-pad mb-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-slate-500">{jadwalTerpilih.nomor}</p>
                  <h2 className="mt-0.5 text-lg font-bold text-slate-900">
                    {jadwalTerpilih.nama_kelompok}
                  </h2>
                  <p className="text-sm text-slate-600">{jadwalTerpilih.asal_instansi}</p>
                </div>
                <Link href={`/hadir/${token}`} className="btn-secondary btn-sm">
                  Ganti
                </Link>
              </div>
              <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">
                {formatTanggal(jadwalTerpilih.tanggal)} ·{" "}
                {rentangWaktu(jadwalTerpilih.waktu_mulai, jadwalTerpilih.waktu_selesai)} ·{" "}
                {kehadiran.length} dari {peserta.length || jadwalTerpilih.jumlah_peserta} peserta
                sudah check-in
              </p>
            </div>

            <PanelDaftarHadir
              token={token}
              scheduleId={jadwalTerpilih.id}
              peserta={peserta}
              kehadiran={kehadiran.map((k) => ({
                id: k.id,
                visitor_id: k.visitor_id,
                nama_peserta: k.nama_peserta,
                checkin_at: formatJam(k.checkin_at.slice(11, 16)),
                checkout_at: k.checkout_at ? formatJam(k.checkout_at.slice(11, 16)) : null,
              }))}
            />
          </>
        )}

        <p className="mt-6 text-center text-xs text-slate-500">
          QR Code daftar hadir dibedakan dari QR Code pengaduan fasilitas agar fungsinya jelas.
        </p>
      </div>
    </div>
  );
}
