/** Tipe data bersama seluruh aplikasi. */

export type Role = "PEMOHON" | "ADMIN";

/** Status permohonan — Bab 12 dokumen analisis. */
export type StatusPermohonan =
  | "DRAFT"
  | "DIAJUKAN"
  | "DALAM_VERIFIKASI"
  | "PERLU_PERBAIKAN"
  | "DITERIMA"
  | "DITOLAK"
  | "DIJADWALKAN"
  | "BERLANGSUNG"
  | "SELESAI"
  | "DIBATALKAN";

/** Status pengaduan fasilitas — Bab 21 dokumen analisis. */
export type StatusPengaduan =
  | "DIAJUKAN"
  | "DIVERIFIKASI"
  | "DITINDAKLANJUTI"
  | "SELESAI"
  | "DITOLAK"
  | "TIDAK_VALID";

export type StatusJadwal = "DIUSULKAN" | "TERJADWAL" | "BERLANGSUNG" | "SELESAI" | "DIBATALKAN";
export type StatusRuangan = "TERSEDIA" | "PERBAIKAN" | "TIDAK_AKTIF";
export type Urgensi = "RENDAH" | "SEDANG" | "TINGGI";

export interface User {
  id: number;
  nama: string;
  email: string;
  password_hash: string;
  telepon: string | null;
  instansi: string | null;
  alamat: string | null;
  foto: string | null;
  role: Role;
  aktif: number;
  created_at: string;
}

export type SessionUser = Omit<User, "password_hash">;

export interface Room {
  id: number;
  kode: string;
  nama: string;
  kapasitas: number;
  lokasi: string | null;
  fasilitas: string | null;
  status: StatusRuangan;
  keterangan: string | null;
  created_at: string;
}

export interface RoomQrCode {
  id: number;
  room_id: number;
  tipe: "PENGADUAN" | "ABSENSI";
  token: string;
  aktif: number;
  created_at: string;
}

export interface VisitApplication {
  id: number;
  nomor: string;
  user_id: number;
  jenis_kunjungan: "RESMI" | "TIDAK_RESMI";
  nama_kelompok: string;
  asal_instansi: string;
  jenis_instansi: string | null;
  jumlah_peserta: number;
  tujuan: string;
  tanggal_usulan: string;
  waktu_mulai_usulan: string;
  waktu_selesai_usulan: string;
  penanggung_jawab: string | null;
  telepon_pj: string | null;
  catatan: string | null;
  status: StatusPermohonan;
  catatan_admin: string | null;
  alasan_keputusan: string | null;
  verified_by: number | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Visitor {
  id: number;
  application_id: number;
  nama: string;
  identitas: string | null;
  jenis: "PESERTA" | "PENDAMPING";
  keterangan: string | null;
  created_at: string;
}

export interface VisitSchedule {
  id: number;
  application_id: number;
  room_id: number;
  tanggal: string;
  waktu_mulai: string;
  waktu_selesai: string;
  penanggung_jawab: string | null;
  status: StatusJadwal;
  catatan: string | null;
  created_by: number | null;
  created_at: string;
}

export interface Attendance {
  id: number;
  schedule_id: number;
  application_id: number;
  room_id: number;
  visitor_id: number | null;
  nama_peserta: string;
  metode: "PILIH_NAMA" | "KODE_KUNJUNGAN" | "QR";
  checkin_at: string;
  checkout_at: string | null;
  catatan: string | null;
}

export interface FacilityReport {
  id: number;
  nomor: string;
  room_id: number;
  application_id: number | null;
  kategori: string;
  deskripsi: string;
  urgensi: Urgensi;
  pelapor_nama: string | null;
  pelapor_kontak: string | null;
  anonim: number;
  foto_url: string | null;
  sumber: "QR" | "MENU";
  status: StatusPengaduan;
  petugas: string | null;
  selesai_at: string | null;
  created_at: string;
}

export interface ReportAction {
  id: number;
  report_id: number;
  admin_id: number | null;
  status_dari: string | null;
  status_ke: StatusPengaduan;
  petugas: string | null;
  catatan: string | null;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  judul: string;
  pesan: string;
  link: string | null;
  dibaca: number;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  aktor: string;
  aksi: string;
  entitas: string | null;
  entitas_id: string | null;
  detail: string | null;
  created_at: string;
}

/** Hasil kembalian server action untuk form. */
export type FormState = { error?: string; success?: string } | undefined;

/** Kategori fasilitas pada formulir pengaduan (Bab 20). */
export const KATEGORI_FASILITAS = [
  "AC",
  "Kursi",
  "Meja",
  "Proyektor",
  "Komputer",
  "Jaringan/Wi-Fi",
  "Penerangan",
  "Kebersihan",
  "Toilet",
  "Lainnya",
] as const;

export const JENIS_INSTANSI = [
  "TK/PAUD",
  "SD/MI",
  "SMP/MTs",
  "SMA/SMK/MA",
  "Perguruan Tinggi",
  "Instansi Pemerintah",
  "Komunitas/Umum",
] as const;
