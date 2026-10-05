import Link from "next/link";

export default function StatCard({
  label,
  value,
  hint,
  href,
  tone = "slate",
}: {
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
  tone?: "slate" | "brand" | "amber" | "rose" | "sky" | "violet";
}) {
  const tones: Record<string, string> = {
    slate: "text-slate-900",
    brand: "text-brand-700",
    amber: "text-gold-600",
    rose: "text-rose-600",
    sky: "text-sky-600",
    violet: "text-violet-600",
  };

  const isi = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${tones[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="card-pad card-hover block">
        {isi}
      </Link>
    );
  }
  return <div className="card-pad">{isi}</div>;
}
