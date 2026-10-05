"use client";

import { useFormState } from "react-dom";
import SubmitButton from "@/components/SubmitButton";
import { aksiAjukanPermohonan, aksiBatalkanPermohonan } from "../../actions";

export default function AksiPermohonan({
  id,
  bisaDiajukan,
  bisaDibatalkan,
}: {
  id: number;
  bisaDiajukan: boolean;
  bisaDibatalkan: boolean;
}) {
  const [stateAjukan, aksiAjukan] = useFormState(aksiAjukanPermohonan, undefined);
  const [stateBatal, aksiBatal] = useFormState(aksiBatalkanPermohonan, undefined);

  if (!bisaDiajukan && !bisaDibatalkan) return null;

  return (
    <section className="card-pad">
      <h2 className="section-title">Tindakan</h2>

      {stateAjukan?.error && <p className="alert-error mt-3">{stateAjukan.error}</p>}
      {stateAjukan?.success && <p className="alert-success mt-3">{stateAjukan.success}</p>}
      {stateBatal?.error && <p className="alert-error mt-3">{stateBatal.error}</p>}
      {stateBatal?.success && <p className="alert-success mt-3">{stateBatal.success}</p>}

      <div className="mt-4 flex flex-wrap gap-3">
        {bisaDiajukan && (
          <form action={aksiAjukan}>
            <input type="hidden" name="id" value={id} />
            <SubmitButton className="btn-primary" loadingText="Mengirim…">
              Ajukan ke Admin
            </SubmitButton>
          </form>
        )}
        {bisaDibatalkan && (
          <form action={aksiBatal}>
            <input type="hidden" name="id" value={id} />
            <SubmitButton
              className="btn-danger"
              loadingText="Membatalkan…"
              confirm="Batalkan permohonan kunjungan ini?"
            >
              Batalkan Permohonan
            </SubmitButton>
          </form>
        )}
      </div>

      {bisaDiajukan && (
        <p className="hint mt-3">
          Pastikan data kelompok dan daftar peserta sudah lengkap sebelum diajukan.
        </p>
      )}
    </section>
  );
}
