"use client";

import { useFormState } from "react-dom";
import SubmitButton from "@/components/SubmitButton";
import type { SessionUser } from "@/lib/types";
import { aksiUbahProfil } from "../actions";

export default function FormProfil({ user }: { user: SessionUser }) {
  const [state, formAction] = useFormState(aksiUbahProfil, undefined);

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
          <label className="label" htmlFor="telepon">Nomor Telepon *</label>
          <input id="telepon" name="telepon" className="input" defaultValue={user.telepon ?? ""} required />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="instansi">Asal Instansi</label>
        <input id="instansi" name="instansi" className="input" defaultValue={user.instansi ?? ""} />
      </div>

      <div>
        <label className="label" htmlFor="alamat">Alamat</label>
        <textarea id="alamat" name="alamat" className="textarea" defaultValue={user.alamat ?? ""} />
      </div>

      <SubmitButton className="btn-primary" loadingText="Menyimpan…">
        Simpan Perubahan
      </SubmitButton>
    </form>
  );
}
