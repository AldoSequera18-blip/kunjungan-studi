import Link from "next/link";
import { db } from "@/lib/db";
import { wajibAdmin } from "@/lib/auth";
import EmptyState from "@/components/EmptyState";
import SubmitButton from "@/components/SubmitButton";
import { formatTanggalWaktu } from "@/lib/utils";
import type { Notification } from "@/lib/types";
import { aksiBacaSemuaNotifikasiAdmin } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notifikasi" };

export default async function NotifikasiAdmin({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = await searchParams;
  const admin = await wajibAdmin();
  const q = (query.q ?? "").trim().toLocaleLowerCase("id-ID");

  const daftar = await db
    .prepare(`SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`)
    .all(admin.id) as Notification[];
  const hasil = q ? daftar.filter((n) => [n.judul, n.pesan].some((v) => v.toLocaleLowerCase("id-ID").includes(q))) : daftar;

  const belumDibaca = daftar.filter((n) => !n.dibaca).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifikasi</h1>
          <p className="mt-1 text-sm text-slate-600">
            Pemberitahuan permohonan baru, pembatalan, dan pengaduan fasilitas.
          </p>
        </div>
        {belumDibaca > 0 && (
          <form action={aksiBacaSemuaNotifikasiAdmin}>
            <SubmitButton className="btn-secondary btn-sm" loadingText="…">
              Tandai semua dibaca ({belumDibaca})
            </SubmitButton>
          </form>
        )}
      </header>

      <form method="get" className="flex flex-wrap gap-2">
        <input name="q" className="input max-w-md" defaultValue={query.q ?? ""} placeholder="Cari judul atau isi notifikasi" />
        <button type="submit" className="btn-secondary">Cari</button>
        {q && <Link href="/admin/notifikasi" className="btn-secondary">Reset</Link>}
      </form>

      {hasil.length === 0 ? (
        <EmptyState
          judul="Belum ada notifikasi"
          pesan="Notifikasi muncul ketika ada permohonan baru atau pengaduan fasilitas masuk."
        />
      ) : (
        <div className="card divide-y divide-slate-100">
          {hasil.map((n) => (
            <div key={n.id} className={`flex gap-4 px-5 py-4 ${n.dibaca ? "" : "bg-brand-50/50"}`}>
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                  n.dibaca ? "bg-slate-300" : "bg-brand-500"
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{n.judul}</p>
                <p className="mt-0.5 text-sm text-slate-600">{n.pesan}</p>
                <p className="mt-1.5 text-xs text-slate-400">
                  {formatTanggalWaktu(n.created_at)}
                  {n.link && (
                    <>
                      {" · "}
                      <Link href={n.link} className="font-semibold text-brand-700 hover:underline">
                        Lihat detail
                      </Link>
                    </>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
