"use client";

import { useFormState } from "react-dom";
import SubmitButton from "@/components/SubmitButton";
import type { SessionUser } from "@/lib/types";
import { aksiUbahPasswordAdmin, aksiUbahProfilAdmin } from "../actions";

export function FormProfilAdmin({ user }: { user: SessionUser }) {
  const [state, formAction] = useFormState(aksiUbahProfilAdmin, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <p className="alert-error">{state.error}</p>}
      {state?.success && <p className="alert-success">{state.success}</p>}

      <div>
        <label className="label" htmlFor="nama">Nama Lengkap *</label>
        <input id="nama" name="nama" className="input" defaultValue={user.nama} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="email">Email *</label>
          <input id="email" name="email" type="email" className="input" defaultValue={user.email} required />
        </div>
        <div>
          <label className="label" htmlFor="telepon">Nomor Telepon</label>
          <input id="telepon" name="telepon" className="input" defaultValue={user.telepon ?? ""} />
        </div>
      </div>

      <SubmitButton className="btn-primary" loadingText="Menyimpan…">
        Simpan Perubahan
      </SubmitButton>
    </form>
  );
}

export function FormPasswordAdmin() {
  const [state, formAction] = useFormState(aksiUbahPasswordAdmin, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <p className="alert-error">{state.error}</p>}
      {state?.success && <p className="alert-success">{state.success}</p>}

      <div>
        <label className="label" htmlFor="password_lama">Password Lama *</label>
        <input id="password_lama" name="password_lama" type="password" className="input" autoComplete="current-password" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="password_baru">Password Baru *</label>
          <input id="password_baru" name="password_baru" type="password" className="input" autoComplete="new-password" minLength={8} required />
        </div>
        <div>
          <label className="label" htmlFor="konfirmasi">Konfirmasi Password *</label>
          <input id="konfirmasi" name="konfirmasi" type="password" className="input" autoComplete="new-password" minLength={8} required />
        </div>
      </div>

      <SubmitButton className="btn-primary" loadingText="Menyimpan…">
        Ubah Password
      </SubmitButton>
    </form>
  );
}
