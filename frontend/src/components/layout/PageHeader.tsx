// ─────────────────────────────────────────────────────────────────────────────
// MineCore — PageHeader Component
// Reusable page header with title, subtitle, and optional action slot
// ─────────────────────────────────────────────────────────────────────────────

import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Right-aligned action buttons or controls */
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn("flex items-start justify-between gap-4 mb-6", className)}
    >
      <div className="min-w-0">
        <h2 className="text-xl font-semibold text-foreground tracking-tight truncate">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}
