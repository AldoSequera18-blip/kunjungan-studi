"use server";

import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buatNomorKunjungan, buatNomorPengaduan, db } from "@/lib/db";
import { wajibPemohon } from "@/lib/auth";
import { catatAudit, kirimNotifikasiAdmin } from "@/lib/audit";
import {
  angka,
  emailValid,
  hariIniISO,
  tanggalValid,
  teks,
  teleponValid,
  waktuBentrok,
  waktuValid,
  waktuLayananValid,
} from "@/lib/utils";
import type { FormState, VisitApplication } from "@/lib/types";

/** Status permohonan yang masih boleh diubah oleh pemohon — Bab 26. */
const BOLEH_DIUBAH = ["DRAFT", "PERLU_PERBAIKAN"];

async function ambilPermohonanMilikSaya(id: number, userId: number): Promise<VisitApplication | undefined> {
  // Aturan Bisnis no. 2: pemohon hanya melihat data yang menjadi kewenangannya
  return await db
    .prepare(`SELECT * FROM visit_applications WHERE id = ? AND user_id = ?`)
    .get(id, userId) as VisitApplication | undefined;
}

/* ================================================================= */
/* Permohonan kunjungan                                              */
/* ================================================================= */

function validasiPermohonan(fd: FormData): string | null {
  const namaKelompok = teks(fd, "nama_kelompok");
  const asalInstansi = teks(fd, "asal_instansi");
  const jumlah = angka(fd, "jumlah_peserta");
  const tujuan = teks(fd, "tujuan");
  const tanggal = teks(fd, "tanggal_usulan");
  const mulai = teks(fd, "waktu_mulai_usulan");
  const selesai = teks(fd, "waktu_selesai_usulan");
  const teleponPj = teks(fd, "telepon_pj");

  if (!namaKelompok || !asalInstansi || !tujuan) {
    return "Nama kelompok, asal instansi, dan tujuan kunjungan wajib diisi.";
  }
  if (jumlah < 1) return "Jumlah peserta minimal 1 orang.";
  if (jumlah > 500) return "Jumlah peserta terlalu besar. Silakan hubungi Balai terlebih dahulu.";
  if (!tanggalValid(tanggal)) return "Tanggal kunjungan tidak valid.";
  if (tanggal < hariIniISO()) return "Tanggal kunjungan tidak boleh di masa lalu.";
  if (!waktuValid(mulai) || !waktuValid(selesai)) return "Format waktu tidak valid.";
  if (selesai <= mulai) return "Waktu selesai harus lebih besar daripada waktu mulai.";
  if (!waktuLayananValid(tanggal, mulai, selesai)) {
    return "Tanggal atau waktu kunjungan di luar jam layanan. Periksa jadwal layanan Grhatama Pustaka.";
  }
  if (teleponPj && !teleponValid(teleponPj)) {
    return "Format nomor telepon penanggung jawab tidak valid.";
  }
  return null;
}

/* ------------------------- Surat kunjungan (helper) ------------------------- */

const DIR_SURAT = path.join(process.cwd(), "data", "surat");
const EKSTENSI_SURAT = [".pdf", ".doc", ".docx"];
const MAKS_SURAT = 5 * 1024 * 1024;
const STATUS_TERKUNCI = ["SELESAI", "DIBATALKAN", "DITOLAK"];

/** Mengembalikan berkas bila ada isinya, null bila kosong, atau pesan galat. */
function periksaBerkasSurat(fd: FormData): File | null | string {
  const file = fd.get("surat");
  if (!(file instanceof File) || file.size === 0) return null;
  const ext = path.extname(file.name).toLowerCase();
  if (!EKSTENSI_SURAT.includes(ext)) return "Format berkas surat harus PDF, DOC, atau DOCX.";
  if (file.size > MAKS_SURAT) return "Ukuran berkas surat maksimal 5 MB.";
  return file;
}

/** Menghapus semua surat milik sebuah permohonan (berkas dan barisnya). */
async function hapusSuratLama(applicationId: number) {
  const lama = await db
    .prepare(`SELECT id, berkas FROM documents WHERE application_id = ? AND jenis = 'SURAT_PERMOHONAN'`)
    .all(applicationId) as { id: number; berkas: string | null }[];
  for (const l of lama) {
    if (l.berkas) {
      try {
        fs.unlinkSync(path.join(DIR_SURAT, path.basename(l.berkas)));
      } catch {
        /* berkas sudah tidak ada */
      }
    }
    await db.prepare(`DELETE FROM documents WHERE id = ?`).run(l.id);
  }
}

