"use client";

import { useFormState } from "react-dom";
import SubmitButton from "@/components/SubmitButton";
import type { Room } from "@/lib/types";
import { aksiSimpanRuangan } from "../actions";

/** Modul Ruangan — Bab 34 dokumen analisis. */
export default function FormRuangan({ data }: { data?: Room }) {
  const [state, formAction] = useFormState(aksiSimpanRuangan, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {data && <input type="hidden" name="id" value={data.id} />}
      {state?.error && <p className="alert-error">{state.error}</p>}
      {state?.success && <p className="alert-success">{state.success}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="kode">Kode Ruangan *</label>
          <input
            id="kode"
            name="kode"
            className="input font-mono uppercase"
            placeholder="R-006"
            defaultValue={data?.kode}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="kapasitas">Kapasitas (orang) *</label>
          <input
            id="kapasitas"
            name="kapasitas"
            type="number"
            min={1}
            className="input"
            defaultValue={data?.kapasitas ?? ""}
            required
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="nama">Nama Ruangan *</label>
        <input
          id="nama"
          name="nama"
          className="input"
          placeholder="Ruang Diskusi Lantai 2"
          defaultValue={data?.nama}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="lokasi">Lokasi</label>
        <input
          id="lokasi"
          name="lokasi"
          className="input"
          placeholder="Lantai 2 – Sayap Barat"
          defaultValue={data?.lokasi ?? ""}
        />
      </div>

      <div>
        <label className="label" htmlFor="fasilitas">Fasilitas</label>
        <input
          id="fasilitas"
          name="fasilitas"
          className="input"
          placeholder="AC, Proyektor, Whiteboard"
          defaultValue={data?.fasilitas ?? ""}
        />
        <p className="hint">Pisahkan dengan koma.</p>
      </div>

      <div>
        <label className="label" htmlFor="status">Status Ketersediaan</label>
        <select id="status" name="status" className="input" defaultValue={data?.status ?? "TERSEDIA"}>
          <option value="TERSEDIA">Tersedia</option>
          <option value="PERBAIKAN">Perbaikan</option>
          <option value="TIDAK_AKTIF">Tidak Aktif</option>
        </select>
      </div>

      <div>
        <label className="label" htmlFor="keterangan">Keterangan</label>
        <textarea
          id="keterangan"
          name="keterangan"
          className="textarea"
          defaultValue={data?.keterangan ?? ""}
        />
      </div>

      <SubmitButton className="btn-primary w-full" loadingText="Menyimpan…">
        {data ? "Simpan Perubahan" : "Tambah Ruangan"}
      </SubmitButton>

      {!data && (
        <p className="hint">
          QR Code pengaduan dan QR Code daftar hadir dibuat otomatis untuk ruangan baru.
        </p>
      )}
    </form>
  );
}
