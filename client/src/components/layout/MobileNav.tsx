import { Bell, Bookmark, Home, PenLine, Search } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../../utils/cn";

export const MobileNav = () => {
  const items = [
    { to: "/", label: "Feed", icon: Home },
    { to: "/search", label: "Explore", icon: Search },
    { to: "/write", label: "Write", icon: PenLine },
    { to: "/saved", label: "Saved", icon: Bookmark },
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
              "flex h-12 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium text-ink-500",
              isActive && "bg-ink-100 text-ink-950 dark:bg-ink-900 dark:text-ink-50"
            )
          }
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
};
