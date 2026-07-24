import {
  Bell,
  BookOpen,
  Bookmark,
  CalendarDays,
  ChevronDown,
  Layers3,
  PanelLeftClose,
  PanelLeftOpen,
  PenLine,
  Settings,
  UserRound
} from "lucide-react";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import { cn } from "../../utils/cn";
import { BrandLogo } from "../brand/BrandLogo";

const primaryItems = [
  { to: "/", label: "Today", icon: CalendarDays },
  { to: "/read", label: "Read", icon: BookOpen },
  { to: "/write", label: "Write", icon: PenLine }
];

const knowledgeItems = [
  { to: "/library", label: "Library", icon: Bookmark },
  { to: "/learn", label: "Learn", icon: Layers3 }
];

const workspaceItems = [
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/studio", label: "Studio", icon: UserRound },
  { to: "/settings/profile", label: "Settings", icon: Settings }
];

type SidebarItem = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

type GroupKey = "primary" | "knowledge" | "workspace";
type CollapsedState = Record<GroupKey, boolean>;

const STORAGE_KEY = "upwrite.sidebar.collapsed.v2";
const defaultCollapsed: CollapsedState = { primary: false, knowledge: false, workspace: true };

const navItemClass = (isActive: boolean, collapsed: boolean) =>
  cn(
    "group/nav relative flex h-12 items-center gap-3 rounded-lg border border-transparent text-[0.95rem] font-semibold text-ink-600 transition-[background-color,border-color,color,box-shadow,transform,width,padding] duration-200 hover:-translate-y-px hover:bg-ink-100 hover:text-ink-950 focus-visible:ring-2 focus-visible:ring-accent-500 dark:text-ink-400 dark:hover:bg-ink-900 dark:hover:text-ink-50",
    collapsed ? "w-12 justify-center px-0" : "w-full px-3",
    isActive &&
      "border-accent-200/70 bg-accent-50/90 text-ink-950 shadow-panel ring-1 ring-accent-200/35 dark:border-accent-800/60 dark:bg-ink-900/90 dark:text-ink-50 dark:ring-accent-700/25",
    collapsed &&
      isActive &&
      "after:absolute after:left-1 after:top-1/2 after:h-5 after:w-1 after:-translate-y-1/2 after:rounded-full after:bg-accent-600 dark:after:bg-accent-300"
  );

const iconClass = (isActive: boolean) =>
  cn(
    "h-[1.05rem] w-[1.05rem] shrink-0 transition-colors duration-200",
    isActive
      ? "text-accent-700 dark:text-accent-300"
      : "text-ink-400 group-hover/nav:text-ink-700 dark:group-hover/nav:text-ink-200"
  );

const readStoredState = (): CollapsedState => {
  if (typeof window === "undefined") return defaultCollapsed;

  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Partial<CollapsedState>;
    return {
      primary: Boolean(parsed.primary),
      knowledge: Boolean(parsed.knowledge),
      workspace: parsed.workspace ?? true
    };
  } catch {
    return defaultCollapsed;
  }
};

const SidebarNavItem = ({ item, collapsed }: { item: SidebarItem; collapsed: boolean }) => (
  <NavLink
    to={item.to}
    end={item.to === "/"}
    data-tour={item.label.toLowerCase()}
    className={({ isActive }) => navItemClass(isActive, collapsed)}
    title={collapsed ? item.label : undefined}
    aria-label={collapsed ? item.label : undefined}
  >
    {({ isActive }) => (
      <>
        <item.icon className={iconClass(isActive)} />
        <span
          className={cn(
            "min-w-0 truncate transition-[opacity,transform,max-width] duration-200 ease-out",
            collapsed ? "max-w-0 -translate-x-1 opacity-0" : "max-w-40 translate-x-0 opacity-100"
          )}
        >
          {item.label}
        </span>
        {collapsed ? (
          <span className="pointer-events-none absolute left-[calc(100%+0.625rem)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-700 opacity-0 shadow-panel transition group-hover/nav:block group-hover/nav:opacity-100 group-focus-visible/nav:block group-focus-visible/nav:opacity-100 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-100">
            {item.label}
          </span>
        ) : null}
      </>
    )}
  </NavLink>
);

