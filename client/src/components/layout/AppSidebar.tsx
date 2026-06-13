import {
  Bell,
  Bookmark,
  Home,
  Info,
  PenLine,
  Search,
  Settings,
  UserRound
} from "lucide-react";
import { NavLink, Link } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import { cn } from "../../utils/cn";
import { BrandLogo } from "../brand/BrandLogo";

const navItems = [
  { to: "/", label: "Feed", icon: Home },
  { to: "/search", label: "Explore", icon: Search },
  { to: "/write", label: "Write", icon: PenLine },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/saved", label: "Saved", icon: Bookmark },
  { to: "/settings/profile", label: "Settings", icon: Settings }
];

export const AppSidebar = () => {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-72 flex-col border-r border-ink-200 bg-ink-50 px-4 py-5 dark:border-ink-800 dark:bg-ink-950 lg:flex">
      
      {/* Logo */}
      <Link to="/">
        <BrandLogo className="px-2" />
      </Link>

      {/* Main Navigation */}
      <nav className="mt-8 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            data-tour={item.label.toLowerCase()}
            className={({ isActive }) =>
              cn(
                "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950 dark:text-ink-400 dark:hover:bg-ink-900 dark:hover:text-ink-50",
                isActive &&
                  "bg-white text-ink-950 shadow-panel dark:bg-ink-900 dark:text-ink-50"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Push everything below to bottom */}
      <div className="mt-auto">

        {/* About */}
        <div className="border-t border-ink-200 pt-4 dark:border-ink-800">
          <NavLink
            to="/about"
            className={({ isActive }) =>
              cn(
                "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950 dark:text-ink-400 dark:hover:bg-ink-900 dark:hover:text-ink-50",
                isActive &&
                  "bg-white text-ink-950 shadow-panel dark:bg-ink-900 dark:text-ink-50"
              )
            }
          >
            <Info className="h-4 w-4" />
            About
          </NavLink>
        </div>

        {/* Branding */}
        <div className="mt-4 px-3 text-xs text-ink-500">
          <p>Designed & Developed by</p>
          <p className="font-medium text-ink-700 dark:text-ink-300">
            Vishesh Khandal
          </p>
        </div>

        {/* User Card */}
        {user ? (
          <NavLink
            to={`/profile/${user.username}`}
            data-tour="profile"
            className="mt-4 flex items-center gap-3 rounded-lg border border-ink-200 bg-white p-3 text-sm dark:border-ink-800 dark:bg-ink-900"
          >
            <UserRound className="h-4 w-4 text-ink-500" />

            <span className="min-w-0">
              <span className="block truncate font-medium text-ink-950 dark:text-ink-50">
                {user.name}
              </span>

              <span className="block truncate text-ink-500">
                @{user.username}
              </span>
            </span>
          </NavLink>
        ) : null}
      </div>
    </aside>
  );
};
