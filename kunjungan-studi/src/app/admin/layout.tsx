import AppShell, { type MenuItem } from "@/components/AppShell";
import { wajibAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const user = wajibAdmin();

  const hitung = (sql: string) => (db.prepare(sql).get() as { n: number }).n;

  const permohonanBaru = hitung(
    `SELECT COUNT(*) AS n FROM visit_applications WHERE status IN ('DIAJUKAN','DALAM_VERIFIKASI')`
  );
  const pengaduanBaru = hitung(
    `SELECT COUNT(*) AS n FROM facility_reports WHERE status IN ('DIAJUKAN','DIVERIFIKASI')`
  );
  const notifBelumDibaca = (
    db
      .prepare(`SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND dibaca = 0`)
      .get(user.id) as { n: number }
  ).n;

  // Menu admin — Bab 30 dokumen analisis
  const menu: MenuItem[] = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/permohonan", label: "Permohonan Kunjungan", badge: permohonanBaru },
    { href: "/admin/kelompok", label: "Kelompok & Peserta" },
    { href: "/admin/jadwal", label: "Jadwal Kunjungan" },
    { href: "/admin/ruangan", label: "Ruangan" },
    { href: "/admin/kehadiran", label: "Daftar Hadir" },
    { href: "/admin/pengaduan", label: "Pengaduan Fasilitas", badge: pengaduanBaru },
    { href: "/admin/laporan", label: "Laporan & Rekap" },
    { href: "/admin/pengaturan", label: "Pengaturan" },
    { href: "/admin/audit", label: "Audit Log" },
  ];

  return (
    <AppShell
      menu={menu}
      judulPanel="Panel Admin"
      subjudul="Balai Layanan Perpustakaan DPAD DIY"
      namaPengguna={user.nama}
      peran="Administrator"
      profilHref="/admin/profil"
      notifHref="/admin/notifikasi"
      notifBelumDibaca={notifBelumDibaca}
    >
      {children}
    </AppShell>
  );
}
