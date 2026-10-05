import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";

/**
 * Koneksi database SQLite.
 *
 * Struktur tabel mengikuti Bab 40 "Gambaran Database" pada dokumen analisis:
 * users, visit_applications, groups (digabung ke visit_applications), visitors,
 * rooms, visit_schedules, attendance, room_qr_codes, facility_reports,
 * report_actions, notifications, audit_logs.
 *
 * Catatan migrasi ke Supabase/PostgreSQL:
 * nama tabel & kolom sengaja dibuat sama, sehingga cukup mengganti driver ini
 * dengan klien Supabase tanpa mengubah struktur data.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "kunjungan.db");

declare global {
  // eslint-disable-next-line no-var
  var __kunjunganDb: Database.Database | undefined;
}

function createConnection(): Database.Database {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const database = new Database(DB_FILE);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  migrate(database);
  // Migrasi ringan: nama berkas tersimpan untuk surat kunjungan
  const kolom = database.prepare(`PRAGMA table_info(documents)`).all() as { name: string }[];
  if (!kolom.some((k) => k.name === "berkas")) {
    database.exec(`ALTER TABLE documents ADD COLUMN berkas TEXT`);
  }
  const kolomUser = database.prepare(`PRAGMA table_info(users)`).all() as { name: string }[];
  if (!kolomUser.some((k) => k.name === "foto")) {
    database.exec(`ALTER TABLE users ADD COLUMN foto TEXT`);
  }
  const kolomPermohonan = database.prepare(`PRAGMA table_info(visit_applications)`).all() as { name: string }[];
  if (!kolomPermohonan.some((k) => k.name === "jenis_kunjungan")) {
    database.exec(`ALTER TABLE visit_applications ADD COLUMN jenis_kunjungan TEXT NOT NULL DEFAULT 'RESMI'`);
  }
  seed(database);
  return database;
}

function migrate(d: Database.Database) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      nama          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      telepon       TEXT,
      instansi      TEXT,
      alamat        TEXT,
      role          TEXT NOT NULL DEFAULT 'PEMOHON',   -- PEMOHON | ADMIN
      aktif         INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id         TEXT PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      kode       TEXT NOT NULL UNIQUE,
      nama       TEXT NOT NULL,
      kapasitas  INTEGER NOT NULL DEFAULT 0,
      lokasi     TEXT,
      fasilitas  TEXT,
      status     TEXT NOT NULL DEFAULT 'TERSEDIA',     -- TERSEDIA | PERBAIKAN | TIDAK_AKTIF
      keterangan TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS room_qr_codes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id    INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      tipe       TEXT NOT NULL DEFAULT 'PENGADUAN',    -- PENGADUAN | ABSENSI
      token      TEXT NOT NULL UNIQUE,
      aktif      INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS visit_applications (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      nomor                 TEXT NOT NULL UNIQUE,      -- KUN-2026-0001
      user_id               INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      nama_kelompok         TEXT NOT NULL,
      asal_instansi         TEXT NOT NULL,
      jenis_instansi        TEXT,                      -- SD/SMP/SMA/PT/INSTANSI/UMUM
      jumlah_peserta        INTEGER NOT NULL,
      tujuan                TEXT NOT NULL,
      tanggal_usulan        TEXT NOT NULL,
      waktu_mulai_usulan    TEXT NOT NULL,
      waktu_selesai_usulan  TEXT NOT NULL,
      penanggung_jawab      TEXT,
      telepon_pj            TEXT,
      catatan               TEXT,
      status                TEXT NOT NULL DEFAULT 'DRAFT',
      catatan_admin         TEXT,
      alasan_keputusan      TEXT,
      verified_by           INTEGER REFERENCES users(id),
      verified_at           TEXT,
      created_at            TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS documents (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL REFERENCES visit_applications(id) ON DELETE CASCADE,
      jenis          TEXT NOT NULL,                    -- SURAT_PERMOHONAN | SURAT_TUGAS | LAINNYA
      nama_file      TEXT NOT NULL,
      url            TEXT,
      catatan        TEXT,
      created_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS visitors (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL REFERENCES visit_applications(id) ON DELETE CASCADE,
      nama           TEXT NOT NULL,
      identitas      TEXT,                             -- NIS/NIM/NIP/No. identitas lain
      jenis          TEXT NOT NULL DEFAULT 'PESERTA',  -- PESERTA | PENDAMPING
      keterangan     TEXT,
      created_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS visit_schedules (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id   INTEGER NOT NULL REFERENCES visit_applications(id) ON DELETE CASCADE,
      room_id          INTEGER NOT NULL REFERENCES rooms(id),
      tanggal          TEXT NOT NULL,
      waktu_mulai      TEXT NOT NULL,
      waktu_selesai    TEXT NOT NULL,
      penanggung_jawab TEXT,
      status           TEXT NOT NULL DEFAULT 'TERJADWAL', -- DIUSULKAN | TERJADWAL | BERLANGSUNG | SELESAI | DIBATALKAN
      catatan          TEXT,
      created_by       INTEGER REFERENCES users(id),
      created_at       TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_id    INTEGER NOT NULL REFERENCES visit_schedules(id) ON DELETE CASCADE,
      application_id INTEGER NOT NULL REFERENCES visit_applications(id) ON DELETE CASCADE,
      room_id        INTEGER NOT NULL REFERENCES rooms(id),
      visitor_id     INTEGER REFERENCES visitors(id) ON DELETE SET NULL,
      nama_peserta   TEXT NOT NULL,
      metode         TEXT NOT NULL DEFAULT 'PILIH_NAMA', -- PILIH_NAMA | KODE_KUNJUNGAN | QR
      checkin_at     TEXT NOT NULL DEFAULT (datetime('now')),
      checkout_at    TEXT,
      catatan        TEXT
    );

    CREATE TABLE IF NOT EXISTS facility_reports (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      nomor          TEXT NOT NULL UNIQUE,             -- ADU-2026-0001
      room_id        INTEGER NOT NULL REFERENCES rooms(id),
      application_id INTEGER REFERENCES visit_applications(id) ON DELETE SET NULL,
      kategori       TEXT NOT NULL,                    -- AC | KURSI | PROYEKTOR | KOMPUTER | KEBERSIHAN | LAINNYA
      deskripsi      TEXT NOT NULL,
      urgensi        TEXT NOT NULL DEFAULT 'SEDANG',   -- RENDAH | SEDANG | TINGGI
      pelapor_nama   TEXT,
      pelapor_kontak TEXT,
      anonim         INTEGER NOT NULL DEFAULT 0,
      foto_url       TEXT,
      sumber         TEXT NOT NULL DEFAULT 'QR',       -- QR | MENU
      status         TEXT NOT NULL DEFAULT 'DIAJUKAN', -- DIAJUKAN | DIVERIFIKASI | DITINDAKLANJUTI | SELESAI | DITOLAK | TIDAK_VALID
      petugas        TEXT,
      selesai_at     TEXT,
      created_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS report_actions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id   INTEGER NOT NULL REFERENCES facility_reports(id) ON DELETE CASCADE,
      admin_id    INTEGER REFERENCES users(id),
      status_dari TEXT,
      status_ke   TEXT NOT NULL,
      petugas     TEXT,
      catatan     TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      judul      TEXT NOT NULL,
      pesan      TEXT NOT NULL,
      link       TEXT,
      dibaca     INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
      aktor      TEXT NOT NULL,
      aksi       TEXT NOT NULL,
      entitas    TEXT,
      entitas_id TEXT,
      detail     TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_app_user    ON visit_applications(user_id);
    CREATE INDEX IF NOT EXISTS idx_app_status  ON visit_applications(status);
    CREATE INDEX IF NOT EXISTS idx_sch_room    ON visit_schedules(room_id, tanggal);
    CREATE INDEX IF NOT EXISTS idx_att_sch     ON attendance(schedule_id);
    CREATE INDEX IF NOT EXISTS idx_rep_room    ON facility_reports(room_id);
    CREATE INDEX IF NOT EXISTS idx_rep_status  ON facility_reports(status);
    CREATE INDEX IF NOT EXISTS idx_notif_user  ON notifications(user_id, dibaca);
  `);
}

/** Token QR acak, tanpa karakter yang membingungkan. */
function randomToken(len = 12) {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += abc[Math.floor(Math.random() * abc.length)];
  return s;
}

