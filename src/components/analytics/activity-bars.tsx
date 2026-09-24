"use client";

import { useState } from "react";

type Datum = { day: string; count: number };

const W = 560;
const H = 220;
const PAD = { top: 20, right: 8, bottom: 28, left: 32 };

function niceMax(value: number) {
  const step = value <= 20 ? 5 : value <= 100 ? 10 : 50;
  return Math.ceil(value / step) * step;
}

/** Bar chart satu seri: jumlah percobaan tes per hari. */
export function ActivityBars({ data }: { data: Datum[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(...data.map((d) => d.count), 1));
  const ticks = [0, max / 2, max];
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const slot = plotW / data.length;
  const barW = Math.min(36, slot - 12);
  const y = (v: number) => PAD.top + plotH - (plotH * v) / max;
  const last = data.length - 1;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Percobaan tes per hari: ${data.map((d) => `${d.day} ${d.count}`).join(", ")}`}
        className="w-full overflow-visible"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
            <text x={PAD.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-muted-foreground text-[11px] tabular-nums">
              {t}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = PAD.left + slot * i + slot / 2;
          const top = y(d.count);
          const h = PAD.top + plotH - top;
          // Ujung atas membulat 4px, dasar rata di baseline.
          const r = Math.min(4, h / 2, barW / 2);
          const x0 = cx - barW / 2;
          const base = PAD.top + plotH;
          const path = `M${x0},${base} V${top + r} Q${x0},${top} ${x0 + r},${top} H${x0 + barW - r} Q${x0 + barW},${top} ${x0 + barW},${top + r} V${base} Z`;
          return (
            <g key={d.day}>
              <path d={path} fill="var(--primary)" opacity={active == null || active === i ? 1 : 0.55} />
              <text x={cx} y={H - 8} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                {d.day}
              </text>
              {i === last && (
                <text x={cx} y={top - 8} textAnchor="middle" className="fill-foreground text-[12px] font-bold tabular-nums">
                  {d.count}
                </text>
              )}
              <rect
                x={PAD.left + slot * i}
                y={PAD.top}
                width={slot}
                height={plotH}
                fill="transparent"
                tabIndex={0}
                aria-label={`${d.day}: ${d.count} percobaan`}
                className="outline-none"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
              />
            </g>
          );
        })}
      </svg>
      {active != null && (
        <div
          role="status"
          className="pointer-events-none absolute top-0 rounded-lg border bg-popover px-3 py-1.5 text-xs shadow-lg"
          style={{ left: `${((PAD.left + slot * active + slot / 2) / W) * 100}%`, transform: "translateX(-50%)" }}
        >
          <span className="font-semibold">{data[active].day}</span>
          <span className="ml-2 tabular-nums text-muted-foreground">{data[active].count} percobaan</span>
        </div>
      )}
    </div>
  );
}
