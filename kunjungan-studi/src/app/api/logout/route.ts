import { NextResponse } from "next/server";
import { penggunaSaatIni, hapusSesi } from "@/lib/auth";
import { catatAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const u = await penggunaSaatIni();
  if (u) await catatAudit({ userId: u.id, aktor: u.nama, aksi: "LOGOUT", entitas: "SESSION" });
  await hapusSesi();
  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}
