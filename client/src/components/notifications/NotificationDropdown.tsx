import {
  ArrowRight,
  Bell,
  Bookmark,
  Check,
  CheckCheck,
  Heart,
  MessageCircle,
  Reply,
  UserPlus
} from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAppSelector } from "../../app/hooks";
import { recordArticleActivation } from "../../motion/articleTransition";
import { getPopoverVariants, useReducedMotionPreference } from "../../motion/system";
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery
} from "../../features/notifications/notificationsApi";
import type { Notification, NotificationType } from "../../types/models";
import { cn } from "../../utils/cn";
import { formatRelative } from "../../utils/formatDate";
import { Avatar } from "../ui/Avatar";

const notificationTypeMeta: Record<
  NotificationType,
  {
    icon: typeof Bell;
    label: string;
    badgeClass: string;
  }
> = {
  follow: {
    icon: UserPlus,
    label: "New follower",
    badgeClass: "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300"
  },
  like: {
    icon: Heart,
    label: "Liked your work",
    badgeClass: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300"
  },
  comment: {
    icon: MessageCircle,
    label: "New comment",
    badgeClass: "bg-accent-subtle text-content-accent"
  },
  reply: {
    icon: Reply,
    label: "New reply",
    badgeClass: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
  },
  mention: {
    icon: Bell,
    label: "Mentioned you",
    badgeClass: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
  },
  article_interaction: {
    icon: Bookmark,
    label: "Saved your article",
    badgeClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
  }
};

export const getNotificationHref = (notification: Notification) => {
  if (notification.targetUrl) {
    return notification.targetUrl;
  }
  if (notification.type === "follow" && notification.actor?.username) {
    return `/profile/${notification.actor.username}`;
  }
  if (notification.entityType === "post") {
    return "/?type=logs";
  }
  return notification.actor?.username ? `/profile/${notification.actor.username}` : "/notifications";
};

interface NotificationDropdownProps {
  id?: string;
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export const NotificationDropdown = ({
  id = "notification-dropdown-panel",
  open,
  onClose,
  triggerRef
}: NotificationDropdownProps) => {
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.accessToken);

