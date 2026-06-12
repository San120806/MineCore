// ─────────────────────────────────────────────────────────────────────────────
// MineCore — ChartWrapper Component
// Wraps all Recharts with title, loading, and error states
// ─────────────────────────────────────────────────────────────────────────────

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, BarChart2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ChartWrapperProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  emptyText?: string;
  height?: number;
  className?: string;
}

export function ChartWrapper({
  title,
  subtitle,
  children,
  isLoading = false,
  isError = false,
  isEmpty = false,
  emptyText = 'No data available',
  height = 280,
  className,
}: ChartWrapperProps) {
  return (
    <Card className={cn('p-4', className)}>
      {/* Chart header */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Chart body */}
      {isLoading ? (
        <Skeleton style={{ height }} className="w-full rounded-lg" />
      ) : isError ? (
        <div
          style={{ height }}
          className="flex flex-col items-center justify-center text-center gap-2"
        >
          <AlertTriangle className="w-8 h-8 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Failed to load chart data</p>
        </div>
      ) : isEmpty ? (
        <div
          style={{ height }}
          className="flex flex-col items-center justify-center text-center gap-2 border border-dashed border-border/60 rounded-lg bg-muted/10"
        >
          <BarChart2 className="w-8 h-8 text-muted-foreground/30 animate-pulse" />
          <p className="text-xs text-muted-foreground">{emptyText}</p>
        </div>
      ) : (
        <div style={{ height }}>{children}</div>
      )}
    </Card>
  );
}
