import Link from "next/link";
import { db } from "@/lib/db";
import { wajibPemohon } from "@/lib/auth";
import EmptyState from "@/components/EmptyState";
import { LABEL_STATUS_PERMOHONAN, formatTanggal, warnaStatusPermohonan } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Data Peserta" };

interface BarisKelompok {
  id: number;
  nomor: string;
  nama_kelompok: string;
  asal_instansi: string;
  tanggal_usulan: string;
  status: string;
  jumlah_peserta: number;
  terdaftar: number;
}

interface BarisPeserta {
  id: number;
  application_id: number;
  nama: string;
  identitas: string | null;
  jenis: string;
}

/** Menu Data Peserta — Bab 26 dokumen analisis. */
export default async function HalamanDataPeserta({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = await searchParams;
  const user = await wajibPemohon();
  const q = (query.q ?? "").trim().toLocaleLowerCase("id-ID");

  const kelompok = await db
    .prepare(
      `SELECT a.id, a.nomor, a.nama_kelompok, a.asal_instansi, a.tanggal_usulan,
              a.status, a.jumlah_peserta,
              (SELECT COUNT(*) FROM visitors v WHERE v.application_id = a.id) AS terdaftar
         FROM visit_applications a
        WHERE a.user_id = ? AND a.status != 'DIBATALKAN'
        ORDER BY a.created_at DESC`
    )
    .all(user.id) as BarisKelompok[];

  const semuaPeserta = await db
    .prepare(
      `SELECT v.id, v.application_id, v.nama, v.identitas, v.jenis
         FROM visitors v JOIN visit_applications a ON a.id = v.application_id
        WHERE a.user_id = ? ORDER BY v.jenis DESC, v.nama`
    )
    .all(user.id) as BarisPeserta[];
  const daftarKelompok = q ? kelompok.filter((k) =>
    [k.nomor, k.nama_kelompok, k.asal_instansi].some((v) => v.toLocaleLowerCase("id-ID").includes(q)) ||
    semuaPeserta.some((p) => p.application_id === k.id && [p.nama, p.identitas ?? ""].some((v) => v.toLocaleLowerCase("id-ID").includes(q)))
  ) : kelompok;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Data Peserta</h1>
        <p className="mt-1 text-sm text-slate-600">
          Daftar peserta pada setiap kunjungan studi yang Anda ajukan. Peserta ditambahkan atau
          diubah melalui halaman detail kunjungan.
        </p>
      </header>

      <form method="get" className="flex flex-wrap gap-2">
        <input name="q" className="input max-w-md" defaultValue={query.q ?? ""} placeholder="Cari peserta, kelompok, atau instansi" />
        <button type="submit" className="btn-secondary">Cari</button>
        {q && <Link href="/peserta" className="btn-secondary">Reset</Link>}
      </form>

      {daftarKelompok.length === 0 ? (
        <EmptyState
          judul="Belum ada kelompok kunjungan"
          pesan="Ajukan permohonan kunjungan terlebih dahulu untuk mengisi data peserta."
          aksi={<Link href="/kunjungan/baru" className="btn-primary">Ajukan Kunjungan</Link>}
        />
      ) : (
        <div className="space-y-5">
          {daftarKelompok.map((k) => {
            const anggota = semuaPeserta.filter((p) => p.application_id === k.id);
            const lengkap = anggota.length >= k.jumlah_peserta;

            return (
              <section key={k.id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
                  <div>
                    <p className="font-mono text-xs text-slate-500">{k.nomor}</p>
                    <h2 className="mt-0.5 font-bold text-slate-900">{k.nama_kelompok}</h2>
                    <p className="text-xs text-slate-500">
                      {k.asal_instansi} · usulan {formatTanggal(k.tanggal_usulan)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={warnaStatusPermohonan(k.status)}>
                      {LABEL_STATUS_PERMOHONAN[k.status as never] ?? k.status}
                    </span>
                    <Link href={`/kunjungan/${k.id}`} className="btn-secondary btn-sm">
                      Kelola
                    </Link>
                  </div>
                </div>

                <div className="px-5 py-4">
                  <p className={`text-sm ${lengkap ? "text-emerald-700" : "text-amber-700"}`}>
                    {anggota.length} dari {k.jumlah_peserta} peserta terdaftar
                    {lengkap ? " — lengkap." : " — masih perlu dilengkapi."}
                  </p>

                  {anggota.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {anggota.map((p) => (
                        <span
                          key={p.id}
                          className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
                        >
                          {p.nama}
                          {p.jenis === "PENDAMPING" && (
                            <span className="ml-1 text-violet-600">(pendamping)</span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
