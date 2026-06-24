import { Bell, Bookmark, Home, PenLine, Search } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../../utils/cn";

export const MobileNav = () => {
  const items = [
    { to: "/", label: "Home", icon: Home },
    { to: "/search", label: "Explore", icon: Search },
    { to: "/write", label: "Write", icon: PenLine },
    { to: "/saved", label: "Bookmarks", icon: Bookmark },
    { to: "/notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-ink-200 bg-white/95 px-2 py-2 backdrop-blur dark:border-ink-800 dark:bg-ink-950/95 lg:hidden">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          data-tour={item.label.toLowerCase()}
          className={({ isActive }) =>
            cn(
              "group flex h-12 flex-col items-center justify-center gap-1 rounded-lg border border-transparent text-[11px] font-semibold text-ink-500 transition-all duration-200",
              isActive && "border-accent-200/70 bg-accent-50/80 text-ink-950 ring-1 ring-accent-200/40 dark:border-accent-800/60 dark:bg-ink-900/80 dark:text-ink-50 dark:ring-accent-700/25"
            )
          }
        >
          {({ isActive }) => (
            <>
              <item.icon className={cn("h-4 w-4 transition-colors", isActive ? "text-accent-700 dark:text-accent-300" : "text-ink-400 group-hover:text-ink-700 dark:group-hover:text-ink-200")} />
              <span className="max-w-full truncate px-0.5">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};
