"use client";

// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Sidebar Navigation Items
// ─────────────────────────────────────────────────────────────────────────────

import {
  LayoutDashboard,
  MapPin,
  Truck,
  Radio,
  ShieldAlert,
  Cog,
  Wrench,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "./routes";
import { UserRole } from "@/types/enums";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  // If defined, only these roles can see this item
  allowedRoles?: UserRole[];
  badge?: string;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      {
        label: "Dashboard",
        href: ROUTES.DASHBOARD,
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        label: "Mining Sites",
        href: ROUTES.SITES,
        icon: MapPin,
      },
      {
        label: "Vehicles",
        href: ROUTES.VEHICLES,
        icon: Truck,
      },
      {
        label: "Sensors",
        href: ROUTES.SENSORS,
        icon: Radio,
      },
    ],
  },
  {
    title: "Safety & Maintenance",
    items: [
      {
        label: "Safety Alerts",
        href: ROUTES.SAFETY,
        icon: ShieldAlert,
        allowedRoles: [
          UserRole.ADMIN,
          UserRole.OPERATIONS_MANAGER,
          UserRole.SAFETY_OFFICER,
        ],
      },
      {
        label: "Equipment",
        href: ROUTES.EQUIPMENT,
        icon: Cog,
      },
      {
        label: "Maintenance",
        href: ROUTES.MAINTENANCE,
        icon: Wrench,
        allowedRoles: [
          UserRole.ADMIN,
          UserRole.OPERATIONS_MANAGER,
          UserRole.MAINTENANCE_ENGINEER,
        ],
      },
    ],
  },
  {
    title: "Intelligence",
    items: [
      {
        label: "Analytics",
        href: ROUTES.ANALYTICS,
        icon: BarChart3,
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        label: "Settings",
        href: ROUTES.SETTINGS,
        icon: Settings,
      },
    ],
  },
];

// Flat list for quick access
export const ALL_NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);
