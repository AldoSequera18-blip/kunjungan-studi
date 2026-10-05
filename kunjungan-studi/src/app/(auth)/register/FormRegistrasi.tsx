"use client";

import { useFormState } from "react-dom";
import SubmitButton from "@/components/SubmitButton";
import { aksiRegistrasi } from "../actions";

export default function FormRegistrasi() {
  const [state, formAction] = useFormState(aksiRegistrasi, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <p className="alert-error">{state.error}</p>}

      <div>
        <label className="label" htmlFor="nama">Nama Lengkap *</label>
        <input id="nama" name="nama" className="input" placeholder="Nama sesuai identitas" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="email">Email *</label>
          <input id="email" name="email" type="email" className="input" placeholder="nama@instansi.sch.id" required />
        </div>
        <div>
          <label className="label" htmlFor="telepon">Nomor Telepon *</label>
          <input id="telepon" name="telepon" className="input" placeholder="081234567890" required />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="instansi">Asal Instansi / Sekolah / Kampus</label>
        <input id="instansi" name="instansi" className="input" placeholder="SMA Negeri 1 Yogyakarta" />
      </div>

      <div>
        <label className="label" htmlFor="alamat">Alamat</label>
        <textarea id="alamat" name="alamat" className="textarea" placeholder="Alamat instansi atau alamat pemohon" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="password">Password *</label>
          <input id="password" name="password" type="password" className="input" required minLength={8} />
          <p className="hint">Minimal 8 karakter.</p>
        </div>
        <div>
          <label className="label" htmlFor="konfirmasi">Konfirmasi Password *</label>
          <input id="konfirmasi" name="konfirmasi" type="password" className="input" required minLength={8} />
        </div>
      </div>

      <SubmitButton className="btn-primary w-full" loadingText="Mendaftarkan…">
        Daftar
      </SubmitButton>
    </form>
  );
}
