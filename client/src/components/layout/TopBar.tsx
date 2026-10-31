import { AnimatePresence, motion, useDragControls } from "framer-motion";
import {
  Bell,
  HelpCircle,
  Info,
  LayoutGrid,
  LogOut,
  Moon,
  PenLine,
  Search,
  Settings,
  Sun,
  UserRound,
  X
} from "lucide-react";
import { forwardRef, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { logout } from "../../features/auth/authSlice";
import { useLogoutUserMutation } from "../../features/auth/authApi";
import { useNotificationsQuery } from "../../features/notifications/notificationsApi";
import { baseApi } from "../../services/baseApi";
import { pushToast, toggleTheme } from "../../features/ui/uiSlice";
import { useBodyScrollLock, useModalFocusTrap } from "../../motion/overlays";
import {
  getBackdropVariants,
  getBottomSheetVariants,
  getPopoverVariants,
  useReducedMotionPreference
} from "../../motion/system";
import { NotificationDropdown } from "../notifications/NotificationDropdown";
import { SearchDiscovery } from "../search/SearchDiscovery";
import { Button } from "../ui/Button";
import { BrandLogo } from "../brand/BrandLogo";
import { Avatar } from "../ui/Avatar";
import { cn } from "../../utils/cn";
import { clearUserScopedStorage } from "../../utils/userLocalData";

interface UtilityIconButtonProps {
  label: string;
  tooltip?: string;
  active?: boolean;
  onClick: () => void;
  ariaControls?: string;
  ariaExpanded?: boolean;
  ariaHasPopup?: "dialog" | "menu" | "listbox";
  tourId?: string;
  className?: string;
  children: ReactNode;
}

const UtilityIconButton = forwardRef<HTMLButtonElement, UtilityIconButtonProps>(
  (
    {
      label,
      tooltip,
      active = false,
      onClick,
      ariaControls,
      ariaExpanded,
      ariaHasPopup,
      tourId,
      className,
      children
    },
    ref
  ) => {
    const tip = tooltip ?? label;
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        aria-label={label}
        title={tip}
        aria-controls={ariaControls}
        aria-expanded={ariaExpanded}
        aria-haspopup={ariaHasPopup}
        data-tour={tourId}
        className={cn(
          "group/util relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-transparent text-content-muted transition-[background-color,border-color,color] duration-150 hover:bg-surface-hover hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
          active && "border-accent bg-accent-subtle text-content-accent",
          className
        )}
      >
        {children}
        <span
          role="tooltip"
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-8 left-1/2 z-50 hidden -translate-x-1/2 whitespace-nowrap rounded-sm border border-subtle bg-surface-elevated px-2 py-0.5 text-[11px] font-medium text-content-primary opacity-0 shadow-panel transition-opacity duration-150 group-hover/util:opacity-100 group-focus-visible/util:opacity-100 lg:block"
        >
          {tip}
        </span>
      </button>
    );
  }
);
UtilityIconButton.displayName = "UtilityIconButton";