const SidebarGroup = ({
  id,
  label,
  items,
  collapsed,
  onToggle,
  collapsible = true
}: {
  id: GroupKey;
  label: string;
  items: SidebarItem[];
  collapsed: boolean;
  onToggle: (id: GroupKey) => void;
  collapsible?: boolean;
}) => (
  <section className={cn("space-y-1.5 transition-[margin] duration-200", collapsed ? "mt-1" : "")} aria-label={`${label} navigation`}>
    <button
      type="button"
      disabled={!collapsible}
      onClick={() => onToggle(id)}
      className={cn(
        "group/header flex h-7 w-full items-center justify-between overflow-hidden rounded-md px-1.5 text-left text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-ink-500/85 transition-[color,opacity,height,margin] hover:text-ink-700 focus-visible:ring-2 focus-visible:ring-accent-500 disabled:cursor-default disabled:hover:text-ink-500/85 dark:text-ink-500 dark:hover:text-ink-300 dark:disabled:hover:text-ink-500",
        !collapsible && "pointer-events-none"
      )}
      aria-expanded={!collapsed}
      aria-controls={`sidebar-group-${id}`}
    >
      <span>{label}</span>
      {collapsible ? (
        <span className="grid h-5 w-5 place-items-center rounded-md text-ink-400/80 transition-colors group-hover/header:bg-ink-100 group-hover/header:text-ink-600 dark:text-ink-600 dark:group-hover/header:bg-ink-900 dark:group-hover/header:text-ink-300">
          <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", collapsed && "-rotate-90")} />
        </span>
      ) : null}
    </button>
    <div
      id={`sidebar-group-${id}`}
      className={cn(
        "grid overflow-hidden transition-[grid-template-rows,opacity] duration-200 ease-out",
        collapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
      )}
    >
      <div className="min-h-0 space-y-1">
        {items.map((item) => <SidebarNavItem key={item.to} item={item} collapsed={false} />)}
      </div>
    </div>
  </section>
);

export const AppSidebar = ({
  collapsed: shellCollapsed,
  onCollapsedChange
}: {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}) => {
  const user = useAppSelector((state) => state.auth.user);
  const [collapsed, setCollapsed] = useState<CollapsedState>(() => readStoredState());
  const groups = useMemo(
    () => [
      { id: "primary" as const, label: "Primary", items: primaryItems, collapsible: true },
      { id: "knowledge" as const, label: "Knowledge", items: knowledgeItems, collapsible: true },
      {
        id: "workspace" as const,
        label: "Workspace",
        items: workspaceItems.map((item) => item.to === "/studio" ? { ...item, to: user ? "/studio" : "/login" } : item),
        collapsible: true
      }
    ],
    [user]
  );

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsed));
  }, [collapsed]);

  const toggleGroup = (id: GroupKey) => {
    setCollapsed((current) => ({ ...current, [id]: !current[id] }));
  };

  return (
    <aside className={cn("fixed left-0 top-0 z-30 hidden h-screen flex-col overflow-visible border-r border-ink-200/80 bg-ink-50 py-6 transition-[width,padding] duration-300 ease-out dark:border-ink-800 dark:bg-ink-950 lg:flex", shellCollapsed ? "w-[5.5rem] px-5" : "w-72 px-4")}>
      <div className={cn("flex h-12 shrink-0 items-center gap-2", shellCollapsed ? "justify-center" : "justify-between")}>
        <Link to="/" className={cn("flex min-w-0 items-center rounded-lg focus-visible:ring-2 focus-visible:ring-accent-500", shellCollapsed ? "justify-center" : "px-2")} aria-label="Upwrite home">
          <BrandLogo linked={false} size={shellCollapsed ? "sm" : "md"} showName={!shellCollapsed} />
        </Link>
        <button
          type="button"
          onClick={() => onCollapsedChange(!shellCollapsed)}
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-transparent text-ink-500 transition-[background-color,border-color,color,transform] duration-200 hover:-translate-y-px hover:border-ink-200 hover:bg-white hover:text-ink-900 focus-visible:ring-2 focus-visible:ring-accent-500 dark:text-ink-500 dark:hover:border-ink-800 dark:hover:bg-ink-900 dark:hover:text-ink-100",
            shellCollapsed && "absolute -right-4 top-7 border-ink-200 bg-white shadow-panel dark:border-ink-800 dark:bg-ink-900"
          )}
          aria-label={shellCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={shellCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={shellCollapsed}
        >
          {shellCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <nav className={cn("sidebar-scroll mt-9 flex min-h-0 flex-1 flex-col transition-[gap,padding] duration-300", shellCollapsed ? "items-center gap-3 overflow-visible pr-0" : "gap-5 overflow-y-auto pr-1")} aria-label="Sidebar">
        {shellCollapsed
          ? groups.map((group) => (
              <section key={group.id} className="grid gap-1.5" aria-label={`${group.label} navigation`}>
                {group.items.map((item) => <SidebarNavItem key={item.to} item={item} collapsed />)}
              </section>
            ))
          : groups.map((group) => (
              <SidebarGroup
                key={group.id}
                id={group.id}
                label={group.label}
                items={group.items}
                collapsed={collapsed[group.id]}
                collapsible={group.collapsible}
                onToggle={toggleGroup}
              />
            ))}
      </nav>
    </aside>
  );
};
