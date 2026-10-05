"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { buatSesi, cekPassword, hashPassword } from "@/lib/auth";
import { catatAudit } from "@/lib/audit";
import { emailValid, teks, teleponValid } from "@/lib/utils";
import type { FormState, User } from "@/lib/types";

export async function aksiLogin(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = teks(fd, "email").toLowerCase();
  const password = teks(fd, "password");

  if (!email || !password) return { error: "Email dan password wajib diisi." };

  const user = await db.prepare(`SELECT * FROM users WHERE email = ?`).get(email) as User | undefined;

  if (!user || !cekPassword(password, user.password_hash)) {
    return { error: "Email atau password salah." };
  }
  if (!user.aktif) {
    return { error: "Akun Anda tidak aktif. Silakan hubungi admin Balai." };
  }

  await buatSesi(user.id);
  await catatAudit({ userId: user.id, aktor: user.nama, aksi: "LOGIN", entitas: "SESSION" });

  redirect(user.role === "ADMIN" ? "/admin" : "/dashboard");
}

export async function aksiRegistrasi(_prev: FormState, fd: FormData): Promise<FormState> {
  const nama = teks(fd, "nama");
  const email = teks(fd, "email").toLowerCase();
  const telepon = teks(fd, "telepon");
  const instansi = teks(fd, "instansi");
  const alamat = teks(fd, "alamat");
  const password = teks(fd, "password");
  const konfirmasi = teks(fd, "konfirmasi");

  // Validasi minimal sesuai Bab 10
  if (!nama || !email || !telepon || !password) {
    return { error: "Nama, email, nomor telepon, dan password wajib diisi." };
  }
  if (!emailValid(email)) return { error: "Format email tidak valid." };
  if (!teleponValid(telepon)) {
    return { error: "Format nomor telepon tidak valid. Contoh: 081234567890." };
  }
  if (password.length < 8) return { error: "Password minimal 8 karakter." };
  if (password !== konfirmasi) return { error: "Konfirmasi password tidak sama." };

  const sudahAda = await db.prepare(`SELECT id FROM users WHERE email = ?`).get(email);
  if (sudahAda) return { error: "Email sudah terdaftar. Silakan masuk." };

  const info = await db
    .prepare(
      `INSERT INTO users (nama, email, password_hash, telepon, instansi, alamat, role)
       VALUES (?, ?, ?, ?, ?, ?, 'PEMOHON')`
    )
    .run(nama, email, hashPassword(password), telepon, instansi || null, alamat || null);

  const userId = Number(info.lastInsertRowid);

  await buatSesi(userId);
  await catatAudit({
    userId,
    aktor: nama,
    aksi: "REGISTRASI",
    entitas: "USER",
    entitasId: userId,
    detail: `Akun pemohon baru: ${email}`,
  });

  redirect("/dashboard");
}
