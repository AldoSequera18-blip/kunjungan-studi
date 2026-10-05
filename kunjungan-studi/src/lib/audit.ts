import { db } from "./db";

/**
 * Mencatat aktivitas penting ke audit_logs — Bab 39 dokumen analisis.
 * Contoh aksi: BUAT_PERMOHONAN, UBAH_STATUS, BUAT_JADWAL, CHECKIN,
 * BUAT_PENGADUAN, TINDAK_LANJUT, LOGIN, LOGOUT.
 */
export async function catatAudit(params: {
  userId?: number | null;
  aktor: string;
  aksi: string;
  entitas?: string;
  entitasId?: string | number;
  detail?: string;
}) {
  await db.prepare(
    `INSERT INTO audit_logs (user_id, aktor, aksi, entitas, entitas_id, detail)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    params.userId ?? null,
    params.aktor,
    params.aksi,
    params.entitas ?? null,
    params.entitasId != null ? String(params.entitasId) : null,
    params.detail ?? null
  );
}

/** Mengirim notifikasi internal ke pengguna — Bab 38 dokumen analisis. */
export async function kirimNotifikasi(params: {
  userId: number;
  judul: string;
  pesan: string;
  link?: string;
}) {
  await db.prepare(
    `INSERT INTO notifications (user_id, judul, pesan, link) VALUES (?, ?, ?, ?)`
  ).run(params.userId, params.judul, params.pesan, params.link ?? null);
}

/** Mengirim notifikasi ke seluruh admin. */
export async function kirimNotifikasiAdmin(params: { judul: string; pesan: string; link?: string }) {
  const admins = await db.prepare(`SELECT id FROM users WHERE role = 'ADMIN' AND aktif = 1`).all() as {
    id: number;
  }[];
  for (const a of admins) {
    await kirimNotifikasi({ userId: a.id, ...params });
  }
}
