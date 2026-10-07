"use client";

import { useEffect, useRef, useState } from "react";

export type TrendPoint = { label: string; percentage: number; rolling: number; questions: number; source: "test" | "practice" | null };
export type SubtopicTrendOption = { id: number; name: string; group: string; points: TrendPoint[] };

const PAD = { top: 18, right: 28, bottom: 30, left: 34 };
const TICKS = [0, 50, 75, 100];
const SOURCE_LABEL = { test: "Tes", practice: "Latihan" } as const;

const selectClass =
  "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15 focus-visible:outline-none sm:w-96";

/**
 * Tren akurasi satu subdomain: titik = hasil tiap tes/latihan, garis tebal =
 * akurasi berjalan (dasar status). Garis putus 50% & 75% = batas Cukup & Baik.
 */
export function SubtopicTrend({ options, initialId }: { options: SubtopicTrendOption[]; initialId?: number }) {
  const [id, setId] = useState(initialId ?? options[0]?.id);
  const [active, setActive] = useState<number | null>(null);
  // Lebar mengikuti wadah (bukan viewBox yang diskalakan) supaya teks tetap ±11px di HP maupun desktop.
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(560);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = W < 480 ? 200 : 240;
  const current = options.find((o) => o.id === id) ?? options[0];
  if (!current) return null;
  const points = current.points;
  const groups = [...new Set(options.map((o) => o.group))];

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? plotW / 2 : (plotW * i) / (points.length - 1));
  const y = (v: number) => PAD.top + plotH - (plotH * v) / 100;
  const rollingPath = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.rolling)}`).join(" ");
  const last = points.length - 1;
  const labelStep = Math.ceil(points.length / (W < 480 ? 4 : 7));
  const showLabel = (i: number) => i === last || (i % labelStep === 0 && last - i >= labelStep / 2);
  const first = points[0].rolling;
  const now = points[last].rolling;
  const diff = now - first;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="trend-subtopic" className="text-sm font-semibold">
          Subdomain
        </label>
        <select
          id="trend-subtopic"
          className={selectClass}
          value={current.id}
          onChange={(e) => {
            setId(Number(e.target.value));
            setActive(null);
          }}
        >
          {groups.map((g) => (
            <optgroup key={g} label={g}>
              {options
                .filter((o) => o.group === g)
                .map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </div>

      <p className="text-sm text-muted-foreground">
        Akurasi berjalan {first}% → <strong className="text-foreground">{now}%</strong>
        {diff !== 0 && (
          <span className={diff > 0 ? "font-semibold text-success-strong" : "font-semibold text-destructive"}>
            {" "}
            ({diff > 0 ? "naik" : "turun"} {Math.abs(diff)} poin)
          </span>
        )}{" "}
        dalam {points.length} tes/latihan terakhir.
      </p>

      <div ref={box} className="relative max-w-3xl">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width={W}
          height={H}
          role="img"
          aria-label={`Tren akurasi ${current.name}: ${points.map((p) => `${p.label} ${p.percentage}% (berjalan ${p.rolling}%)`).join(", ")}`}
          className="block overflow-visible"
          onMouseLeave={() => setActive(null)}
        >
          {TICKS.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--border)"
                strokeWidth={1}
                strokeDasharray={t === 50 || t === 75 ? "4 4" : undefined}
              />
              <text x={PAD.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-muted-foreground text-[11px] tabular-nums">
                {t}
              </text>
            </g>
          ))}
          <text x={PAD.left + 6} y={y(75) - 5} className="fill-muted-foreground text-[10px]">
            Baik
          </text>
          <text x={PAD.left + 6} y={y(50) - 5} className="fill-muted-foreground text-[10px]">
            Cukup
          </text>
          {active != null && <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={PAD.top + plotH} stroke="var(--input)" strokeWidth={1} />}
          {/* Titik hasil per tes/latihan (lingkaran = tes, belah ketupat = latihan) */}
          {points.map((p, i) =>
            p.source === "practice" ? (
              <rect
                key={`p${i}`}
                x={x(i) - 3.5}
                y={y(p.percentage) - 3.5}
                width={7}
                height={7}
                transform={`rotate(45 ${x(i)} ${y(p.percentage)})`}
                fill="var(--card)"
                stroke="var(--muted-foreground)"
                strokeWidth={1.5}
              />
            ) : (
              <circle key={`p${i}`} cx={x(i)} cy={y(p.percentage)} r={3.5} fill="var(--card)" stroke="var(--muted-foreground)" strokeWidth={1.5} />
            ),
          )}
          <path d={rollingPath} fill="none" stroke="var(--primary)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={x(i)} cy={y(p.rolling)} r={i === last ? 5 : 3.5} fill="var(--primary)" stroke="var(--card)" strokeWidth={2} />
              {showLabel(i) && (
                <text x={x(i)} y={H - 8} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                  {p.label}
                </text>
              )}
              <rect
                x={x(i) - plotW / Math.max(points.length - 1, 1) / 2}
                y={PAD.top}
                width={plotW / Math.max(points.length - 1, 1)}
                height={plotH}
                fill="transparent"
                tabIndex={0}
                aria-label={`${p.label}: ${p.source ? SOURCE_LABEL[p.source] : "Tes"} ${p.percentage}% dari ${p.questions} soal, akurasi berjalan ${p.rolling}%`}
                className="outline-none"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
              />
            </g>
          ))}
          <text x={x(last)} y={y(points[last].rolling) - 12} textAnchor="middle" className="fill-foreground text-[12px] font-bold">
            {points[last].rolling}%
          </text>
        </svg>
        {active != null && (
          <div
            role="status"
            className="pointer-events-none absolute top-0 rounded-lg border bg-popover px-3 py-1.5 text-xs shadow-lg"
            style={{ left: `${(x(active) / W) * 100}%`, transform: "translateX(-50%)" }}
          >
            <div className="font-semibold">
              {points[active].label} · {points[active].source ? SOURCE_LABEL[points[active].source!] : "Tes"}
            </div>
            <div className="tabular-nums text-muted-foreground">
              {points[active].percentage}% dari {points[active].questions} soal · berjalan {points[active].rolling}%
            </div>
          </div>
        )}
      </div>

      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground" aria-label="Keterangan grafik">
        <li className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-5 rounded bg-primary" aria-hidden /> Akurasi berjalan (dasar status)
        </li>
        <li className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full border-[1.5px] border-muted-foreground" aria-hidden /> Hasil tes
        </li>
        <li className="flex items-center gap-1.5">
          <span className="inline-block size-2 rotate-45 border-[1.5px] border-muted-foreground" aria-hidden /> Hasil latihan
        </li>
        <li className="flex items-center gap-1.5">
          <span className="inline-block w-5 border-t border-dashed border-muted-foreground" aria-hidden /> Batas Cukup 50% · Baik 75%
        </li>
      </ul>
    </div>
  );
}
