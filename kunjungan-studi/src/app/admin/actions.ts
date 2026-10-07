"use server";

import { revalidatePath } from "next/cache";
import { db, randomToken } from "@/lib/db";
import { cekPassword, hashPassword, wajibAdmin } from "@/lib/auth";
import { catatAudit, kirimNotifikasi } from "@/lib/audit";
import {
  angka,
  emailValid,
  teks,
  teleponValid,
  waktuBentrok,
} from "@/lib/utils";
import type {
  FormState,
  StatusPengaduan,
  VisitApplication,
  VisitSchedule,
} from "@/lib/types";

/* ================================================================= */
/* Verifikasi & keputusan permohonan — Bab 13 & 14                   */
/* ================================================================= */

export async function aksiMulaiVerifikasi(_prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await wajibAdmin();
  const id = angka(fd, "id");

  const app = await db.prepare(`SELECT * FROM visit_applications WHERE id = ?`).get(id) as
    | VisitApplication
    | undefined;
  if (!app) return { error: "Permohonan tidak ditemukan." };
  if (app.status !== "DIAJUKAN") {
    return { error: "Hanya permohonan berstatus Diajukan yang dapat mulai diverifikasi." };
  }

  await db.prepare(
    `UPDATE visit_applications
        SET status = 'DALAM_VERIFIKASI', verified_by = ?, updated_at = datetime('now')
      WHERE id = ?`
  ).run(admin.id, id);

  await catatAudit({
    userId: admin.id,
    aktor: admin.nama,
    aksi: "MULAI_VERIFIKASI",
    entitas: "VISIT_APPLICATION",
    entitasId: id,
    detail: app.nomor,
  });

  await kirimNotifikasi({
    userId: app.user_id,
    judul: "Permohonan sedang diverifikasi",
    pesan: `Permohonan ${app.nomor} sedang diperiksa oleh admin Balai.`,
    link: `/kunjungan/${id}`,
  });

  revalidatePath(`/admin/permohonan/${id}`);
  return { success: "Permohonan masuk tahap verifikasi." };
}

export async function aksiKeputusanPermohonan(
  _prev: FormState,
  fd: FormData
): Promise<FormState> {
  const admin = await wajibAdmin();
  const id = angka(fd, "id");
  const keputusan = teks(fd, "keputusan"); // DITERIMA | DITOLAK | PERLU_PERBAIKAN
  const alasan = teks(fd, "alasan");
  const catatanInternal = teks(fd, "catatan_admin");

  const app = await db.prepare(`SELECT * FROM visit_applications WHERE id = ?`).get(id) as
    | VisitApplication
    | undefined;
  if (!app) return { error: "Permohonan tidak ditemukan." };
  if (!["DIAJUKAN", "DALAM_VERIFIKASI"].includes(app.status)) {
    return { error: "Keputusan hanya dapat diberikan pada permohonan yang sedang diverifikasi." };
  }
  if (!["DITERIMA", "DITOLAK", "PERLU_PERBAIKAN"].includes(keputusan)) {
    return { error: "Keputusan tidak dikenali." };
  }
  if (keputusan !== "DITERIMA" && !alasan) {
    return { error: "Alasan wajib diisi untuk penolakan atau permintaan perbaikan." };
  }

  if (keputusan === "DITERIMA" && app.jenis_kunjungan === "RESMI") {
    const galatJadwal = await periksaUsulanJadwal(id);
    if (galatJadwal) return { error: galatJadwal };
  }

  await db.prepare(
    `UPDATE visit_applications
        SET status = ?, alasan_keputusan = ?, catatan_admin = ?,
            verified_by = ?, verified_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?`
  ).run(
    keputusan === "DITERIMA" ? "DIJADWALKAN" : keputusan,
    alasan || null,
    catatanInternal || null,
    admin.id,
    id
  );

  if (keputusan === "DITERIMA" && app.jenis_kunjungan === "RESMI") {
    await db.prepare(
      `UPDATE visit_schedules SET status = 'TERJADWAL' WHERE application_id = ? AND status = 'DIUSULKAN'`
    ).run(id);
  } else if (keputusan === "DITOLAK") {
    await db.prepare(
      `UPDATE visit_schedules SET status = 'DIBATALKAN' WHERE application_id = ? AND status = 'DIUSULKAN'`
    ).run(id);
  }

  await catatAudit({
    userId: admin.id,
    aktor: admin.nama,
    aksi: "KEPUTUSAN_PERMOHONAN",
    entitas: "VISIT_APPLICATION",
    entitasId: id,
    detail: `${app.nomor} → ${keputusan}`,
  });

  const pesan: Record<string, string> = {
    DITERIMA: app.jenis_kunjungan === "RESMI"
      ? `Permohonan ${app.nomor} disetujui. Jadwal dan ruangan yang Anda pilih telah dikonfirmasi.`
      : `Permohonan ${app.nomor} disetujui. Kunjungan mandiri tidak memerlukan pembagian ruangan.`,
    DITOLAK: `Permohonan ${app.nomor} ditolak. Alasan: ${alasan}`,
    PERLU_PERBAIKAN: `Permohonan ${app.nomor} perlu diperbaiki. Catatan: ${alasan}`,
  };
  await kirimNotifikasi({
    userId: app.user_id,
    judul: `Permohonan ${keputusan.toLowerCase().replace("_", " ")}`,
    pesan: pesan[keputusan],
    link: `/kunjungan/${id}`,
  });

  revalidatePath(`/admin/permohonan/${id}`);
  revalidatePath("/admin/permohonan");
  revalidatePath("/admin/jadwal");
  return { success: `Permohonan ditandai ${keputusan}.` };
}

