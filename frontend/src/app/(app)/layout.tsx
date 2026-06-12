// ─────────────────────────────────────────────────────────────────────────────
// App Group Layout — Sidebar + Navbar shell for all authenticated pages
// Protected route guard will be wired in Session 2.
// ─────────────────────────────────────────────────────────────────────────────

import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { ProtectedRoute } from '@/features/auth/guards/ProtectedRoute';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Fixed left sidebar */}
        <Sidebar />

        {/* Main content area */}
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          {/* Top navigation bar */}
          <Navbar />

          {/* Scrollable page content */}
          <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
