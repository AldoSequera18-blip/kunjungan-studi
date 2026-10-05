import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { penggunaSaatIni } from "@/lib/auth";

export const dynamic = "force-dynamic";

const TIPE: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

/** Unduh surat kunjungan — hanya pemilik permohonan dan admin (Aturan Bisnis no. 2). */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const u = penggunaSaatIni();
  if (!u) return new NextResponse("Tidak diizinkan", { status: 401 });

  const dok = db
    .prepare(
      `SELECT d.*, a.user_id FROM documents d
         JOIN visit_applications a ON a.id = d.application_id
        WHERE d.id = ? AND d.jenis = 'SURAT_PERMOHONAN'`
    )
    .get(Number(params.id)) as
    | { nama_file: string; berkas: string | null; user_id: number }
    | undefined;
  if (!dok || !dok.berkas) return new NextResponse("Tidak ditemukan", { status: 404 });
  if (u.role !== "ADMIN" && dok.user_id !== u.id) {
    return new NextResponse("Tidak diizinkan", { status: 403 });
  }

  const file = path.join(process.cwd(), "data", "surat", path.basename(dok.berkas));
  if (!fs.existsSync(file)) return new NextResponse("Berkas hilang", { status: 404 });

  const ext = path.extname(file).toLowerCase();
  return new NextResponse(fs.readFileSync(file), {
    headers: {
      "Content-Type": TIPE[ext] ?? "application/octet-stream",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(dok.nama_file)}`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
