"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { catatAudit } from "@/lib/audit";
import { teks } from "@/lib/utils";
import type { FormState, RoomQrCode, VisitSchedule, Visitor } from "@/lib/types";

/**
 * Mencatat check-in peserta pada sebuah ruangan — Bab 17 & 18.
 * Aturan Bisnis no. 5: daftar hadir harus terkait kunjungan dan ruangan yang valid.
 */
export async function aksiCheckin(_prev: FormState, fd: FormData): Promise<FormState> {
  const token = teks(fd, "token");
  const scheduleId = Number(teks(fd, "schedule_id"));
  const visitorId = Number(teks(fd, "visitor_id")) || null;
  const namaManual = teks(fd, "nama_peserta");
  const metode = teks(fd, "metode") || "PILIH_NAMA";

  const qr = db
    .prepare(`SELECT * FROM room_qr_codes WHERE token = ? AND aktif = 1 AND tipe = 'ABSENSI'`)
    .get(token) as RoomQrCode | undefined;
  if (!qr) return { error: "QR Code daftar hadir tidak dikenali atau sudah tidak aktif." };

  const jadwal = db
    .prepare(`SELECT * FROM visit_schedules WHERE id = ?`)
    .get(scheduleId) as VisitSchedule | undefined;
  if (!jadwal) return { error: "Jadwal kunjungan tidak ditemukan." };

  // Kunjungan harus benar-benar dijadwalkan pada ruangan ini
  if (jadwal.room_id !== qr.room_id) {
    return { error: "Jadwal tersebut tidak menggunakan ruangan ini." };
  }
  if (jadwal.status === "DIBATALKAN") {
    return { error: "Jadwal kunjungan ini telah dibatalkan." };
  }

  let nama = namaManual;
  if (visitorId) {
    const peserta = db
      .prepare(`SELECT * FROM visitors WHERE id = ? AND application_id = ?`)
      .get(visitorId, jadwal.application_id) as Visitor | undefined;
    if (!peserta) return { error: "Peserta tidak terdaftar pada kunjungan ini." };
    nama = peserta.nama;

    const sudah = db
      .prepare(
        `SELECT id FROM attendance WHERE schedule_id = ? AND visitor_id = ? AND checkout_at IS NULL`
      )
      .get(scheduleId, visitorId);
    if (sudah) return { error: `${nama} sudah tercatat hadir di ruangan ini.` };
  } else if (!nama) {
    return { error: "Pilih nama peserta atau isi nama secara manual." };
  }

  db.prepare(
    `INSERT INTO attendance
       (schedule_id, application_id, room_id, visitor_id, nama_peserta, metode)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(scheduleId, jadwal.application_id, jadwal.room_id, visitorId, nama, metode);

  // Kunjungan yang sudah ada kehadirannya otomatis berstatus berlangsung
  if (jadwal.status === "TERJADWAL") {
    db.prepare(`UPDATE visit_schedules SET status = 'BERLANGSUNG' WHERE id = ?`).run(scheduleId);
    db.prepare(
      `UPDATE visit_applications SET status = 'BERLANGSUNG', updated_at = datetime('now')
        WHERE id = ? AND status IN ('DITERIMA','DIJADWALKAN')`
    ).run(jadwal.application_id);
  }

  catatAudit({
    aktor: nama,
    aksi: "CHECKIN",
    entitas: "ATTENDANCE",
    entitasId: scheduleId,
    detail: `Check-in pada jadwal #${scheduleId}`,
  });

  revalidatePath(`/hadir/${token}`);
  return { success: `Check-in berhasil untuk ${nama}.` };
}

/** Mencatat check-out peserta (opsional, Bab 18). */
export async function aksiCheckout(_prev: FormState, fd: FormData): Promise<FormState> {
  const token = teks(fd, "token");
  const attendanceId = Number(teks(fd, "attendance_id"));

  const baris = db
    .prepare(`SELECT nama_peserta, checkout_at FROM attendance WHERE id = ?`)
    .get(attendanceId) as { nama_peserta: string; checkout_at: string | null } | undefined;
  if (!baris) return { error: "Data kehadiran tidak ditemukan." };
  if (baris.checkout_at) return { error: "Peserta sudah melakukan check-out." };

  db.prepare(`UPDATE attendance SET checkout_at = datetime('now') WHERE id = ?`).run(attendanceId);

  catatAudit({
    aktor: baris.nama_peserta,
    aksi: "CHECKOUT",
    entitas: "ATTENDANCE",
    entitasId: attendanceId,
  });

  revalidatePath(`/hadir/${token}`);
  return { success: `Check-out tercatat untuk ${baris.nama_peserta}.` };
}
