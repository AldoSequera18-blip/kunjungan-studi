import { db } from "@/lib/db";
import { wajibAdmin } from "@/lib/auth";
import { formatTanggalWaktu } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pengaturan" };

/**
 * Halaman Pengaturan — Bab 30.
 * Berisi informasi sistem serta daftar hal yang menurut Bab 46 masih
 * memerlukan konfirmasi resmi dari Balai sebelum dijadikan aturan wajib.
 */
export default async function HalamanPengaturan({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = await searchParams;
  await wajibAdmin();
  const q = (query.q ?? "").trim().toLocaleLowerCase("id-ID");

  const hitung = async (sql: string) => (await db.prepare(sql).get() as { n: number }).n;

  const statistik = [
    ["Pengguna terdaftar", await hitung(`SELECT COUNT(*) AS n FROM users`)],
    ["Admin", await hitung(`SELECT COUNT(*) AS n FROM users WHERE role = 'ADMIN'`)],
    ["Ruangan", await hitung(`SELECT COUNT(*) AS n FROM rooms`)],
    ["QR Code aktif", await hitung(`SELECT COUNT(*) AS n FROM room_qr_codes WHERE aktif = 1`)],
    ["Permohonan", await hitung(`SELECT COUNT(*) AS n FROM visit_applications`)],
    ["Jadwal", await hitung(`SELECT COUNT(*) AS n FROM visit_schedules`)],
    ["Catatan kehadiran", await hitung(`SELECT COUNT(*) AS n FROM attendance`)],
    ["Pengaduan", await hitung(`SELECT COUNT(*) AS n FROM facility_reports`)],
    ["Catatan audit", await hitung(`SELECT COUNT(*) AS n FROM audit_logs`)],
  ] as const;

  const pengguna = await db
    .prepare(`SELECT id, nama, email, role, instansi, created_at FROM users ORDER BY role, nama`)
    .all() as {
    id: number;
    nama: string;
    email: string;
    role: string;
    instansi: string | null;
    created_at: string;
  }[];
  const hasilPengguna = q ? pengguna.filter((u) => [u.nama, u.email, u.instansi ?? "", u.role].some((v) => v.toLocaleLowerCase("id-ID").includes(q))) : pengguna;


  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Pengaturan</h1>
        <p className="mt-1 text-sm text-slate-600">
          Informasi sistem dan daftar pengguna.
        </p>
      </header>

      <section className="card-pad">
        <h2 className="section-title">Statistik Sistem</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {statistik.map(([label, nilai]) => (
            <div key={label} className="rounded-lg bg-slate-50 px-3 py-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {label}
              </dt>
              <dd className="mt-1 text-xl font-bold text-slate-900">{nilai}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="section-title">Hak Akses Pengguna</h2>
        </div>
        <form method="get" className="flex flex-wrap gap-2 px-5 py-4">
          <input name="q" className="input max-w-md" defaultValue={query.q ?? ""} placeholder="Cari nama, email, instansi, peran" />
          <button type="submit" className="btn-secondary">Cari pengguna</button>
        </form>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Instansi</th>
                <th>Peran</th>
                <th>Terdaftar</th>
              </tr>
            </thead>
            <tbody>
              {hasilPengguna.map((u) => (
                <tr key={u.id}>
                  <td className="font-medium text-slate-900">{u.nama}</td>
                  <td>{u.email}</td>
                  <td>{u.instansi ?? "-"}</td>
                  <td>
                    <span className={u.role === "ADMIN" ? "badge-purple" : "badge-slate"}>
                      {u.role === "ADMIN" ? "Admin" : "Pemohon"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-xs text-slate-500">
                    {formatTanggalWaktu(u.created_at)}
                  </td>
                </tr>
              ))}
              {hasilPengguna.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-sm text-slate-500">Tidak ada pengguna yang cocok.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>




    </div>
  );
}
