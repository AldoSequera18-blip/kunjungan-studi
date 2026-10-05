export default function Badge({
  label,
  tone,
}: {
  label: string;
  tone: string; // salah satu kelas badge-* dari globals.css
}) {
  return <span className={tone}>{label}</span>;
}
