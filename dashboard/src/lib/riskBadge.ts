export type RiskLevel = "HIGH" | "MEDIUM" | "LOW";

export const RISK_STYLES: Record<RiskLevel, string> = {
  HIGH: "bg-[var(--risk-high-soft)] text-[var(--risk-high-ink)]",
  MEDIUM: "bg-[var(--risk-medium-soft)] text-[var(--risk-medium-ink)]",
  LOW: "bg-[var(--risk-low-soft)] text-[var(--risk-low-ink)]",
};

export function isRiskLevel(value: string): value is RiskLevel {
  return value === "HIGH" || value === "MEDIUM" || value === "LOW";
}
