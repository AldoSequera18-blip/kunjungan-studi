import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { penggunaSaatIni } from "@/lib/auth";

export const dynamic = "force-dynamic";

const TIPE: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

/** Foto profil — hanya pemilik akun dan admin yang dapat melihat. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const u = await penggunaSaatIni();
  if (!u) return new NextResponse("Tidak diizinkan", { status: 401 });

  const id = Number(idParam);
  if (u.role !== "ADMIN" && u.id !== id) {
    return new NextResponse("Tidak diizinkan", { status: 403 });
  }

  const row = await db.prepare(`SELECT foto FROM users WHERE id = ?`).get(id) as
    | { foto: string | null }
    | undefined;
  if (!row?.foto) return new NextResponse("Tidak ditemukan", { status: 404 });

  const file = path.join(process.cwd(), "data", "foto", path.basename(row.foto));
  if (!fs.existsSync(file)) return new NextResponse("Tidak ditemukan", { status: 404 });

  return new NextResponse(fs.readFileSync(file), {
    headers: {
      "Content-Type": TIPE[path.extname(file).toLowerCase()] ?? "application/octet-stream",
      "Cache-Control": "private, max-age=0, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
