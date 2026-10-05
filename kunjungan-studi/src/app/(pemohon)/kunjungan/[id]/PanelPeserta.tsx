"use client";

import { useFormState } from "react-dom";
import SubmitButton from "@/components/SubmitButton";
import type { Visitor } from "@/lib/types";
import { aksiHapusPeserta, aksiTambahPeserta } from "../../actions";

export default function PanelPeserta({
  applicationId,
  peserta,
  bolehUbah,
}: {
  applicationId: number;
  peserta: Visitor[];
  bolehUbah: boolean;
}) {
  const [stateTambah, aksiTambah] = useFormState(aksiTambahPeserta, undefined);
  const [stateHapus, aksiHapus] = useFormState(aksiHapusPeserta, undefined);

  const jumlahPeserta = peserta.filter((p) => p.jenis === "PESERTA").length;
  const jumlahPendamping = peserta.filter((p) => p.jenis === "PENDAMPING").length;

  return (
    <section className="card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="section-title">Data Peserta</h2>
          <p className="text-xs text-slate-500">
            {jumlahPeserta} peserta · {jumlahPendamping} pendamping
          </p>
        </div>
      </div>

      <div className="px-5 py-4">
        {stateTambah?.error && <p className="alert-error mb-3">{stateTambah.error}</p>}
        {stateTambah?.success && <p className="alert-success mb-3">{stateTambah.success}</p>}
        {stateHapus?.error && <p className="alert-error mb-3">{stateHapus.error}</p>}
        {stateHapus?.success && <p className="alert-success mb-3">{stateHapus.success}</p>}

        {bolehUbah && (
          <form action={aksiTambah} className="mb-5 grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-[2fr,1.5fr,1fr,auto]">
            <input type="hidden" name="application_id" value={applicationId} />
            <div>
              <label className="label" htmlFor="nama">Nama Peserta *</label>
              <input id="nama" name="nama" className="input" placeholder="Nama lengkap" required />
            </div>
            <div>
              <label className="label" htmlFor="identitas">Identitas</label>
              <input id="identitas" name="identitas" className="input" placeholder="NIS / NIM / NIP" />
            </div>
            <div>
              <label className="label" htmlFor="jenis">Jenis</label>
              <select id="jenis" name="jenis" className="input" defaultValue="PESERTA">
                <option value="PESERTA">Peserta</option>
                <option value="PENDAMPING">Pendamping</option>
              </select>
            </div>
            <div className="flex items-end">
              <SubmitButton className="btn-primary w-full" loadingText="…">
                Tambah
              </SubmitButton>
            </div>
          </form>
        )}

        {peserta.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
            Belum ada peserta yang didaftarkan.
            {bolehUbah && " Tambahkan peserta melalui formulir di atas."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-10">#</th>
                  <th>Nama</th>
                  <th>Identitas</th>
                  <th>Jenis</th>
                  {bolehUbah && <th></th>}
                </tr>
              </thead>
              <tbody>
                {peserta.map((p, i) => (
                  <tr key={p.id}>
                    <td className="text-slate-400">{i + 1}</td>
                    <td className="font-medium text-slate-900">{p.nama}</td>
                    <td>{p.identitas ?? "-"}</td>
                    <td>
                      <span className={p.jenis === "PENDAMPING" ? "badge-purple" : "badge-slate"}>
                        {p.jenis === "PENDAMPING" ? "Pendamping" : "Peserta"}
                      </span>
                    </td>
                    {bolehUbah && (
                      <td className="text-right">
                        <form action={aksiHapus}>
                          <input type="hidden" name="visitor_id" value={p.id} />
                          <SubmitButton
                            className="btn-sm text-rose-600 hover:underline"
                            loadingText="…"
                            confirm={`Hapus peserta ${p.nama}?`}
                          >
                            Hapus
                          </SubmitButton>
                        </form>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!bolehUbah && (
          <p className="hint mt-4">
            Data peserta tidak dapat diubah pada status permohonan saat ini. Perubahan mengikuti
            aturan admin Balai.
          </p>
        )}
      </div>
    </section>
  );
}
