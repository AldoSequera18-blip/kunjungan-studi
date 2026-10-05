# Sistem Informasi Manajemen Kunjungan Studi

Aplikasi web berbasis **Next.js 14 (App Router) + TypeScript + Tailwind CSS** untuk
Balai Layanan Perpustakaan Pemda DIY. Dibangun mengikuti dokumen
*Analisis Sistem Informasi Manajemen Kunjungan Studi v1.0*.

Alur inti yang didukung:

```
Informasi Kunjungan → Pendaftaran Kelompok → Verifikasi Admin → Diterima
→ Penjadwalan → Pembagian Ruangan → Pelaksanaan Kunjungan
→ Daftar Hadir per Ruangan → Pengaduan Fasilitas via QR Code
→ Tindak Lanjut Admin → Kunjungan Selesai
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

Database SQLite (`data/kunjungan.db`) **dibuat otomatis** pada saat pertama kali
dijalankan, lengkap dengan data awal: 1 akun admin, 1 akun pemohon, 5 ruangan,
dan QR Code untuk setiap ruangan.

### Akun uji coba

| Peran | Email | Password |
|---|---|---|
| Admin | `admin@perpusdiy.go.id` | `admin123` |
| Pemohon | `budi@sman1yogya.sch.id` | `pemohon123` |

> Ganti password kedua akun ini sebelum digunakan pada lingkungan sungguhan.

### Perintah lain

```bash
npm run build     # build produksi
npm start         # jalankan hasil build
npm run lint      # pemeriksaan ESLint
npm run db:reset  # hapus database agar dibuat ulang dari data awal
```

---

## 2. Menguji QR Code dari ponsel

Secara bawaan QR Code berisi alamat `http://localhost:3000`, yang tidak dapat
dibuka dari ponsel. Agar bisa dipindai pada jaringan Wi-Fi yang sama:

1. Cari alamat IP komputer Anda — `ipconfig` (Windows) atau `ifconfig` / `ip a` (macOS/Linux),
   misalnya `192.168.1.10`.
2. Ubah `.env.local`:
   ```env
   PUBLIC_BASE_URL=http://192.168.1.10:3000
   ```
3. Jalankan ulang: `npm run dev`
4. Buka **Panel Admin → Ruangan → [pilih ruangan]**, lalu pindai QR Code dari ponsel.

---

## 3. Struktur Proyek

