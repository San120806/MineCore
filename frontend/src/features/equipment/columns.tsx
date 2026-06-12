// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Equipment Table Column Definitions
// ─────────────────────────────────────────────────────────────────────────────

import type { ColumnDef } from '@tanstack/react-table';
import type { Equipment } from '@/types/equipment';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EQUIPMENT_TYPE_LABELS } from '@/constants/enums';
import { getHealthScoreColor, formatDate } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash, Heart } from 'lucide-react';

export const equipmentColumns: ColumnDef<Equipment, unknown>[] = [
  {
    accessorKey: 'name',
    header: 'Equipment',
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
      <span className="text-sm">
        {EQUIPMENT_TYPE_LABELS[getValue() as keyof typeof EQUIPMENT_TYPE_LABELS] ?? String(getValue())}
      </span>
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
    accessorKey: 'healthScore',
    header: 'Health Score',
    cell: ({ getValue }) => {
      const score = Number(getValue());
      const colors = getHealthScoreColor(score);
      return (
        <div className="flex items-center gap-2 min-w-28">
          <Progress
            value={score}
            className={`h-1.5 flex-1 ${colors.bg}`}
          />
          <span className={`text-xs font-semibold tabular-nums ${colors.text}`}>
            {score}%
          </span>
        </div>
      );
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
    accessorKey: 'nextMaintenanceDate',
    header: 'Next Maintenance',
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground tabular-nums">
        {formatDate(getValue() as string | null | undefined)}
      </span>
    ),
    enableSorting: true,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row, table }) => {
      const equipment = row.original;
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
            <DropdownMenuItem onClick={() => meta?.onEdit?.(equipment)}>
              <Edit className="mr-2 w-4 h-4" />
              Edit Equipment
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => meta?.onUpdateHealth?.(equipment)}>
              <Heart className="mr-2 w-4 h-4 text-rose-500" />
              Update Health
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => meta?.onDelete?.(equipment)}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Trash className="mr-2 w-4 h-4" />
              Delete Equipment
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
  },
];
