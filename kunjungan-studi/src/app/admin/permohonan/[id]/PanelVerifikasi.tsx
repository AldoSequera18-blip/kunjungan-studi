"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import SubmitButton from "@/components/SubmitButton";
import {
  aksiKeputusanPermohonan,
  aksiMulaiVerifikasi,
  aksiSelesaikanKunjungan,
} from "../../actions";

/** Verifikasi & keputusan admin — Bab 13 & 14 dokumen analisis. */
export default function PanelVerifikasi({
  id,
  status,
  jenisKunjungan,
}: {
  id: number;
  status: string;
  jenisKunjungan: "RESMI" | "TIDAK_RESMI";
}) {
  const [stateMulai, aksiMulai] = useFormState(aksiMulaiVerifikasi, undefined);
  const [stateKeputusan, aksiKeputusan] = useFormState(aksiKeputusanPermohonan, undefined);
  const [stateSelesai, aksiSelesai] = useFormState(aksiSelesaikanKunjungan, undefined);
  const [keputusan, setKeputusan] = useState("DITERIMA");

  const bisaVerifikasi = status === "DIAJUKAN";
  const bisaKeputusan = ["DIAJUKAN", "DALAM_VERIFIKASI"].includes(status);
  const bisaSelesai = ["DIJADWALKAN", "BERLANGSUNG"].includes(status);

  return (
    <section className="card-pad space-y-4">
      <h2 className="section-title">Verifikasi &amp; Keputusan</h2>

      {stateMulai?.error && <p className="alert-error">{stateMulai.error}</p>}
      {stateMulai?.success && <p className="alert-success">{stateMulai.success}</p>}
      {stateKeputusan?.error && <p className="alert-error">{stateKeputusan.error}</p>}
      {stateKeputusan?.success && <p className="alert-success">{stateKeputusan.success}</p>}
      {stateSelesai?.error && <p className="alert-error">{stateSelesai.error}</p>}
      {stateSelesai?.success && <p className="alert-success">{stateSelesai.success}</p>}

      {bisaVerifikasi && (
        <form action={aksiMulai}>
          <input type="hidden" name="id" value={id} />
          <SubmitButton className="btn-secondary" loadingText="Memproses…">
            Mulai Verifikasi
          </SubmitButton>
          <p className="hint mt-2">
            Menandai bahwa permohonan sedang diperiksa. Pemohon akan menerima notifikasi.
          </p>
        </form>
      )}

      {bisaKeputusan && (
        <form action={aksiKeputusan} className="space-y-4 border-t border-slate-100 pt-4">
          <input type="hidden" name="id" value={id} />
          {jenisKunjungan === "TIDAK_RESMI" && (
            <p className="alert-info">Kunjungan tidak resmi tidak memerlukan pilihan ruangan. Keputusan dapat langsung disimpan dari panel ini.</p>
          )}

          <div>
            <label className="label" htmlFor="keputusan">Keputusan *</label>
            <select
              id="keputusan"
              name="keputusan"
              className="input"
              value={keputusan}
              onChange={(e) => setKeputusan(e.target.value)}
            >
              <option value="DITERIMA">Terima permohonan</option>
              <option value="PERLU_PERBAIKAN">Minta perbaikan data</option>
              <option value="DITOLAK">Tolak permohonan</option>
            </select>
          </div>

          <div>
            <label className="label" htmlFor="alasan">
              {keputusan === "DITERIMA"
                ? "Catatan untuk Pemohon (opsional)"
                : keputusan === "DITOLAK"
                ? "Alasan Penolakan *"
                : "Hal yang Perlu Diperbaiki *"}
            </label>
            <textarea
              id="alasan"
              name="alasan"
              className="textarea"
              placeholder={
                keputusan === "DITERIMA"
                  ? "Contoh: mohon hadir 15 menit lebih awal untuk registrasi."
                  : "Jelaskan alasan atau bagian yang perlu diperbaiki."
              }
              required={keputusan !== "DITERIMA"}
            />
          </div>

          <div>
            <label className="label" htmlFor="catatan_admin">Catatan Internal (tidak dikirim ke pemohon)</label>
            <textarea
              id="catatan_admin"
              name="catatan_admin"
              className="textarea"
              placeholder="Catatan untuk arsip internal Balai."
            />
          </div>

          <SubmitButton
            className={keputusan === "DITOLAK" ? "btn-danger" : "btn-primary"}
            loadingText="Menyimpan…"
          >
            Simpan Keputusan
          </SubmitButton>
        </form>
      )}

      {bisaSelesai && (
        <form action={aksiSelesai} className="border-t border-slate-100 pt-4">
          <input type="hidden" name="id" value={id} />
          <SubmitButton
            className="btn-primary"
            loadingText="Menyimpan…"
            confirm="Tandai kunjungan ini sebagai selesai?"
          >
            Tandai Kunjungan Selesai
          </SubmitButton>
        </form>
      )}

      {!bisaVerifikasi && !bisaKeputusan && !bisaSelesai && (
        <p className="alert-info">
          Tidak ada tindakan verifikasi yang tersedia untuk status permohonan saat ini.
        </p>
      )}
    </section>
  );
}