const MobileSearchDialog = ({
  id = "mobile-search-dialog",
  open,
  onClose
}: {
  id?: string;
  open: boolean;
  onClose: () => void;
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  useBodyScrollLock(open);
  const { pathname, search } = useLocation();
  const previousLocationRef = useRef(`${pathname}${search}`);

  useEffect(() => {
    const currentLocation = `${pathname}${search}`;
    if (previousLocationRef.current !== currentLocation) {
      previousLocationRef.current = currentLocation;
      if (open) onClose();
    }
  }, [pathname, search, open, onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || "closedBy" in HTMLDialogElement.prototype) return;

    const outside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    let pressedOutside = false;
    const onPointerDown = (e: PointerEvent) => {
      pressedOutside = outside(e);
    };
    const onPointerUp = (e: PointerEvent) => {
      if (pressedOutside && outside(e)) dialog.close();
    };
    dialog.addEventListener("pointerdown", onPointerDown);
    dialog.addEventListener("pointerup", onPointerUp);
    return () => {
      dialog.removeEventListener("pointerdown", onPointerDown);
      dialog.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <dialog
      id={id}
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby={`${id}-title`}
      {...({ closedby: "any" } as Record<string, string>)}
      className="m-0 mb-auto mt-[calc(0.5rem+env(safe-area-inset-top))] mx-auto w-[min(36rem,calc(100vw-1.5rem))] max-w-none overflow-visible rounded-lg border border-subtle bg-surface p-3 text-content-primary shadow-elevated md:hidden"
    >
      <div className="flex items-center justify-between gap-2 pb-2.5">
        <h2 id={`${id}-title`} className="text-xs font-semibold text-content-secondary">
          Search Upwrite
        </h2>
        <form method="dialog">
          <button
            type="submit"
            aria-label="Close search"
            title="Close search"
            className="grid h-8 w-8 place-items-center rounded-md text-content-muted transition-colors hover:bg-surface-hover hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
      </div>
      {open ? (
        <SearchDiscovery
          className="relative w-full"
          autoFocus
          defaultOpen
          onAfterNavigate={onClose}
        />
      ) : null}
    </dialog>,
    document.body
  );
};

export const TopBar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const bellRef = useRef<HTMLButtonElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [desktopSearchCloseSignal, setDesktopSearchCloseSignal] = useState(0);
  const theme = useAppSelector((state) => state.ui.theme);
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.accessToken);
  const [logoutUser, logoutState] = useLogoutUserMutation();
  const reducedMotion = useReducedMotionPreference();
  const mobileSheetDragControls = useDragControls();
  const isMobileMenuOpen = menuOpen && typeof window !== "undefined" && window.innerWidth < 1024;
  useBodyScrollLock(isMobileMenuOpen);
  const mobileMenuSheetRef = useModalFocusTrap<HTMLDivElement>(isMobileMenuOpen, () => setMenuOpen(false));
  const popoverVariants = getPopoverVariants(reducedMotion, "down");
  const backdropVariants = getBackdropVariants(reducedMotion);
  const bottomSheetVariants = getBottomSheetVariants(reducedMotion);

  const handleThemeToggle = () => {
    if (typeof document !== "undefined" && !reducedMotion) {
      document.documentElement.dataset.themeTransitioning = "true";
      window.setTimeout(() => {
        delete document.documentElement.dataset.themeTransitioning;
      }, 220);
    }
    dispatch(toggleTheme());
  };

  const { data: notifications = [] } = useNotificationsQuery(
    { limit: 12 },
    { skip: !user || !token }
  );
  const unreadCount = user
    ? typeof notifications.unreadCount === "number"
      ? notifications.unreadCount
      : notifications.filter((item) => !item.readAt).length
    : 0;

  const closeDesktopSearch = () => {
    setDesktopSearchCloseSignal((signal) => signal + 1);
  };

  const openMobileSearch = () => {
    setMenuOpen(false);
    setNotificationsOpen(false);
    setSearchOpen(true);
  };

  const toggleNotifications = () => {
    setMenuOpen(false);
    setSearchOpen(false);
    closeDesktopSearch();
    setNotificationsOpen((open) => !open);
  };

  const toggleAccountMenu = () => {
    setNotificationsOpen(false);
    setSearchOpen(false);
    closeDesktopSearch();
    setMenuOpen((open) => !open);
  };

  const handleDesktopSearchOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setMenuOpen(false);
      setNotificationsOpen(false);
    }
  };

  useEffect(() => {
    setMenuOpen(false);
    setNotificationsOpen(false);
    closeDesktopSearch();
  }, [pathname]);

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

  const onLogout = async () => {
    try {
      await logoutUser().unwrap();
    } catch {
      // Local logout still keeps the UI honest if the API is unavailable.
    }
    dispatch(logout());
    dispatch(baseApi.util.resetApiState());
    clearUserScopedStorage();
    dispatch(pushToast({ title: "Logged out", tone: "info" }));
    setMenuOpen(false);
    navigate("/login");
  };

  const go = (to: string) => {
    setMenuOpen(false);
    navigate(to);
  };

  type AccountMenuItem = {
    label: string;
    icon: typeof UserRound;
    action: () => void;
    tour?: string;
  };

  const getMenuItems = (mobile: boolean): AccountMenuItem[][] => {
    if (!user) return [];
    const primaryGroup: AccountMenuItem[] = [
      { label: "Profile", icon: UserRound, action: () => go(`/profile/${user.username}`), tour: "profile" },
      { label: "Studio", icon: LayoutGrid, action: () => go("/studio"), tour: "studio" }
    ];
    if (mobile) {
      primaryGroup.push({
        label: "Settings",
        icon: Settings,
        action: () => go("/settings/profile"),
        tour: "settings"
      });
    }
    return [
      primaryGroup,
      [
        { label: "About Upwrite", icon: Info, action: () => go("/about") },
        { label: "Help Center", icon: HelpCircle, action: () => go("/help") }
      ]
    ];
  };

  const MenuContent = ({ mobile = false }: { mobile?: boolean }) => {
    const groups = getMenuItems(mobile);
    return (
      <>
        <div className={cn("flex items-center justify-between gap-3", mobile ? "border-b border-subtle pb-4" : "px-2 pb-3")}>
          <div className="flex min-w-0 items-center gap-3">
            <Avatar src={user?.avatar?.url ?? user?.avatar?.secureUrl} name={user?.name} size={mobile ? "md" : "sm"} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-content-primary">{user?.name}</p>
              <p className="truncate text-xs text-content-muted">@{user?.username}</p>
            </div>
          </div>
          {mobile ? (
            <Button variant="ghost" size="icon" onClick={() => setMenuOpen(false)} aria-label="Close account menu">
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
        <div className="mt-2 grid gap-1">
          {groups.map((group, groupIndex) => (
            <div
              key={groupIndex}
              className={cn(
                groupIndex > 0 && "border-t border-subtle pt-1.5",
                groupIndex < groups.length - 1 && "pb-1.5"
              )}
            >
              {group.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  data-tour={item.tour}
                  onClick={item.action}
                  className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-content-secondary transition-colors duration-150 hover:bg-surface-hover hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                >
                  <item.icon className="h-4 w-4 shrink-0 text-content-muted" aria-hidden="true" />
                  {item.label}
                </button>
              ))}
            </div>
          ))}
          <div className="border-t border-subtle pt-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={onLogout}
              disabled={logoutState.isLoading}
              className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-red-600 transition-colors duration-150 hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950/25"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              {logoutState.isLoading ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </>
    );
  };

  const themeLabel = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  const isNotificationsPage = pathname === "/notifications" || pathname.startsWith("/notifications/");
  const bellLabel =
    unreadCount > 0
      ? `Notifications (${unreadCount > 99 ? "99+" : unreadCount} unread)`
      : "Notifications";

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-subtle bg-surface/95 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[88rem] items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6 lg:px-8">
          {/* Left area: Clean brand logo on <lg (no hamburger menu); Search aligned with main content area on md+ */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Link
              to="/"
              className="flex shrink-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] lg:hidden [&>span>span]:hidden min-[360px]:[&>span>span]:inline"
              aria-label="Upwrite home"
            >
              <BrandLogo linked={false} size="sm" showName />
            </Link>

            <SearchDiscovery
              className="relative hidden min-w-0 flex-1 md:block md:max-w-[26rem] lg:max-w-[28rem] xl:max-w-[30rem]"
              externalCloseSignal={desktopSearchCloseSignal}
              onOpenChange={handleDesktopSearchOpenChange}
            />
          </div>

          {/* Right-aligned utility area: Mobile Search trigger, Theme control, Notification bell dropdown trigger, primary Write action, and Profile avatar */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            <UtilityIconButton
              label="Search"
              tooltip="Search"
              onClick={openMobileSearch}
              ariaExpanded={searchOpen}
              ariaControls="mobile-search-dialog"
              ariaHasPopup="dialog"
              className="md:hidden"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </UtilityIconButton>

            <UtilityIconButton
              label={themeLabel}
              tooltip={themeLabel}
              onClick={handleThemeToggle}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </UtilityIconButton>

            <UtilityIconButton
              ref={bellRef}
              label={bellLabel}
              tooltip="Notifications"
              active={notificationsOpen || isNotificationsPage}
              ariaExpanded={notificationsOpen}
              ariaControls="notification-dropdown-panel"
              ariaHasPopup="dialog"
              tourId="notifications"
              onClick={toggleNotifications}
            >
              <span className="relative inline-flex items-center justify-center">
                <Bell className="h-4 w-4 shrink-0" aria-hidden="true" />
                {unreadCount > 0 ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute -top-1.5 -right-2 grid h-4 place-items-center rounded-full bg-accent font-bold leading-none text-content-on-accent text-on-accent ring-2 ring-surface group-hover/util:ring-surface-hover shadow-xs select-none tabular-nums",
                      unreadCount > 99
                        ? "min-w-6 px-1.5 text-[9px]"
                        : unreadCount > 9
                          ? "min-w-5 px-1 text-[10px]"
                          : "min-w-4 px-0.5 text-[10px]"
                    )}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </span>
            </UtilityIconButton>

            <Button
              variant="primary"
              size="md"
              className="ml-1 hidden shrink-0 px-3.5 lg:inline-flex"
              onClick={() => {
                setMenuOpen(false);
                setNotificationsOpen(false);
                closeDesktopSearch();
                navigate("/write");
              }}
              aria-label="Write"
              title="Write"
            >
              <span data-tour="write" className="inline-flex items-center gap-2">
                <PenLine className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="hidden xs:inline sm:inline">Write</span>
              </span>
            </Button>

            {user ? (
              <div className="relative ml-0.5 sm:ml-1" ref={menuRef}>
                <button
                  type="button"
                  onClick={toggleAccountMenu}
                  title={`Account (${user.name})`}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="Open account menu"
                  className={cn(
                    "group/avatar relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-transparent transition-[background-color,border-color] duration-150 hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
                    menuOpen && "border-accent bg-accent-subtle"
                  )}
                >
                  <Avatar src={user.avatar?.url ?? user.avatar?.secureUrl} name={user.name} size="sm" />
                </button>
                <AnimatePresence>
                  {menuOpen ? (
                    <motion.div
                      className="absolute right-0 top-[calc(100%+0.5rem)] z-50 hidden w-64 origin-top-right rounded-lg border border-subtle bg-surface-elevated p-3 shadow-elevated lg:block"
                      role="menu"
                      aria-label="Account menu"
                      variants={popoverVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <MenuContent />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            ) : (
              <Button
                variant="secondary"
                size="md"
                className="ml-0.5 shrink-0 px-3 sm:ml-1"
                onClick={() => navigate("/login")}
              >
                Log in
              </Button>
            )}
          </div>
        </div>
      </header>

      <NotificationDropdown
        id="notification-dropdown-panel"
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        triggerRef={bellRef}
      />

      <MobileSearchDialog
        id="mobile-search-dialog"
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      <AnimatePresence>
        {menuOpen ? (
          <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Account menu">
            <motion.button
              type="button"
              className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
              aria-label="Close account menu"
              onClick={() => setMenuOpen(false)}
              variants={backdropVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            />
            <motion.div
              ref={mobileMenuSheetRef}
              tabIndex={-1}
              drag={reducedMotion ? false : "y"}
              dragControls={mobileSheetDragControls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.22 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 90 || info.velocity.y > 700) setMenuOpen(false);
              }}
              className="absolute inset-x-0 bottom-0 max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain rounded-t-xl border border-subtle bg-surface-elevated p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-elevated outline-none"
              variants={bottomSheetVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <div
                onPointerDown={(event) => {
                  if (!reducedMotion) {
                    mobileSheetDragControls.start(event);
                  }
                }}
                style={{ touchAction: "none" }}
                className="mx-auto mb-3 flex cursor-grab justify-center py-1 select-none active:cursor-grabbing"
              >
                <div className="h-1.5 w-12 rounded-full bg-border-subtle" aria-hidden="true" />
              </div>
              <MenuContent mobile />
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
};