  const {
    data: notifications = [],
    isLoading,
    isError,
    refetch
  } = useNotificationsQuery(
    { limit: 12 },
    { skip: !user || !token }
  );
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, markAllState] = useMarkAllNotificationsReadMutation();

  const unreadCount =
    typeof notifications.unreadCount === "number"
      ? notifications.unreadCount
      : notifications.filter((item) => !item.readAt).length;
  const recentNotifications = notifications.slice(0, 4);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      onClose();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, triggerRef]);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      panelRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  if (typeof document === "undefined") return null;

  const reducedMotion = useReducedMotionPreference();
  const popoverVariants = getPopoverVariants(reducedMotion, "down");

  const handleViewAll = () => {
    onClose();
    navigate("/notifications");
  };

  const handleItemClick = (notification: Notification) => {
    if (!notification.readAt) {
      void markRead(notification._id);
    }
    const href = getNotificationHref(notification);
    if (href.startsWith("/articles/")) {
      const slug = href.replace(/^\/articles\//, "").split(/[?#]/)[0];
      if (slug) {
        recordArticleActivation({
          slug,
          mode: "open",
          instanceId: `notification-dropdown:${notification._id}`
        });
      }
    }
    onClose();
  };

  const [anchorStyle, setAnchorStyle] = useState<React.CSSProperties>({
    top: "4.25rem",
    right: "1rem"
  });

  useLayoutEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger || typeof window === "undefined") return;
      const rect = trigger.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const margin = viewportWidth < 640 ? 12 : 16;
      const panelWidth = Math.min(384, viewportWidth - margin * 2);
      const idealLeft = rect.right - panelWidth;
      const clampedLeft = Math.max(margin, Math.min(idealLeft, viewportWidth - panelWidth - margin));

      setAnchorStyle({
        top: `${Math.round(rect.bottom + 8)}px`,
        left: `${Math.round(clampedLeft)}px`,
        width: `${Math.round(panelWidth)}px`,
        transformOrigin: "top right"
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, triggerRef]);

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          id={id}
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby={`${id}-heading`}
          tabIndex={-1}
          style={anchorStyle}
          variants={popoverVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed z-50 flex max-h-[min(30rem,calc(100dvh-5.5rem))] flex-col overflow-hidden rounded-lg border border-subtle bg-surface-elevated text-content-primary shadow-elevated outline-none"
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-subtle px-4 py-3">
            <div className="flex items-center gap-2">
              <h2 id={`${id}-heading`} className="text-sm font-semibold text-content-primary">
                Notifications
              </h2>
              {unreadCount > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-subtle px-1.5 text-[11px] font-semibold text-content-accent tabular-nums">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </div>

            {user && unreadCount > 0 ? (
              <button
                type="button"
                disabled={markAllState.isLoading}
                onClick={() => void markAllRead()}
                className="inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs font-medium text-content-accent transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Mark all read
              </button>
            ) : null}
          </div>

          {/* Body: Scrollable notification list (up to 4 recent notifications) */}
          <div className="sidebar-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {!user ? (
              <div className="flex flex-col items-center justify-center px-5 py-8 text-center">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-surface-subtle text-content-muted">
                  <Bell className="h-4 w-4" aria-hidden="true" />
                </div>
                <p className="mt-3 text-sm font-medium text-content-primary">
                  Sign in to view notifications
                </p>
                <p className="mt-1 text-xs leading-5 text-content-muted">
                  Track replies, follows, likes, and activity on your writing.
                </p>
              </div>
            ) : isLoading ? (
              <div className="space-y-2 p-3" aria-busy="true" aria-label="Loading notifications">
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-md p-2.5"
                  >
                    <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-surface-subtle" />
                    <div className="min-w-0 flex-1 space-y-2 pt-0.5">
                      <div className="h-3.5 w-3/4 animate-pulse rounded-sm bg-surface-subtle" />
                      <div className="h-3 w-1/3 animate-pulse rounded-sm bg-surface-subtle" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center px-5 py-8 text-center">
                <p className="text-sm font-medium text-content-primary">
                  Could not load notifications
                </p>
                <p className="mt-1 text-xs text-content-muted">
                  Check your connection and try again.
                </p>
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="mt-3 rounded-md border border-subtle bg-surface px-3 py-1.5 text-xs font-medium text-content-primary transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                >
                  Retry
                </button>
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-5 py-9 text-center">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-surface-subtle text-content-muted">
                  <Bell className="h-4 w-4" aria-hidden="true" />
                </div>
                <p className="mt-3 text-sm font-medium text-content-primary">
                  No notifications yet
                </p>
                <p className="mt-1 text-xs leading-5 text-content-muted">
                  Likes, follows, comments, and article activity will appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border-subtle p-1.5" role="list">
                {recentNotifications.map((notification) => {
                  const meta = notificationTypeMeta[notification.type] ?? notificationTypeMeta.mention;
                  const Icon = meta.icon;
                  const unread = !notification.readAt;
                  const actorName = notification.actor?.name ?? "Someone";

                  return (
                    <li key={notification._id}>
                      <div
                        className={cn(
                          "group flex items-start gap-2 rounded-md px-3 py-2.5 transition-colors duration-150 hover:bg-surface-hover",
                          unread ? "bg-accent-subtle/60" : "bg-transparent"
                        )}
                      >
                        <Link
                          to={getNotificationHref(notification)}
                          onClick={() => handleItemClick(notification)}
                          className="flex min-w-0 flex-1 items-start gap-3 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                        >
                          <div className="relative mt-0.5 shrink-0">
                            <Avatar
                              size="sm"
                              src={notification.actor?.avatar?.url ?? notification.actor?.avatar?.secureUrl}
                              name={actorName}
                            />
                            <span
                              className={cn(
                                "absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full ring-2 ring-[var(--bg-surface-elevated)]",
                                meta.badgeClass
                              )}
                              aria-hidden="true"
                            >
                              <Icon className="h-2.5 w-2.5" />
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-xs font-semibold text-content-primary">
                                {actorName}
                              </p>
                              <span className="shrink-0 text-[11px] text-content-muted">
                                {formatRelative(notification.createdAt)}
                              </span>
                            </div>
                            <p
                              className={cn(
                                "mt-0.5 line-clamp-2 text-xs leading-5",
                                unread ? "font-medium text-content-primary" : "text-content-secondary"
                              )}
                            >
                              {notification.message}
                            </p>
                          </div>
                        </Link>

                        {unread ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void markRead(notification._id);
                            }}
                            aria-label={`Mark notification from ${actorName} as read`}
                            title="Mark as read"
                            className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-content-accent transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                          >
                            <span className="h-2 w-2 rounded-full bg-accent group-hover:hidden" aria-hidden="true" />
                            <Check className="hidden h-3.5 w-3.5 group-hover:block" aria-hidden="true" />
                          </button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer: View All Notifications -> */}
          <div className="shrink-0 border-t border-subtle bg-surface/60 p-2">
            <button
              type="button"
              onClick={handleViewAll}
              className="group/viewall flex h-9 w-full items-center justify-center gap-1.5 rounded-md px-3 text-xs font-semibold text-content-accent transition-colors duration-150 hover:bg-surface-hover hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              <span>View All Notifications</span>
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform duration-150 group-hover/viewall:translate-x-0.5"
                aria-hidden="true"
              />
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
};
