import Link from "next/link";
import { wajibPemohon } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Room } from "@/lib/types";
import FormPermohonan from "../FormPermohonan";

export const metadata = { title: "Ajukan Kunjungan" };

export default async function HalamanPermohonanBaru() {
  const user = await wajibPemohon();
  const ruangan = await db.prepare(`SELECT * FROM rooms WHERE status != 'TIDAK_AKTIF' ORDER BY kode`).all() as Room[];

  return (
    <div className="space-y-6">
      <header>
        <Link href="/kunjungan" className="text-sm font-semibold text-brand-700 hover:underline">
          ← Kembali ke daftar kunjungan
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">
          Formulir Pendaftaran Kunjungan Studi
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Pilih jenis kunjungan, lalu isi data kelompok dan usulan waktu. Kunjungan resmi juga memerlukan pilihan ruangan dan menyediakan unggah surat. Data peserta dilengkapi pada langkah berikutnya.
        </p>
      </header>

      <FormPermohonan
        mode="baru"
        defaultInstansi={user.instansi}
        defaultPj={user.nama}
        defaultTelepon={user.telepon}
        ruangan={ruangan}
      />
    </div>
  );
}
