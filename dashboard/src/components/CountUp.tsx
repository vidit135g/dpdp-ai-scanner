"use client";

import { useEffect, useRef, useState } from "react";

export default function CountUp({
  value,
  durationMs = 700,
  className,
}: {
  value: number;
  durationMs?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const frame = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      frame.current = requestAnimationFrame(() => setDisplay(value));
      return () => {
        if (frame.current) cancelAnimationFrame(frame.current);
      };
    }
    const start = performance.now();
    const from = 0;
    function tick(now: number) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) frame.current = requestAnimationFrame(tick);
    }
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [value, durationMs]);

  return <span className={className}>{display}</span>;
}
