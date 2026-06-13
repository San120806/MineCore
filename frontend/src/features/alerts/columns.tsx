// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Alerts Table Column Definitions
// ─────────────────────────────────────────────────────────────────────────────

import type { ColumnDef } from "@tanstack/react-table";
import type { SafetyAlert } from "@/types/alert";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDateTime } from "@/lib/utils";
import { truncate } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash, CheckCheck, ShieldCheck } from "lucide-react";

export const alertColumns: ColumnDef<SafetyAlert, unknown>[] = [
  {
    accessorKey: "severity",
    header: "Severity",
    cell: ({ getValue }) => <StatusBadge value={String(getValue())} />,
    enableSorting: true,
  },
  {
    accessorKey: "title",
    header: "Alert",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="font-medium text-sm truncate max-w-xs">
          {row.original.title}
        </p>
        <p className="text-xs text-muted-foreground truncate max-w-xs">
          {truncate(row.original.description, 60)}
        </p>
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => <StatusBadge value={String(getValue())} />,
    enableSorting: true,
  },
  {
    accessorKey: "site",
    header: "Site",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.site?.name ?? "—"}
      </span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "raisedBy",
    header: "Raised By",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.raisedBy?.name ?? "—"}
      </span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "raisedAt",
    header: "Raised At",
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground tabular-nums">
        {formatDateTime(getValue() as string)}
      </span>
    ),
    enableSorting: true,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row, table }) => {
      const alert = row.original;
      const meta = table.options.meta as any;
      const isOpen = alert.status === "OPEN";
      const isAcknowledged = alert.status === "ACKNOWLEDGED";
      const isResolved = alert.status === "RESOLVED";

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
            {isOpen && (
              <DropdownMenuItem onClick={() => meta?.onAcknowledge?.(alert)}>
                <CheckCheck className="mr-2 w-4 h-4" />
                Acknowledge
              </DropdownMenuItem>
            )}
            {(isOpen || isAcknowledged) && (
              <DropdownMenuItem onClick={() => meta?.onResolve?.(alert)}>
                <ShieldCheck className="mr-2 w-4 h-4" />
                Resolve Alert
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => meta?.onDelete?.(alert)}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Trash className="mr-2 w-4 h-4" />
              Delete Alert
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
  },
];