/** Menyimpan surat; satu surat per permohonan, unggahan baru menggantikan yang lama. */
async function simpanSurat(applicationId: number, file: File) {
  fs.mkdirSync(DIR_SURAT, { recursive: true });
  const ext = path.extname(file.name).toLowerCase();
  const berkas = `${applicationId}-${Date.now()}${ext}`;
  fs.writeFileSync(path.join(DIR_SURAT, berkas), Buffer.from(await file.arrayBuffer()));

  await hapusSuratLama(applicationId);
  const info = await db
    .prepare(
      `INSERT INTO documents (application_id, jenis, nama_file, berkas) VALUES (?, 'SURAT_PERMOHONAN', ?, ?)`
    )
    .run(applicationId, file.name.slice(0, 200), berkas);
  await db.prepare(`UPDATE documents SET url = ? WHERE id = ?`).run(
    `/api/surat/${info.lastInsertRowid}`,
    info.lastInsertRowid
  );
}


/** Mengambil id ruangan pilihan pemohon dari formulir. */
function ruanganDipilih(fd: FormData): number[] {
  return Array.from(new Set(fd.getAll("room_id").map((v) => Number(v)).filter((n) => n > 0)));
}

/** Memeriksa ruangan yang dipilih pemohon terhadap jadwal yang sudah dikonfirmasi. */
async function periksaRuangan(ids: number[], fd: FormData, applicationId?: number): Promise<string | null> {
  if (ids.length === 0) return "Pilih minimal satu ruangan yang akan dikunjungi.";
  const tanggal = teks(fd, "tanggal_usulan");
  const mulai = teks(fd, "waktu_mulai_usulan");
  const selesai = teks(fd, "waktu_selesai_usulan");

  for (const rid of ids) {
    const r = await db.prepare(`SELECT nama, status FROM rooms WHERE id = ?`).get(rid) as
      | { nama: string; status: string }
      | undefined;
    if (!r) return "Ruangan yang dipilih tidak ditemukan.";
    if (r.status !== "TERSEDIA") return `Ruangan ${r.nama} sedang tidak tersedia (${r.status}).`;

    const terpakai = await db
      .prepare(
        `SELECT s.waktu_mulai, s.waktu_selesai FROM visit_schedules s
          WHERE s.room_id = ? AND s.tanggal = ?
            AND s.status NOT IN ('DIBATALKAN','DIUSULKAN')
            AND s.application_id != ?`
      )
      .all(rid, tanggal, applicationId ?? 0) as { waktu_mulai: string; waktu_selesai: string }[];
    const bentrok = terpakai.find((t) => waktuBentrok(mulai, selesai, t.waktu_mulai, t.waktu_selesai));
    if (bentrok) {
      return `${r.nama} sudah dipakai kelompok lain pukul ${bentrok.waktu_mulai}–${bentrok.waktu_selesai} pada tanggal tersebut. Pilih ruangan atau waktu lain.`;
    }
  }
  return null;
}

/** Menyimpan usulan jadwal & ruangan; menggantikan usulan sebelumnya. */
async function simpanUsulanRuangan(applicationId: number, ids: number[], fd: FormData, pj: string | null) {
  await db.prepare(`DELETE FROM visit_schedules WHERE application_id = ? AND status = 'DIUSULKAN'`).run(applicationId);
  const ins = db.prepare(
    `INSERT INTO visit_schedules
       (application_id, room_id, tanggal, waktu_mulai, waktu_selesai, penanggung_jawab, status)
     VALUES (?, ?, ?, ?, ?, ?, 'DIUSULKAN')`
  );
  for (const rid of ids) {
    ins.run(
      applicationId,
      rid,
      teks(fd, "tanggal_usulan"),
      teks(fd, "waktu_mulai_usulan"),
      teks(fd, "waktu_selesai_usulan"),
      pj
    );
  }
}

