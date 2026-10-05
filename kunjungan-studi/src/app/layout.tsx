import type { Metadata, Viewport } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";

const fontSans = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const fontDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

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
    <html lang="id" className={`${fontSans.variable} ${fontDisplay.variable}`}>
      <body>{children}</body>
    </html>
  );
}
