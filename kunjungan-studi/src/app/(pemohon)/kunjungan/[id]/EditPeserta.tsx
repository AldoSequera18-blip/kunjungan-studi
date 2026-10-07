"use client";

import { useFormState } from "react-dom";
import SubmitButton from "@/components/SubmitButton";
import type { Visitor } from "@/lib/types";
import { aksiUbahPeserta } from "../../actions";

export default function EditPeserta({ peserta }: { peserta: Visitor }) {
  const [state, formAction] = useFormState(aksiUbahPeserta, {});

  return (
    <details className="min-w-48">
      <summary className="cursor-pointer text-right text-sm font-semibold text-brand-700">Ubah</summary>
      <form action={formAction} className="mt-2 min-w-64 space-y-2 rounded-lg bg-slate-50 p-3">
      <input type="hidden" name="visitor_id" value={peserta.id} />
      {state?.error && <p className="alert-error text-xs">{state.error}</p>}
      {state?.success && <p className="alert-success text-xs">{state.success}</p>}
      <label className="sr-only" htmlFor={`nama-${peserta.id}`}>Nama peserta</label>
      <input id={`nama-${peserta.id}`} name="nama" className="input" defaultValue={peserta.nama} required />
      <label className="sr-only" htmlFor={`identitas-${peserta.id}`}>Identitas</label>
      <input id={`identitas-${peserta.id}`} name="identitas" className="input" defaultValue={peserta.identitas ?? ""} placeholder="NIS / NIM / NIP" />
      <label className="sr-only" htmlFor={`jenis-${peserta.id}`}>Jenis</label>
      <select id={`jenis-${peserta.id}`} name="jenis" className="input" defaultValue={peserta.jenis}>
        <option value="PESERTA">Peserta</option>
        <option value="PENDAMPING">Pendamping</option>
      </select>
      <SubmitButton className="btn-secondary btn-sm w-full" loadingText="Menyimpan…">Simpan perubahan</SubmitButton>
      </form>
    </details>
  );
}
