import Link from "next/link";
import FormRegistrasi from "./FormRegistrasi";

export const metadata = { title: "Daftar Akun Pemohon" };

export default function HalamanRegistrasi() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="mb-6 text-center">
          <Link href="/" className="text-sm font-semibold text-brand-200 hover:text-white">
            ← Kembali ke halaman informasi
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-white">Daftar Akun Pemohon</h1>
          <p className="mt-1 text-sm text-brand-200">
            Akun digunakan untuk mengajukan dan memantau kunjungan studi.
          </p>
        </div>

        <div className="card-pad">
          <FormRegistrasi />

          <p className="mt-5 text-center text-sm text-slate-600">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-semibold text-brand-700 hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
