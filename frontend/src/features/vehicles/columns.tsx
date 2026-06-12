// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Vehicles Table Column Definitions
// ─────────────────────────────────────────────────────────────────────────────

import type { ColumnDef } from '@tanstack/react-table';
import type { Vehicle } from '@/types/vehicle';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { VEHICLE_TYPE_LABELS } from '@/constants/enums';
import { formatRelativeTime } from '@/lib/utils';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash, Settings } from 'lucide-react';

export const vehicleColumns: ColumnDef<Vehicle, unknown>[] = [
  {
    accessorKey: 'vehicleCode',
    header: 'Code',
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-muted-foreground">{String(getValue())}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'name',
    header: 'Vehicle',
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-sm">{row.original.name}</p>
        <p className="text-xs text-muted-foreground">{row.original.model}</p>
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ getValue }) => (
      <span className="text-sm">{VEHICLE_TYPE_LABELS[getValue() as keyof typeof VEHICLE_TYPE_LABELS] ?? String(getValue())}</span>
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
    accessorKey: 'fuelLevel',
    header: 'Fuel',
    cell: ({ getValue }) => {
      const level = Number(getValue());
      const color = level > 50 ? 'text-emerald-400' : level > 20 ? 'text-amber-400' : 'text-red-400';
      return <span className={`tabular-nums text-sm font-medium ${color}`}>{level.toFixed(0)}%</span>;
    },
    enableSorting: true,
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
    accessorKey: 'lastSeen',
    header: 'Last Seen',
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground tabular-nums">
        {formatRelativeTime(getValue() as string | null | undefined)}
      </span>
    ),
    enableSorting: true,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row, table }) => {
      const vehicle = row.original;
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
            <DropdownMenuItem onClick={() => meta?.onEdit?.(vehicle)}>
              <Edit className="mr-2 w-4 h-4" />
              Edit Vehicle
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => meta?.onChangeStatus?.(vehicle)}>
              <Settings className="mr-2 w-4 h-4" />
              Update Status
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => meta?.onDelete?.(vehicle)}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Trash className="mr-2 w-4 h-4" />
              Delete Vehicle
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
  },
];
