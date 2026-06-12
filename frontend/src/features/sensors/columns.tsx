// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Sensors Table Column Definitions
// ─────────────────────────────────────────────────────────────────────────────

import type { ColumnDef } from '@tanstack/react-table';
import type { Sensor } from '@/types/sensor';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SENSOR_TYPE_LABELS } from '@/constants/enums';
import { formatRelativeTime } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash } from 'lucide-react';

export const sensorColumns: ColumnDef<Sensor, unknown>[] = [
  {
    accessorKey: 'sensorCode',
    header: 'Code',
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-muted-foreground">{String(getValue())}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'name',
    header: 'Sensor',
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-sm">{row.original.name}</p>
        <p className="text-xs text-muted-foreground">
          {SENSOR_TYPE_LABELS[row.original.sensorType]}
        </p>
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => <StatusBadge value={String(getValue())} />,
    enableSorting: true,
  },
  {
    accessorKey: 'value',
    header: 'Current Reading',
    cell: ({ row }) => {
      const val = row.original.value;
      const unit = row.original.unit;
      return val != null ? (
        <span className="font-mono text-sm tabular-nums">
          {val.toFixed(2)} <span className="text-muted-foreground text-xs">{unit}</span>
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: 'site',
    header: 'Site',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.site?.name ?? '—'}</span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'lastReading',
    header: 'Last Reading',
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground">
        {formatRelativeTime(getValue() as string | null | undefined)}
      </span>
    ),
    enableSorting: true,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row, table }) => {
      const sensor = row.original;
      const meta = table.options.meta as any;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => meta?.onEdit?.(sensor)}>
              <Edit className="mr-2 w-4 h-4" />
              Edit Sensor
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => meta?.onDelete?.(sensor)}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Trash className="mr-2 w-4 h-4" />
              Delete Sensor
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
  },
];
