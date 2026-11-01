# Sistem Informasi Manajemen Kunjungan Studi

Aplikasi web berbasis **Next.js 14 (App Router) + TypeScript + Tailwind CSS** untuk
Balai Layanan Perpustakaan Pemda DIY. Dibangun mengikuti dokumen
*Analisis Sistem Informasi Manajemen Kunjungan Studi v1.0*.

Alur inti yang didukung:

```
Informasi Kunjungan â†’ Pendaftaran Kelompok â†’ Verifikasi Admin â†’ Diterima
â†’ Penjadwalan â†’ Pembagian Ruangan â†’ Pelaksanaan Kunjungan
â†’ Daftar Hadir per Ruangan â†’ Pengaduan Fasilitas via QR Code
â†’ Tindak Lanjut Admin â†’ Kunjungan Selesai
```

---

## 1. Menjalankan di VSCode

### Prasyarat

| Kebutuhan | Versi |
|---|---|
| Node.js | 20 LTS atau 22 LTS |
| npm | bawaan Node |
| VSCode | versi terbaru |

Ekstensi VSCode yang disarankan: **ESLint**, **Tailwind CSS IntelliSense**, **Prettier**.

### Langkah

```bash
# 1. Buka folder proyek di VSCode, lalu buka Terminal (Ctrl + `)

# 2. Pasang dependensi
npm install

# 3. Salin konfigurasi environment
#    Windows (PowerShell):
copy .env.example .env.local
#    macOS / Linux:
cp .env.example .env.local

# 4. Jalankan mode pengembangan
npm run dev
```

Buka <http://localhost:3000>.

Database aplikasi menggunakan PostgreSQL Supabase. Atur `DATABASE_URL` di
`.env.local` dan jalankan SQL migration sebelum menjalankan aplikasi.

### Perintah lain

```bash
npm run build     # build produksi
npm start         # jalankan hasil build
npm run lint      # pemeriksaan ESLint
```

---

## 2. Menguji QR Code dari ponsel

Secara bawaan QR Code berisi alamat `http://localhost:3000`, yang tidak dapat
dibuka dari ponsel. Agar bisa dipindai pada jaringan Wi-Fi yang sama:

1. Cari alamat IP komputer Anda â€” `ipconfig` (Windows) atau `ifconfig` / `ip a` (macOS/Linux),
   misalnya `192.168.1.10`.
2. Ubah `.env.local`:
   ```env
   PUBLIC_BASE_URL=http://192.168.1.10:3000
   ```
3. Jalankan ulang: `npm run dev`
4. Buka **Panel Admin â†’ Ruangan â†’ [pilih ruangan]**, lalu pindai QR Code dari ponsel.

---

## 3. Struktur Proyek

```
kunjungan-studi/
â”œâ”€â”€ data/                       # berkas lokal
â”œâ”€â”€ scripts/check-supabase-connection.mjs # pemeriksaan koneksi Supabase
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ app/
â”‚   â”‚   â”œâ”€â”€ (publik)/           # halaman publik tanpa login
â”‚   â”‚   â”‚   â”œâ”€â”€ page.tsx              Informasi kunjungan (Bab 7)
â”‚   â”‚   â”‚   â”œâ”€â”€ alur/                 Alur pendaftaran (Bab 6)
â”‚   â”‚   â”‚   â”œâ”€â”€ ruangan/              Ruangan & fasilitas
â”‚   â”‚   â”‚   â””â”€â”€ faq/                  Pertanyaan umum
â”‚   â”‚   â”œâ”€â”€ (auth)/             # login & registrasi
â”‚   â”‚   â”œâ”€â”€ (pemohon)/          # portal pemohon (Bab 23â€“28)
â”‚   â”‚   â”‚   â”œâ”€â”€ dashboard/  profil/  kunjungan/  peserta/
â”‚   â”‚   â”‚   â”œâ”€â”€ jadwal/  fasilitas/  kehadiran/
â”‚   â”‚   â”‚   â””â”€â”€ pengaduan-saya/  notifikasi/
â”‚   â”‚   â”œâ”€â”€ admin/              # panel admin (Bab 29â€“39)
â”‚   â”‚   â”‚   â”œâ”€â”€ permohonan/  kelompok/  jadwal/  ruangan/
â”‚   â”‚   â”‚   â”œâ”€â”€ kehadiran/  pengaduan/  laporan/
â”‚   â”‚   â”‚   â””â”€â”€ notifikasi/  pengaturan/  audit/
â”‚   â”‚   â”œâ”€â”€ hadir/[token]/      # daftar hadir per ruangan via QR (Bab 17â€“18)
â”‚   â”‚   â”œâ”€â”€ pengaduan/[token]/  # pengaduan fasilitas via QR (Bab 19â€“20)
â”‚   â”‚   â””â”€â”€ api/
â”‚   â”‚       â”œâ”€â”€ qr/[token]/     # generator gambar QR Code (PNG)
â”‚   â”‚       â””â”€â”€ logout/
â”‚   â”œâ”€â”€ components/             # komponen UI bersama
â”‚   â””â”€â”€ lib/
â”‚       â”œâ”€â”€ db.ts               # koneksi PostgreSQL Supabase
â”‚       â”œâ”€â”€ auth.ts             # sesi, bcrypt, hak akses
â”‚       â”œâ”€â”€ audit.ts            # audit log & notifikasi
â”‚       â”œâ”€â”€ types.ts            # tipe data & konstanta
â”‚       â””â”€â”€ utils.ts            # format tanggal, label status, validasi
â”œâ”€â”€ tailwind.config.ts
â””â”€â”€ next.config.mjs
```

