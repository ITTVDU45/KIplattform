import {
  LayoutDashboard,
  Key,
  BarChart3,
  FileText,
  HardDrive,
  Store,
  Bot,
  Puzzle,
  Workflow,
  HeadphonesIcon,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  titleKey: string; // i18n key
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavSection {
  titleKey: string; // i18n key
  items: NavItem[];
}

export const navConfig: NavSection[] = [
  {
    titleKey: "nav.sections.overview",
    items: [
      {
        titleKey: "nav.items.dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        titleKey: "nav.items.marketplace",
        href: "/marketplace",
        icon: Store,
      },
      {
        titleKey: "nav.items.assistantMode",
        href: "/assistant-mode",
        icon: Bot,
      },
    ],
  },
  {
    titleKey: "nav.sections.development",
    items: [
      {
        titleKey: "nav.items.apiKeys",
        href: "/api-keys",
        icon: Key,
      },
      {
        titleKey: "nav.items.usage",
        href: "/usage",
        icon: BarChart3,
      },
      {
        titleKey: "nav.items.logs",
        href: "/logs",
        icon: FileText,
      },
      {
        titleKey: "nav.items.storage",
        href: "/storage",
        icon: HardDrive,
      },
    ],
  },
  {
    titleKey: "nav.sections.account",
    items: [
      {
        titleKey: "nav.items.integrations",
        href: "/integrations",
        icon: Puzzle,
      },
      {
        titleKey: "nav.items.workflows",
        href: "/workflows",
        icon: Workflow,
      },
      {
        titleKey: "nav.items.support",
        href: "/support",
        icon: HeadphonesIcon,
      },
      {
        titleKey: "nav.items.settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
];
