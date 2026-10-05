import Link from "next/link";
import { db } from "@/lib/db";
import { wajibAdmin } from "@/lib/auth";
import KalenderJadwal, { type EventKalender } from "@/components/KalenderJadwal";
import {
  LABEL_STATUS_JADWAL,
  LABEL_STATUS_PERMOHONAN,
  formatJam,
  hariIniISO,
  rentangWaktu,
  warnaStatusJadwal,
  warnaStatusPermohonan,
  waktuBentrok,
} from "@/lib/utils";
import AksiJadwal from "./AksiJadwal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Jadwal Kunjungan" };

interface BarisJadwal {
  id: number;
  application_id: number;
  room_id: number;
  tanggal: string;
  waktu_mulai: string;
  waktu_selesai: string;
  penanggung_jawab: string | null;
  status: string;
  catatan: string | null;
  nomor: string;
  nama_kelompok: string;
  jumlah_peserta: number;
  nama_ruangan: string;
  kode_ruangan: string;
  kapasitas: number;
  hadir: number;
}

/** Modul Jadwal — Bab 33 dokumen analisis. */
export default function HalamanJadwalAdmin() {
  wajibAdmin();

  const jadwal = db
    .prepare(
      `SELECT s.*, a.nomor, a.nama_kelompok, a.jumlah_peserta,
              r.nama AS nama_ruangan, r.kode AS kode_ruangan, r.kapasitas,
              (SELECT COUNT(*) FROM attendance t WHERE t.schedule_id = s.id) AS hadir
         FROM visit_schedules s
         JOIN visit_applications a ON a.id = s.application_id
         JOIN rooms r ON r.id = s.room_id
        ORDER BY s.tanggal, s.waktu_mulai`
    )
    .all() as BarisJadwal[];

  // Deteksi bentrokan untuk peringatan — Aturan Bisnis no. 4
  const bentrok = new Set<number>();
  for (let i = 0; i < jadwal.length; i++) {
    for (let j = i + 1; j < jadwal.length; j++) {
      const a = jadwal[i];
      const b = jadwal[j];
      if (
        a.room_id === b.room_id &&
        a.tanggal === b.tanggal &&
        a.status !== "DIBATALKAN" &&
        b.status !== "DIBATALKAN" &&
        waktuBentrok(a.waktu_mulai, a.waktu_selesai, b.waktu_mulai, b.waktu_selesai)
      ) {
        bentrok.add(a.id);
        bentrok.add(b.id);
      }
    }
  }

  // Satu entri per permohonan per tanggal; ruangan-ruangannya digabung
  const kelompok = new Map<string, BarisJadwal[]>();
  for (const j of jadwal) {
    const k = `${j.application_id}|${j.tanggal}`;
    if (!kelompok.has(k)) kelompok.set(k, []);
    kelompok.get(k)!.push(j);
  }

  const events: EventKalender[] = Array.from(kelompok.values()).map((isi) => {
    const j = isi[0];
    const aktif = isi.filter((x) => x.status !== "DIBATALKAN");
    const utama = aktif[0] ?? j;
    const mulai = isi.reduce((m, x) => (x.waktu_mulai < m ? x.waktu_mulai : m), j.waktu_mulai);
    const selesai = isi.reduce((m, x) => (x.waktu_selesai > m ? x.waktu_selesai : m), j.waktu_selesai);
    return {
      id: j.id,
      tanggal: j.tanggal,
      waktu: rentangWaktu(mulai, selesai),
      judul: j.nama_kelompok,
      nomor: j.nomor,
      statusLabel: LABEL_STATUS_JADWAL[utama.status as never] ?? utama.status,
      statusClass: warnaStatusJadwal(utama.status),
      href: `/admin/permohonan/${j.application_id}`,
      bentrok: isi.some((x) => bentrok.has(x.id)),
      info: [`Peserta: ${j.jumlah_peserta} · Hadir: ${isi.reduce((n, x) => n + x.hadir, 0)}`],
      sesi: isi.map((x) => ({
        id: x.id,
        waktu: rentangWaktu(x.waktu_mulai, x.waktu_selesai),
        ruangan: `${x.nama_ruangan} (${x.kode_ruangan}) · kapasitas ${x.kapasitas}`,
        statusLabel: LABEL_STATUS_JADWAL[x.status as never] ?? x.status,
        statusClass: warnaStatusJadwal(x.status),
        bentrok: bentrok.has(x.id),
        aksi: <AksiJadwal scheduleId={x.id} status={x.status} />,
      })),
    };
  });

  const kunjunganTidakResmi = db.prepare(
    `SELECT id, nomor, nama_kelompok, jumlah_peserta, tanggal_usulan, waktu_mulai_usulan,
            waktu_selesai_usulan, status
       FROM visit_applications
      WHERE jenis_kunjungan = 'TIDAK_RESMI'`
  ).all() as { id: number; nomor: string; nama_kelompok: string; jumlah_peserta: number; tanggal_usulan: string; waktu_mulai_usulan: string; waktu_selesai_usulan: string; status: string }[];
  events.push(...kunjunganTidakResmi.map((k) => {
    const waktu = `${formatJam(k.waktu_mulai_usulan)}–${formatJam(k.waktu_selesai_usulan)}`;
    const label = LABEL_STATUS_PERMOHONAN[k.status as keyof typeof LABEL_STATUS_PERMOHONAN] ?? k.status;
    return {
      id: -k.id, tanggal: k.tanggal_usulan, waktu, judul: k.nama_kelompok,
      nomor: k.nomor, statusLabel: label, statusClass: warnaStatusPermohonan(k.status),
      href: `/admin/permohonan/${k.id}`,
      info: [`Kunjungan tidak resmi · Peserta: ${k.jumlah_peserta} · tanpa ruangan`],
      sesi: [{ id: -k.id, waktu, ruangan: "Tidak menggunakan ruangan", statusLabel: label, statusClass: warnaStatusPermohonan(k.status) }],
    };
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Jadwal Kunjungan</h1>
        <p className="mt-1 text-sm text-slate-600">
          Kalender jadwal yang diusulkan dan dikonfirmasi. Kunjungan tidak resmi memakai tanggal dan waktu usulan tanpa pembagian ruangan.
        </p>
      </header>

      {bentrok.size > 0 && (
        <p className="alert-error">
          Terdapat {bentrok.size} jadwal yang bentrok pada ruangan dan waktu yang sama. Periksa
          jadwal yang ditandai merah.
        </p>
      )}

      {jadwal.length === 0 && (
        <p className="text-sm text-slate-600">
          Belum ada jadwal.{" "}
          <Link href="/admin/permohonan?status=DITERIMA" className="font-semibold text-brand-700 hover:underline">
            Lihat permohonan diterima
          </Link>
        </p>
      )}

      <KalenderJadwal events={events} hariIni={hariIniISO()} />
    </div>
  );
}
