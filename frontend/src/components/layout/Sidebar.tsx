'use client';

// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Sidebar Navigation Component
// ─────────────────────────────────────────────────────────────────────────────

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Pickaxe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_SECTIONS } from '@/constants/nav';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';

// ─────────────────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();

  return (
    <aside
      className={cn(
        'relative flex flex-col h-full border-r border-border bg-sidebar transition-all duration-300 ease-in-out shrink-0',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-5 border-b border-border',
          collapsed && 'justify-center px-0',
        )}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 shrink-0">
          <Pickaxe className="w-4 h-4 text-primary" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight overflow-hidden">
            <span className="text-sm font-bold text-foreground tracking-tight truncate">
              MineCore
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Operations
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2">
        {NAV_SECTIONS.map((section, sectionIdx) => {
          const visibleItems = section.items.filter(
            (item) => !item.allowedRoles || (user && item.allowedRoles.includes(user.role))
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={sectionIdx} className="mb-1">
              {/* Section title */}
              {section.title && !collapsed && (
                <p className="px-2 mb-1 mt-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  {section.title}
                </p>
              )}
              {section.title && collapsed && sectionIdx > 0 && (
                <Separator className="my-2 mx-auto w-8 opacity-40" />
              )}

              {/* Nav items */}
              {visibleItems.map((item) => {
                const isActive =
                  item.href === '/dashboard'
                    ? pathname === item.href
                    : pathname.startsWith(item.href);

                const navItem = (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-all duration-150',
                      'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      isActive
                        ? 'bg-primary/15 text-primary border border-primary/20'
                        : 'text-sidebar-foreground/70',
                      collapsed && 'justify-center px-0 w-10 h-10 mx-auto',
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <item.icon
                      className={cn(
                        'shrink-0 transition-colors',
                        collapsed ? 'w-5 h-5' : 'w-4 h-4',
                        isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                      )}
                    />
                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </Link>
                );

                if (collapsed) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger render={navItem} />
                      <TooltipContent side="right" sideOffset={8}>
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return navItem;
              })}
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-border">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            'flex items-center justify-center w-full rounded-md p-2',
            'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent',
            'transition-colors duration-150 text-xs gap-2',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
