"use client";

import { useEffect, useState } from "react";
import CountUp from "./CountUp";

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function RiskDonut({
  high,
  medium,
  low,
  size = 120,
}: {
  high: number;
  medium: number;
  low: number;
  size?: number;
}) {
  const total = high + medium + low;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const segments = [
    { key: "high", value: high, color: "var(--risk-high)" },
    { key: "medium", value: medium, color: "var(--risk-medium)" },
    { key: "low", value: low, color: "var(--risk-low)" },
  ];

  let offsetAcc = 0;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="var(--surface-hover)" strokeWidth="10" />
        {total > 0 &&
          segments.map((seg) => {
            if (seg.value === 0) return null;
            const fraction = seg.value / total;
            const dash = mounted ? fraction * CIRCUMFERENCE : 0;
            const dashOffset = -offsetAcc;
            offsetAcc += fraction * CIRCUMFERENCE;
            return (
              <circle
                key={seg.key}
                cx="50"
                cy="50"
                r={RADIUS}
                fill="none"
                stroke={seg.color}
                strokeWidth="10"
                strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                strokeDashoffset={dashOffset}
                style={{ transition: "stroke-dasharray 700ms cubic-bezier(0.16, 1, 0.3, 1)" }}
              />
            );
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-semibold text-ink">
          <CountUp value={total} />
        </span>
        <span className="text-[10px] text-ink-faint">findings</span>
      </div>
    </div>
  );
}
