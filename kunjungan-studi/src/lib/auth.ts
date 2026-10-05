import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import type { SessionUser, User } from "./types";

const COOKIE = "sesi_kunjungan";
const MASA_BERLAKU_HARI = 7;

/** Hash password — Aturan Bisnis no. 10: password tidak disimpan plaintext. */
export function hashPassword(pwd: string): string {
  return bcrypt.hashSync(pwd, 10);
}

export function cekPassword(pwd: string, hash: string): boolean {
  return bcrypt.compareSync(pwd, hash);
}

/** Membuat sesi baru dan menyimpan cookie httpOnly. */
export async function buatSesi(userId: number) {
  const id = crypto.randomBytes(32).toString("hex");
  const kadaluarsa = new Date(Date.now() + MASA_BERLAKU_HARI * 864e5);

  await db.prepare(`INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)`).run(
    id,
    userId,
    kadaluarsa.toISOString()
  );

  cookies().set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: kadaluarsa,
  });
}

export async function hapusSesi() {
  const id = cookies().get(COOKIE)?.value;
  if (id) await db.prepare(`DELETE FROM sessions WHERE id = ?`).run(id);
  cookies().delete(COOKIE);
}

/** Mengambil user yang sedang login, atau null. */
export async function penggunaSaatIni(): Promise<SessionUser | null> {
  const id = cookies().get(COOKIE)?.value;
  if (!id) return null;

  const sesi = await db
    .prepare(`SELECT user_id, expires_at FROM sessions WHERE id = ?`)
    .get(id) as { user_id: number; expires_at: string } | undefined;

  if (!sesi) return null;
  if (new Date(sesi.expires_at) < new Date()) {
    await db.prepare(`DELETE FROM sessions WHERE id = ?`).run(id);
    return null;
  }

  const user = await db
    .prepare(`SELECT * FROM users WHERE id = ? AND aktif = 1`)
    .get(sesi.user_id) as User | undefined;
  if (!user) return null;

  const { password_hash: _buang, ...aman } = user;
  return aman as SessionUser;
}

/** Wajib login (peran apa pun). */
export async function wajibLogin(): Promise<SessionUser> {
  const u = await penggunaSaatIni();
  if (!u) redirect("/login");
  return u;
}

/** Wajib login sebagai pemohon. */
export async function wajibPemohon(): Promise<SessionUser> {
  const u = await wajibLogin();
  if (u.role !== "PEMOHON") redirect("/admin");
  return u;
}

/** Wajib login sebagai admin — Bab 43 aturan hak akses. */
export async function wajibAdmin(): Promise<SessionUser> {
  const u = await wajibLogin();
  if (u.role !== "ADMIN") redirect("/dashboard");
  return u;
}
