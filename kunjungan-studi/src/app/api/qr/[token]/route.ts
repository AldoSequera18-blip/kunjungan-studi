import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import type { RoomQrCode } from "@/lib/types";

/**
 * Menghasilkan gambar QR Code (PNG) untuk sebuah token ruangan.
 * Isi QR mengarah ke halaman pengaduan/daftar hadir ruangan tersebut,
 * sehingga identitas ruangan terbawa otomatis (Bab 19).
 */
export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  const qr = await db
    .prepare(`SELECT * FROM room_qr_codes WHERE token = ? AND aktif = 1`)
    .get(params.token) as RoomQrCode | undefined;

  if (!qr) {
    return new NextResponse("QR Code tidak ditemukan", { status: 404 });
  }

  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0].trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0].trim();
  const host = forwardedHost || request.headers.get("host") || url.host;
  const protocol = forwardedProto || url.protocol.replace(":", "");
  const base = (process.env.PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`).replace(/\/$/, "");
  const tujuan =
    qr.tipe === "PENGADUAN"
      ? `${base}/pengaduan/${qr.token}`
      : `${base}/hadir/${qr.token}`;

  const png = await QRCode.toBuffer(tujuan, {
    type: "png",
    width: 600,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#0e5343", light: "#ffffff" },
  });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
