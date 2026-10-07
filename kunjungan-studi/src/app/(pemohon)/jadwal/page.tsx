import { db } from "@/lib/db";
import Link from "next/link";
import { wajibPemohon } from "@/lib/auth";
import KalenderJadwal, { type EventKalender } from "@/components/KalenderJadwal";
import {
  LABEL_STATUS_JADWAL,
  LABEL_STATUS_PERMOHONAN,
  hariIniISO,
  formatJam,
  rentangWaktu,
  warnaStatusJadwal,
  warnaStatusPermohonan,
} from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Jadwal Kunjungan" };

interface BarisJadwal {
  user_id: number;
  id: number;
  application_id: number;
  tanggal: string;
  waktu_mulai: string;
  waktu_selesai: string;
  penanggung_jawab: string | null;
  status: string;
  catatan: string | null;
  nomor: string;
  nama_kelompok: string;
  nama_ruangan: string;
  kode_ruangan: string;
  lokasi: string | null;
  fasilitas: string | null;
}

export default async function HalamanJadwalPemohon({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = await searchParams;
  const user = await wajibPemohon();
  const q = (query.q ?? "").trim().toLocaleLowerCase("id-ID");

  const jadwal = await db
    .prepare(
      `SELECT s.*, a.nomor, a.nama_kelompok, a.user_id,
              r.nama AS nama_ruangan, r.kode AS kode_ruangan, r.lokasi, r.fasilitas
         FROM visit_schedules s
         JOIN visit_applications a ON a.id = s.application_id
         JOIN rooms r ON r.id = s.room_id
        WHERE a.user_id = ? OR s.status != 'DIBATALKAN'
        ORDER BY s.tanggal DESC, s.waktu_mulai DESC`
    )
    .all(user.id) as BarisJadwal[];

  // Satu entri per permohonan per tanggal; ruangan-ruangannya digabung
  const kelompok = new Map<string, BarisJadwal[]>();
  for (const j of jadwal) {
    const k = `${j.application_id}|${j.tanggal}`;
    if (!kelompok.has(k)) kelompok.set(k, []);
    kelompok.get(k)!.push(j);
  }

  const events: EventKalender[] = Array.from(kelompok.values()).map((isi) => {
    isi.sort((x, y) => x.waktu_mulai.localeCompare(y.waktu_mulai));
    const j = isi[0];
    const milikSaya = j.user_id === user.id;
    const aktif = isi.filter((x) => x.status !== "DIBATALKAN");
    const utama = aktif[0] ?? j;
    const mulai = isi.reduce((m, x) => (x.waktu_mulai < m ? x.waktu_mulai : m), j.waktu_mulai);
    const selesai = isi.reduce((m, x) => (x.waktu_selesai > m ? x.waktu_selesai : m), j.waktu_selesai);
    const pj = isi.find((x) => x.penanggung_jawab)?.penanggung_jawab;
    return {
      id: j.id,
      tanggal: j.tanggal,
      waktu: rentangWaktu(mulai, selesai),
      judul: j.nama_kelompok,
      milikSaya,
      // Jadwal pemohon lain: hanya waktu, kelompok, dan ruangan yang ditampilkan
      nomor: milikSaya ? j.nomor : undefined,
      statusLabel: LABEL_STATUS_JADWAL[utama.status as never] ?? utama.status,
      statusClass: warnaStatusJadwal(utama.status),
      href: milikSaya ? `/kunjungan/${j.application_id}` : undefined,
      info: milikSaya
        ? [
            `Penanggung jawab: ${pj ?? "-"}`,
            ...isi.filter((x) => x.catatan).map((x) => `Catatan: ${x.catatan}`),
          ]
        : [],
      sesi: isi.map((x) => ({
        id: x.id,
        waktu: rentangWaktu(x.waktu_mulai, x.waktu_selesai),
        ruangan: [`${x.nama_ruangan} (${x.kode_ruangan})`, x.lokasi, milikSaya && x.fasilitas && `Fasilitas: ${x.fasilitas}`]
          .filter(Boolean)
          .join(" · "),
        statusLabel: LABEL_STATUS_JADWAL[x.status as never] ?? x.status,
        statusClass: warnaStatusJadwal(x.status),
      })),
    };
  });

  const kunjunganTidakResmi = await db.prepare(
    `SELECT id, nomor, nama_kelompok, user_id, tanggal_usulan, waktu_mulai_usulan,
            waktu_selesai_usulan, status
       FROM visit_applications
      WHERE jenis_kunjungan = 'TIDAK_RESMI'
        AND (status != 'DIBATALKAN' OR user_id = ?)`
  ).all(user.id) as { id: number; nomor: string; nama_kelompok: string; user_id: number; tanggal_usulan: string; waktu_mulai_usulan: string; waktu_selesai_usulan: string; status: string }[];
  events.push(...kunjunganTidakResmi.map((k) => {
    const milikSaya = k.user_id === user.id;
    const waktu = `${formatJam(k.waktu_mulai_usulan)}–${formatJam(k.waktu_selesai_usulan)}`;
    const label = LABEL_STATUS_PERMOHONAN[k.status as keyof typeof LABEL_STATUS_PERMOHONAN] ?? k.status;
    const warna = warnaStatusPermohonan(k.status);
    return {
      id: -k.id, tanggal: k.tanggal_usulan, waktu, judul: k.nama_kelompok,
      milikSaya, nomor: milikSaya ? k.nomor : undefined, statusLabel: label,
      statusClass: warna, href: milikSaya ? `/kunjungan/${k.id}` : undefined,
      info: ["Kunjungan mandiri · tanpa ruangan"],
      sesi: [{ id: -k.id, waktu, ruangan: "Tidak menggunakan ruangan", statusLabel: label, statusClass: warna }],
    };
  }));
  const hasilEvents = q ? events.filter((event) =>
    [event.judul, event.nomor ?? "", ...event.sesi.map((s) => s.ruangan)].some((value) => value.toLocaleLowerCase("id-ID").includes(q))
  ) : events;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Jadwal Kunjungan</h1>
        <p className="mt-1 text-sm text-slate-600">
          Jadwal usulan dan jadwal yang telah dikonfirmasi, termasuk kunjungan pemohon lain. Kunjungan mandiri tidak memakai ruangan; jadwal Anda ditandai warna hijau.
        </p>
      </header>

      <form method="get" className="flex flex-wrap gap-2">
        <input name="q" className="input max-w-md" defaultValue={query.q ?? ""} placeholder="Cari kelompok, nomor, atau ruangan" />
        <button type="submit" className="btn-secondary">Cari jadwal</button>
        {q && <Link href="/jadwal" className="btn-secondary">Reset</Link>}
      </form>

      <KalenderJadwal events={hasilEvents} hariIni={hariIniISO()} />
    </div>
  );
}
