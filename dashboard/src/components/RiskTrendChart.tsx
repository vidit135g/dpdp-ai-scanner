export interface TrendPoint {
  label: string;
  high: number;
  medium: number;
  low: number;
}

const CHART_HEIGHT = 120;
const BAR_WIDTH = 20;
const BAR_GAP = 14;

export default function RiskTrendChart({ points }: { points: TrendPoint[] }) {
  const maxTotal = Math.max(1, ...points.map((p) => p.high + p.medium + p.low));
  const width = points.length * (BAR_WIDTH + BAR_GAP) + BAR_GAP;

  return (
    <div>
      <div className="overflow-x-auto">
        <svg
          role="img"
          aria-label={`Findings per scan over time, ${points.length} scans`}
          width={width}
          height={CHART_HEIGHT + 28}
          viewBox={`0 0 ${width} ${CHART_HEIGHT + 28}`}
          className="min-w-full"
        >
          <line
            x1={0}
            y1={CHART_HEIGHT}
            x2={width}
            y2={CHART_HEIGHT}
            stroke="var(--border)"
            strokeWidth={1}
          />
          {points.map((p, i) => {
            const x = BAR_GAP + i * (BAR_WIDTH + BAR_GAP);
            const total = p.high + p.medium + p.low;
            const scale = total === 0 ? 0 : CHART_HEIGHT / maxTotal;
            const highH = p.high * scale;
            const medH = p.medium * scale;
            const lowH = p.low * scale;
            let y = CHART_HEIGHT;
            const segments: { h: number; color: string }[] = [
              { h: lowH, color: "var(--risk-low)" },
              { h: medH, color: "var(--risk-medium)" },
              { h: highH, color: "var(--risk-high)" },
            ];
            return (
              <g key={i}>
                {segments.map((seg, si) => {
                  if (seg.h === 0) return null;
                  y -= seg.h;
                  return (
                    <rect
                      key={si}
                      x={x}
                      y={y}
                      width={BAR_WIDTH}
                      height={Math.max(0, seg.h - 1)}
                      rx={2}
                      fill={seg.color}
                    />
                  );
                })}
                {total === 0 && (
                  <rect
                    x={x}
                    y={CHART_HEIGHT - 3}
                    width={BAR_WIDTH}
                    height={3}
                    rx={1.5}
                    fill="var(--border-strong)"
                  />
                )}
                <text
                  x={x + BAR_WIDTH / 2}
                  y={CHART_HEIGHT + 18}
                  textAnchor="middle"
                  fontSize={10}
                  fill="var(--ink-faint)"
                  className="font-mono"
                >
                  {p.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--risk-high)" }} />
          High
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--risk-medium)" }} />
          Medium
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--risk-low)" }} />
          Low
        </span>
      </div>
    </div>
  );
}
