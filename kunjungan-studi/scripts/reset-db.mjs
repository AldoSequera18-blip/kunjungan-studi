/**
 * Menghapus database SQLite lokal agar dibuat ulang beserta data awal.
 * Jalankan dengan: npm run db:reset
 */
import fs from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "data");
const berkas = ["kunjungan.db", "kunjungan.db-wal", "kunjungan.db-shm", "kunjungan.db-journal"];

let terhapus = 0;
for (const b of berkas) {
  const p = path.join(dir, b);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    terhapus++;
    console.log(`Dihapus: data/${b}`);
  }
}

if (terhapus === 0) {
  console.log("Tidak ada berkas database yang perlu dihapus.");
} else {
  console.log("\nDatabase akan dibuat ulang beserta data awal saat aplikasi dijalankan.");
}