export async function aksiSelesaikanKunjungan(
  _prev: FormState,
  fd: FormData
): Promise<FormState> {
  const admin = await wajibAdmin();
  const id = angka(fd, "id");

  const app = await db.prepare(`SELECT * FROM visit_applications WHERE id = ?`).get(id) as
    | VisitApplication
    | undefined;
  if (!app) return { error: "Permohonan tidak ditemukan." };

  await db.prepare(
    `UPDATE visit_applications SET status = 'SELESAI', updated_at = datetime('now') WHERE id = ?`
  ).run(id);
  await db.prepare(
    `UPDATE visit_schedules SET status = 'SELESAI'
      WHERE application_id = ? AND status IN ('TERJADWAL','BERLANGSUNG')`
  ).run(id);

  await catatAudit({
    userId: admin.id,
    aktor: admin.nama,
    aksi: "SELESAIKAN_KUNJUNGAN",
    entitas: "VISIT_APPLICATION",
    entitasId: id,
    detail: app.nomor,
  });

  await kirimNotifikasi({
    userId: app.user_id,
    judul: "Kunjungan selesai",
    pesan: `Kunjungan ${app.nomor} telah dinyatakan selesai. Terima kasih atas kunjungan Anda.`,
    link: `/kunjungan/${id}`,
  });

  revalidatePath(`/admin/permohonan/${id}`);
  return { success: "Kunjungan ditandai selesai." };
}

/* ================================================================= */
/* Jadwal & pembagian ruangan — Bab 15, 33                           */
/* ================================================================= */

/** Memeriksa bentrokan ruangan — Aturan Bisnis no. 4. */
async function cariBentrokan(
  roomId: number,
  tanggal: string,
  mulai: string,
  selesai: string,
  kecualiId?: number
) {
  const daftar = await db
    .prepare(
      `SELECT s.id, s.waktu_mulai, s.waktu_selesai, a.nomor, a.nama_kelompok
         FROM visit_schedules s JOIN visit_applications a ON a.id = s.application_id
        WHERE s.room_id = ? AND s.tanggal = ? AND s.status NOT IN ('DIBATALKAN','DIUSULKAN')`
    )
    .all(roomId, tanggal) as {
    id: number;
    waktu_mulai: string;
    waktu_selesai: string;
    nomor: string;
    nama_kelompok: string;
  }[];

  return daftar.find(
    (d) =>
      d.id !== kecualiId && waktuBentrok(mulai, selesai, d.waktu_mulai, d.waktu_selesai)
  );
}

/**
 * Admin hanya memutuskan usulan jadwal & ruangan dari pemohon — tidak memilih ruangan.
 * Mengembalikan pesan galat bila usulan tidak dapat disetujui.
 */
