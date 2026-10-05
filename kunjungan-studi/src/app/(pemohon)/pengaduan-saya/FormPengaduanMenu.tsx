"use client";

import { useFormState } from "react-dom";
import SubmitButton from "@/components/SubmitButton";
import { KATEGORI_FASILITAS, type Room } from "@/lib/types";
import { aksiPengaduanDariMenu } from "../actions";

export default function FormPengaduanMenu({
  ruangan,
  kunjungan,
}: {
  ruangan: Room[];
  kunjungan: { id: number; nomor: string; nama_kelompok: string }[];
}) {
  const [state, formAction] = useFormState(aksiPengaduanDariMenu, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <p className="alert-error">{state.error}</p>}
      {state?.success && <p className="alert-success">{state.success}</p>}

      <div>
        <label className="label" htmlFor="room_id">Ruangan *</label>
        <select id="room_id" name="room_id" className="input" required defaultValue="">
          <option value="" disabled>— Pilih ruangan —</option>
          {ruangan.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nama} ({r.kode})
            </option>
          ))}
        </select>
        <p className="hint">
          Bila memindai QR Code di ruangan, kolom ini terisi otomatis.
        </p>
      </div>

      {kunjungan.length > 0 && (
        <div>
          <label className="label" htmlFor="application_id">Kaitkan dengan Kunjungan</label>
          <select id="application_id" name="application_id" className="input" defaultValue="">
            <option value="">— Tidak dikaitkan —</option>
            {kunjungan.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nomor} — {k.nama_kelompok}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="label" htmlFor="kategori">Kategori Fasilitas *</label>
        <select id="kategori" name="kategori" className="input" required defaultValue="">
          <option value="" disabled>— Pilih kategori —</option>
          {KATEGORI_FASILITAS.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="deskripsi">Deskripsi Masalah *</label>
        <textarea
          id="deskripsi"
          name="deskripsi"
          className="textarea"
          placeholder="Jelaskan kendala yang ditemukan."
          required
          minLength={10}
        />
      </div>

      <div>
        <label className="label" htmlFor="urgensi">Tingkat Urgensi</label>
        <select id="urgensi" name="urgensi" className="input" defaultValue="SEDANG">
          <option value="RENDAH">Rendah</option>
          <option value="SEDANG">Sedang</option>
          <option value="TINGGI">Tinggi</option>
        </select>
      </div>

      <SubmitButton className="btn-primary w-full" loadingText="Mengirim…">
        Kirim Pengaduan
      </SubmitButton>
    </form>
  );
}