---

## 4. Struktur Database (Bab 40)

| Tabel | Fungsi |
|---|---|
| `users` | Akun dan identitas pengguna (pemohon & admin) |
| `sessions` | Sesi login |
| `visit_applications` | Permohonan kunjungan + data kelompok |
| `visitors` | Data peserta / pengunjung |
| `documents` | Dokumen pendukung permohonan |
| `rooms` | Data ruangan dan fasilitas |
| `room_qr_codes` | QR Code unik setiap ruangan (pengaduan & absensi) |
| `visit_schedules` | Jadwal kunjungan dan pembagian ruangan |
| `attendance` | Daftar hadir per ruangan |
| `facility_reports` | Pengaduan fasilitas |
| `report_actions` | Riwayat tindak lanjut pengaduan |
| `notifications` | Notifikasi pengguna |
| `audit_logs` | Riwayat aktivitas |

Data kelompok digabung ke dalam `visit_applications` karena setiap permohonan
mewakili tepat satu kelompok/rombongan.

---

## 5. Status yang Digunakan

**Permohonan (Bab 12)**
`DRAFT â†’ DIAJUKAN â†’ DALAM_VERIFIKASI â†’ DITERIMA / DITOLAK / PERLU_PERBAIKAN â†’ DIJADWALKAN â†’ BERLANGSUNG â†’ SELESAI`
serta `DIBATALKAN`.

**Pengaduan (Bab 21)**
`DIAJUKAN â†’ DIVERIFIKASI â†’ DITINDAKLANJUTI â†’ SELESAI`, dengan `DITOLAK` dan `TIDAK_VALID`.

**Jadwal**
`TERJADWAL â†’ BERLANGSUNG â†’ SELESAI`, serta `DIBATALKAN`.

**Nomor kunjungan (Bab 11)**: `KUN-2026-0001`  Â·  **Nomor pengaduan**: `ADU-2026-0001`

---

## 6. Aturan Bisnis yang Sudah Diterapkan (Bab 43)

1. Setiap permohonan memperoleh nomor kunjungan unik.
2. Pemohon hanya dapat melihat data kunjungan miliknya sendiri.
3. Verifikasi dan penjadwalan hanya dapat dilakukan admin.
4. Sistem menolak jadwal yang bentrok pada ruangan dan waktu yang sama, serta
   menampilkan peringatan bentrokan pada halaman jadwal admin.
5. Daftar hadir hanya diterima bila jadwal dan ruangan sesuai.
6. Setiap ruangan memiliki QR Code pengaduan yang unik.
7. Pengaduan dari QR Code otomatis mengidentifikasi ruangan asal.
8. Setiap perubahan status pengaduan tercatat pada riwayat tindak lanjut.
9. Data sensitif tidak dibuka ke publik.
10. Password disimpan sebagai hash bcrypt, tidak pernah plaintext.

Poin 11 (kapasitas, dokumen wajib, mekanisme check-out, retensi data) sengaja
**belum dipaksakan** sebagai aturan wajib â€” sistem hanya menampilkan peringatan.
Daftar lengkap hal yang masih perlu dikonfirmasi ada di **Admin â†’ Pengaturan**,
mengacu Bab 46.

---

## 7. Alur Penggunaan Singkat

