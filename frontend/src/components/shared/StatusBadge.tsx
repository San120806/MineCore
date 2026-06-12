'use client';

// ─────────────────────────────────────────────────────────────────────────────
// MineCore — StatusBadge
// Renders a colored badge for any status/severity enum value
// ─────────────────────────────────────────────────────────────────────────────

import { cn } from '@/lib/utils';
import {
  VEHICLE_STATUS_LABELS,
  VEHICLE_STATUS_COLORS,
  SENSOR_STATUS_LABELS,
  SENSOR_STATUS_COLORS,
  ALERT_SEVERITY_LABELS,
  ALERT_SEVERITY_COLORS,
  ALERT_STATUS_LABELS,
  ALERT_STATUS_COLORS,
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_STATUS_COLORS,
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_STATUS_COLORS,
  MAINTENANCE_TYPE_LABELS,
  MAINTENANCE_TYPE_COLORS,
  SITE_STATUS_LABELS,
  SITE_STATUS_COLORS,
} from '@/constants/enums';
import {
  VehicleStatus,
  SensorStatus,
  AlertSeverity,
  AlertStatus,
  EquipmentStatus,
  MaintenanceStatus,
  MaintenanceType,
  SiteStatus,
} from '@/types/enums';

type StatusValue =
  | VehicleStatus
  | SensorStatus
  | AlertSeverity
  | AlertStatus
  | EquipmentStatus
  | MaintenanceStatus
  | MaintenanceType
  | SiteStatus;

const ALL_LABELS: Record<string, string> = {
  ...VEHICLE_STATUS_LABELS,
  ...SENSOR_STATUS_LABELS,
  ...ALERT_SEVERITY_LABELS,
  ...ALERT_STATUS_LABELS,
  ...EQUIPMENT_STATUS_LABELS,
  ...MAINTENANCE_STATUS_LABELS,
  ...MAINTENANCE_TYPE_LABELS,
  ...SITE_STATUS_LABELS,
};

const ALL_COLORS: Record<string, string> = {
  ...VEHICLE_STATUS_COLORS,
  ...SENSOR_STATUS_COLORS,
  ...ALERT_SEVERITY_COLORS,
  ...ALERT_STATUS_COLORS,
  ...EQUIPMENT_STATUS_COLORS,
  ...MAINTENANCE_STATUS_COLORS,
  ...MAINTENANCE_TYPE_COLORS,
  ...SITE_STATUS_COLORS,
};

// Map color name → Tailwind classes
const COLOR_CLASSES: Record<string, { text: string; bg: string; border: string }> = {
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25' },
  amber:   { text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/25'   },
  red:     { text: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/25'     },
  blue:    { text: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/25'    },
  slate:   { text: 'text-slate-400',   bg: 'bg-slate-500/10',   border: 'border-slate-500/25'   },
  orange:  { text: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/25'  },
  purple:  { text: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/25'  },
};

interface StatusBadgeProps {
  value: StatusValue | string;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ value, size = 'sm', className }: StatusBadgeProps) {
  const label = ALL_LABELS[value] ?? value;
  const colorName = ALL_COLORS[value] ?? 'slate';
  const colors = COLOR_CLASSES[colorName] ?? COLOR_CLASSES.slate;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border font-medium',
        colors.text,
        colors.bg,
        colors.border,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        className,
      )}
    >
      {label}
    </span>
  );
}
