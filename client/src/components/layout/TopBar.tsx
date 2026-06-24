import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, HelpCircle, Lock, LogOut, Moon, Palette, PenLine, Search, Settings, Sun, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { logout } from "../../features/auth/authSlice";
import { useLogoutUserMutation } from "../../features/auth/authApi";
import { pushToast, toggleTheme } from "../../features/ui/uiSlice";
import { SearchDiscovery } from "../search/SearchDiscovery";
import { Button } from "../ui/Button";
import { BrandLogo } from "../brand/BrandLogo";
import { Avatar } from "../ui/Avatar";

export const TopBar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const theme = useAppSelector((state) => state.ui.theme);
  const user = useAppSelector((state) => state.auth.user);
  const [logoutUser, logoutState] = useLogoutUserMutation();

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      if (window.innerWidth < 1024) return;
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen || window.innerWidth >= 1024) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  const onLogout = async () => {
    try {
      await logoutUser().unwrap();
    } catch {
      // Local logout still keeps the UI honest if the API is unavailable.
    }
    dispatch(logout());
    dispatch(pushToast({ title: "Logged out", tone: "info" }));
    setMenuOpen(false);
    navigate("/login");
  };

  const go = (to: string) => {
    setMenuOpen(false);
    navigate(to);
  };

  const menuItems = user
    ? [
        { label: "My Profile", icon: UserRound, action: () => go(`/profile/${user.username}`), tour: "profile" },
        { label: "Settings", icon: Settings, action: () => go("/settings/profile"), tour: "settings" },
        { label: "Appearance", icon: Palette, action: () => go("/settings/profile?section=appearance") },
        { label: "Security", icon: Lock, action: () => go("/settings/profile?section=security") },
        { label: "Saved Items", icon: Bookmark, action: () => go("/saved") },
        { label: "Help & Support", icon: HelpCircle, action: () => go("/about") }
      ]
    : [];

  const MenuContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <div className={`flex items-center justify-between gap-3 ${mobile ? "border-b border-ink-200 pb-4 dark:border-ink-800" : "px-2 pb-3"}`}>
        <div className="flex min-w-0 items-center gap-3">
          <Avatar src={user?.avatar?.url ?? user?.avatar?.secureUrl} name={user?.name} size={mobile ? "md" : "sm"} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink-950 dark:text-ink-50">{user?.name}</p>
            <p className="truncate text-sm text-ink-500">@{user?.username}</p>
          </div>
        </div>
        {mobile ? <Button variant="ghost" size="icon" onClick={() => setMenuOpen(false)} aria-label="Close account menu"><X className="h-4 w-4" /></Button> : null}
      </div>
      <div className="mt-3 grid gap-1">
        {menuItems.map((item) => (
          <button key={item.label} type="button" data-tour={item.tour} onClick={item.action} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-ink-700 transition hover:bg-ink-100 focus-visible:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-900 dark:focus-visible:bg-ink-900">
            <item.icon className="h-4 w-4 text-ink-500" />
            {item.label}
          </button>
        ))}
        <button type="button" onClick={() => dispatch(toggleTheme())} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-ink-700 transition hover:bg-ink-100 focus-visible:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-900 dark:focus-visible:bg-ink-900">
          {theme === "dark" ? <Sun className="h-4 w-4 text-ink-500" /> : <Moon className="h-4 w-4 text-ink-500" />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        <button type="button" onClick={onLogout} disabled={logoutState.isLoading} className="mt-2 flex min-h-11 items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:hover:bg-red-950/20">
          <LogOut className="h-4 w-4" />
          {logoutState.isLoading ? "Logging out..." : "Logout"}
        </button>
      </div>
    </>
  );

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-ink-200 bg-ink-50/90 backdrop-blur dark:border-ink-800 dark:bg-ink-950/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <BrandLogo showName={false} size="sm" className="lg:hidden" />
          <SearchDiscovery className="relative hidden max-w-md flex-1 md:block" />
          <div className="flex items-center gap-2 md:ml-auto">
            <Button variant="secondary" size="icon" className="md:hidden" onClick={() => navigate("/search")} aria-label="Search"><Search className="h-4 w-4" /></Button>
            <Button variant="secondary" size="icon" onClick={() => dispatch(toggleTheme())} aria-label="Toggle theme">{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button>
            <Button variant="primary" className="hidden sm:inline-flex" onClick={() => navigate("/write")}>
              <span data-tour="write" className="inline-flex items-center gap-2"><PenLine className="h-4 w-4" />Write</span>
            </Button>
            {user ? (
              <div className="relative" ref={menuRef}>
                <button type="button" onClick={() => setMenuOpen((open) => !open)} className="rounded-full" aria-haspopup="menu" aria-expanded={menuOpen} aria-label="Open account menu">
                  <Avatar src={user.avatar?.url ?? user.avatar?.secureUrl} name={user.name} size="sm" />
                </button>
                <AnimatePresence>
                  {menuOpen ? (
                    <motion.div
                      className="absolute right-0 top-12 z-50 hidden w-72 rounded-lg border border-ink-200 bg-white p-3 shadow-2xl dark:border-ink-800 dark:bg-ink-950 lg:block"
                      role="menu"
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.16 }}
                    >
                      <MenuContent />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            ) : (
              <Button variant="secondary" onClick={() => navigate("/login")}>Log in</Button>
            )}
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen ? (
          <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Account menu">
            <motion.button type="button" className="absolute inset-0 bg-ink-950/55 backdrop-blur-sm" aria-label="Close account menu" onClick={() => setMenuOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.22 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 90 || info.velocity.y > 700) setMenuOpen(false);
              }}
              className="absolute inset-x-0 bottom-0 max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-t-2xl border border-ink-200 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl dark:border-ink-800 dark:bg-ink-950"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 34 }}
            >
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-ink-200 dark:bg-ink-800" />
              <MenuContent mobile />
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
};