export async function aksiBuatPermohonan(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await wajibPemohon();
  const jenisKunjungan = teks(fd, "jenis_kunjungan") === "TIDAK_RESMI" ? "TIDAK_RESMI" : "RESMI";

  const galat = validasiPermohonan(fd);
  if (galat) return { error: galat };

  const surat = jenisKunjungan === "RESMI" ? periksaBerkasSurat(fd) : null;
  if (typeof surat === "string") return { error: surat };

  const ruangan = jenisKunjungan === "RESMI" ? ruanganDipilih(fd) : [];
  const galatRuangan = jenisKunjungan === "RESMI" ? await periksaRuangan(ruangan, fd) : null;
  if (galatRuangan) return { error: galatRuangan };

  const nomor = await buatNomorKunjungan();

  const info = await db
    .prepare(
      `INSERT INTO visit_applications
         (nomor, user_id, jenis_kunjungan, nama_kelompok, asal_instansi, jenis_instansi, jumlah_peserta, tujuan,
          tanggal_usulan, waktu_mulai_usulan, waktu_selesai_usulan,
          penanggung_jawab, telepon_pj, catatan, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      nomor,
      user.id,
      jenisKunjungan,
      teks(fd, "nama_kelompok"),
      teks(fd, "asal_instansi"),
      teks(fd, "jenis_instansi") || null,
      angka(fd, "jumlah_peserta"),
      teks(fd, "tujuan"),
      teks(fd, "tanggal_usulan"),
      teks(fd, "waktu_mulai_usulan"),
      teks(fd, "waktu_selesai_usulan"),
      teks(fd, "penanggung_jawab") || user.nama,
      teks(fd, "telepon_pj") || user.telepon,
      teks(fd, "catatan") || null,
      "DRAFT"
    );

  const id = Number(info.lastInsertRowid);

  if (surat) await simpanSurat(id, surat);
  if (jenisKunjungan === "RESMI") await simpanUsulanRuangan(id, ruangan, fd, teks(fd, "penanggung_jawab") || user.nama);

  await catatAudit({
    userId: user.id,
    aktor: user.nama,
    aksi: "BUAT_PERMOHONAN",
    entitas: "VISIT_APPLICATION",
    entitasId: id,
    detail: `${nomor} — ${teks(fd, "nama_kelompok")}`,
  });

  revalidatePath("/kunjungan");
  redirect(`/kunjungan/${id}`);
}

export async function aksiUbahPermohonan(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await wajibPemohon();
  const id = angka(fd, "id");

  const app = await ambilPermohonanMilikSaya(id, user.id);
  if (!app) return { error: "Permohonan tidak ditemukan." };
  if (!BOLEH_DIUBAH.includes(app.status)) {
    return { error: "Permohonan pada status ini tidak dapat diubah lagi." };
  }

  const jenisKunjungan = teks(fd, "jenis_kunjungan") === "TIDAK_RESMI" ? "TIDAK_RESMI" : "RESMI";
  const galat = validasiPermohonan(fd);
  if (galat) return { error: galat };

  const ruangan = jenisKunjungan === "RESMI" ? ruanganDipilih(fd) : [];
  const galatRuangan = jenisKunjungan === "RESMI" ? await periksaRuangan(ruangan, fd, id) : null;
  if (galatRuangan) return { error: galatRuangan };

  await db.prepare(
    `UPDATE visit_applications SET
       jenis_kunjungan = ?, nama_kelompok = ?, asal_instansi = ?, jenis_instansi = ?, jumlah_peserta = ?,
       tujuan = ?, tanggal_usulan = ?, waktu_mulai_usulan = ?, waktu_selesai_usulan = ?,
       penanggung_jawab = ?, telepon_pj = ?, catatan = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    jenisKunjungan,
    teks(fd, "nama_kelompok"),
    teks(fd, "asal_instansi"),
    teks(fd, "jenis_instansi") || null,
    angka(fd, "jumlah_peserta"),
    teks(fd, "tujuan"),
    teks(fd, "tanggal_usulan"),
    teks(fd, "waktu_mulai_usulan"),
    teks(fd, "waktu_selesai_usulan"),
    teks(fd, "penanggung_jawab") || null,
    teks(fd, "telepon_pj") || null,
    teks(fd, "catatan") || null,
    id
  );

  if (jenisKunjungan === "RESMI") await simpanUsulanRuangan(id, ruangan, fd, teks(fd, "penanggung_jawab") || null);
  else await db.prepare(`DELETE FROM visit_schedules WHERE application_id = ? AND status = 'DIUSULKAN'`).run(id);

  await catatAudit({
    userId: user.id,
    aktor: user.nama,
    aksi: "UBAH_PERMOHONAN",
    entitas: "VISIT_APPLICATION",
    entitasId: id,
    detail: app.nomor,
  });

  revalidatePath(`/kunjungan/${id}`);
  return { success: "Perubahan tersimpan." };
}

