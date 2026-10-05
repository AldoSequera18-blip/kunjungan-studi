"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export interface EventKalender {
  id: number;
  tanggal: string; // YYYY-MM-DD
  waktu: string; // sudah diformat, mis. "09:00 – 11:00"
  judul: string;
  /** Kosong untuk jadwal pemohon lain (data dirahasiakan) */
  nomor?: string;
  /** true bila jadwal ini milik pengguna yang sedang login (portal pemohon) */
  milikSaya?: boolean;
  statusLabel: string;
  statusClass: string;
  href?: string;
  bentrok?: boolean;
  /** Baris keterangan tambahan (peserta, penanggung jawab, dll.) */
  info?: string[];
  /** Seluruh jadwal & pembagian ruangan untuk pemohon ini pada tanggal tersebut */
  sesi: SesiKalender[];
}

/** Satu sesi (ruangan + waktu) di dalam kunjungan milik satu pemohon. */
export interface SesiKalender {
  id: number;
  waktu: string;
  ruangan: string;
  statusLabel: string;
  statusClass: string;
  bentrok?: boolean;
  /** Elemen aksi opsional (mis. tombol ubah status pada admin) */
  aksi?: React.ReactNode;
}

const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const NAMA_HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

export default function KalenderJadwal({
  events,
  hariIni,
}: {
  events: EventKalender[];
  hariIni: string;
}) {
  const [tahun0, bulan0] = hariIni.split("-").map(Number);
  const [tahun, setTahun] = useState(tahun0);
  const [bulan, setBulan] = useState(bulan0 - 1);
  const [dipilih, setDipilih] = useState<string>(hariIni);

  const perTanggal = useMemo(() => {
    const m = new Map<string, EventKalender[]>();
    for (const e of events) {
      if (!m.has(e.tanggal)) m.set(e.tanggal, []);
      m.get(e.tanggal)!.push(e);
    }
    return m;
  }, [events]);

  const pindah = (delta: number) => {
    const d = new Date(tahun, bulan + delta, 1);
    setTahun(d.getFullYear());
    setBulan(d.getMonth());
  };
  const keHariIni = () => {
    setTahun(tahun0);
    setBulan(bulan0 - 1);
    setDipilih(hariIni);
  };

  const hariPertama = new Date(tahun, bulan, 1).getDay();
  const jumlahHari = new Date(tahun, bulan + 1, 0).getDate();
  const sel: (number | null)[] = [
    ...Array<null>(hariPertama).fill(null),
    ...Array.from({ length: jumlahHari }, (_, i) => i + 1),
  ];
  while (sel.length % 7 !== 0) sel.push(null);

  const acara = perTanggal.get(dipilih) ?? [];
  const [ty, tm, td] = dipilih.split("-").map(Number);
  const labelDipilih = `${td} ${NAMA_BULAN[tm - 1]} ${ty}`;

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
          <h2 className="font-display text-xl font-bold text-slate-900">
            {NAMA_BULAN[bulan]} {tahun}
          </h2>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => pindah(-1)} className="btn-secondary btn-sm" aria-label="Bulan sebelumnya">
              ‹
            </button>
            <button type="button" onClick={keHariIni} className="btn-secondary btn-sm">
              Hari ini
            </button>
            <button type="button" onClick={() => pindah(1)} className="btn-secondary btn-sm" aria-label="Bulan berikutnya">
              ›
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/80 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
          {NAMA_HARI.map((h) => (
            <div key={h} className="py-2">{h}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {sel.map((d, i) => {
            if (d === null) {
              return (
                <div
                  key={i}
                  className="min-h-[4.5rem] border-b border-r border-slate-100 bg-slate-50/40 sm:min-h-[6.5rem]"
                />
              );
            }
            const tgl = iso(tahun, bulan, d);
            const list = perTanggal.get(tgl) ?? [];
            const adalahHariIni = tgl === hariIni;
            const terpilih = tgl === dipilih;
            return (
              <button
                type="button"
                key={i}
                onClick={() => setDipilih(tgl)}
                className={`flex min-h-[4.5rem] min-w-0 flex-col items-stretch gap-1 border-b border-r border-slate-100 p-1.5 text-left transition-colors sm:min-h-[6.5rem] ${
                  terpilih ? "bg-brand-50 ring-2 ring-inset ring-brand-500" : "hover:bg-slate-50"
                }`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    adalahHariIni ? "bg-brand-700 text-white" : "text-slate-700"
                  }`}
                >
                  {d}
                </span>
                <span className="hidden flex-col gap-0.5 sm:flex">
                  {list.slice(0, 2).map((e) => (
                    <span
                      key={e.id}
                      className={`truncate rounded px-1.5 py-0.5 text-[11px] font-medium ${
                        e.bentrok
                          ? "bg-rose-100 text-rose-700"
                          : e.milikSaya
                            ? "bg-brand-100 text-brand-800"
                            : "bg-gold-100 text-gold-900"
                      }`}
                    >
                      {e.waktu.slice(0, 5)} {e.judul}
                    </span>
                  ))}
                  {list.length > 2 && (
                    <span className="px-1 text-[11px] font-semibold text-slate-500">
                      +{list.length - 2} lagi
                    </span>
                  )}
                </span>
                {list.length > 0 && (
                  <span className="flex gap-0.5 sm:hidden">
                    {list.slice(0, 4).map((e) => (
                      <span
                        key={e.id}
                        className={`h-1.5 w-1.5 rounded-full ${e.bentrok ? "bg-rose-500" : e.milikSaya ? "bg-brand-600" : "bg-gold-500"}`}
                      />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="section-title mb-3">
          Kunjungan {labelDipilih} ({acara.length})
        </h2>
        {acara.length === 0 ? (
          <p className="card-pad text-sm text-slate-500">Tidak ada kunjungan pada tanggal ini.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {acara.map((e) => (
              <article key={e.id} className={`card-pad ${e.bentrok ? "ring-1 ring-rose-300" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {e.milikSaya && (
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">
                        Jadwal Saya
                      </p>
                    )}
                    {e.nomor && <p className="font-mono text-xs text-slate-500">{e.nomor}</p>}
                    {e.href ? (
                      <Link href={e.href} className="mt-0.5 block font-bold text-brand-800 hover:underline">
                        {e.judul}
                      </Link>
                    ) : (
                      <p className="mt-0.5 font-bold text-slate-900">{e.judul}</p>
                    )}
                  </div>
                  <span className={e.statusClass}>{e.statusLabel}</span>
                </div>
                <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-100">
                  {e.sesi.map((x) => (
                    <li key={x.id} className={`space-y-1 px-3 py-2 ${x.bentrok ? "bg-rose-50" : ""}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800">{x.waktu}</p>
                          <p className="text-sm text-slate-600">{x.ruangan}</p>
                        </div>
                        {e.sesi.length > 1 && <span className={x.statusClass}>{x.statusLabel}</span>}
                      </div>
                      {x.bentrok && (
                        <p className="text-xs font-semibold text-rose-600">
                          Bentrok ruangan pada waktu yang sama
                        </p>
                      )}
                      {x.aksi}
                    </li>
                  ))}
                </ul>
                {e.info?.map((t, i) => (
                  <p key={i} className="mt-1 text-sm text-slate-600">{t}</p>
                ))}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
