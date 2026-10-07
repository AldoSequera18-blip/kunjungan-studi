import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { wajibAdmin } from "@/lib/auth";
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
import PanelVerifikasi from "./PanelVerifikasi";

export const dynamic = "force-dynamic";

export default async function DetailPermohonanAdmin({ params }: { params: Promise<{ id: string }> }) {
  await wajibAdmin();
  const { id: idParam } = await params;
  const id = Number(idParam);

  const app = await db
    .prepare(
      `SELECT a.*, u.nama AS nama_pemohon, u.email, u.telepon, u.instansi, u.alamat
         FROM visit_applications a JOIN users u ON u.id = a.user_id
        WHERE a.id = ?`
    )
    .get(id) as
    | (VisitApplication & {
        nama_pemohon: string;
        email: string;
        telepon: string | null;
        instansi: string | null;
        alamat: string | null;
      })
    | undefined;
  if (!app) notFound();

  const peserta = await db
    .prepare(`SELECT * FROM visitors WHERE application_id = ? ORDER BY jenis DESC, nama`)
    .all(id) as Visitor[];

  const dokumen = await db
    .prepare(`SELECT * FROM documents WHERE application_id = ? ORDER BY created_at`)
    .all(id) as { id: number; jenis: string; nama_file: string; url: string | null }[];

  const jadwal = await db
    .prepare(
      `SELECT s.*, r.nama AS nama_ruangan, r.kode AS kode_ruangan, r.kapasitas
         FROM visit_schedules s JOIN rooms r ON r.id = s.room_id
        WHERE s.application_id = ? ORDER BY s.tanggal, s.waktu_mulai`
    )
    .all(id) as (import("@/lib/types").VisitSchedule & {
    nama_ruangan: string;
    kode_ruangan: string;
    kapasitas: number;
  })[];

  const kehadiran = await db
    .prepare(
      `SELECT t.*, r.nama AS nama_ruangan FROM attendance t JOIN rooms r ON r.id = t.room_id
        WHERE t.application_id = ? ORDER BY t.checkin_at DESC`
    )
    .all(id) as (Attendance & { nama_ruangan: string })[];



  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/permohonan" className="text-sm font-semibold text-brand-700 hover:underline">
          ← Kembali ke daftar permohonan
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-sm text-slate-500">{app.nomor}</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{app.nama_kelompok}</h1>
            <p className="text-sm text-slate-600">{app.asal_instansi}</p>
            <span className="badge-slate mt-2 inline-flex">Kunjungan {app.jenis_kunjungan === "TIDAK_RESMI" ? "Mandiri" : "Resmi"}</span>
          </div>
          <span className={warnaStatusPermohonan(app.status)}>
            {LABEL_STATUS_PERMOHONAN[app.status] ?? app.status}
          </span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ---- Kolom kiri: data ---- */}
        <div className="space-y-6 lg:col-span-2">
          {/* Data pemohon — Bab 9 */}
          <section className="card-pad">
            <h2 className="section-title">Data Pemohon</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                ["Nama Lengkap", app.nama_pemohon],
                ["Email", app.email],
                ["Telepon", app.telepon ?? "-"],
                ["Instansi", app.instansi ?? "-"],
                ["Alamat", app.alamat ?? "-"],
                ["Penanggung Jawab", `${app.penanggung_jawab ?? "-"} (${app.telepon_pj ?? "-"})`],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k}</dt>
                  <dd className="mt-1 text-sm text-slate-800">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Data kelompok */}
          <section className="card-pad">
            <h2 className="section-title">Data Kelompok &amp; Usulan</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                ["Jenis Instansi", app.jenis_instansi ?? "-"],
                ["Jumlah Peserta Diajukan", `${app.jumlah_peserta} orang`],
                ["Peserta Terdaftar", `${peserta.length} orang`],
                ["Tanggal Diusulkan", formatTanggal(app.tanggal_usulan)],
                ["Waktu Diusulkan", rentangWaktu(app.waktu_mulai_usulan, app.waktu_selesai_usulan)],
                ["Diajukan Pada", formatTanggalWaktu(app.created_at)],
              ].map(([k, v]) => (
                <div key={k}>
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
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Catatan Pemohon
                </p>
                <p className="mt-1 text-sm text-slate-700">{app.catatan}</p>
              </div>
            )}

            {peserta.length < app.jumlah_peserta && (
              <p className="alert-warning mt-4">
                Daftar peserta belum lengkap: {peserta.length} dari {app.jumlah_peserta} orang.
              </p>
            )}
          </section>

          {/* Daftar peserta */}
          <section className="card">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="section-title">Daftar Peserta ({peserta.length})</h2>
            </div>
            {peserta.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">
                Pemohon belum mengisi daftar peserta.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="w-10">#</th>
                      <th>Nama</th>
                      <th>Identitas</th>
                      <th>Jenis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {peserta.map((p, i) => (
                      <tr key={p.id}>
                        <td className="text-slate-400">{i + 1}</td>
                        <td className="font-medium text-slate-900">{p.nama}</td>
                        <td>{p.identitas ?? "-"}</td>
                        <td>
                          <span className={p.jenis === "PENDAMPING" ? "badge-purple" : "badge-slate"}>
                            {p.jenis === "PENDAMPING" ? "Pendamping" : "Peserta"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Dokumen hanya diwajibkan pada kunjungan resmi */}
          {app.jenis_kunjungan === "RESMI" && <section className="card-pad">
            <h2 className="section-title">Dokumen Pendukung</h2>
            {dokumen.length === 0 ? (
              <p className="hint mt-2">
                Tidak ada dokumen yang diunggah. Status wajib/tidaknya dokumen ditetapkan setelah
                dikonfirmasi oleh Balai.
              </p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {dokumen.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
                    <span>
                      <span className="font-medium text-slate-800">{d.nama_file}</span>
                      <span className="block text-xs text-slate-500">{d.jenis}</span>
                    </span>
                    {d.url && (
                      <a href={d.url} className="text-sm font-semibold text-brand-700 hover:underline">
                        Buka
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>}

          {/* Jadwal dan ruangan hanya digunakan pada kunjungan resmi */}
          {app.jenis_kunjungan === "RESMI" && <section className="card">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="section-title">Jadwal &amp; Pembagian Ruangan</h2>
            </div>

            {jadwal.length > 0 && (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Waktu</th>
                      <th>Ruangan</th>
                      <th>Kapasitas</th>
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
                          <span className="block text-xs text-slate-500">{j.kode_ruangan}</span>
                        </td>
                        <td className={j.kapasitas < app.jumlah_peserta ? "text-rose-600" : ""}>
                          {j.kapasitas}
                        </td>
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

            {jadwal.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">
                Pemohon belum memilih jadwal dan ruangan.
              </p>
            ) : (
              jadwal.some((j) => j.status === "DIUSULKAN") && (
                <p className="border-t border-slate-100 px-5 py-4 text-sm text-slate-600">
                  Jadwal dan ruangan dipilih oleh pemohon. Admin cukup memverifikasi dan memutuskan
                  (terima, minta perbaikan, atau tolak) melalui panel verifikasi.
                </p>
              )
            )}
          </section>}

          {/* Kehadiran */}
          {kehadiran.length > 0 && (
            <section className="card">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="section-title">Daftar Hadir ({kehadiran.length})</h2>
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
        </div>

        {/* ---- Kolom kanan: tindakan ---- */}
        <aside className="space-y-6">
          <PanelVerifikasi id={app.id} status={app.status} jenisKunjungan={app.jenis_kunjungan} />

          {(app.alasan_keputusan || app.catatan_admin) && (
            <section className="card-pad">
              <h2 className="section-title">Riwayat Keputusan</h2>
              {app.verified_at && (
                <p className="hint mt-2">Diputuskan {formatTanggalWaktu(app.verified_at)}</p>
              )}
              {app.alasan_keputusan && (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Keterangan untuk Pemohon
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{app.alasan_keputusan}</p>
                </div>
              )}
              {app.catatan_admin && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Catatan Internal
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{app.catatan_admin}</p>
                </div>
              )}
            </section>
          )}

          <section className="card-pad">
            <h2 className="section-title">Ceklis Verifikasi</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {[
                ["Data pemohon lengkap", !!app.telepon_pj || !!app.telepon],
                ["Daftar peserta lengkap", peserta.length >= app.jumlah_peserta],
                ["Tujuan kunjungan jelas", app.tujuan.length > 15],
                ["Tanggal & waktu valid", app.waktu_selesai_usulan > app.waktu_mulai_usulan],
                ...(app.jenis_kunjungan === "RESMI" ? [["Jadwal & ruangan dipilih pemohon", jadwal.some((j) => j.status !== "DIBATALKAN")]] : []),
              ].map(([label, ok]) => (
                <li key={label as string} className="flex items-start gap-2">
                  <span className={ok ? "text-emerald-600" : "text-amber-500"}>{ok ? "✓" : "•"}</span>
                  <span>{label as string}</span>
                </li>
              ))}
            </ul>
            <p className="hint mt-4">
              Ketersediaan kapasitas dan dokumen wajib mengikuti kebijakan resmi Balai.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
