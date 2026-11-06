"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";

function tautanDaftarHadir(nilai: string): string | null {
  try {
    const url = new URL(nilai.trim(), window.location.origin);
    const cocok = url.pathname.match(/^\/hadir\/([^/]+)\/?$/);
    return cocok ? `/hadir/${encodeURIComponent(decodeURIComponent(cocok[1]))}` : null;
  } catch {
    return null;
  }
}

export default function PemindaiQr() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const aktifRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const [memindai, setMemindai] = useState(false);
  const [galat, setGalat] = useState("");

  const hentikanKamera = useCallback(() => {
    aktifRef.current = false;
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    controlsRef.current?.stop();
    controlsRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setMemindai(false);
  }, []);

  useEffect(() => () => {
    aktifRef.current = false;
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    controlsRef.current?.stop();
  }, []);

  async function mulaiMemindai() {
    setGalat("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setGalat("Akses kamera tidak tersedia. Pastikan halaman dibuka melalui HTTPS atau localhost.");
      return;
    }

    try {
      const video = videoRef.current;
      if (!video) throw new Error("Tampilan kamera tidak tersedia.");
      const pembaca = new BrowserQRCodeReader();
      aktifRef.current = true;
      setMemindai(true);
      const controls = await pembaca.decodeFromConstraints(
        { audio: false, video: { facingMode: { ideal: "environment" } } },
        video,
        (hasil, _galatScan, kontrol) => {
          if (!hasil || !aktifRef.current) return;
          aktifRef.current = false;
          kontrol.stop();
          controlsRef.current = null;
          setMemindai(false);
          const tujuan = tautanDaftarHadir(hasil.getText());
          if (tujuan) router.push(tujuan);
          else setGalat("QR yang dipindai bukan barcode daftar hadir ruangan.");
        }
      );
      if (aktifRef.current) controlsRef.current = controls;
      else controls.stop();
    } catch {
      hentikanKamera();
      setGalat("Kamera tidak dapat dibuka. Izinkan akses kamera pada browser dan coba lagi.");
    }
  }

  return (
    <section className="card-pad space-y-4">
      <div>
        <h2 className="section-title">Scan Barcode Daftar Hadir</h2>
        <p className="mt-1 text-sm text-slate-600">
          Arahkan kamera ke QR daftar hadir di ruangan. Setelah terbaca, halaman daftar hadir ruangan akan terbuka.
        </p>
      </div>
      {galat && <p className="alert-warning" role="status">{galat}</p>}
      {memindai ? (
        <button type="button" className="btn-secondary" onClick={hentikanKamera}>Tutup Kamera</button>
      ) : (
        <button type="button" className="btn-primary" onClick={mulaiMemindai}>Buka Kamera &amp; Scan QR</button>
      )}
      <div className="relative flex aspect-[4/3] min-h-72 w-full items-center justify-center overflow-hidden rounded-[2rem] bg-[#112233] text-center sm:min-h-[30rem]">
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover ${memindai ? "block" : "hidden"}`}
          muted
          playsInline
          aria-label="Tampilan kamera untuk scan QR daftar hadir"
        />
        {memindai ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-52 w-52 rounded-3xl border-2 border-white/75 shadow-[0_0_0_999px_rgba(7,20,34,0.25)] sm:h-64 sm:w-64" />
            <span className="absolute bottom-6 rounded-full bg-slate-950/70 px-4 py-2 text-sm font-medium text-white">
              Arahkan QR ke dalam bingkai
            </span>
          </div>
        ) : (
          <div className="relative z-10 mx-auto max-w-2xl px-6 py-10 text-slate-300">
            <svg className="mx-auto h-16 w-16" viewBox="0 0 64 64" fill="none" aria-hidden="true">
              <path d="M20 17 24 11h16l5 6h7a6 6 0 0 1 6 6v25a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6V23a6 6 0 0 1 6-6h8Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
              <circle cx="32" cy="35" r="10" stroke="currentColor" strokeWidth="4" />
            </svg>
            <h3 className="mt-8 text-2xl font-bold sm:text-3xl">Kamera siap digunakan</h3>
            <p className="mx-auto mt-7 max-w-3xl text-lg leading-relaxed text-slate-400 sm:text-2xl">
              Tekan tombol di atas untuk memberi izin kamera.
            </p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-center gap-3 text-center text-sm text-slate-500 sm:text-base">
        <span>Pemindaian hanya menggunakan kamera perangkat.</span>
      </div>
    </section>
  );
}
