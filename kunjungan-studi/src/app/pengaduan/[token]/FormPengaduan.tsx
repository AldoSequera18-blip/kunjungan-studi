"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState } from "react-dom";
import SubmitButton from "@/components/SubmitButton";
import { KATEGORI_FASILITAS } from "@/lib/types";
import { aksiKirimPengaduan } from "../actions";

export default function FormPengaduan({
  token,
  namaRuangan,
}: {
  token: string;
  namaRuangan: string;
}) {
  const [state, formAction] = useFormState(aksiKirimPengaduan, undefined);
  const [anonim, setAnonim] = useState(false);

  if (state?.success) {
    return (
      <div className="text-center">
        <span className="text-4xl">✅</span>
        <h2 className="mt-3 text-lg font-bold text-slate-900">Pengaduan Terkirim</h2>
        <p className="mt-2 text-sm text-slate-600">
          Terima kasih. Laporan Anda mengenai fasilitas di <strong>{namaRuangan}</strong> telah
          diterima dan akan ditindaklanjuti oleh admin Balai.
        </p>
        <p className="mt-4 rounded-lg bg-slate-100 px-4 py-3 text-sm">
          Nomor pengaduan:{" "}
          <strong className="font-mono text-brand-700">{state.success}</strong>
        </p>
        <p className="hint mt-2">Simpan nomor ini untuk menanyakan perkembangan tindak lanjut.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href={`/pengaduan/${token}`} className="btn-secondary btn-sm">
            Buat Pengaduan Lain
          </Link>
          <Link href="/" className="btn-primary btn-sm">Selesai</Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {state?.error && <p className="alert-error">{state.error}</p>}

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
          placeholder="Contoh: AC tidak menyala sejak pukul 09.30, ruangan terasa panas."
          required
          minLength={10}
        />
      </div>

      <div>
        <label className="label" htmlFor="urgensi">Tingkat Urgensi *</label>
        <select id="urgensi" name="urgensi" className="input" defaultValue="SEDANG">
          <option value="RENDAH">Rendah — tidak mengganggu kegiatan</option>
          <option value="SEDANG">Sedang — cukup mengganggu</option>
          <option value="TINGGI">Tinggi — kegiatan terhambat</option>
        </select>
      </div>

      <div>
        <label className="label" htmlFor="nomor_kunjungan">Nomor Kunjungan (opsional)</label>
        <input
          id="nomor_kunjungan"
          name="nomor_kunjungan"
          className="input font-mono"
          placeholder="KUN-2026-0001"
        />
        <p className="hint">Isi bila Anda sedang mengikuti kunjungan studi.</p>
      </div>

      <div>
        <label className="label" htmlFor="foto_url">Tautan Foto/Bukti (opsional)</label>
        <input id="foto_url" name="foto_url" className="input" placeholder="https://..." />
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="anonim"
            className="mt-0.5 h-4 w-4 rounded border-slate-300"
            checked={anonim}
            onChange={(e) => setAnonim(e.target.checked)}
          />
          <span>
            <span className="font-medium text-slate-800">Kirim sebagai anonim</span>
            <span className="block text-xs text-slate-500">
              Identitas pelapor tidak disimpan. Penerapan mengikuti kebijakan Balai.
            </span>
          </span>
        </label>

        {!anonim && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="pelapor_nama">Nama Pelapor *</label>
              <input id="pelapor_nama" name="pelapor_nama" className="input" placeholder="Nama Anda" />
            </div>
            <div>
              <label className="label" htmlFor="pelapor_kontak">Kontak (opsional)</label>
              <input id="pelapor_kontak" name="pelapor_kontak" className="input" placeholder="No. HP / email" />
            </div>
          </div>
        )}
      </div>

      <SubmitButton className="btn-primary w-full" loadingText="Mengirim…">
        Kirim Pengaduan
      </SubmitButton>
    </form>
  );
}
