import {
  BookOpen,
  Bookmark,
  CalendarDays,
  Layers3,
  Settings
} from "lucide-react";
import { motion } from "framer-motion";
import type { ComponentType } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { MOTION_DURATION, MOTION_EASE, useReducedMotionPreference } from "../../motion/system";
import { useInstallAction } from "../../pwa/InstallApp";
import { cn } from "../../utils/cn";
import { BrandLogo } from "../brand/BrandLogo";

export type SidebarItem = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  matchPaths?: string[];
  tourId?: string;
};

export const primaryNavItems: SidebarItem[] = [
  { to: "/", label: "Today", icon: CalendarDays, matchPaths: ["/", "/today"], tourId: "today" },
  { to: "/read", label: "Read", icon: BookOpen, matchPaths: ["/read"], tourId: "read" },
  { to: "/library", label: "Library", icon: Bookmark, matchPaths: ["/library", "/saved"], tourId: "library" },
  { to: "/learn", label: "Learn", icon: Layers3, matchPaths: ["/learn", "/review"], tourId: "learn" }
];

export const settingsNavItem: SidebarItem = {
  to: "/settings/profile",
  label: "Settings",
  icon: Settings,
  matchPaths: ["/settings"],
  tourId: "settings"
};

const isItemActive = (pathname: string, item: SidebarItem): boolean => {
  if (item.to === "/") {
    return pathname === "/" || pathname === "/today";
  }
  const prefixes = item.matchPaths ?? [item.to];
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
};

const navItemClass = (isActive: boolean) =>
  cn(
    "group/nav relative isolate flex h-10 w-full items-center gap-3 rounded-md border border-transparent px-3 text-sm font-medium transition-[background-color,border-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
    isActive
      ? "font-semibold text-content-primary"
      : "text-content-secondary hover:bg-surface-hover hover:text-content-primary"
  );

const iconClass = (isActive: boolean) =>
  cn(
    "relative z-10 h-4 w-4 shrink-0 transition-colors duration-150",
    isActive
      ? "text-content-accent"
      : "text-content-muted group-hover/nav:text-content-primary"
  );

const SidebarNavItem = ({
  item,
  pathname,
  onNavigate
}: {
  item: SidebarItem;
  pathname: string;
  onNavigate?: () => void;
}) => {
  const active = isItemActive(pathname, item);
  const reducedMotion = useReducedMotionPreference();

  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      data-tour={item.tourId ?? item.label.toLowerCase()}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={() => navItemClass(active)}
    >
      {active ? (
        <motion.span
          layoutId={reducedMotion ? undefined : "sidebar-active-indicator"}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: MOTION_DURATION.small, ease: MOTION_EASE }
          }
          className="pointer-events-none absolute inset-0 rounded-md border border-accent bg-accent-subtle before:absolute before:left-0 before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-accent"
          aria-hidden="true"
        />
      ) : null}
      <item.icon className={iconClass(active)} />
      <span className="relative z-10 min-w-0 truncate">{item.label}</span>
    </NavLink>
  );
};

const SidebarInstallButton = ({ onAction }: { onAction?: () => void }) => {
  const install = useInstallAction();
  if (install.mode === "hidden") return null;

  return (
    <div className="pt-1">
      <button
        type="button"
        onClick={() => {
          onAction?.();
          void install.onClick();
        }}
        disabled={install.disabled}
        data-tour="install-app"
        aria-haspopup={install.mode === "guide" ? "dialog" : undefined}
        className="group/install flex h-9 w-full items-center gap-3 rounded-md border border-transparent px-3 text-xs font-medium text-content-muted transition-colors duration-150 hover:bg-surface-hover hover:text-content-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-wait disabled:opacity-60"
      >
        <install.Icon className="h-3.5 w-3.5 shrink-0 text-content-muted transition-colors group-hover/install:text-content-secondary" />
        <span className="min-w-0 truncate">{install.label}</span>
      </button>
      {install.guide}
    </div>
  );
};

export const AppSidebar = () => {
  const { pathname } = useLocation();

  return (
    <aside
      className="fixed left-0 top-0 z-30 hidden h-screen w-56 flex-col border-r border-subtle bg-surface px-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] lg:flex"
      aria-label="Primary sidebar"
    >
      <div className="flex h-11 shrink-0 items-center px-2">
        <Link
          to="/"
          className="flex min-w-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          aria-label="Upwrite home"
        >
          <BrandLogo linked={false} size="md" showName />
        </Link>
      </div>

      <nav
        className="sidebar-scroll mt-6 flex min-h-0 flex-1 flex-col justify-between overflow-y-auto"
        aria-label="Main navigation"
      >
        <div className="space-y-1">
          {primaryNavItems.map((item) => (
            <SidebarNavItem key={item.to} item={item} pathname={pathname} />
          ))}
        </div>

        <div className="mt-6 space-y-1 border-t border-subtle pt-3">
          <SidebarNavItem item={settingsNavItem} pathname={pathname} />
          <SidebarInstallButton />
        </div>
      </nav>
    </aside>
  );
};
