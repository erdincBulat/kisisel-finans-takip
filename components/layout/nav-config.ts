import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Receipt,
  FileStack,
  Wallet,
  BarChart3,
  Shapes,
  RefreshCw,
  CalendarClock,
  PiggyBank,
  History,
  Settings,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type NavGroup = {
  label: string | null;
  items: NavItem[];
};

/** Sidebar navigasyon yapısı — spec §45. */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Finans",
    items: [
      { label: "İşlemler", href: "/transactions", icon: Receipt },
      { label: "Ekstreler", href: "/statements", icon: FileStack },
      { label: "Gelirler", href: "/income", icon: Wallet },
    ],
  },
  {
    label: "Analiz",
    items: [
      { label: "Raporlar", href: "/reports", icon: BarChart3 },
      { label: "Kategoriler", href: "/categories", icon: Shapes },
      { label: "Abonelikler", href: "/subscriptions", icon: RefreshCw },
      { label: "Taksitler", href: "/installments", icon: CalendarClock },
      { label: "Geçmiş", href: "/history", icon: History },
    ],
  },
  {
    label: "Planlama",
    items: [{ label: "Bütçe", href: "/budgets", icon: PiggyBank }],
  },
  {
    label: null,
    items: [{ label: "Ayarlar", href: "/settings", icon: Settings }],
  },
];
