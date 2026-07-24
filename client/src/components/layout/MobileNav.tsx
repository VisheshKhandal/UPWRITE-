import { BookOpen, Bookmark, CalendarDays, Layers3, PenLine } from "lucide-react";
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "../../utils/cn";

export const MobileNav = () => {
  const { pathname } = useLocation();
  const [pressedItem, setPressedItem] = useState<string | null>(null);
  const items = [
    { to: "/", label: "Today", icon: CalendarDays },
    { to: "/read", label: "Read", icon: BookOpen },
    { to: "/library", label: "Library", icon: Bookmark },
    { to: "/learn", label: "Learn", icon: Layers3 },
    { to: "/write", label: "Write", icon: PenLine }
  ];
  const activeIndex = Math.max(0, items.findIndex((item) => item.to === "/" ? pathname === "/" || pathname === "/today" : pathname === item.to || pathname.startsWith(`${item.to}/`)));

  const handleNavigationIntent = () => {
    document.documentElement.classList.add("is-mobile-nav-transitioning");
    window.setTimeout(() => document.documentElement.classList.remove("is-mobile-nav-transitioning"), 260);
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden" aria-label="Primary mobile navigation">
      <div className="relative mx-auto grid max-w-md grid-cols-5 rounded-full border border-ink-200/80 bg-white/88 p-1.5 shadow-[0_16px_42px_rgba(15,23,42,0.16)] backdrop-blur-xl dark:border-ink-800/90 dark:bg-ink-950/88 dark:shadow-[0_16px_42px_rgba(0,0,0,0.42)]">
        <span
          className="pointer-events-none absolute bottom-1.5 left-1.5 top-1.5 rounded-full bg-accent-50 shadow-sm transition-transform duration-[240ms] ease-in-out will-change-transform dark:bg-ink-800"
          style={{
            width: "calc((100% - 0.75rem) / 5)",
            transform: `translate3d(${activeIndex * 100}%, 0, 0)`
          }}
          aria-hidden="true"
        />
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            data-tour={item.label.toLowerCase()}
            onClick={handleNavigationIntent}
            onPointerDown={() => setPressedItem(item.to)}
            onPointerLeave={() => setPressedItem(null)}
            onPointerUp={() => setPressedItem(null)}
            onPointerCancel={() => setPressedItem(null)}
            className="group relative isolate flex min-h-[3.125rem] flex-col items-center justify-center gap-0.5 rounded-full px-1 text-[11px] font-semibold text-ink-500 outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-accent-500 dark:text-ink-400"
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("h-[1.125rem] w-[1.125rem] transition-[color,opacity,transform] duration-[240ms] ease-in-out", isActive ? "text-accent-700 opacity-100 dark:text-accent-300" : "text-ink-400 opacity-72 group-hover:text-ink-700 group-hover:opacity-90 dark:group-hover:text-ink-200", pressedItem === item.to && "scale-[0.96] opacity-85")} />
                <span className={cn("max-w-full truncate px-0.5 transition-[color,opacity] duration-[240ms] ease-in-out", isActive ? "text-ink-950 opacity-100 dark:text-ink-50" : "opacity-70 group-hover:opacity-90", pressedItem === item.to && "opacity-85")}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
