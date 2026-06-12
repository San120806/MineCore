'use client';

import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Settings"
        subtitle="Manage your profile, preferences, and account"
      />

      {/* Profile */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Profile</h3>
        <Separator />
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Full Name</p>
            <div className="h-9 bg-muted/50 rounded border border-border" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Email</p>
            <div className="h-9 bg-muted/50 rounded border border-border" />
          </div>
        </div>
        <Button size="sm" variant="outline" disabled>
          Save Changes
        </Button>
      </section>

      {/* Theme */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Appearance</h3>
        <Separator />
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme('light')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors ${
              theme === 'light'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-border/80'
            }`}
          >
            <Sun className="w-4 h-4" />
            Light
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors ${
              theme === 'dark'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-border/80'
            }`}
          >
            <Moon className="w-4 h-4" />
            Dark
          </button>
        </div>
      </section>

      {/* Account */}
      <section className="rounded-lg border border-destructive/20 bg-destructive/5 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Danger Zone</h3>
        <p className="text-xs text-muted-foreground">
          Sign out of MineCore. You will need to sign in again to access the platform.
        </p>
        <Button variant="destructive" size="sm" id="signout-btn">
          Sign Out
        </Button>
      </section>
    </div>
  );
}
