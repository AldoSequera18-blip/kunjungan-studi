import type {
  StatusJadwal,
  StatusPengaduan,
  StatusPermohonan,
  StatusRuangan,
  Urgensi,
} from "./types";

/* ---------------------------------------------------------------- */
/* Format tanggal & waktu                                            */
/* ---------------------------------------------------------------- */

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/** "2026-09-21" -> "21 September 2026" */
export function formatTanggal(iso: string | null | undefined): string {
  if (!iso) return "-";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${BULAN[m - 1]} ${y}`;
}

/** "2026-09-21 08:30:00" -> "21 September 2026, 08.30" */
export function formatTanggalWaktu(iso: string | null | undefined): string {
  if (!iso) return "-";
  const tanggal = formatTanggal(iso);
  const jam = iso.slice(11, 16).replace(":", ".");
  return jam ? `${tanggal}, ${jam}` : tanggal;
}

/** "09:00" -> "09.00" */
export function formatJam(hhmm: string | null | undefined): string {
  if (!hhmm) return "-";
  return hhmm.slice(0, 5).replace(":", ".");
}

export function rentangWaktu(mulai: string, selesai: string): string {
  return `${formatJam(mulai)}–${formatJam(selesai)}`;
}

export function hariIniISO(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60 * 1000).toISOString().slice(0, 10);
}

/* ---------------------------------------------------------------- */
/* Label & warna status                                              */
/* ---------------------------------------------------------------- */

export const LABEL_STATUS_PERMOHONAN: Record<StatusPermohonan, string> = {
  DRAFT: "Draft",
  DIAJUKAN: "Diajukan",
  DALAM_VERIFIKASI: "Dalam Verifikasi",
  PERLU_PERBAIKAN: "Perlu Perbaikan",
  DITERIMA: "Diterima",
  DITOLAK: "Ditolak",
  DIJADWALKAN: "Dijadwalkan",
  BERLANGSUNG: "Berlangsung",
  SELESAI: "Selesai",
  DIBATALKAN: "Dibatalkan",
};

export function warnaStatusPermohonan(s: string): string {
  switch (s) {
    case "DRAFT": return "badge-slate";
    case "DIAJUKAN": return "badge-blue";
    case "DALAM_VERIFIKASI": return "badge-amber";
    case "PERLU_PERBAIKAN": return "badge-amber";
    case "DITERIMA": return "badge-green";
    case "DIJADWALKAN": return "badge-purple";
    case "BERLANGSUNG": return "badge-purple";
    case "SELESAI": return "badge-green";
    case "DITOLAK": return "badge-red";
    case "DIBATALKAN": return "badge-red";
    default: return "badge-slate";
  }
}

export const LABEL_STATUS_PENGADUAN: Record<StatusPengaduan, string> = {
  DIAJUKAN: "Diajukan",
  DIVERIFIKASI: "Diverifikasi",
  DITINDAKLANJUTI: "Ditindaklanjuti",
  SELESAI: "Selesai",
  DITOLAK: "Ditolak",
  TIDAK_VALID: "Tidak Valid",
};

export function warnaStatusPengaduan(s: string): string {
  switch (s) {
    case "DIAJUKAN": return "badge-blue";
    case "DIVERIFIKASI": return "badge-amber";
    case "DITINDAKLANJUTI": return "badge-purple";
    case "SELESAI": return "badge-green";
    case "DITOLAK":
    case "TIDAK_VALID": return "badge-red";
    default: return "badge-slate";
  }
}

export const LABEL_STATUS_JADWAL: Record<StatusJadwal, string> = {
  DIUSULKAN: "Diusulkan",
  TERJADWAL: "Terjadwal",
  BERLANGSUNG: "Berlangsung",
  SELESAI: "Selesai",
  DIBATALKAN: "Dibatalkan",
};

export function warnaStatusJadwal(s: string): string {
  switch (s) {
    case "DIUSULKAN": return "badge-amber";
    case "TERJADWAL": return "badge-blue";
    case "BERLANGSUNG": return "badge-purple";
    case "SELESAI": return "badge-green";
    case "DIBATALKAN": return "badge-red";
    default: return "badge-slate";
  }
}

export const LABEL_STATUS_RUANGAN: Record<StatusRuangan, string> = {
  TERSEDIA: "Tersedia",
  PERBAIKAN: "Perbaikan",
  TIDAK_AKTIF: "Tidak Aktif",
};

export function warnaStatusRuangan(s: string): string {
  switch (s) {
    case "TERSEDIA": return "badge-green";
    case "PERBAIKAN": return "badge-amber";
    case "TIDAK_AKTIF": return "badge-slate";
    default: return "badge-slate";
  }
}

export const LABEL_URGENSI: Record<Urgensi, string> = {
  RENDAH: "Rendah",
  SEDANG: "Sedang",
  TINGGI: "Tinggi",
};

export function warnaUrgensi(s: string): string {
  switch (s) {
    case "TINGGI": return "badge-red";
    case "SEDANG": return "badge-amber";
    default: return "badge-slate";
  }
}

/* ---------------------------------------------------------------- */
/* Validasi — Bab 10 dokumen analisis                                */
/* ---------------------------------------------------------------- */

export function emailValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/** Menerima 08xxxxxxxx atau +62xxxxxxxxx, 9–15 digit. */
export function teleponValid(telepon: string): boolean {
  const bersih = telepon.replace(/[\s\-().]/g, "");
  return /^(\+62|62|0)[0-9]{8,14}$/.test(bersih);
}

export function waktuValid(hhmm: string): boolean {
  return /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(hhmm);
}

/** Jam kunjungan Grhatama Pustaka, termasuk jeda layanan siang. */
export function waktuLayananValid(tanggal: string, mulai: string, selesai: string): boolean {
  const hari = new Date(`${tanggal}T00:00:00`).getDay();
  const sesi = hari === 1
    ? [["08:00", "11:30"], ["12:30", "15:30"]]
    : hari >= 2 && hari <= 4
      ? [["08:00", "15:30"]]
      : hari === 5
        ? [["09:00", "11:00"], ["13:00", "15:30"]]
        : hari === 6
          ? [["08:00", "11:30"], ["12:30", "15:30"]]
          : [];
  return sesi.some(([buka, tutup]) => mulai >= buka && selesai <= tutup);
}

export function tanggalValid(iso: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) && !Number.isNaN(Date.parse(iso));
}

/** Dua rentang waktu pada tanggal sama dianggap bentrok bila saling tumpang tindih. */
export function waktuBentrok(
  mulaiA: string, selesaiA: string,
  mulaiB: string, selesaiB: string
): boolean {
  return mulaiA < selesaiB && mulaiB < selesaiA;
}

/** Ambil isi field teks dari FormData dan rapikan. */
export function teks(fd: FormData, nama: string): string {
  const v = fd.get(nama);
  return typeof v === "string" ? v.trim() : "";
}

export function angka(fd: FormData, nama: string): number {
  const v = Number(teks(fd, nama));
  return Number.isFinite(v) ? v : 0;
}

export function potong(s: string | null | undefined, n = 80): string {
  if (!s) return "-";
  return s.length > n ? s.slice(0, n) + "…" : s;
}
