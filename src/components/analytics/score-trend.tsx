"use client";

import { useState } from "react";

type Point = { label: string; score: number };

const W = 480;
const H = 200;
const PAD = { top: 16, right: 20, bottom: 28, left: 32 };
const TICKS = [0, 50, 100];

/** Tren skor antar percobaan satu paket (satu seri, skala 0–100). */
export function ScoreTrend({ points }: { points: Point[] }) {
  const [active, setActive] = useState<number | null>(null);
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? plotW / 2 : (plotW * i) / (points.length - 1));
  const y = (v: number) => PAD.top + plotH - (plotH * v) / 100;
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.score)}`).join(" ");
  const last = points.length - 1;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Tren skor: ${points.map((p) => `${p.label} ${p.score}`).join(", ")}`}
        className="w-full overflow-visible"
        onMouseLeave={() => setActive(null)}
      >
        {TICKS.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
            <text x={PAD.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-muted-foreground text-[11px] tabular-nums">
              {t}
            </text>
          </g>
        ))}
        {active != null && (
          <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={PAD.top + plotH} stroke="var(--input)" strokeWidth={1} />
        )}
        <path d={path} fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(p.score)} r={i === last ? 5 : 4} fill="var(--primary)" stroke="var(--card)" strokeWidth={2} />
            <text x={x(i)} y={H - 6} textAnchor="middle" className="fill-muted-foreground text-[11px]">
              {p.label}
            </text>
            {/* Kolom hover selebar jarak antar titik */}
            <rect
              x={x(i) - plotW / Math.max(points.length - 1, 1) / 2}
              y={PAD.top}
              width={plotW / Math.max(points.length - 1, 1)}
              height={plotH}
              fill="transparent"
              tabIndex={0}
              aria-label={`${p.label}: skor ${p.score}`}
              className="outline-none"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
            />
          </g>
        ))}
        {/* Label langsung hanya di titik terakhir */}
        <text x={x(last)} y={y(points[last].score) - 12} textAnchor="middle" className="fill-foreground text-[12px] font-bold">
          {points[last].score}
        </text>
      </svg>
      {active != null && (
        <div
          role="status"
          className="pointer-events-none absolute top-0 rounded-lg border bg-popover px-3 py-1.5 text-xs shadow-lg"
          style={{ left: `${(x(active) / W) * 100}%`, transform: "translateX(-50%)" }}
        >
          <span className="font-semibold">{points[active].label}</span>
          <span className="ml-2 tabular-nums text-muted-foreground">Skor {points[active].score}</span>
        </div>
      )}
    </div>
  );
}
