"use client";

// ─────────────────────────────────────────────────────────────────────────────
// MineCore — AppProviders
// Combines all context providers into a single tree.
// Add new providers here to make them globally available.
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      <TooltipProvider delay={200}>
        <AuthProvider>
          {children}
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