async function periksaUsulanJadwal(applicationId: number): Promise<string | null> {
  const usulan = await db
    .prepare(
      `SELECT s.*, r.nama AS nama_ruangan, r.status AS status_ruangan
         FROM visit_schedules s JOIN rooms r ON r.id = s.room_id
        WHERE s.application_id = ? AND s.status = 'DIUSULKAN'`
    )
    .all(applicationId) as (VisitSchedule & { nama_ruangan: string; status_ruangan: string })[];

  if (usulan.length === 0) {
    return "Pemohon belum memilih ruangan. Minta pemohon melengkapi jadwal dan ruangan melalui opsi perbaikan.";
  }
  for (const u of usulan) {
    if (u.status_ruangan !== "TERSEDIA") {
      return `Ruangan ${u.nama_ruangan} sedang tidak tersedia (${u.status_ruangan}). Minta pemohon memilih ruangan lain.`;
    }
    const bentrok = await cariBentrokan(u.room_id, u.tanggal, u.waktu_mulai, u.waktu_selesai);
    if (bentrok) {
      return `Bentrokan jadwal: ${u.nama_ruangan} sudah dipakai ${bentrok.nama_kelompok} (${bentrok.nomor}) pukul ${bentrok.waktu_mulai}–${bentrok.waktu_selesai}. Minta pemohon memperbaiki usulan atau tolak permohonan.`;
    }
  }
  return null;
}

export async function aksiUbahStatusJadwal(_prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await wajibAdmin();
  const id = angka(fd, "schedule_id");
  const status = teks(fd, "status");

  if (!["TERJADWAL", "BERLANGSUNG", "SELESAI", "DIBATALKAN"].includes(status)) {
    return { error: "Status jadwal tidak dikenali." };
  }

  const jadwal = await db.prepare(`SELECT * FROM visit_schedules WHERE id = ?`).get(id) as
    | VisitSchedule
    | undefined;
  if (!jadwal) return { error: "Jadwal tidak ditemukan." };

  await db.prepare(`UPDATE visit_schedules SET status = ? WHERE id = ?`).run(status, id);

  await catatAudit({
    userId: admin.id,
    aktor: admin.nama,
    aksi: "UBAH_STATUS_JADWAL",
    entitas: "VISIT_SCHEDULE",
    entitasId: id,
    detail: `Status → ${status}`,
  });

  revalidatePath("/admin/jadwal");
  revalidatePath(`/admin/permohonan/${jadwal.application_id}`);
  return { success: `Status jadwal diubah menjadi ${status}.` };
}

/* ================================================================= */
/* Ruangan & QR Code — Bab 16, 34                                    */
/* ================================================================= */

