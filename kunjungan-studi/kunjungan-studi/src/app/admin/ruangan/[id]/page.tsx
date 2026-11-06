import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { wajibAdmin } from "@/lib/auth";
import {
  LABEL_STATUS_JADWAL,
  LABEL_STATUS_PENGADUAN,
  formatTanggal,
  formatTanggalWaktu,
  rentangWaktu,
  warnaStatusJadwal,
  warnaStatusPengaduan,
} from "@/lib/utils";
import type { Room, RoomQrCode } from "@/lib/types";
import FormRuangan from "../FormRuangan";
import KartuQr from "./KartuQr";

export const dynamic = "force-dynamic";

export default async function DetailRuanganAdmin({ params }: { params: Promise<{ id: string }> }) {
  await wajibAdmin();
  const { id: idParam } = await params;
  const id = Number(idParam);

  const room = await db.prepare(`SELECT * FROM rooms WHERE id = ?`).get(id) as Room | undefined;
  if (!room) notFound();

  const qrCodes = await db
    .prepare(`SELECT * FROM room_qr_codes WHERE room_id = ? ORDER BY tipe`)
    .all(id) as RoomQrCode[];

  const jadwal = await db
    .prepare(
      `SELECT s.id, s.tanggal, s.waktu_mulai, s.waktu_selesai, s.status,
              a.id AS application_id, a.nomor, a.nama_kelompok
         FROM visit_schedules s JOIN visit_applications a ON a.id = s.application_id
        WHERE s.room_id = ? AND s.tanggal >= date('now','-30 days')
        ORDER BY s.tanggal DESC, s.waktu_mulai LIMIT 20`
    )
    .all(id) as {
    id: number;
    tanggal: string;
    waktu_mulai: string;
    waktu_selesai: string;
    status: string;
    application_id: number;
    nomor: string;
    nama_kelompok: string;
  }[];

  const pengaduan = await db
    .prepare(
      `SELECT id, nomor, kategori, urgensi, status, created_at
         FROM facility_reports WHERE room_id = ? ORDER BY created_at DESC LIMIT 10`
    )
    .all(id) as {
    id: number;
    nomor: string;
    kategori: string;
    urgensi: string;
    status: string;
    created_at: string;
  }[];

  const reqHeaders = await headers();
  const currentUrl = new URL(`http://${reqHeaders.get("host") || "localhost:3000"}`);
  const forwardedProto = reqHeaders.get("x-forwarded-proto")?.split(",")[0].trim();
  const forwardedHost = reqHeaders.get("x-forwarded-host")?.split(",")[0].trim();
  const baseUrl = (process.env.PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL ||
    `${forwardedProto || "http"}://${forwardedHost || currentUrl.host}`).replace(/\/$/, "");

  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/ruangan" className="text-sm font-semibold text-brand-700 hover:underline">
          ← Kembali ke daftar ruangan
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">{room.nama}</h1>
        <p className="text-sm text-slate-600">
          {room.kode} · kapasitas {room.kapasitas} orang
          {room.lokasi ? ` · ${room.lokasi}` : ""}
        </p>
      </header>

      {/* ---- QR Code ---- */}
      <section>
        <h2 className="section-title mb-3">QR Code Ruangan</h2>
        <div className="grid gap-5 md:grid-cols-2">
          {qrCodes.map((q) => (
            <KartuQr
              key={q.id}
              qrId={q.id}
              tipe={q.tipe}
              token={q.token}
              namaRuangan={room.nama}
              kodeRuangan={room.kode}
              baseUrl={baseUrl}
            />
          ))}
        </div>
        <p className="hint mt-3">
          QR menggunakan alamat publik aplikasi. Untuk penggunaan lokal/jaringan kantor, alamat yang
          dipakai mengikuti host halaman ini atau nilai PUBLIC_BASE_URL pada konfigurasi server.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* ---- Jadwal penggunaan ---- */}
          <section className="card">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="section-title">Jadwal Penggunaan Ruangan</h2>
            </div>
            {jadwal.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">
                Belum ada jadwal pada 30 hari terakhir.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Waktu</th>
                      <th>Kelompok</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jadwal.map((j) => (
                      <tr key={j.id}>
                        <td className="whitespace-nowrap">{formatTanggal(j.tanggal)}</td>
                        <td className="whitespace-nowrap">
                          {rentangWaktu(j.waktu_mulai, j.waktu_selesai)}
                        </td>
                        <td>
                          <Link
                            href={`/admin/permohonan/${j.application_id}`}
                            className="font-medium text-brand-700 hover:underline"
                          >
                            {j.nama_kelompok}
                          </Link>
                          <span className="block font-mono text-xs text-slate-500">{j.nomor}</span>
                        </td>
                        <td>
                          <span className={warnaStatusJadwal(j.status)}>
                            {LABEL_STATUS_JADWAL[j.status as never] ?? j.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ---- Pengaduan ruangan ---- */}
          <section className="card">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="section-title">Pengaduan Fasilitas Ruangan Ini</h2>
            </div>
            {pengaduan.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">
                Belum ada pengaduan pada ruangan ini.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nomor</th>
                      <th>Kategori</th>
                      <th>Waktu</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pengaduan.map((p) => (
                      <tr key={p.id}>
                        <td className="whitespace-nowrap font-mono text-xs">{p.nomor}</td>
                        <td>{p.kategori}</td>
                        <td className="whitespace-nowrap text-xs text-slate-500">
                          {formatTanggalWaktu(p.created_at)}
                        </td>
                        <td>
                          <span className={warnaStatusPengaduan(p.status)}>
                            {LABEL_STATUS_PENGADUAN[p.status as never] ?? p.status}
                          </span>
                        </td>
                        <td className="text-right">
                          <Link
                            href={`/admin/pengaduan/${p.id}`}
                            className="text-sm font-semibold text-brand-700 hover:underline"
                          >
                            Detail
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside>
          <div className="card-pad">
            <h2 className="section-title mb-4">Ubah Data Ruangan</h2>
            <FormRuangan data={room} />
          </div>
        </aside>
      </div>
    </div>
  );
}
