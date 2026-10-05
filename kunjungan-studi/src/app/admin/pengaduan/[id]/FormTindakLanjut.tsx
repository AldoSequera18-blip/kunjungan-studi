"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import SubmitButton from "@/components/SubmitButton";
import { aksiTindakLanjutPengaduan } from "../../actions";

/** Tindak lanjut pengaduan — Bab 22 dokumen analisis. */
export default function FormTindakLanjut({
  id,
  statusSaatIni,
  petugasSaatIni,
}: {
  id: number;
  statusSaatIni: string;
  petugasSaatIni: string | null;
}) {
  const [state, formAction] = useFormState(aksiTindakLanjutPengaduan, undefined);
  const [status, setStatus] = useState(statusSaatIni);

  const wajibCatatan = ["DITOLAK", "TIDAK_VALID"].includes(status);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={id} />

      {state?.error && <p className="alert-error">{state.error}</p>}
      {state?.success && <p className="alert-success">{state.success}</p>}

      <div>
        <label className="label" htmlFor="status">Status Pengaduan *</label>
        <select
          id="status"
          name="status"
          className="input"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="DIAJUKAN">Diajukan</option>
          <option value="DIVERIFIKASI">Diverifikasi</option>
          <option value="DITINDAKLANJUTI">Ditindaklanjuti</option>
          <option value="SELESAI">Selesai</option>
          <option value="DITOLAK">Ditolak</option>
          <option value="TIDAK_VALID">Tidak Valid</option>
        </select>
        <p className="hint">Alur yang disarankan: Diajukan → Diverifikasi → Ditindaklanjuti → Selesai.</p>
      </div>

      <div>
        <label className="label" htmlFor="petugas">Petugas / Penanggung Jawab</label>
        <input
          id="petugas"
          name="petugas"
          className="input"
          placeholder="Nama petugas yang menangani"
          defaultValue={petugasSaatIni ?? ""}
        />
      </div>

      <div>
        <label className="label" htmlFor="catatan">
          Catatan Tindak Lanjut {wajibCatatan && "*"}
        </label>
        <textarea
          id="catatan"
          name="catatan"
          className="textarea"
          placeholder="Contoh: teknisi sudah memeriksa unit AC, menunggu penggantian kapasitor."
          required={wajibCatatan}
        />
      </div>

      <SubmitButton className="btn-primary w-full" loadingText="Menyimpan…">
        Simpan Tindak Lanjut
      </SubmitButton>
    </form>
  );
}