export async function aksiAjukanPermohonan(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await wajibPemohon();
  const id = angka(fd, "id");

  const app = await ambilPermohonanMilikSaya(id, user.id);
  if (!app) return { error: "Permohonan tidak ditemukan." };
  if (!BOLEH_DIUBAH.includes(app.status)) {
    return { error: "Permohonan ini sudah diajukan sebelumnya." };
  }

  const jumlahPeserta = (
    await db
      .prepare(`SELECT COUNT(*) AS n FROM visitors WHERE application_id = ?`)
      .get(id) as { n: number }
  ).n;
  const jumlahRuangan = (
    await db
      .prepare(`SELECT COUNT(*) AS n FROM visit_schedules WHERE application_id = ? AND status = 'DIUSULKAN'`)
      .get(id) as { n: number }
  ).n;
  if (app.jenis_kunjungan === "RESMI" && jumlahRuangan === 0) {
    return { error: "Pilih jadwal dan ruangan yang akan dikunjungi terlebih dahulu (ubah data permohonan)." };
  }
  if (jumlahPeserta === 0) {
    return { error: "Lengkapi data peserta terlebih dahulu sebelum mengajukan permohonan." };
  }

  await db.prepare(
    `UPDATE visit_applications SET status = 'DIAJUKAN', updated_at = datetime('now') WHERE id = ?`
  ).run(id);

  await catatAudit({
    userId: user.id,
    aktor: user.nama,
    aksi: "AJUKAN_PERMOHONAN",
    entitas: "VISIT_APPLICATION",
    entitasId: id,
    detail: `${app.nomor} diajukan untuk verifikasi`,
  });

  await kirimNotifikasiAdmin({
    judul: "Permohonan kunjungan baru",
    pesan: `${app.nomor} dari ${app.asal_instansi} menunggu verifikasi.`,
    link: `/admin/permohonan/${id}`,
  });

  revalidatePath(`/kunjungan/${id}`);
  revalidatePath("/kunjungan");
  return { success: "Permohonan berhasil diajukan dan menunggu verifikasi admin." };
}

export async function aksiBatalkanPermohonan(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await wajibPemohon();
  const id = angka(fd, "id");

  const app = await ambilPermohonanMilikSaya(id, user.id);
  if (!app) return { error: "Permohonan tidak ditemukan." };
  if (["SELESAI", "DIBATALKAN", "BERLANGSUNG"].includes(app.status)) {
    return { error: "Permohonan pada status ini tidak dapat dibatalkan." };
  }

  await db.prepare(
    `UPDATE visit_applications SET status = 'DIBATALKAN', updated_at = datetime('now') WHERE id = ?`
  ).run(id);
  await db.prepare(
    `UPDATE visit_schedules SET status = 'DIBATALKAN' WHERE application_id = ? AND status IN ('TERJADWAL','DIUSULKAN')`
  ).run(id);

  await catatAudit({
    userId: user.id,
    aktor: user.nama,
    aksi: "BATALKAN_PERMOHONAN",
    entitas: "VISIT_APPLICATION",
    entitasId: id,
    detail: app.nomor,
  });

  await kirimNotifikasiAdmin({
    judul: "Permohonan dibatalkan pemohon",
    pesan: `${app.nomor} — ${app.nama_kelompok} dibatalkan oleh pemohon.`,
    link: `/admin/permohonan/${id}`,
  });

  revalidatePath(`/kunjungan/${id}`);
  return { success: "Permohonan telah dibatalkan." };
}

/* ================================================================= */
/* Data peserta — Bab 26                                             */
/* ================================================================= */

