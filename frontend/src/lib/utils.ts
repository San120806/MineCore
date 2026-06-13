import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

/** Merges Tailwind class names safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format ISO date string to locale readable format */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

/** Format ISO date string to datetime */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/** Relative time from now (e.g. "2 hours ago") */
export function formatRelativeTime(
  date: string | Date | null | undefined,
): string {
  if (!date) return "—";
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = then - now;
  const diffSec = diffMs / 1000;
  const diffMin = diffSec / 60;
  const diffHour = diffMin / 60;
  const diffDay = diffHour / 24;

  if (Math.abs(diffSec) < 60) return rtf.format(Math.round(diffSec), "second");
  if (Math.abs(diffMin) < 60) return rtf.format(Math.round(diffMin), "minute");
  if (Math.abs(diffHour) < 24) return rtf.format(Math.round(diffHour), "hour");
  return rtf.format(Math.round(diffDay), "day");
}

/**
 * Returns Tailwind text + bg color classes for a health score (0–100)
 * Green ≥ 70 | Yellow ≥ 40 | Red < 40
 */
export function getHealthScoreColor(score: number): {
  text: string;
  bg: string;
  border: string;
} {
  if (score >= 70) {
    return {
      text: "text-emerald-400",
      bg: "bg-emerald-500/15",
      border: "border-emerald-500/30",
    };
  }
  if (score >= 40) {
    return {
      text: "text-amber-400",
      bg: "bg-amber-500/15",
      border: "border-amber-500/30",
    };
  }
  return {
    text: "text-red-400",
    bg: "bg-red-500/15",
    border: "border-red-500/30",
  };
}

/** Format a number as a percentage string */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/** Format cost in USD */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value);
}

/** Truncate a string to a max length */
export function truncate(str: string, max: number): string {
  return str.length > max ? `${str.slice(0, max)}…` : str;
}

/** Get user initials from a full name */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
