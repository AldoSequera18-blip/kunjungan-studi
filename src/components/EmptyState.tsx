export default function EmptyState({
  judul,
  pesan,
  aksi,
}: {
  judul: string;
  pesan?: string;
  aksi?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <p className="text-base font-semibold text-slate-700">{judul}</p>
      {pesan && <p className="mt-1 max-w-md text-sm text-slate-500">{pesan}</p>}
      {aksi && <div className="mt-5">{aksi}</div>}
    </div>
  );
}
