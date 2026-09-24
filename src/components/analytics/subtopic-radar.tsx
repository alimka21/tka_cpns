"use client";

import { useState } from "react";

export type RadarDatum = { label: string; fullLabel: string; percentage: number; correct: number; total: number };

type Props = {
  data: RadarDatum[];
  /** Index subtopik terlemah — diberi penanda status (warna + teks). */
  weakestIndex: number;
};

const SIZE = 360;
const CENTER = SIZE / 2;
const RADIUS = 120;
const RINGS = [25, 50, 75, 100];

function point(index: number, count: number, value: number) {
  // Sumbu pertama tegak ke atas, searah jarum jam.
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
  const r = (RADIUS * value) / 100;
  return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle), angle };
}

/**
 * Radar chart penguasaan per subtopik (satu seri). Nilai juga tersedia di
 * daftar rincian subtopik — chart ini bukan satu-satunya cara membaca angka.
 */
export function SubtopicRadar({ data, weakestIndex }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const n = data.length;
  const polygon = data.map((d, i) => point(i, n, d.percentage)).map((p) => `${p.x},${p.y}`).join(" ");
  const shown = active != null ? data[active] : null;

  return (
    <figure className="flex flex-col items-center gap-3">
      <div className="relative w-full max-w-[26rem]">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label={`Radar penguasaan subtopik: ${data.map((d) => `${d.fullLabel} ${d.percentage}%`).join(", ")}`}
          className="w-full overflow-visible"
        >
          {/* Grid: ring persentase + jari-jari, hairline */}
          {RINGS.map((ring) => (
            <polygon
              key={ring}
              points={data.map((_, i) => point(i, n, ring)).map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="var(--border)"
              strokeWidth={1}
            />
          ))}
          {data.map((_, i) => {
            const p = point(i, n, 100);
            return <line key={i} x1={CENTER} y1={CENTER} x2={p.x} y2={p.y} stroke="var(--border)" strokeWidth={1} />;
          })}
          <polygon points={polygon} fill="var(--primary)" fillOpacity={0.12} stroke="var(--primary)" strokeWidth={2} strokeLinejoin="round" />

          {RINGS.map((ring) => (
            <text
              key={ring}
              x={CENTER + 4}
              y={CENTER - (RADIUS * ring) / 100 + 11}
              // Halo warna kartu supaya label tetap terbaca di atas garis data.
              stroke="var(--card)"
              strokeWidth={3}
              paintOrder="stroke"
              className="fill-muted-foreground text-[10px] tabular-nums"
            >
              {ring}%
            </text>
          ))}

          {data.map((d, i) => {
            const p = point(i, n, d.percentage);
            const weak = i === weakestIndex;
            return (
              <g key={d.label}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={weak ? 6 : 4.5}
                  fill={weak ? "var(--destructive)" : "var(--primary)"}
                  stroke="var(--card)"
                  strokeWidth={2}
                />
                {/* Area hover/fokus lebih besar dari titiknya */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={14}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${d.fullLabel}: ${d.percentage}%`}
                  className="cursor-pointer outline-none"
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                />
              </g>
            );
          })}

          {data.map((d, i) => {
            const p = point(i, n, 100);
            const lx = CENTER + (p.x - CENTER) * 1.2;
            const ly = CENTER + (p.y - CENTER) * 1.2;
            const anchor = Math.abs(lx - CENTER) < 4 ? "middle" : lx > CENTER ? "start" : "end";
            const weak = i === weakestIndex;
            return (
              <text
                key={d.label}
                x={lx}
                y={ly}
                textAnchor={anchor}
                dominantBaseline="middle"
                className={weak ? "fill-foreground text-[12px] font-bold" : "fill-muted-foreground text-[12px] font-medium"}
              >
                {weak ? `⚠ ${d.label}` : d.label}
              </text>
            );
          })}
        </svg>

        {shown && (
          <div
            role="status"
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg"
          >
            <div className="font-semibold">{shown.fullLabel}</div>
            <div className="text-muted-foreground tabular-nums">
              {shown.percentage}% · {shown.correct}/{shown.total} benar
            </div>
          </div>
        )}
      </div>
      <figcaption className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-primary" aria-hidden /> Penguasaan kamu
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-destructive" aria-hidden /> ⚠ Subtopik terlemah
        </span>
      </figcaption>
    </figure>
  );
}
