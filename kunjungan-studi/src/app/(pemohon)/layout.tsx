import AppShell, { type MenuItem } from "@/components/AppShell";
import { wajibPemohon } from "@/lib/auth";
import { db } from "@/lib/db";

export default function LayoutPemohon({ children }: { children: React.ReactNode }) {
  const user = wajibPemohon();

  const belumDibaca = (
    db
      .prepare(`SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND dibaca = 0`)
      .get(user.id) as { n: number }
  ).n;

  // Menu pemohon — Bab 24 dokumen analisis
  const menu: MenuItem[] = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/kunjungan", label: "Kunjungan Studi" },
    { href: "/peserta", label: "Data Peserta" },
    { href: "/jadwal", label: "Jadwal Kunjungan" },
    { href: "/fasilitas", label: "Ruangan & Fasilitas" },
    { href: "/kehadiran", label: "Daftar Hadir" },
    { href: "/pengaduan-saya", label: "Pengaduan Fasilitas" },
  ];

  return (
    <AppShell
      menu={menu}
      judulPanel="Panel Pemohon"
      subjudul="Tilik Pustaka — Kunjungan Studi"
      namaPengguna={user.nama}
      peran={user.instansi ?? "Pemohon"}
      profilHref="/profil"
      notifHref="/notifikasi"
      notifBelumDibaca={belumDibaca}
      fotoUrl={user.foto ? `/api/foto/${user.id}?v=${encodeURIComponent(user.foto)}` : null}
    >
      {children}
    </AppShell>
  );
}
