import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Tilik Pustaka — Balai Layanan Perpustakaan DPAD DIY",
    template: "%s · Tilik Pustaka",
  },
  description:
    "Sistem Informasi Manajemen Kunjungan Studi pada Balai Layanan Perpustakaan DPAD DIY: informasi layanan, pendaftaran kelompok, verifikasi, penjadwalan, daftar hadir per ruangan, dan pengaduan fasilitas melalui QR Code.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#128363",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
