"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export interface MenuItem {
  href: string;
  label: string;
  badge?: number;
}

/**
 * Kerangka halaman untuk portal Pemohon dan panel Admin.
 * Menu mengikuti Bab 24 (menu pemohon) dan Bab 30 (menu admin).
 */
export default function AppShell({
  menu,
  judulPanel,
  subjudul,
  namaPengguna,
  peran,
  profilHref,
  notifHref,
  notifBelumDibaca = 0,
  fotoUrl = null,
  children,
}: {
  menu: MenuItem[];
  judulPanel: string;
  subjudul: string;
  namaPengguna: string;
  peran: string;
  profilHref: string;
  notifHref: string;
  notifBelumDibaca?: number;
  fotoUrl?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [buka, setBuka] = useState(false);

  const aktif = (href: string) =>
    pathname === href || (href !== "/dashboard" && href !== "/admin" && pathname.startsWith(href + "/"));

  return (
    <div className="min-h-screen lg:flex">
      {/* ---- Sidebar ---- */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 transform bg-brand-900 text-brand-50 transition-transform lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 ${
          buka ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 border-b border-gold-500/20 px-5 py-5">
            <Image
              src="/logo.png"
              alt="Logo Tilik Pustaka"
              width={44}
              height={44}
              className="h-11 w-11 shrink-0 rounded-lg object-cover ring-1 ring-gold-400/40"
            />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gold-400">
                {judulPanel}
              </p>
              <p className="mt-1 font-display text-base font-bold leading-snug text-white">{subjudul}</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {menu.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                onClick={() => setBuka(false)}
                className={`flex items-center gap-3 rounded-lg border-l-2 px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  aktif(m.href)
                    ? "border-gold-400 bg-brand-700/60 text-white"
                    : "border-transparent text-brand-200 hover:border-gold-400/40 hover:bg-brand-800/60 hover:text-white"
                }`}
              >
                <span className="flex-1">{m.label}</span>
                {!!m.badge && m.badge > 0 && (
                  <span className="rounded-full bg-gold-400 px-2 py-0.5 text-[11px] font-bold text-brand-950">
                    {m.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="border-t border-gold-500/20 px-3 py-4">
            <div className="px-2 pb-3">
              <p className="truncate text-sm font-semibold text-white">{namaPengguna}</p>
              <p className="text-xs text-brand-300">{peran}</p>
            </div>
            <form action="/api/logout" method="post">
              <button
                type="submit"
                className="w-full rounded-lg px-3.5 py-2.5 text-left text-sm font-medium text-brand-200 transition-colors hover:bg-brand-800/60 hover:text-white"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </aside>

      {buka && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={() => setBuka(false)}
          aria-hidden
        />
      )}

      {/* ---- Konten ---- */}
      <div className="relative flex min-w-0 flex-1 flex-col overflow-x-clip">
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
          className="pointer-events-none fixed left-64 top-24 z-0 hidden h-[30rem] w-[30rem] rotate-12 select-none rounded-full object-cover opacity-[0.05] mix-blend-multiply lg:block"
        />
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3">
          <button
            onClick={() => setBuka(true)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-brand-800 transition-colors hover:bg-brand-50 lg:hidden"
            aria-label="Buka menu"
          >
            Menu
          </button>
          <span className="text-sm font-bold text-slate-800 lg:hidden">{judulPanel}</span>

          <div className="ml-auto flex items-center gap-1">
            <Link
              href={notifHref}
              className="relative rounded-full p-2 text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-800"
              aria-label="Notifikasi"
              title="Notifikasi"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              {notifBelumDibaca > 0 && (
                <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-gold-400 px-1 text-center text-[10px] font-bold leading-[18px] text-brand-950">
                  {notifBelumDibaca > 99 ? "99+" : notifBelumDibaca}
                </span>
              )}
            </Link>
            <Link
              href={profilHref}
              className="rounded-full p-2 text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-800"
              aria-label="Profil"
              title={`Profil — ${namaPengguna}`}
            >
              {fotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fotoUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21a8 8 0 0 1 16 0" />
                </svg>
              )}
            </Link>
          </div>
        </header>

        <main className="relative z-10 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
