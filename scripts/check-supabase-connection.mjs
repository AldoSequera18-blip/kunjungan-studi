import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL belum diatur.");
  process.exit(2);
}

const sql = postgres(url, {
  max: 1,
  prepare: false,
  ssl: "require",
  connect_timeout: 10,
});

const expectedTables = [
  "users", "sessions", "rooms", "room_qr_codes", "visit_applications",
  "documents", "visitors", "visit_schedules", "attendance",
  "facility_reports", "report_actions", "notifications", "audit_logs",
];

try {
  await sql.unsafe("select 1 as connected");
  const result = await sql.unsafe(
    `select table_name from information_schema.tables
      where table_schema = 'public' and table_name in (${expectedTables.map((name) => `'${name}'`).join(",")})`
  );
  const available = new Set(result.map((row) => row.table_name));
  console.log("Koneksi PostgreSQL Supabase berhasil.");
  console.log(`Tabel aplikasi ditemukan: ${available.size}/${expectedTables.length}.`);
  if (available.size !== expectedTables.length) {
    console.log(`Tabel yang belum ada: ${expectedTables.filter((name) => !available.has(name)).join(", ")}`);
    process.exitCode = 1;
  } else {
    const [summary] = await sql.unsafe(
      "select (select count(*)::int from users) as users, (select count(*)::int from rooms) as rooms, (select count(*)::int from visit_applications) as applications"
    );
    console.log(`Data terbaca: ${summary.users} pengguna, ${summary.rooms} ruangan, ${summary.applications} permohonan.`);
  }
} catch (error) {
  console.error(`Koneksi gagal (kode: ${error?.code || "tidak diketahui"}).`);
  console.error("Periksa DATABASE_URL, kata sandi, konfigurasi SSL, dan akses jaringan.");
  process.exitCode = 1;
} finally {
  await sql.end();
}
