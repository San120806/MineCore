'use client';

// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Top Navigation Bar
// ─────────────────────────────────────────────────────────────────────────────

import { usePathname } from 'next/navigation';
import { Bell, Sun, Moon, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';
import { ALL_NAV_ITEMS } from '@/constants/nav';
import { useAuth } from '@/hooks/useAuth';

// ─── Derive page title from pathname ─────────────────────────────────────────

function usePageTitle(pathname: string): string {
  const match = ALL_NAV_ITEMS.find((item) =>
    item.href === '/dashboard'
      ? pathname === item.href
      : pathname.startsWith(item.href),
  );
  return match?.label ?? 'MineCore';
}

// ─────────────────────────────────────────────────────────────────────────────

export function Navbar() {
  const pathname = usePathname();
  const pageTitle = usePageTitle(pathname);
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  const openAlerts: number = 3; // TODO (Session 3): from dashboard API

  if (!user) return null;

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-border bg-background/95 backdrop-blur-sm shrink-0 z-10">
      {/* Page Title */}
      <div className="flex items-center gap-2">
        <h1 className="text-sm font-semibold text-foreground">{pageTitle}</h1>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
              />
            }
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          </TooltipTrigger>
          <TooltipContent>Toggle theme</TooltipContent>
        </Tooltip>

        {/* Notification bell */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8 text-muted-foreground hover:text-foreground"
                aria-label="Notifications"
              />
            }
          >
            <Bell className="h-4 w-4" />
            {openAlerts > 0 && (
              <span
                className={cn(
                  'absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center',
                  'rounded-full bg-destructive text-[10px] font-bold text-white',
                )}
              >
                {openAlerts > 9 ? '9+' : openAlerts}
              </span>
            )}
          </TooltipTrigger>
          <TooltipContent>
            {openAlerts} open alert{openAlerts !== 1 ? 's' : ''}
          </TooltipContent>
        </Tooltip>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="flex items-center gap-2 h-8 px-2 text-muted-foreground hover:text-foreground"
                aria-label="User menu"
              />
            }
          >
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px] bg-primary/20 text-primary font-semibold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:block text-xs font-medium text-foreground max-w-28 truncate">
              {user.name}
            </span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                <Badge variant="secondary" className="mt-1 text-[10px] w-fit">
                  {user.role.replace('_', ' ')}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
