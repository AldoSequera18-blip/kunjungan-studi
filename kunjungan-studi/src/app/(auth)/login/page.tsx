import Image from "next/image";
import Link from "next/link";
import FormLogin from "./FormLogin";

export const metadata = { title: "Masuk" };

export default function HalamanLogin() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 px-4 py-12">
      {/* Logo samar sebagai latar */}
      <Image
        src="/logo.png"
        alt=""
        width={640}
        height={640}
        priority
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-[34rem] w-[34rem] rotate-12 select-none rounded-full object-cover opacity-[0.09] mix-blend-luminosity"
      />
      <Image
        src="/logo.png"
        alt=""
        width={640}
        height={640}
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-28 h-[28rem] w-[28rem] -rotate-12 select-none rounded-full object-cover opacity-[0.07] mix-blend-luminosity"
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(600px circle at 15% 0%, rgba(224,158,31,0.18), transparent 60%)" }}
        aria-hidden
      />
      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="text-sm font-semibold text-brand-200 hover:text-white">
            ← Kembali ke halaman informasi
          </Link>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-wide text-white">Masuk ke Akun</h1>
          <p className="mt-1 text-sm text-brand-200">
            Sistem Informasi Manajemen Kunjungan Studi
          </p>
        </div>

        <div className="card-pad">
          <FormLogin />

          <p className="mt-5 text-center text-sm text-slate-600">
            Belum punya akun?{" "}
            <Link href="/register" className="font-semibold text-brand-700 hover:underline">
              Daftar sebagai pemohon
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
