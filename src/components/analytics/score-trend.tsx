"use client";

import { useState } from "react";
import { formatScore, type ScoreView } from "@/lib/score-display";
import { SCALE_RANGE } from "@/lib/score-scale";

type Point = { label: string; score: ScoreView };

const W = 480;
const H = 200;
const PAD = { top: 16, right: 20, bottom: 28, left: 40 };

/**
 * Tren nilai antar percobaan (satu seri). Sumbu-y mengikuti skala titik:
 * 0–100 (SD/SMP) atau 200–800 (SMA). Semua titik harus satu skala.
 */
export function ScoreTrend({ points }: { points: Point[] }) {
  const [active, setActive] = useState<number | null>(null);
  const range = SCALE_RANGE[points[0]?.score.scale ?? "0_100"];
  const ticks = [range.min, (range.min + range.max) / 2, range.max];
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? plotW / 2 : (plotW * i) / (points.length - 1));
  /** `position` = 0–100 di rentang skala; `t` = nilai sumbu. */
  const y = (position: number) => PAD.top + plotH - (plotH * position) / 100;
  const tickY = (t: number) => y(((t - range.min) / (range.max - range.min)) * 100);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.score.position)}`).join(" ");
  const last = points.length - 1;
  // Maks ±6 label sumbu-x supaya tidak bertabrakan; detail tiap titik di tooltip.
  const labelStep = Math.ceil(points.length / 6);
  const showLabel = (i: number) => i === last || (i % labelStep === 0 && last - i >= labelStep / 2);

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Tren nilai: ${points.map((p) => `${p.label} ${formatScore(p.score.value)}`).join(", ")}`}
        className="w-full overflow-visible"
        onMouseLeave={() => setActive(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={tickY(t)} y2={tickY(t)} stroke="var(--border)" strokeWidth={1} />
            <text x={PAD.left - 8} y={tickY(t)} textAnchor="end" dominantBaseline="middle" className="fill-muted-foreground text-[11px] tabular-nums">
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
            <circle cx={x(i)} cy={y(p.score.position)} r={i === last ? 5 : 4} fill="var(--primary)" stroke="var(--card)" strokeWidth={2} />
            {showLabel(i) && (
              <text x={x(i)} y={H - 6} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                {p.label}
              </text>
            )}
            {/* Kolom hover selebar jarak antar titik */}
            <rect
              x={x(i) - plotW / Math.max(points.length - 1, 1) / 2}
              y={PAD.top}
              width={plotW / Math.max(points.length - 1, 1)}
              height={plotH}
              fill="transparent"
              tabIndex={0}
              aria-label={`${p.label}: nilai ${formatScore(p.score.value)}`}
              className="outline-none"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
            />
          </g>
        ))}
        {/* Label langsung hanya di titik terakhir */}
        <text x={x(last)} y={y(points[last].score.position) - 12} textAnchor="middle" className="fill-foreground text-[12px] font-bold">
          {formatScore(points[last].score.value)}
        </text>
      </svg>
      {active != null && (
        <div
          role="status"
          className="pointer-events-none absolute top-0 rounded-lg border bg-popover px-3 py-1.5 text-xs shadow-lg"
          style={{ left: `${(x(active) / W) * 100}%`, transform: "translateX(-50%)" }}
        >
          <span className="font-semibold">{points[active].label}</span>
          <span className="ml-2 tabular-nums text-muted-foreground">Nilai {formatScore(points[active].score.value)}</span>
        </div>
      )}
    </div>
  );
}