export async function aksiSimpanRuangan(_prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await wajibAdmin();
  const id = angka(fd, "id");
  const kode = teks(fd, "kode").toUpperCase();
  const nama = teks(fd, "nama");
  const kapasitas = angka(fd, "kapasitas");

  if (!kode || !nama) return { error: "Kode dan nama ruangan wajib diisi." };
  if (kapasitas < 1) return { error: "Kapasitas minimal 1 orang." };

  const bentrok = await db
    .prepare(`SELECT id FROM rooms WHERE kode = ? AND id != ?`)
    .get(kode, id || 0);
  if (bentrok) return { error: `Kode ruangan ${kode} sudah digunakan.` };

  if (id) {
    await db.prepare(
      `UPDATE rooms SET kode = ?, nama = ?, kapasitas = ?, lokasi = ?,
                        fasilitas = ?, status = ?, keterangan = ?
        WHERE id = ?`
    ).run(
      kode,
      nama,
      kapasitas,
      teks(fd, "lokasi") || null,
      teks(fd, "fasilitas") || null,
      teks(fd, "status") || "TERSEDIA",
      teks(fd, "keterangan") || null,
      id
    );

    await catatAudit({
      userId: admin.id,
      aktor: admin.nama,
      aksi: "UBAH_RUANGAN",
      entitas: "ROOM",
      entitasId: id,
      detail: `${kode} — ${nama}`,
    });

    revalidatePath("/admin/ruangan");
    revalidatePath(`/admin/ruangan/${id}`);
    return { success: "Data ruangan diperbarui." };
  }

  const info = await db
    .prepare(
      `INSERT INTO rooms (kode, nama, kapasitas, lokasi, fasilitas, status, keterangan)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      kode,
      nama,
      kapasitas,
      teks(fd, "lokasi") || null,
      teks(fd, "fasilitas") || null,
      teks(fd, "status") || "TERSEDIA",
      teks(fd, "keterangan") || null
    );

  const roomId = Number(info.lastInsertRowid);

  // Aturan Bisnis no. 6: setiap ruangan memiliki QR Code pengaduan yang unik
  await db.prepare(`INSERT INTO room_qr_codes (room_id, tipe, token) VALUES (?, 'PENGADUAN', ?)`).run(
    roomId,
    randomToken()
  );
  await db.prepare(`INSERT INTO room_qr_codes (room_id, tipe, token) VALUES (?, 'ABSENSI', ?)`).run(
    roomId,
    randomToken()
  );

  await catatAudit({
    userId: admin.id,
    aktor: admin.nama,
    aksi: "TAMBAH_RUANGAN",
    entitas: "ROOM",
    entitasId: roomId,
    detail: `${kode} — ${nama}`,
  });

  revalidatePath("/admin/ruangan");
  return { success: `Ruangan ${nama} ditambahkan beserta QR Code-nya.` };
}

/** Menerbitkan ulang token QR Code suatu ruangan. */
export async function aksiRegenerasiQr(_prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await wajibAdmin();
  const qrId = angka(fd, "qr_id");

  const qr = await db.prepare(`SELECT * FROM room_qr_codes WHERE id = ?`).get(qrId) as
    | { id: number; room_id: number; tipe: string }
    | undefined;
  if (!qr) return { error: "QR Code tidak ditemukan." };

  const token = randomToken();
  await db.prepare(`UPDATE room_qr_codes SET token = ? WHERE id = ?`).run(token, qrId);

  await catatAudit({
    userId: admin.id,
    aktor: admin.nama,
    aksi: "REGENERASI_QR",
    entitas: "ROOM_QR_CODE",
    entitasId: qrId,
    detail: `Tipe ${qr.tipe} pada ruangan #${qr.room_id}`,
  });

  revalidatePath(`/admin/ruangan/${qr.room_id}`);
  return { success: "QR Code baru diterbitkan. Cetak ulang dan pasang di ruangan." };
}

/* ================================================================= */
/* Tindak lanjut pengaduan — Bab 22, 36                              */
/* ================================================================= */

