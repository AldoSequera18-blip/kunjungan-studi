"use client";

import { useFormState } from "react-dom";
import SubmitButton from "@/components/SubmitButton";
import { aksiRegenerasiQr } from "../../actions";

/**
 * Kartu QR Code ruangan — Bab 16, 19, 34.
 * QR pengaduan dan QR daftar hadir sengaja dibedakan agar fungsinya jelas.
 */
export default function KartuQr({
  qrId,
  tipe,
  token,
  namaRuangan,
  kodeRuangan,
  baseUrl,
}: {
  qrId: number;
  tipe: "PENGADUAN" | "ABSENSI";
  token: string;
  namaRuangan: string;
  kodeRuangan: string;
  baseUrl: string;
}) {
  const [state, formAction] = useFormState(aksiRegenerasiQr, undefined);

  const tujuan =
    tipe === "PENGADUAN" ? `${baseUrl}/pengaduan/${token}` : `${baseUrl}/hadir/${token}`;
  const judul = tipe === "PENGADUAN" ? "QR Code Pengaduan Fasilitas" : "QR Code Daftar Hadir";
  const keterangan =
    tipe === "PENGADUAN"
      ? "Tempel di lokasi yang mudah terlihat. Halaman pengaduan otomatis mencatat ruangan ini."
      : "Digunakan peserta untuk melakukan check-in pada ruangan ini.";

  return (
    <div className="card-pad">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900">{judul}</h3>
          <p className="mt-1 text-xs text-slate-500">{keterangan}</p>
        </div>
        <span className={tipe === "PENGADUAN" ? "badge-amber" : "badge-blue"}>{tipe}</span>
      </div>

      {state?.error && <p className="alert-error mt-3">{state.error}</p>}
      {state?.success && <p className="alert-success mt-3">{state.success}</p>}

      <div className="mt-4 flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/qr/${token}`}
          alt={`QR Code ${tipe} untuk ${namaRuangan}`}
          width={200}
          height={200}
          className="h-48 w-48"
        />
        <p className="mt-3 text-center text-sm font-bold text-slate-900">{namaRuangan}</p>
        <p className="text-center text-xs text-slate-500">
          {kodeRuangan} · kode <span className="font-mono">{token}</span>
        </p>
      </div>

      <div className="mt-4 space-y-2">
        <p className="break-all rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          {tujuan}
        </p>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/qr/${token}`} download={`qr-${tipe.toLowerCase()}-${kodeRuangan}.png`} className="btn-secondary btn-sm">
            Unduh PNG
          </a>
          <a href={tujuan} target="_blank" rel="noreferrer" className="btn-secondary btn-sm">
            Uji Buka Halaman
          </a>
          <form action={formAction}>
            <input type="hidden" name="qr_id" value={qrId} />
            <SubmitButton
              className="btn-warning btn-sm"
              loadingText="…"
              confirm="Terbitkan ulang QR Code? QR lama tidak akan berlaku lagi."
            >
              Terbitkan Ulang
            </SubmitButton>
          </form>
        </div>
      </div>
    </div>
  );
}
