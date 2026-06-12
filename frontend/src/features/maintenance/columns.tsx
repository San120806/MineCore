// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Maintenance Table Column Definitions
// ─────────────────────────────────────────────────────────────────────────────

import type { ColumnDef } from '@tanstack/react-table';
import type { MaintenanceRecord } from '@/types/maintenance';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MAINTENANCE_TYPE_LABELS } from '@/constants/enums';
import { formatDate, formatCurrency, truncate } from '@/lib/utils';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash, CheckSquare } from 'lucide-react';

export const maintenanceColumns: ColumnDef<MaintenanceRecord, unknown>[] = [
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ getValue }) => (
      <StatusBadge value={String(getValue())} />
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'issue',
    header: 'Issue',
    cell: ({ getValue }) => (
      <span className="text-sm">{truncate(String(getValue()), 60)}</span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'equipment',
    header: 'Equipment',
    cell: ({ row }) => (
      <div>
        <p className="text-sm font-medium">{row.original.equipment?.name ?? '—'}</p>
        <p className="text-xs text-muted-foreground">{row.original.equipment?.site?.name ?? ''}</p>
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => <StatusBadge value={String(getValue())} />,
    enableSorting: true,
  },
  {
    accessorKey: 'performedBy',
    header: 'Technician',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.performedBy?.name ?? '—'}</span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'maintenanceDate',
    header: 'Date',
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground tabular-nums">
        {formatDate(getValue() as string)}
      </span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'cost',
    header: 'Cost',
    cell: ({ getValue }) => (
      <span className="text-sm tabular-nums">{formatCurrency(getValue() as number | null | undefined)}</span>
    ),
    enableSorting: true,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row, table }) => {
      const record = row.original;
      const meta = table.options.meta as any;
      const isCompleted = record.status === 'COMPLETED';

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
            {!isCompleted && (
              <>
                <DropdownMenuItem onClick={() => meta?.onEdit?.(record)}>
                  <Edit className="mr-2 w-4 h-4" />
                  Edit Log
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => meta?.onComplete?.(record)}>
                  <CheckSquare className="mr-2 w-4 h-4 text-emerald-500" />
                  Complete Repair
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem
              onClick={() => meta?.onDelete?.(record)}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Trash className="mr-2 w-4 h-4" />
              Delete Record
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
  },
];
