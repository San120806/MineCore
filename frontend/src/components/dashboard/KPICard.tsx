// ─────────────────────────────────────────────────────────────────────────────
// MineCore — KPICard Component
// Primary metric display card for the dashboard
// ─────────────────────────────────────────────────────────────────────────────

import { type LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface KPICardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  /** Color accent: 'blue' | 'emerald' | 'amber' | 'red' | 'purple' | 'slate' */
  color?: "blue" | "emerald" | "amber" | "red" | "purple" | "slate";
  /** Delta vs previous period */
  delta?: number;
  deltaLabel?: string;
  subtitle?: string;
  className?: string;
}

const COLOR_MAP = {
  blue: {
    icon: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  emerald: {
    icon: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  amber: {
    icon: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  red: {
    icon: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  purple: {
    icon: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  slate: {
    icon: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
  },
};

export function KPICard({
  label,
  value,
  icon: Icon,
  color = "blue",
  delta,
  deltaLabel,
  subtitle,
  className,
}: KPICardProps) {
  const colors = COLOR_MAP[color];

  const DeltaIcon =
    delta == null ? Minus : delta > 0 ? TrendingUp : TrendingDown;
  const deltaColor =
    delta == null
      ? "text-muted-foreground"
      : delta > 0
        ? "text-emerald-400"
        : "text-red-400";

  return (
    <Card
      className={cn(
        "p-4 flex flex-col gap-3 border hover:border-primary/25 transition-colors duration-200",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
          {label}
        </p>
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg border",
            colors.bg,
            colors.border,
          )}
        >
          <Icon className={cn("w-4 h-4", colors.icon)} />
        </div>
      </div>

      {/* Value */}
      <div>
        <p className="text-2xl font-bold text-foreground tabular-nums">
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Delta */}
      {delta != null && (
        <div className={cn("flex items-center gap-1 text-xs", deltaColor)}>
          <DeltaIcon className="w-3 h-3" />
          <span>
            {delta > 0 ? "+" : ""}
            {delta}
            {deltaLabel ? ` ${deltaLabel}` : ""}
          </span>
        </div>
      )}
    </Card>
  );
}