export async function aksiTambahPeserta(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await wajibPemohon();
  const applicationId = angka(fd, "application_id");

  const app = await ambilPermohonanMilikSaya(applicationId, user.id);
  if (!app) return { error: "Permohonan tidak ditemukan." };
  if (["SELESAI", "DIBATALKAN", "DITOLAK"].includes(app.status)) {
    return { error: "Data peserta tidak dapat diubah pada status permohonan ini." };
  }

  const nama = teks(fd, "nama");
  if (!nama) return { error: "Nama peserta wajib diisi." };

  await db.prepare(
    `INSERT INTO visitors (application_id, nama, identitas, jenis, keterangan)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    applicationId,
    nama,
    teks(fd, "identitas") || null,
    teks(fd, "jenis") || "PESERTA",
    teks(fd, "keterangan") || null
  );

  await catatAudit({
    userId: user.id,
    aktor: user.nama,
    aksi: "TAMBAH_PESERTA",
    entitas: "VISITOR",
    entitasId: applicationId,
    detail: `${app.nomor} — ${nama}`,
  });

  revalidatePath(`/kunjungan/${applicationId}`);
  revalidatePath("/peserta");
  return { success: `Peserta ${nama} ditambahkan.` };
}

export async function aksiHapusPeserta(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await wajibPemohon();
  const visitorId = angka(fd, "visitor_id");

  const baris = await db
    .prepare(
      `SELECT v.id, v.nama, v.application_id, a.status, a.nomor
         FROM visitors v JOIN visit_applications a ON a.id = v.application_id
        WHERE v.id = ? AND a.user_id = ?`
    )
    .get(visitorId, user.id) as
    | { id: number; nama: string; application_id: number; status: string; nomor: string }
    | undefined;

  if (!baris) return { error: "Data peserta tidak ditemukan." };
  if (["SELESAI", "DIBATALKAN", "BERLANGSUNG"].includes(baris.status)) {
    return { error: "Data peserta tidak dapat dihapus pada status permohonan ini." };
  }

  await db.prepare(`DELETE FROM visitors WHERE id = ?`).run(visitorId);

  await catatAudit({
    userId: user.id,
    aktor: user.nama,
    aksi: "HAPUS_PESERTA",
    entitas: "VISITOR",
    entitasId: visitorId,
    detail: `${baris.nomor} — ${baris.nama}`,
  });

  revalidatePath(`/kunjungan/${baris.application_id}`);
  revalidatePath("/peserta");
  return { success: `Peserta ${baris.nama} dihapus.` };
}

export async function aksiUbahPeserta(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await wajibPemohon();
  const visitorId = angka(fd, "visitor_id");
  const baris = await db
    .prepare(
      `SELECT v.id, v.application_id, v.nama, a.status, a.nomor
         FROM visitors v JOIN visit_applications a ON a.id = v.application_id
        WHERE v.id = ? AND a.user_id = ?`
    )
    .get(visitorId, user.id) as
    | { id: number; application_id: number; nama: string; status: string; nomor: string }
    | undefined;

  if (!baris) return { error: "Data peserta tidak ditemukan." };
  if (["SELESAI", "DIBATALKAN", "DITOLAK", "BERLANGSUNG"].includes(baris.status)) {
    return { error: "Data peserta tidak dapat diubah pada status permohonan ini." };
  }

  const nama = teks(fd, "nama");
  const jenis = teks(fd, "jenis");
  if (!nama) return { error: "Nama peserta wajib diisi." };
  if (jenis !== "PESERTA" && jenis !== "PENDAMPING") return { error: "Jenis peserta tidak valid." };

  await db.prepare(
    `UPDATE visitors SET nama = ?, identitas = ?, jenis = ?, keterangan = ? WHERE id = ?`
  ).run(nama, teks(fd, "identitas") || null, jenis, teks(fd, "keterangan") || null, visitorId);

  await catatAudit({
    userId: user.id,
    aktor: user.nama,
    aksi: "UBAH_PESERTA",
    entitas: "VISITOR",
    entitasId: visitorId,
    detail: `${baris.nomor} — ${baris.nama} menjadi ${nama}`,
  });

  revalidatePath(`/kunjungan/${baris.application_id}`);
  revalidatePath("/peserta");
  return { success: `Data peserta ${nama} diperbarui.` };
}

/* ================================================================= */
/* Profil                                                            */
/* ================================================================= */

export async function aksiUbahProfil(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await wajibPemohon();

  const nama = teks(fd, "nama");
  const email = teks(fd, "email").toLowerCase();
  const telepon = teks(fd, "telepon");

  if (!nama || !email || !telepon) return { error: "Nama, email, dan telepon wajib diisi." };
  if (!emailValid(email)) return { error: "Format email tidak valid." };
  if (!teleponValid(telepon)) return { error: "Format nomor telepon tidak valid." };

  const bentrok = await db
    .prepare(`SELECT id FROM users WHERE email = ? AND id != ?`)
    .get(email, user.id);
  if (bentrok) return { error: "Email tersebut sudah digunakan akun lain." };

  await db.prepare(
    `UPDATE users SET nama = ?, email = ?, telepon = ?, instansi = ?, alamat = ? WHERE id = ?`
  ).run(nama, email, telepon, teks(fd, "instansi") || null, teks(fd, "alamat") || null, user.id);

  await catatAudit({
    userId: user.id,
    aktor: nama,
    aksi: "UBAH_PROFIL",
    entitas: "USER",
    entitasId: user.id,
  });

  revalidatePath("/profil");
  return { success: "Profil berhasil diperbarui." };
}

/* ================================================================= */
/* Pengaduan fasilitas dari menu — Bab 28                            */
/* ================================================================= */

export async function aksiPengaduanDariMenu(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await wajibPemohon();

  const roomId = angka(fd, "room_id");
  const kategori = teks(fd, "kategori");
  const deskripsi = teks(fd, "deskripsi");
  const urgensi = teks(fd, "urgensi") || "SEDANG";
  const applicationId = angka(fd, "application_id") || null;

  if (!roomId) return { error: "Ruangan wajib dipilih." };
  if (!kategori) return { error: "Kategori fasilitas wajib dipilih." };
  if (deskripsi.length < 10) return { error: "Deskripsi masalah minimal 10 karakter." };

  const room = await db.prepare(`SELECT nama FROM rooms WHERE id = ?`).get(roomId) as
    | { nama: string }
    | undefined;
  if (!room) return { error: "Ruangan tidak ditemukan." };

  const nomor = await buatNomorPengaduan();
  const info = await db
    .prepare(
      `INSERT INTO facility_reports
         (nomor, room_id, application_id, kategori, deskripsi, urgensi,
          pelapor_nama, pelapor_kontak, anonim, sumber, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'MENU', 'DIAJUKAN')`
    )
    .run(nomor, roomId, applicationId, kategori, deskripsi, urgensi, user.nama, user.telepon);

  const reportId = Number(info.lastInsertRowid);
  await db.prepare(
    `INSERT INTO report_actions (report_id, status_dari, status_ke, catatan)
     VALUES (?, NULL, 'DIAJUKAN', 'Pengaduan dibuat melalui menu pemohon')`
  ).run(reportId);

  await catatAudit({
    userId: user.id,
    aktor: user.nama,
    aksi: "BUAT_PENGADUAN",
    entitas: "FACILITY_REPORT",
    entitasId: reportId,
    detail: `${nomor} — ${room.nama} — ${kategori}`,
  });

  await kirimNotifikasiAdmin({
    judul: "Pengaduan fasilitas baru",
    pesan: `${nomor} pada ${room.nama} — kategori ${kategori}.`,
    link: `/admin/pengaduan/${reportId}`,
  });

  revalidatePath("/pengaduan-saya");
  return { success: `Pengaduan terkirim dengan nomor ${nomor}.` };
}

/* ================================================================= */
/* Notifikasi                                                        */
/* ================================================================= */

export async function aksiBacaSemuaNotifikasi(): Promise<void> {
  const user = await wajibPemohon();
  await db.prepare(`UPDATE notifications SET dibaca = 1 WHERE user_id = ?`).run(user.id);
  revalidatePath("/notifikasi");
}

/* ================================================================= */
/* Surat kunjungan                                                   */
/* ================================================================= */

export async function aksiUnggahSurat(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await wajibPemohon();
  const id = angka(fd, "id");

  const app = await ambilPermohonanMilikSaya(id, user.id);
  if (!app) return { error: "Permohonan tidak ditemukan." };
  if (app.jenis_kunjungan !== "RESMI") return { error: "Unggah surat hanya tersedia untuk kunjungan resmi." };
  if (STATUS_TERKUNCI.includes(app.status)) {
    return { error: "Surat tidak dapat diunggah pada permohonan dengan status ini." };
  }

  const file = periksaBerkasSurat(fd);
  if (typeof file === "string") return { error: file };
  if (!file) return { error: "Pilih berkas surat terlebih dahulu." };

  await simpanSurat(id, file);

  await catatAudit({
    userId: user.id,
    aktor: user.nama,
    aksi: "UNGGAH_SURAT",
    entitas: "VISIT_APPLICATION",
    entitasId: id,
    detail: `${app.nomor}: ${file.name}`,
  });

  revalidatePath(`/kunjungan/${id}`);
  return { success: "Surat kunjungan berhasil diunggah." };
}

export async function aksiHapusSurat(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await wajibPemohon();
  const id = angka(fd, "id");

  const app = await ambilPermohonanMilikSaya(id, user.id);
  if (!app) return { error: "Permohonan tidak ditemukan." };
  if (app.jenis_kunjungan !== "RESMI") return { error: "Pengelolaan surat hanya tersedia untuk kunjungan resmi." };
  if (STATUS_TERKUNCI.includes(app.status)) {
    return { error: "Surat tidak dapat dihapus pada permohonan dengan status ini." };
  }

  await hapusSuratLama(id);

  await catatAudit({
    userId: user.id,
    aktor: user.nama,
    aksi: "HAPUS_SURAT",
    entitas: "VISIT_APPLICATION",
    entitasId: id,
    detail: app.nomor,
  });

  revalidatePath(`/kunjungan/${id}`);
  return { success: "Surat kunjungan dihapus." };
}

/* ================================================================= */
/* Foto profil                                                       */
/* ================================================================= */

const DIR_FOTO = path.join(process.cwd(), "data", "foto");
const EKSTENSI_FOTO = [".jpg", ".jpeg", ".png", ".webp"];
const MAKS_FOTO = 2 * 1024 * 1024;

function hapusBerkasFoto(nama: string | null | undefined) {
  if (!nama) return;
  try {
    fs.unlinkSync(path.join(DIR_FOTO, path.basename(nama)));
  } catch {
    /* berkas sudah tidak ada */
  }
}

export async function aksiUnggahFoto(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await wajibPemohon();

  const file = fd.get("foto");
  if (!(file instanceof File) || file.size === 0) return { error: "Pilih foto terlebih dahulu." };
  const ext = path.extname(file.name).toLowerCase();
  if (!EKSTENSI_FOTO.includes(ext) || !file.type.startsWith("image/")) {
    return { error: "Format foto harus JPG, PNG, atau WEBP." };
  }
  if (file.size > MAKS_FOTO) return { error: "Ukuran foto maksimal 2 MB." };

  fs.mkdirSync(DIR_FOTO, { recursive: true });
  const nama = `${user.id}-${Date.now()}${ext}`;
  fs.writeFileSync(path.join(DIR_FOTO, nama), Buffer.from(await file.arrayBuffer()));

  hapusBerkasFoto(user.foto);
  await db.prepare(`UPDATE users SET foto = ? WHERE id = ?`).run(nama, user.id);

  await catatAudit({
    userId: user.id,
    aktor: user.nama,
    aksi: "UBAH_FOTO_PROFIL",
    entitas: "USER",
    entitasId: user.id,
  });

  revalidatePath("/", "layout");
  return { success: "Foto profil berhasil disimpan." };
}

export async function aksiHapusFoto(_prev: FormState, _fd: FormData): Promise<FormState> {
  const user = await wajibPemohon();
  if (!user.foto) return { error: "Belum ada foto profil." };

  hapusBerkasFoto(user.foto);
  await db.prepare(`UPDATE users SET foto = NULL WHERE id = ?`).run(user.id);

  await catatAudit({
    userId: user.id,
    aktor: user.nama,
    aksi: "HAPUS_FOTO_PROFIL",
    entitas: "USER",
    entitasId: user.id,
  });

  revalidatePath("/", "layout");
  return { success: "Foto profil dihapus." };
}
