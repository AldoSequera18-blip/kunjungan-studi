"use client";

import { useFormState } from "react-dom";
import SubmitButton from "@/components/SubmitButton";
import { aksiHapusFoto, aksiUnggahFoto } from "../actions";

export default function FotoProfil({
  userId,
  nama,
  foto,
}: {
  userId: number;
  nama: string;
  foto: string | null;
}) {
  const [stateUnggah, aksiUnggah] = useFormState(aksiUnggahFoto, undefined);
  const [stateHapus, aksiHapus] = useFormState(aksiHapusFoto, undefined);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Foto Profil</p>

      <div className="mt-3 flex flex-col items-center gap-4 text-center">
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/foto/${userId}?v=${encodeURIComponent(foto)}`}
            alt={`Foto ${nama}`}
            className="h-28 w-28 rounded-full object-cover ring-2 ring-brand-600/30"
          />
        ) : (
          <span className="flex h-28 w-28 items-center justify-center rounded-full bg-brand-100 font-display text-4xl font-bold text-brand-700">
            {nama.trim().charAt(0).toUpperCase()}
          </span>
        )}

        {stateUnggah?.error && <p className="alert-error w-full">{stateUnggah.error}</p>}
        {stateUnggah?.success && <p className="alert-success w-full">{stateUnggah.success}</p>}
        {stateHapus?.error && <p className="alert-error w-full">{stateHapus.error}</p>}
        {stateHapus?.success && <p className="alert-success w-full">{stateHapus.success}</p>}

        <form action={aksiUnggah} className="w-full space-y-2">
          <input
            name="foto"
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            className="input"
            required
          />
          <p className="hint">JPG, PNG, atau WEBP, maksimal 2 MB.</p>
          <SubmitButton className="btn-primary w-full" loadingText="Mengunggah…">
            {foto ? "Ganti Foto" : "Unggah Foto"}
          </SubmitButton>
        </form>

        {foto && (
          <form action={aksiHapus} className="w-full">
            <SubmitButton className="btn-secondary w-full" loadingText="…" confirm="Hapus foto profil?">
              Hapus Foto
            </SubmitButton>
          </form>
        )}
      </div>
    </div>
  );
}
