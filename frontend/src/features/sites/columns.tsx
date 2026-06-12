// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Sites Table Column Definitions (TanStack Table)
// ─────────────────────────────────────────────────────────────────────────────

import type { ColumnDef } from '@tanstack/react-table';
import type { MiningSite } from '@/types/site';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash } from 'lucide-react';

export const siteColumns: ColumnDef<MiningSite, unknown>[] = [
  {
    accessorKey: 'name',
    header: 'Site Name',
    cell: ({ row }) => (
      <Link
        href={ROUTES.SITE_DETAIL(row.original.id)}
        className="font-medium text-primary hover:underline underline-offset-2"
      >
        {row.original.name}
      </Link>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'location',
    header: 'Location',
    cell: ({ getValue }) => (
      <span className="text-muted-foreground text-sm">{String(getValue())}</span>
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
    accessorKey: 'workerCount',
    header: 'Workers',
    cell: ({ getValue }) => (
      <span className="tabular-nums">{String(getValue())}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'managerName',
    header: 'Manager',
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{String(getValue() ?? '—')}</span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ getValue }) => (
      <span className="text-muted-foreground text-xs tabular-nums">
        {formatDate(String(getValue()))}
      </span>
    ),
    enableSorting: true,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row, table }) => {
      const site = row.original;
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
            <DropdownMenuItem onClick={() => meta?.onEdit?.(site)}>
              <Edit className="mr-2 w-4 h-4" />
              Edit Site
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => meta?.onDelete?.(site)}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Trash className="mr-2 w-4 h-4" />
              Delete Site
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
  },
];
