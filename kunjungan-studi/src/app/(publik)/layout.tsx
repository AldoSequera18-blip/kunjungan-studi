import Image from "next/image";
import Link from "next/link";

const NAV = [
  { href: "/", label: "Informasi" },
  { href: "/alur", label: "Alur Pendaftaran" },
  { href: "/ruangan", label: "Ruangan & Fasilitas" },
  { href: "/faq", label: "FAQ" },
];

export default function LayoutPublik({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip">
      {/* Siluet logo sebagai latar */}
      <Image
        src="/logo.png"
        alt=""
        width={640}
        height={640}
        aria-hidden
        className="pointer-events-none fixed -bottom-40 -right-32 z-0 h-[36rem] w-[36rem] -rotate-12 select-none rounded-full object-cover opacity-[0.07] mix-blend-multiply"
      />
      <Image
        src="/logo.png"
        alt=""
        width={640}
        height={640}
        aria-hidden
        className="pointer-events-none fixed -left-40 top-32 z-0 hidden h-[30rem] w-[30rem] rotate-12 select-none rounded-full object-cover opacity-[0.05] mix-blend-multiply lg:block"
      />
      <header className="sticky top-0 z-30 border-b border-gold-200/60 bg-white/95 shadow-soft backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Logo Tilik Pustaka"
              width={40}
              height={40}
              className="h-10 w-10 rounded-lg object-cover ring-1 ring-brand-900/10"
            />
            <span className="leading-tight">
              <span className="block font-display text-xl font-bold tracking-wide text-brand-900">Tilik Pustaka</span>
              <span className="block text-[11px] text-slate-500">
                Balai Layanan Perpustakaan DPAD DIY
              </span>
            </span>
          </Link>

          <nav className="order-3 flex w-full gap-1 overflow-x-auto text-sm sm:order-2 sm:w-auto sm:flex-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="whitespace-nowrap rounded-lg px-3 py-2 font-medium text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-800"
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="order-2 ml-auto flex items-center gap-2 sm:order-3 sm:ml-0">
            <Link href="/login" className="btn-secondary btn-sm">Masuk</Link>
            <Link href="/register" className="btn-primary btn-sm">Daftar</Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1">{children}</main>

      <footer className="border-t border-gold-500/20 bg-brand-950 text-brand-100">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm font-bold text-white">
                Balai Layanan Perpustakaan DPAD DIY
              </p>
              <p className="mt-2 text-sm text-brand-300">
                Sistem Informasi Manajemen Kunjungan Studi — pendaftaran,
                penjadwalan, daftar hadir per ruangan, dan pengaduan fasilitas.
              </p>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Kontak</p>
              <ul className="mt-2 space-y-1 text-sm text-brand-300">
                <li><a href="https://wa.me/628812658192" target="_blank" rel="noreferrer" className="hover:text-white">WhatsApp: 0881-2658-192</a></li>
                <li><a href="mailto:balaiyanpus@jogjaprov.go.id" className="hover:text-white">balaiyanpus@jogjaprov.go.id</a></li>
                <li>
                  <a
                    href="https://maps.app.goo.gl/dFC6zjqEjLrmN7Wp9"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white"
                  >
                    Jl. Janti, Banguntapan, Kabupaten Bantul, DI Yogyakarta 55198 Indonesia
                  </a>
                </li>
              </ul>
            </div>
            
            
            <div>
              <p className="text-sm font-bold text-white">Tautan</p>
              <ul className="mt-2 space-y-1 text-sm">
                {NAV.map((n) => (
                  <li key={n.href}>
                    <Link href={n.href} className="text-brand-300 transition-colors hover:text-gold-400">
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-8 border-t border-brand-800 pt-5 text-xs text-brand-400">
            © {new Date().getFullYear()} Balai Layanan Perpustakaan DPAD DIY. Isi halaman
            informasi mengikuti ketentuan resmi Balai.
          </p>
        </div>
      </footer>
    </div>
  );
}
