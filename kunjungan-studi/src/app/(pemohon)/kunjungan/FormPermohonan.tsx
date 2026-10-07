"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import SubmitButton from "@/components/SubmitButton";
import { JENIS_INSTANSI, type FormState, type Room, type VisitApplication } from "@/lib/types";
import { aksiBuatPermohonan, aksiUbahPermohonan } from "../actions";

export default function FormPermohonan({
  mode,
  data,
  defaultInstansi,
  defaultPj,
  defaultTelepon,
  ruangan = [],
  ruanganTerpilih = [],
}: {
  mode: "baru" | "ubah";
  data?: VisitApplication;
  defaultInstansi?: string | null;
  defaultPj?: string | null;
  defaultTelepon?: string | null;
  ruangan?: Room[];
  ruanganTerpilih?: number[];
}) {
  const aksi = mode === "baru" ? aksiBuatPermohonan : aksiUbahPermohonan;
  const [state, formAction] = useFormState<FormState, FormData>(aksi, undefined);
  const [jenisKunjungan, setJenisKunjungan] = useState<"RESMI" | "TIDAK_RESMI">(data?.jenis_kunjungan ?? "RESMI");

  return (
    <form action={formAction} className="space-y-6">
      {data && <input type="hidden" name="id" value={data.id} />}
      {state?.error && <p className="alert-error">{state.error}</p>}
      {state?.success && <p className="alert-success">{state.success}</p>}

      <fieldset className="card-pad space-y-3">
        <legend className="px-2 text-sm font-bold uppercase tracking-wide text-brand-700">Jenis Kunjungan</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {([["RESMI", "Kunjungan Resmi", "Melampirkan surat kunjungan dan memilih ruangan."], ["TIDAK_RESMI", "Kunjungan Mandiri", "Tanpa unggah surat kunjungan dan tanpa memilih ruangan."]] as const).map(([value, label, description]) => (
            <label key={value} className={`cursor-pointer rounded-lg border p-4 ${jenisKunjungan === value ? "border-brand-600 bg-brand-50" : "border-slate-200"}`}>
              <input type="radio" name="jenis_kunjungan" value={value} checked={jenisKunjungan === value} onChange={() => setJenisKunjungan(value)} className="mr-2 accent-brand-700" />
              <span className="font-semibold text-slate-800">{label}</span>
              <span className="mt-1 block text-sm text-slate-600">{description}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* ---- Data kelompok (Bab 9) ---- */}
      <fieldset className="card-pad space-y-4">
        <legend className="px-2 text-sm font-bold uppercase tracking-wide text-brand-700">
          Data Kelompok
        </legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="nama_kelompok">Nama Kelompok / Rombongan *</label>
            <input
              id="nama_kelompok"
              name="nama_kelompok"
              className="input"
              placeholder="Kelompok Studi Kelas XI IPS 2"
              defaultValue={data?.nama_kelompok}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="asal_instansi">Asal Sekolah / Kampus / Instansi *</label>
            <input
              id="asal_instansi"
              name="asal_instansi"
              className="input"
              placeholder="SMA Negeri 1 Yogyakarta"
              defaultValue={data?.asal_instansi ?? defaultInstansi ?? ""}
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="jenis_instansi">Jenis Instansi</label>
            <select
              id="jenis_instansi"
              name="jenis_instansi"
              className="input"
              defaultValue={data?.jenis_instansi ?? ""}
            >
              <option value="">— Pilih jenis —</option>
              {JENIS_INSTANSI.map((j) => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="jumlah_peserta">Jumlah Peserta *</label>
            <input
              id="jumlah_peserta"
              name="jumlah_peserta"
              type="number"
              min={1}
              max={500}
              className="input"
              defaultValue={data?.jumlah_peserta ?? ""}
              required
            />
            <p className="hint">Termasuk pendamping bila ada.</p>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="tujuan">Tujuan Kunjungan *</label>
          <textarea
            id="tujuan"
            name="tujuan"
            className="textarea"
            placeholder="Contoh: mengenal layanan perpustakaan dan praktik penelusuran koleksi untuk tugas literasi."
            defaultValue={data?.tujuan}
            required
          />
        </div>
      </fieldset>

      {/* ---- Jadwal & ruangan dalam satu pilihan ---- */}
      <fieldset className="card-pad space-y-4">
        <legend className="px-2 text-sm font-bold uppercase tracking-wide text-brand-700">
          Usulan Waktu Kunjungan
        </legend>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="tanggal_usulan">Tanggal Diusulkan *</label>
            <input
              id="tanggal_usulan"
              name="tanggal_usulan"
              type="date"
              className="input"
              defaultValue={data?.tanggal_usulan}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="waktu_mulai_usulan">Waktu Mulai *</label>
            <input
              id="waktu_mulai_usulan"
              name="waktu_mulai_usulan"
              type="time"
              className="input"
              defaultValue={data?.waktu_mulai_usulan ?? "09:00"}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="waktu_selesai_usulan">Waktu Selesai *</label>
            <input
              id="waktu_selesai_usulan"
              name="waktu_selesai_usulan"
              type="time"
              className="input"
              defaultValue={data?.waktu_selesai_usulan ?? "11:00"}
              required
            />
          </div>
        </div>
        <p className="hint">
          Jam layanan: Senin 08.00–15.30 (istirahat 11.30–12.30), Selasa–Kamis 08.00–15.30,
          Jumat 09.00–15.30 (istirahat 11.00–13.00), Sabtu 08.00–15.30 (istirahat 11.30–12.30),
          dan Minggu tutup.
        </p>

        {jenisKunjungan === "RESMI" && <>
        <div className="border-t border-slate-100 pt-4">
          <p className="label">Ruangan yang Dikunjungi *</p>
          <p className="text-sm text-slate-600">
            Centang satu atau lebih ruangan; semuanya memakai tanggal dan waktu di atas. Admin
            Balai hanya memverifikasi dan memutuskan (terima, minta perbaikan, atau tolak) usulan
            Anda.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {ruangan.map((r) => {
            const tersedia = r.status === "TERSEDIA";
            return (
              <label
                key={r.id}
                className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${
                  tersedia
                    ? "cursor-pointer border-slate-200 hover:border-brand-500 hover:bg-brand-50/50"
                    : "cursor-not-allowed border-slate-100 bg-slate-50 opacity-60"
                }`}
              >
                <input
                  type="checkbox"
                  name="room_id"
                  value={r.id}
                  defaultChecked={ruanganTerpilih.includes(r.id)}
                  disabled={!tersedia}
                  className="mt-1 h-4 w-4 accent-brand-700"
                />
                <span className="min-w-0">
                  <span className="block font-semibold text-slate-800">
                    {r.nama} <span className="font-mono text-xs text-slate-500">({r.kode})</span>
                  </span>
                  <span className="block text-xs text-slate-500">
                    Kapasitas {r.kapasitas} orang{r.lokasi ? ` · ${r.lokasi}` : ""}
                    {!tersedia ? ` · ${r.status}` : ""}
                  </span>
                  {r.fasilitas && <span className="block text-xs text-slate-500">{r.fasilitas}</span>}
                </span>
              </label>
            );
          })}
        </div>
        {ruangan.length === 0 && <p className="hint">Belum ada data ruangan.</p>}
        </>}
      </fieldset>

      {/* ---- Penanggung jawab ---- */}
      <fieldset className="card-pad space-y-4">
        <legend className="px-2 text-sm font-bold uppercase tracking-wide text-brand-700">
          Penanggung Jawab &amp; Catatan
        </legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="penanggung_jawab">Nama Penanggung Jawab</label>
            <input
              id="penanggung_jawab"
              name="penanggung_jawab"
              className="input"
              defaultValue={data?.penanggung_jawab ?? defaultPj ?? ""}
            />
          </div>
          <div>
            <label className="label" htmlFor="telepon_pj">Telepon Penanggung Jawab</label>
            <input
              id="telepon_pj"
              name="telepon_pj"
              className="input"
              placeholder="081234567890"
              defaultValue={data?.telepon_pj ?? defaultTelepon ?? ""}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="catatan">Catatan Tambahan</label>
          <textarea
            id="catatan"
            name="catatan"
            className="textarea"
            placeholder="Kebutuhan khusus, permintaan materi, atau informasi lain."
            defaultValue={data?.catatan ?? ""}
          />
        </div>
      </fieldset>

      {/* ---- Surat kunjungan (hanya saat membuat permohonan baru) ---- */}
      {mode === "baru" && jenisKunjungan === "RESMI" && (
        <fieldset className="card-pad space-y-4">
          <legend className="px-2 text-sm font-bold uppercase tracking-wide text-brand-700">
            Surat Kunjungan
          </legend>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Lampirkan surat permohonan resmi dari instansi Anda. Belum punya? Unduh template,
              isi, lalu tandatangani.
            </p>
            <a
              href="/template/Template-Surat-Kunjungan.docx"
              download
              className="btn-secondary btn-sm"
            >
              ⬇ Unduh Template Surat
            </a>
          </div>

          <div>
            <label className="label" htmlFor="surat">Unggah Surat (PDF / Word)</label>
            <input
              id="surat"
              name="surat"
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="input"
            />
            <p className="hint">Format PDF, DOC, atau DOCX, maksimal 5 MB. Dapat diunggah nanti dari halaman detail.</p>
          </div>
        </fieldset>
      )}

      <div className="flex flex-wrap gap-3">
        <SubmitButton className="btn-primary" loadingText="Menyimpan…">
          {mode === "baru" ? "Simpan & Lanjut Isi Peserta" : "Simpan Perubahan"}
        </SubmitButton>
      </div>
      {mode === "baru" && (
        <p className="hint">
          Permohonan disimpan sebagai draft. Setelah data peserta dilengkapi, permohonan dapat
          diajukan ke admin untuk diverifikasi.
        </p>
      )}
    </form>
  );
}