**Sebagai pemohon**
1. Daftar akun â†’ Login
2. Kunjungan Studi â†’ Ajukan Kunjungan â†’ isi data kelompok
3. Lengkapi Data Peserta pada halaman detail
4. Tekan **Ajukan ke Admin**
5. Pantau status, jadwal, dan ruangan pada dashboard

**Sebagai admin**
1. Login â†’ Permohonan Kunjungan â†’ pilih permohonan
2. **Mulai Verifikasi** â†’ periksa data â†’ simpan keputusan (Terima / Tolak / Perbaikan)
3. Setelah diterima: **Tetapkan Jadwal & Ruangan** (sistem memeriksa bentrokan)
4. Ruangan â†’ cetak QR Code pengaduan dan QR Code daftar hadir
5. Saat kunjungan: peserta check-in lewat halaman daftar hadir ruangan
6. Pengaduan Fasilitas â†’ tindak lanjut hingga Selesai
7. Laporan & Rekap untuk rekapitulasi periode

---

## 8. Supabase / PostgreSQL

Aplikasi menggunakan PostgreSQL Supabase lewat driver server `postgres`.
`DATABASE_URL` hanya dibaca di server dan tidak boleh diberi awalan `NEXT_PUBLIC_`.

1. Di Supabase, buka **SQL Editor**, lalu jalankan isi `supabase/migrations/20261005000000_initial_schema.sql`.
2. Atur URI koneksi dari menu **Connect** pada `DATABASE_URL` di `.env.local` atau `.env.production`. Untuk server VPS IPv4, pilih **Session Pooler**. Jangan commit atau membagikan URI tersebut.
3. Jalankan `npm run db:check` untuk memastikan koneksi serta 13 tabel aplikasi dapat diakses.
## 9. Belum Termasuk (Bab 42 â€” Menyusul)

Check-out otomatis, notifikasi real-time, export Excel/PDF, statistik lanjutan,
QR Code absensi terintegrasi penuh, penilaian pengalaman kunjungan, integrasi
WhatsApp/email, multi-role admin, dan integrasi IoT/sensor fasilitas.

Unggah berkas dokumen saat ini disiapkan strukturnya (tabel `documents` dan
folder `public/uploads/`) namun belum memiliki antarmuka unggah, karena status
wajib/tidaknya dokumen masih perlu dikonfirmasi Balai.

---

## 10. Pemecahan Masalah

**Koneksi database gagal**
Pastikan `DATABASE_URL` valid, migration sudah dijalankan, dan server dapat mengakses Supabase.

**QR Code tidak bisa dipindai dari ponsel**
Lihat bagian 2 â€” atur `PUBLIC_BASE_URL` ke alamat IP komputer.

**Port 3000 sudah dipakai**
`npm run dev -- -p 3001`

---

## 11. Deploy agar dapat diakses dari mana saja

Akses melalui jaringan mana pun memerlukan server/VPS dengan IP publik dan domain. Konfigurasi
`Dockerfile`, `docker-compose.yml`, dan `Caddyfile` menjalankan aplikasi dengan HTTPS otomatis,
Node.js 20, serta volume persisten untuk berkas unggahan. Database PostgreSQL berada di Supabase.
Jangan deploy aplikasi ini sebagai fungsi serverless dengan filesystem sementara.

1. Siapkan VPS Linux dengan Docker Engine dan Docker Compose Plugin. Arahkan DNS `A` domain ke IP VPS.
2. Buka port masuk `80/tcp` dan `443/tcp` pada firewall VPS/provider.
3. Salin proyek ke VPS, lalu buat konfigurasi produksi:

   ```bash
   cp .env.production.example .env.production
   ```

   Isi `DOMAIN`, `PUBLIC_BASE_URL`, dan `DATABASE_URL`. Jalankan SQL migration di Supabase
   sebelum aplikasi dijalankan.

4. Jalankan dari folder proyek:

   ```bash
   docker compose up -d --build
   ```

5. Buka `https://domain-anda`. Caddy meminta sertifikat HTTPS otomatis; DNS dan port 80/443 harus
   sudah mengarah ke VPS. Kamera scan daftar hadir memerlukan HTTPS pada perangkat selain localhost.

Database dan berkas unggahan disimpan pada Docker volume `app_data`, sehingga tetap ada saat
container diperbarui. Cadangkan volume tersebut secara berkala. Jangan menghapus volume dengan
`docker compose down -v` bila ingin mempertahankan data.


