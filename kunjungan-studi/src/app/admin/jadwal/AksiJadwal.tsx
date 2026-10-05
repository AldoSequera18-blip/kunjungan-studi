"use client";

import { useFormState } from "react-dom";
import SubmitButton from "@/components/SubmitButton";
import { aksiUbahStatusJadwal } from "../actions";

export default function AksiJadwal({
  scheduleId,
  status,
}: {
  scheduleId: number;
  status: string;
}) {
  const [state, formAction] = useFormState(aksiUbahStatusJadwal, undefined);

  const pilihan: { nilai: string; label: string; kelas: string }[] = [];
  if (status === "TERJADWAL") {
    pilihan.push({ nilai: "BERLANGSUNG", label: "Mulai", kelas: "btn-primary btn-sm" });
    pilihan.push({ nilai: "DIBATALKAN", label: "Batalkan", kelas: "btn-danger btn-sm" });
  } else if (status === "BERLANGSUNG") {
    pilihan.push({ nilai: "SELESAI", label: "Selesaikan", kelas: "btn-primary btn-sm" });
  }

  if (pilihan.length === 0) return <span className="text-xs text-slate-400">—</span>;

  return (
    <div className="space-y-1">
      {state?.error && <p className="text-xs text-rose-600">{state.error}</p>}
      <div className="flex justify-end gap-2">
        {pilihan.map((p) => (
          <form key={p.nilai} action={formAction}>
            <input type="hidden" name="schedule_id" value={scheduleId} />
            <input type="hidden" name="status" value={p.nilai} />
            <SubmitButton
              className={p.kelas}
              loadingText="…"
              confirm={p.nilai === "DIBATALKAN" ? "Batalkan jadwal ini?" : undefined}
            >
              {p.label}
            </SubmitButton>
          </form>
        ))}
      </div>
    </div>
  );
}
