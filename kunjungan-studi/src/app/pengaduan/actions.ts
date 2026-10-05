"use server";

import { revalidatePath } from "next/cache";
import { buatNomorPengaduan, db } from "@/lib/db";
import { catatAudit, kirimNotifikasiAdmin } from "@/lib/audit";
import { penggunaSaatIni } from "@/lib/auth";
import { teks } from "@/lib/utils";
import type { FormState, Room, RoomQrCode } from "@/lib/types";

/**
 * Menyimpan pengaduan fasilitas.
 * Ruangan diambil dari token QR Code sehingga identitas ruangan terbawa
 * otomatis dan pelapor tidak perlu memilih ruangan (Bab 19 & Aturan Bisnis no. 7).
 */
export async function aksiKirimPengaduan(
  _prev: FormState,
  fd: FormData
): Promise<FormState> {
  const token = teks(fd, "token");
  const kategori = teks(fd, "kategori");
  const deskripsi = teks(fd, "deskripsi");
  const urgensi = teks(fd, "urgensi") || "SEDANG";
  const anonim = fd.get("anonim") === "on" ? 1 : 0;
  const pelaporNama = teks(fd, "pelapor_nama");
  const pelaporKontak = teks(fd, "pelapor_kontak");
  const fotoUrl = teks(fd, "foto_url");
  const nomorKunjungan = teks(fd, "nomor_kunjungan");

  const qr = db
    .prepare(`SELECT * FROM room_qr_codes WHERE token = ? AND aktif = 1 AND tipe = 'PENGADUAN'`)
    .get(token) as RoomQrCode | undefined;
  if (!qr) return { error: "QR Code tidak dikenali atau sudah tidak aktif." };

  const room = db.prepare(`SELECT * FROM rooms WHERE id = ?`).get(qr.room_id) as Room | undefined;
  if (!room) return { error: "Data ruangan tidak ditemukan." };

  if (!kategori) return { error: "Kategori fasilitas wajib dipilih." };
  if (deskripsi.length < 10) {
    return { error: "Deskripsi masalah wajib diisi, minimal 10 karakter." };
  }
  if (!anonim && !pelaporNama) {
    return { error: "Nama pelapor wajib diisi, atau centang pilihan anonim." };
  }

  // Mengaitkan pengaduan dengan kunjungan bila pelapor mengisi nomor kunjungan
  let applicationId: number | null = null;
  if (nomorKunjungan) {
    const app = db
      .prepare(`SELECT id FROM visit_applications WHERE nomor = ?`)
      .get(nomorKunjungan.toUpperCase()) as { id: number } | undefined;
    applicationId = app?.id ?? null;
  }

  const nomor = buatNomorPengaduan();
  const info = db
    .prepare(
      `INSERT INTO facility_reports
         (nomor, room_id, application_id, kategori, deskripsi, urgensi,
          pelapor_nama, pelapor_kontak, anonim, foto_url, sumber, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'QR', 'DIAJUKAN')`
    )
    .run(
      nomor,
      room.id,
      applicationId,
      kategori,
      deskripsi,
      urgensi,
      anonim ? null : pelaporNama || null,
      anonim ? null : pelaporKontak || null,
      anonim,
      fotoUrl || null
    );

  const reportId = Number(info.lastInsertRowid);

  db.prepare(
    `INSERT INTO report_actions (report_id, admin_id, status_dari, status_ke, catatan)
     VALUES (?, NULL, NULL, 'DIAJUKAN', 'Pengaduan dibuat melalui QR Code ruangan')`
  ).run(reportId);

  const u = penggunaSaatIni();
  catatAudit({
    userId: u?.id ?? null,
    aktor: anonim ? "ANONIM" : pelaporNama || u?.nama || "PENGUNJUNG",
    aksi: "BUAT_PENGADUAN",
    entitas: "FACILITY_REPORT",
    entitasId: reportId,
    detail: `${nomor} — ${room.nama} — ${kategori}`,
  });

  kirimNotifikasiAdmin({
    judul: "Pengaduan fasilitas baru",
    pesan: `${nomor} pada ${room.nama} — kategori ${kategori}, urgensi ${urgensi.toLowerCase()}.`,
    link: `/admin/pengaduan/${reportId}`,
  });

  revalidatePath("/admin/pengaduan");
  return { success: nomor };
}
