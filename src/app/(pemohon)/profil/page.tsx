import { wajibPemohon } from "@/lib/auth";
import { formatTanggalWaktu } from "@/lib/utils";
import FormProfil from "./FormProfil";
import FotoProfil from "./FotoProfil";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profil Saya" };

export default async function HalamanProfil() {
  const user = await wajibPemohon();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Profil Saya</h1>
        <p className="mt-1 text-sm text-slate-600">
          Data pemohon yang digunakan pada setiap permohonan kunjungan studi.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card-pad">
            <FormProfil user={user} />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card-pad">
            <FotoProfil userId={user.id} nama={user.nama} foto={user.foto} />
          </div>

          <div className="card-pad">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Informasi Akun
            </p>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-slate-500">Peran</dt>
                <dd className="font-medium text-slate-800">Pemohon</dd>
              </div>
              <div>
                <dt className="text-slate-500">Terdaftar sejak</dt>
                <dd className="font-medium text-slate-800">
                  {formatTanggalWaktu(user.created_at)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="alert-info">
            <p className="font-semibold">Keamanan data</p>
            <p className="mt-1 text-xs">
              Password disimpan dalam bentuk terenkripsi dan tidak pernah ditampilkan.
              Data sensitif tidak dibuka ke publik.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
