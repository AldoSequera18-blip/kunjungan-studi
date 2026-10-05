import { wajibAdmin } from "@/lib/auth";
import { formatTanggalWaktu } from "@/lib/utils";
import { FormPasswordAdmin, FormProfilAdmin } from "./FormProfilAdmin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profil Admin" };

export default function HalamanProfilAdmin() {
  const user = wajibAdmin();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Profil Admin</h1>
        <p className="mt-1 text-sm text-slate-600">
          Kelola data akun dan password administrator.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card-pad">
            <h2 className="mb-4 text-base font-semibold text-slate-800">Data Akun</h2>
            <FormProfilAdmin user={user} />
          </div>
          <div className="card-pad">
            <h2 className="mb-4 text-base font-semibold text-slate-800">Ubah Password</h2>
            <FormPasswordAdmin />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card-pad">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Informasi Akun
            </p>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-slate-500">Peran</dt>
                <dd className="font-medium text-slate-800">Administrator</dd>
              </div>
              <div>
                <dt className="text-slate-500">Terdaftar sejak</dt>
                <dd className="font-medium text-slate-800">{formatTanggalWaktu(user.created_at)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