function seed(d: Database.Database) {
  const jumlahUser = (d.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n;
  if (jumlahUser > 0) return;

  const hash = (pwd: string) => bcrypt.hashSync(pwd, 10);
  const production = process.env.NODE_ENV === "production";
  const adminEmail = production ? process.env.INITIAL_ADMIN_EMAIL?.trim() : "admin@perpusdiy.go.id";
  const adminPassword = production ? process.env.INITIAL_ADMIN_PASSWORD : "admin123";
  if (production && (!adminEmail || !adminPassword || adminPassword.length < 16)) {
    throw new Error("Set INITIAL_ADMIN_EMAIL dan INITIAL_ADMIN_PASSWORD (minimal 16 karakter) untuk inisialisasi database produksi.");
  }

  const insertUser = d.prepare(
    `INSERT INTO users (nama, email, password_hash, telepon, instansi, alamat, role)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  insertUser.run(
    process.env.INITIAL_ADMIN_NAME?.trim() || "Administrator Balai",
    adminEmail,
    hash(adminPassword!),
    process.env.INITIAL_ADMIN_PHONE?.trim() || null,
    "Balai Layanan Perpustakaan DPAD DIY",
    null,
    "ADMIN"
  );
  if (!production) {
    insertUser.run(
      "Budi Santoso",
      "budi@sman1yogya.sch.id",
      hash("pemohon123"),
      "081234567890",
      "SMA Negeri 1 Yogyakarta",
      "Jl. HOS Cokroaminoto 10, Yogyakarta",
      "PEMOHON"
    );
  }

  const insertRoom = d.prepare(
    `INSERT INTO rooms (kode, nama, kapasitas, lokasi, fasilitas, status, keterangan)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const insertQr = d.prepare(
    `INSERT INTO room_qr_codes (room_id, tipe, token) VALUES (?, ?, ?)`
  );

  const daftarRuangan = [
    ["R-001", "Ruang Baca Anak", 40, "Lantai 1 – Sayap Timur", "AC, Rak buku anak, Karpet baca, Panggung dongeng", "TERSEDIA", "Cocok untuk kunjungan SD/TK"],
    ["R-002", "Ruang Multimedia", 30, "Lantai 2 – Sayap Barat", "AC, Proyektor, Layar, Sound system, 20 unit komputer", "TERSEDIA", "Untuk pemutaran profil & literasi digital"],
    ["R-003", "Ruang Meeting", 25, "Lantai 2 – Sayap Timur", "AC, Meja rapat, Proyektor, Whiteboard, Wi-Fi", "TERSEDIA", "Diskusi kelompok dan tanya jawab"],
    ["R-004", "Ruang Koleksi Umum", 60, "Lantai 1 – Area Tengah", "AC, Rak koleksi umum, Meja baca, OPAC", "TERSEDIA", "Pengenalan sistem klasifikasi koleksi"],
    ["R-005", "Ruang Audio Visual", 35, "Lantai 3", "AC, TV LED 75 inci, Sound system, Kursi teater", "PERBAIKAN", "Sedang perbaikan pendingin ruangan"],
  ] as const;

  for (const [kode, nama, kapasitas, lokasi, fasilitas, status, keterangan] of daftarRuangan) {
    const info = insertRoom.run(kode, nama, kapasitas, lokasi, fasilitas, status, keterangan);
    const roomId = Number(info.lastInsertRowid);
    // Setiap ruangan memiliki QR Code pengaduan unik (Aturan Bisnis no. 6)
    insertQr.run(roomId, "PENGADUAN", randomToken());
    // QR absensi disediakan terpisah agar fungsinya jelas (Bab 17)
    insertQr.run(roomId, "ABSENSI", randomToken());
  }

  d.prepare(
    `INSERT INTO audit_logs (user_id, aktor, aksi, entitas, detail)
     VALUES (NULL, 'SISTEM', 'INISIALISASI', 'DATABASE', 'Database dibuat dan diisi data awal')`
  ).run();
}

export const db: Database.Database = global.__kunjunganDb ?? createConnection();
if (process.env.NODE_ENV !== "production") global.__kunjunganDb = db;

/** Membuat nomor kunjungan unik, format KUN-YYYY-0001 (Bab 11). */
export function buatNomorKunjungan(): string {
  const tahun = new Date().getFullYear();
  const row = db
    .prepare(
      `SELECT nomor FROM visit_applications WHERE nomor LIKE ? ORDER BY id DESC LIMIT 1`
    )
    .get(`KUN-${tahun}-%`) as { nomor: string } | undefined;
  const urut = row ? Number(row.nomor.split("-")[2]) + 1 : 1;
  return `KUN-${tahun}-${String(urut).padStart(4, "0")}`;
}

/** Membuat nomor pengaduan unik, format ADU-YYYY-0001. */
export function buatNomorPengaduan(): string {
  const tahun = new Date().getFullYear();
  const row = db
    .prepare(`SELECT nomor FROM facility_reports WHERE nomor LIKE ? ORDER BY id DESC LIMIT 1`)
    .get(`ADU-${tahun}-%`) as { nomor: string } | undefined;
  const urut = row ? Number(row.nomor.split("-")[2]) + 1 : 1;
  return `ADU-${tahun}-${String(urut).padStart(4, "0")}`;
}

export { randomToken };
