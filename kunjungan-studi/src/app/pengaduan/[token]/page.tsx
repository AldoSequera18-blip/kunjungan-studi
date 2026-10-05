import Link from "next/link";
import { db } from "@/lib/db";
import type { Room, RoomQrCode } from "@/lib/types";
import FormPengaduan from "./FormPengaduan";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pengaduan Fasilitas" };

/**
 * Halaman pengaduan fasilitas yang dibuka dari QR Code ruangan — Bab 19 & 20.
 * Identitas ruangan terbawa otomatis dari token pada URL.
 */
export default function HalamanPengaduanQr({ params }: { params: { token: string } }) {
  const qr = db
    .prepare(`SELECT * FROM room_qr_codes WHERE token = ? AND tipe = 'PENGADUAN'`)
    .get(params.token) as RoomQrCode | undefined;

  const room = qr
    ? (db.prepare(`SELECT * FROM rooms WHERE id = ?`).get(qr.room_id) as Room | undefined)
    : undefined;

  if (!qr || !qr.aktif || !room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="card-pad max-w-md text-center">
          <span className="text-4xl">🚫</span>
          <h1 className="mt-4 text-xl font-bold text-slate-900">QR Code Tidak Dikenali</h1>
          <p className="mt-2 text-sm text-slate-600">
            QR Code ini tidak terdaftar atau sudah tidak aktif. Silakan hubungi petugas Balai
            untuk melaporkan kendala fasilitas.
          </p>
          <Link href="/" className="btn-primary mt-6">Ke Halaman Informasi</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-lg">
        <header className="mb-5 text-center">
          <span className="text-3xl">⚠️</span>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Pengaduan Fasilitas</h1>
          <p className="mt-1 text-sm text-slate-600">
            Balai Layanan Perpustakaan DPAD DIY
          </p>
        </header>

        {/* Ruangan terisi otomatis dari QR Code */}
        <div className="card mb-5 border-brand-200 bg-brand-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            Lokasi terdeteksi otomatis
          </p>
          <p className="mt-1 text-lg font-bold text-brand-900">{room.nama}</p>
          <p className="text-sm text-brand-800">
            {room.kode} · {room.lokasi ?? "Lokasi tidak dicantumkan"}
          </p>
        </div>

        <div className="card-pad">
          <FormPengaduan token={qr.token} namaRuangan={room.nama} />
        </div>

        <p className="mt-5 text-center text-xs text-slate-500">
          Laporan Anda akan diteruskan kepada admin Balai untuk ditindaklanjuti.
        </p>
      </div>
    </div>
  );
}
