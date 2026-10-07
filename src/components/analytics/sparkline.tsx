// Grafik garis mini akurasi berjalan satu subdomain (tanpa interaksi, server component).

const W = 64;
const H = 22;
const PAD = 3;

export function Sparkline({ values, label }: { values: number[]; label: string }) {
  if (values.length < 2) return null;
  const x = (i: number) => PAD + ((W - PAD * 2) * i) / (values.length - 1);
  const y = (v: number) => PAD + (H - PAD * 2) * (1 - v / 100);
  const path = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const first = values[0];
  const last = values[values.length - 1];
  const tone = last > first ? "var(--success-strong)" : last < first ? "var(--destructive)" : "var(--muted-foreground)";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={label} className="shrink-0 overflow-visible">
      <line x1={PAD} x2={W - PAD} y1={y(50)} y2={y(50)} stroke="var(--border)" strokeWidth={1} strokeDasharray="2 2" />
      <path d={path} fill="none" stroke={tone} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(values.length - 1)} cy={y(last)} r={2.25} fill={tone} />
    </svg>
  );
}
