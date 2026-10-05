"use client";

import { useFormState } from "react-dom";
import SubmitButton from "@/components/SubmitButton";
import type { Visitor } from "@/lib/types";
import { aksiCheckin, aksiCheckout } from "../actions";

interface BarisHadir {
  id: number;
  visitor_id: number | null;
  nama_peserta: string;
  checkin_at: string;
  checkout_at: string | null;
}

export default function PanelDaftarHadir({
  token,
  scheduleId,
  peserta,
  kehadiran,
}: {
  token: string;
  scheduleId: number;
  peserta: Visitor[];
  kehadiran: BarisHadir[];
}) {
  const [stateIn, aksiIn] = useFormState(aksiCheckin, undefined);
  const [stateOut, aksiOut] = useFormState(aksiCheckout, undefined);

  const sudahHadir = new Set(
    kehadiran.filter((k) => !k.checkout_at).map((k) => k.visitor_id)
  );

  return (
    <div className="space-y-5">
      {stateIn?.error && <p className="alert-error">{stateIn.error}</p>}
      {stateIn?.success && <p className="alert-success">{stateIn.success}</p>}
      {stateOut?.error && <p className="alert-error">{stateOut.error}</p>}
      {stateOut?.success && <p className="alert-success">{stateOut.success}</p>}

      {/* ---- Pilih nama peserta ---- */}
      <section className="card-pad">
        <h3 className="section-title">Pilih Nama Anda</h3>
        <p className="hint mb-4">Tekan nama Anda untuk mencatat kehadiran di ruangan ini.</p>

        {peserta.length === 0 ? (
          <p className="alert-warning">
            Daftar peserta belum diisi oleh pemohon. Silakan gunakan pencatatan manual di bawah.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {peserta.map((p) => {
              const hadir = sudahHadir.has(p.id);
              return (
                <li key={p.id}>
                  <form action={aksiIn}>
                    <input type="hidden" name="token" value={token} />
                    <input type="hidden" name="schedule_id" value={scheduleId} />
                    <input type="hidden" name="visitor_id" value={p.id} />
                    <input type="hidden" name="metode" value="PILIH_NAMA" />
                    <button
                      type="submit"
                      disabled={hadir}
                      className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
                        hadir
                          ? "cursor-not-allowed border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white hover:border-brand-400 hover:bg-brand-50"
                      }`}
                    >
                      <span className="block font-semibold">{p.nama}</span>
                      <span className="block text-xs text-slate-500">
                        {p.jenis === "PENDAMPING" ? "Pendamping" : "Peserta"}
                        {p.identitas ? ` · ${p.identitas}` : ""}
                        {hadir ? " · sudah hadir" : ""}
                      </span>
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ---- Pencatatan manual ---- */}
      <section className="card-pad">
        <h3 className="section-title">Nama Tidak Ada di Daftar?</h3>
        <form action={aksiIn} className="mt-3 flex gap-2">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="schedule_id" value={scheduleId} />
          <input type="hidden" name="metode" value="KODE_KUNJUNGAN" />
          <input
            name="nama_peserta"
            className="input"
            placeholder="Tulis nama lengkap Anda"
            required
          />
          <SubmitButton className="btn-primary shrink-0" loadingText="…">
            Check-in
          </SubmitButton>
        </form>
        <p className="hint mt-2">
          Pencatatan manual digunakan bila peserta belum terdaftar pada data kelompok.
        </p>
      </section>

      {/* ---- Riwayat kehadiran ---- */}
      <section className="card">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="section-title">Sudah Check-in ({kehadiran.length})</h3>
        </div>
        {kehadiran.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">
            Belum ada peserta yang melakukan check-in di ruangan ini.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {kehadiran.map((k) => (
              <li key={k.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{k.nama_peserta}</p>
                  <p className="text-xs text-slate-500">
                    Masuk {k.checkin_at}
                    {k.checkout_at ? ` · Keluar ${k.checkout_at}` : ""}
                  </p>
                </div>
                {k.checkout_at ? (
                  <span className="badge-slate">Selesai</span>
                ) : (
                  <form action={aksiOut}>
                    <input type="hidden" name="token" value={token} />
                    <input type="hidden" name="attendance_id" value={k.id} />
                    <SubmitButton className="btn-secondary btn-sm" loadingText="…">
                      Check-out
                    </SubmitButton>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