export async function aksiTindakLanjutPengaduan(
  _prev: FormState,
  fd: FormData
): Promise<FormState> {
  const admin = await wajibAdmin();
  const id = angka(fd, "id");
  const statusBaru = teks(fd, "status") as StatusPengaduan;
  const petugas = teks(fd, "petugas");
  const catatan = teks(fd, "catatan");

  const daftarStatus: StatusPengaduan[] = [
    "DIAJUKAN",
    "DIVERIFIKASI",
    "DITINDAKLANJUTI",
    "SELESAI",
    "DITOLAK",
    "TIDAK_VALID",
  ];
  if (!daftarStatus.includes(statusBaru)) return { error: "Status pengaduan tidak dikenali." };

  const laporan = await db
    .prepare(
      `SELECT f.*, r.nama AS nama_ruangan FROM facility_reports f
         JOIN rooms r ON r.id = f.room_id WHERE f.id = ?`
    )
    .get(id) as
    | {
        id: number;
        nomor: string;
        status: string;
        application_id: number | null;
        nama_ruangan: string;
      }
    | undefined;
  if (!laporan) return { error: "Pengaduan tidak ditemukan." };

  if (["DITOLAK", "TIDAK_VALID"].includes(statusBaru) && !catatan) {
    return { error: "Catatan wajib diisi saat menolak atau menandai pengaduan tidak valid." };
  }

  await db.prepare(
    `UPDATE facility_reports
        SET status = ?, petugas = ?, selesai_at = CASE WHEN ? = 'SELESAI' THEN datetime('now') ELSE selesai_at END
      WHERE id = ?`
  ).run(statusBaru, petugas || null, statusBaru, id);

  await db.prepare(
    `INSERT INTO report_actions (report_id, admin_id, status_dari, status_ke, petugas, catatan)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, admin.id, laporan.status, statusBaru, petugas || null, catatan || null);

  await catatAudit({
    userId: admin.id,
    aktor: admin.nama,
    aksi: "TINDAK_LANJUT_PENGADUAN",
    entitas: "FACILITY_REPORT",
    entitasId: id,
    detail: `${laporan.nomor}: ${laporan.status} → ${statusBaru}`,
  });

  // Memberi tahu pemohon bila pengaduan terkait kunjungannya
  if (laporan.application_id) {
    const pemilik = await db
      .prepare(`SELECT user_id, nomor FROM visit_applications WHERE id = ?`)
      .get(laporan.application_id) as { user_id: number; nomor: string } | undefined;
    if (pemilik) {
      await kirimNotifikasi({
        userId: pemilik.user_id,
        judul: "Status pengaduan diperbarui",
        pesan: `Pengaduan ${laporan.nomor} di ${laporan.nama_ruangan} kini berstatus ${statusBaru}.`,
        link: "/pengaduan-saya",
      });
    }
  }

  revalidatePath(`/admin/pengaduan/${id}`);
  revalidatePath("/admin/pengaduan");
  return { success: `Status pengaduan diperbarui menjadi ${statusBaru}.` };
}

/* ================================================================= */
/* Notifikasi admin                                                  */
/* ================================================================= */

export async function aksiBacaSemuaNotifikasiAdmin(): Promise<void> {
  const admin = await wajibAdmin();
  await db.prepare(`UPDATE notifications SET dibaca = 1 WHERE user_id = ?`).run(admin.id);
  revalidatePath("/admin/notifikasi");
}

/* ================================================================= */
/* Profil admin                                                      */
/* ================================================================= */

export async function aksiUbahProfilAdmin(_prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await wajibAdmin();

  const nama = teks(fd, "nama");
  const email = teks(fd, "email").toLowerCase();
  const telepon = teks(fd, "telepon");

  if (!nama || !email) return { error: "Nama dan email wajib diisi." };
  if (!emailValid(email)) return { error: "Format email tidak valid." };
  if (telepon && !teleponValid(telepon)) return { error: "Format nomor telepon tidak valid." };

  const bentrok = await db
    .prepare(`SELECT id FROM users WHERE email = ? AND id != ?`)
    .get(email, admin.id);
  if (bentrok) return { error: "Email tersebut sudah digunakan akun lain." };

  await db.prepare(`UPDATE users SET nama = ?, email = ?, telepon = ? WHERE id = ?`).run(
    nama,
    email,
    telepon || null,
    admin.id
  );

  await catatAudit({
    userId: admin.id,
    aktor: nama,
    aksi: "UBAH_PROFIL",
    entitas: "USER",
    entitasId: admin.id,
  });

  revalidatePath("/admin/profil");
  return { success: "Profil berhasil diperbarui." };
}

export async function aksiUbahPasswordAdmin(_prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await wajibAdmin();

  const lama = String(fd.get("password_lama") ?? "");
  const baru = String(fd.get("password_baru") ?? "");
  const konfirmasi = String(fd.get("konfirmasi") ?? "");

  if (!lama || !baru || !konfirmasi) return { error: "Semua kolom password wajib diisi." };
  if (baru.length < 8) return { error: "Password baru minimal 8 karakter." };
  if (baru !== konfirmasi) return { error: "Konfirmasi password tidak cocok." };

  const row = await db.prepare(`SELECT password_hash FROM users WHERE id = ?`).get(admin.id) as
    | { password_hash: string }
    | undefined;
  if (!row || !cekPassword(lama, row.password_hash)) {
    return { error: "Password lama tidak sesuai." };
  }

  await db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(hashPassword(baru), admin.id);

  await catatAudit({
    userId: admin.id,
    aktor: admin.nama,
    aksi: "UBAH_PASSWORD",
    entitas: "USER",
    entitasId: admin.id,
  });

  return { success: "Password berhasil diubah." };
}
