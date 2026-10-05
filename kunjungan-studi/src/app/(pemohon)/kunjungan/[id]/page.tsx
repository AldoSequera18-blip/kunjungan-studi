import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { wajibPemohon } from "@/lib/auth";
import {
  LABEL_STATUS_JADWAL,
  LABEL_STATUS_PERMOHONAN,
  formatTanggal,
  formatTanggalWaktu,
  rentangWaktu,
  warnaStatusJadwal,
  warnaStatusPermohonan,
} from "@/lib/utils";
import type { Attendance, Room, VisitApplication, Visitor } from "@/lib/types";
import FormPermohonan from "../FormPermohonan";
import PanelPeserta from "./PanelPeserta";
import AksiPermohonan from "./AksiPermohonan";
import PanelSurat from "./PanelSurat";

export const dynamic = "force-dynamic";

export default async function DetailKunjungan({ params }: { params: { id: string } }) {
  const user = await wajibPemohon();
  const id = Number(params.id);

  // Aturan Bisnis no. 2 — pemohon hanya melihat kunjungan miliknya sendiri
  const app = await db
    .prepare(`SELECT * FROM visit_applications WHERE id = ? AND user_id = ?`)
    .get(id, user.id) as VisitApplication | undefined;
  if (!app) notFound();

  const peserta = await db
    .prepare(`SELECT * FROM visitors WHERE application_id = ? ORDER BY jenis DESC, nama`)
    .all(id) as Visitor[];

  const jadwal = await db
    .prepare(
      `SELECT s.*, r.nama AS nama_ruangan, r.kode AS kode_ruangan, r.lokasi
         FROM visit_schedules s JOIN rooms r ON r.id = s.room_id
        WHERE s.application_id = ? ORDER BY s.tanggal, s.waktu_mulai`
    )
    .all(id) as (import("@/lib/types").VisitSchedule & {
    nama_ruangan: string;
    kode_ruangan: string;
    lokasi: string | null;
  })[];

  const kehadiran = await db
    .prepare(
      `SELECT t.*, r.nama AS nama_ruangan FROM attendance t
         JOIN rooms r ON r.id = t.room_id
        WHERE t.application_id = ? ORDER BY t.checkin_at DESC`
    )
    .all(id) as (Attendance & { nama_ruangan: string })[];

  const surat = await db
    .prepare(
      `SELECT id, nama_file, created_at FROM documents
        WHERE application_id = ? AND jenis = 'SURAT_PERMOHONAN' ORDER BY id DESC LIMIT 1`
    )
    .get(id) as { id: number; nama_file: string; created_at: string } | undefined;

  const semuaRuangan = await db
    .prepare(`SELECT * FROM rooms WHERE status != 'TIDAK_AKTIF' ORDER BY kode`)
    .all() as Room[];

  const bolehUbahData = ["DRAFT", "PERLU_PERBAIKAN"].includes(app.status);
  const bolehUbahPeserta = !["SELESAI", "DIBATALKAN", "DITOLAK"].includes(app.status);
  const bisaDibatalkan = !["SELESAI", "DIBATALKAN", "BERLANGSUNG"].includes(app.status);

  return (
    <div className="space-y-6">
      <header>
        <Link href="/kunjungan" className="text-sm font-semibold text-brand-700 hover:underline">
          ← Kembali ke daftar kunjungan
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-sm text-slate-500">{app.nomor}</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{app.nama_kelompok}</h1>
            <p className="text-sm text-slate-600">{app.asal_instansi}</p>
            <span className="badge-slate mt-2 inline-flex">Kunjungan {app.jenis_kunjungan === "TIDAK_RESMI" ? "Tidak Resmi" : "Resmi"}</span>
          </div>
          <span className={warnaStatusPermohonan(app.status)}>
            {LABEL_STATUS_PERMOHONAN[app.status] ?? app.status}
          </span>
        </div>
      </header>

      {/* ---- Catatan admin ---- */}
      {app.status === "PERLU_PERBAIKAN" && (
        <div className="alert-warning">
          <p className="font-semibold">Permohonan perlu diperbaiki</p>
          <p className="mt-1">{app.catatan_admin || "Silakan periksa kembali data permohonan."}</p>
        </div>
      )}
      {app.status === "DITOLAK" && (
        <div className="alert-error">
          <p className="font-semibold">Permohonan ditolak</p>
          <p className="mt-1">{app.alasan_keputusan || "Alasan tidak dicantumkan."}</p>
        </div>
      )}
      {["DITERIMA", "DIJADWALKAN"].includes(app.status) && (
        <div className="alert-success">
          <p className="font-semibold">Permohonan diterima</p>
          <p className="mt-1">
            {app.alasan_keputusan ||
              "Silakan periksa jadwal dan ruangan yang telah ditetapkan admin Balai."}
          </p>
        </div>
      )}

      {/* ---- Ringkasan ---- */}
      <section className="card-pad">
        <h2 className="section-title">Ringkasan Permohonan</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Jenis Instansi", app.jenis_instansi ?? "-"],
            ["Jumlah Peserta", `${app.jumlah_peserta} orang`],
            ["Tanggal Diusulkan", formatTanggal(app.tanggal_usulan)],
            ["Waktu Diusulkan", rentangWaktu(app.waktu_mulai_usulan, app.waktu_selesai_usulan)],
            ["Penanggung Jawab", app.penanggung_jawab ?? "-"],
            ["Telepon PJ", app.telepon_pj ?? "-"],
            ["Diajukan Pada", formatTanggalWaktu(app.created_at)],
            ["Terakhir Diperbarui", formatTanggalWaktu(app.updated_at)],
          ].map(([k, v]) => (
            <div key={k as string}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k}</dt>
              <dd className="mt-1 text-sm text-slate-800">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Tujuan Kunjungan
          </p>
          <p className="mt-1 text-sm text-slate-700">{app.tujuan}</p>
        </div>
        {app.catatan && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Catatan</p>
            <p className="mt-1 text-sm text-slate-700">{app.catatan}</p>
          </div>
        )}
      </section>

      {/* ---- Jadwal & ruangan ---- */}
      {app.jenis_kunjungan === "RESMI" && <section className="card">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="section-title">Jadwal &amp; Pembagian Ruangan</h2>
        </div>
        {jadwal.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">
            Belum ada jadwal dan ruangan yang dipilih. Pilih ruangan pada bagian Ubah Data
            Permohonan di bawah, lalu ajukan ke admin.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Waktu</th>
                  <th>Ruangan</th>
                  <th>Penanggung Jawab</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {jadwal.map((j) => (
                  <tr key={j.id}>
                    <td className="whitespace-nowrap font-medium text-slate-900">
                      {formatTanggal(j.tanggal)}
                    </td>
                    <td className="whitespace-nowrap">
                      {rentangWaktu(j.waktu_mulai, j.waktu_selesai)}
                    </td>
                    <td>
                      {j.nama_ruangan}
                      <span className="block text-xs text-slate-500">
                        {j.kode_ruangan}
                        {j.lokasi ? ` · ${j.lokasi}` : ""}
                      </span>
                    </td>
                    <td>{j.penanggung_jawab ?? "-"}</td>
                    <td>
                      <span className={warnaStatusJadwal(j.status)}>
                        {LABEL_STATUS_JADWAL[j.status] ?? j.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>}

      {/* ---- Surat kunjungan ---- */}
      {app.jenis_kunjungan === "RESMI" && <PanelSurat applicationId={app.id} surat={surat ?? null} bolehUbah={bolehUbahPeserta} />}

      {/* ---- Peserta ---- */}
      <PanelPeserta applicationId={app.id} peserta={peserta} bolehUbah={bolehUbahPeserta} />

      {/* ---- Riwayat kehadiran ---- */}
      {kehadiran.length > 0 && (
        <section className="card">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="section-title">Riwayat Daftar Hadir ({kehadiran.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Nama Peserta</th>
                  <th>Ruangan</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                </tr>
              </thead>
              <tbody>
                {kehadiran.map((k) => (
                  <tr key={k.id}>
                    <td className="font-medium text-slate-900">{k.nama_peserta}</td>
                    <td>{k.nama_ruangan}</td>
                    <td className="whitespace-nowrap">{formatTanggalWaktu(k.checkin_at)}</td>
                    <td className="whitespace-nowrap">
                      {k.checkout_at ? formatTanggalWaktu(k.checkout_at) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ---- Tindakan ---- */}
      <AksiPermohonan
        id={app.id}
        bisaDiajukan={bolehUbahData}
        bisaDibatalkan={bisaDibatalkan}
      />

      {/* ---- Ubah data ---- */}
      {bolehUbahData && (
        <section>
          <h2 className="section-title mb-3">Ubah Data Permohonan</h2>
          <FormPermohonan
            mode="ubah"
            data={app}
            ruangan={semuaRuangan}
            ruanganTerpilih={jadwal.filter((j) => j.status === "DIUSULKAN").map((j) => j.room_id)}
          />
        </section>
      )}
    </div>
  );
}
