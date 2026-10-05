"use client";

import { useFormState } from "react-dom";
import SubmitButton from "@/components/SubmitButton";
import { aksiHapusSurat, aksiUnggahSurat } from "../../actions";

export default function PanelSurat({
  applicationId,
  surat,
  bolehUbah,
}: {
  applicationId: number;
  surat: { id: number; nama_file: string; created_at: string } | null;
  bolehUbah: boolean;
}) {
  const [stateUnggah, aksiUnggah] = useFormState(aksiUnggahSurat, undefined);
  const [stateHapus, aksiHapus] = useFormState(aksiHapusSurat, undefined);

  return (
    <section className="card-pad">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="section-title">Surat Kunjungan</h2>
          <p className="mt-1 text-sm text-slate-600">
            Unggah surat permohonan kunjungan resmi dari instansi Anda. Belum punya? Unduh
            template, isi, lalu tandatangani.
          </p>
        </div>
        <a
          href="/template/Template-Surat-Kunjungan.docx"
          download
          className="btn-secondary btn-sm"
        >
          ⬇ Unduh Template Surat
        </a>
      </div>

      {stateUnggah?.error && <p className="alert-error mt-3">{stateUnggah.error}</p>}
      {stateUnggah?.success && <p className="alert-success mt-3">{stateUnggah.success}</p>}
      {stateHapus?.error && <p className="alert-error mt-3">{stateHapus.error}</p>}
      {stateHapus?.success && <p className="alert-success mt-3">{stateHapus.success}</p>}

      {surat ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
          <span className="min-w-0 text-sm">
            <span className="block truncate font-medium text-slate-800">{surat.nama_file}</span>
            <span className="text-xs text-slate-500">Diunggah {surat.created_at}</span>
          </span>
          <span className="flex items-center gap-2">
            <a
              href={`/api/surat/${surat.id}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-brand-700 hover:underline"
            >
              Buka
            </a>
            {bolehUbah && (
              <form action={aksiHapus}>
                <input type="hidden" name="id" value={applicationId} />
                <SubmitButton className="btn-danger btn-sm" loadingText="…" confirm="Hapus surat ini?">
                  Hapus
                </SubmitButton>
              </form>
            )}
          </span>
        </div>
      ) : (
        <p className="hint mt-4">Belum ada surat yang diunggah.</p>
      )}

      {bolehUbah && (
        <form action={aksiUnggah} className="mt-4 flex flex-wrap items-end gap-3">
          <input type="hidden" name="id" value={applicationId} />
          <div className="min-w-0 flex-1">
            <label className="label" htmlFor="surat">
              {surat ? "Ganti Surat" : "Berkas Surat"} (PDF/DOC/DOCX, maks. 5 MB)
            </label>
            <input
              id="surat"
              name="surat"
              type="file"
              accept=".pdf,.doc,.docx"
              className="input"
              required
            />
          </div>
          <SubmitButton className="btn-primary" loadingText="Mengunggah…">
            Unggah
          </SubmitButton>
        </form>
      )}
    </section>
  );
}