```
kunjungan-studi/
├── data/                       # database SQLite (dibuat otomatis)
├── scripts/reset-db.mjs        # utilitas reset database
├── src/
│   ├── app/
│   │   ├── (publik)/           # halaman publik tanpa login
│   │   │   ├── page.tsx              Informasi kunjungan (Bab 7)
│   │   │   ├── alur/                 Alur pendaftaran (Bab 6)
│   │   │   ├── ruangan/              Ruangan & fasilitas
│   │   │   └── faq/                  Pertanyaan umum
│   │   ├── (auth)/             # login & registrasi
│   │   ├── (pemohon)/          # portal pemohon (Bab 23–28)
│   │   │   ├── dashboard/  profil/  kunjungan/  peserta/
│   │   │   ├── jadwal/  fasilitas/  kehadiran/
│   │   │   └── pengaduan-saya/  notifikasi/
│   │   ├── admin/              # panel admin (Bab 29–39)
│   │   │   ├── permohonan/  kelompok/  jadwal/  ruangan/
│   │   │   ├── kehadiran/  pengaduan/  laporan/
│   │   │   └── notifikasi/  pengaturan/  audit/
│   │   ├── hadir/[token]/      # daftar hadir per ruangan via QR (Bab 17–18)
│   │   ├── pengaduan/[token]/  # pengaduan fasilitas via QR (Bab 19–20)
│   │   └── api/
│   │       ├── qr/[token]/     # generator gambar QR Code (PNG)
│   │       └── logout/
│   ├── components/             # komponen UI bersama
│   └── lib/
│       ├── db.ts               # koneksi SQLite, skema 12 tabel, data awal
│       ├── auth.ts             # sesi, bcrypt, hak akses
│       ├── audit.ts            # audit log & notifikasi
│       ├── types.ts            # tipe data & konstanta
│       └── utils.ts            # format tanggal, label status, validasi
├── tailwind.config.ts
└── next.config.mjs
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
`DRAFT → DIAJUKAN → DALAM_VERIFIKASI → DITERIMA / DITOLAK / PERLU_PERBAIKAN → DIJADWALKAN → BERLANGSUNG → SELESAI`
serta `DIBATALKAN`.

**Pengaduan (Bab 21)**
`DIAJUKAN → DIVERIFIKASI → DITINDAKLANJUTI → SELESAI`, dengan `DITOLAK` dan `TIDAK_VALID`.

**Jadwal**
`TERJADWAL → BERLANGSUNG → SELESAI`, serta `DIBATALKAN`.

**Nomor kunjungan (Bab 11)**: `KUN-2026-0001`  ·  **Nomor pengaduan**: `ADU-2026-0001`

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
**belum dipaksakan** sebagai aturan wajib — sistem hanya menampilkan peringatan.
Daftar lengkap hal yang masih perlu dikonfirmasi ada di **Admin → Pengaturan**,
mengacu Bab 46.

---

## 7. Alur Penggunaan Singkat

**Sebagai pemohon**
1. Daftar akun → Login
2. Kunjungan Studi → Ajukan Kunjungan → isi data kelompok
3. Lengkapi Data Peserta pada halaman detail
4. Tekan **Ajukan ke Admin**
5. Pantau status, jadwal, dan ruangan pada dashboard

**Sebagai admin**
1. Login → Permohonan Kunjungan → pilih permohonan
2. **Mulai Verifikasi** → periksa data → simpan keputusan (Terima / Tolak / Perbaikan)
3. Setelah diterima: **Tetapkan Jadwal & Ruangan** (sistem memeriksa bentrokan)
4. Ruangan → cetak QR Code pengaduan dan QR Code daftar hadir
5. Saat kunjungan: peserta check-in lewat halaman daftar hadir ruangan
6. Pengaduan Fasilitas → tindak lanjut hingga Selesai
7. Laporan & Rekap untuk rekapitulasi periode

---

## 8. Migrasi ke Supabase / PostgreSQL

Dokumen analisis (Bab 41) merencanakan Supabase + Vercel. Proyek ini memakai
SQLite lokal agar langsung dapat dijalankan tanpa pendaftaran layanan apa pun.
Nama tabel dan kolom dibuat identik dengan rencana tersebut, sehingga migrasi
cukup dilakukan pada satu lapisan:

1. Buat tabel di Supabase memakai definisi SQL pada `src/lib/db.ts`
   (ubah `INTEGER PRIMARY KEY AUTOINCREMENT` → `BIGSERIAL PRIMARY KEY`,
   `datetime('now')` → `now()`, `TEXT` tanggal → `DATE`/`TIMESTAMPTZ`).
2. Ganti isi `src/lib/db.ts` dengan klien Supabase.
3. Ganti `src/lib/auth.ts` dengan Supabase Auth bila ingin memakai autentikasi bawaan.
4. Seluruh halaman dan server action tidak perlu diubah strukturnya.

---

## 9. Belum Termasuk (Bab 42 — Menyusul)

Check-out otomatis, notifikasi real-time, export Excel/PDF, statistik lanjutan,
QR Code absensi terintegrasi penuh, penilaian pengalaman kunjungan, integrasi
WhatsApp/email, multi-role admin, dan integrasi IoT/sensor fasilitas.

Unggah berkas dokumen saat ini disiapkan strukturnya (tabel `documents` dan
folder `public/uploads/`) namun belum memiliki antarmuka unggah, karena status
wajib/tidaknya dokumen masih perlu dikonfirmasi Balai.

---

## 10. Pemecahan Masalah

**`npm install` gagal pada better-sqlite3**
Modul ini memerlukan binary native. Umumnya npm mengunduh versi siap pakai.
Bila gagal di Windows, pasang build tools: `npm install --global windows-build-tools`
atau install **Visual Studio Build Tools** dengan workload *Desktop development with C++*.

**Halaman error setelah mengubah skema database**
Jalankan `npm run db:reset`, lalu `npm run dev` lagi.

**QR Code tidak bisa dipindai dari ponsel**
Lihat bagian 2 — atur `PUBLIC_BASE_URL` ke alamat IP komputer.

**Port 3000 sudah dipakai**
`npm run dev -- -p 3001`

---

## 11. Deploy agar dapat diakses dari mana saja

Akses melalui jaringan mana pun memerlukan server/VPS dengan IP publik dan domain. Konfigurasi
`Dockerfile`, `docker-compose.yml`, dan `Caddyfile` menjalankan aplikasi dengan HTTPS otomatis,
Node.js 20, serta volume persisten untuk database SQLite dan unggahan. Jangan deploy aplikasi ini
sebagai fungsi serverless dengan filesystem sementara.

1. Siapkan VPS Linux dengan Docker Engine dan Docker Compose Plugin. Arahkan DNS `A` domain ke IP VPS.
2. Buka port masuk `80/tcp` dan `443/tcp` pada firewall VPS/provider.
3. Salin proyek ke VPS, lalu buat konfigurasi produksi:

   ```bash
   cp .env.production.example .env.production
   ```

   Isi `DOMAIN` dan `PUBLIC_BASE_URL` dengan domain yang sama. Ubah `INITIAL_ADMIN_EMAIL` dan
   tetapkan `INITIAL_ADMIN_PASSWORD` yang kuat (minimal 16 karakter). Database baru akan membuat
   akun admin tersebut tanpa akun demo bawaan.

4. Jalankan dari folder proyek:

   ```bash
   docker compose up -d --build
   ```

5. Buka `https://domain-anda`. Caddy meminta sertifikat HTTPS otomatis; DNS dan port 80/443 harus
   sudah mengarah ke VPS. Kamera scan daftar hadir memerlukan HTTPS pada perangkat selain localhost.

Database dan berkas unggahan disimpan pada Docker volume `app_data`, sehingga tetap ada saat
container diperbarui. Cadangkan volume tersebut secara berkala. Jangan menghapus volume dengan
`docker compose down -v` bila ingin mempertahankan data.
