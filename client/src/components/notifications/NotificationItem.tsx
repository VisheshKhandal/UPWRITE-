import { Bell, Bookmark, Heart, MessageCircle, Reply, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { useArticleLinkActivation } from "../../motion/useArticleLinkProps";
import type { Notification } from "../../types/models";
import { formatRelative } from "../../utils/formatDate";
import { Avatar } from "../ui/Avatar";
import { Card } from "../ui/Card";
import { cn } from "../../utils/cn";
import { getNotificationHref } from "./NotificationDropdown";

const notificationMeta = {
  follow: { icon: UserPlus, className: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300" },
  like: { icon: Heart, className: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" },
  comment: { icon: MessageCircle, className: "bg-accent-50 text-accent-700 dark:bg-accent-950/40 dark:text-accent-300" },
  reply: { icon: Reply, className: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300" },
  mention: { icon: Bell, className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
  article_interaction: { icon: Bookmark, className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" }
};

export const NotificationItem = ({ notification, onRead }: { notification: Notification; onRead?: () => void }) => {
  const meta = notificationMeta[notification.type] ?? notificationMeta.mention;
  const Icon = meta.icon;
  const unread = !notification.readAt;
  const href = getNotificationHref(notification);
  const articleMatch = href.match(/^\/articles\/[^/]+\/([^/?#]+)/);
  const articleSlug = articleMatch?.[1] ?? "";
  const activation = useArticleLinkActivation({
    slug: articleSlug || notification._id,
    to: href,
    mode: "open",
    onBeforeNavigate: onRead
  });

  const content = (
    <div className="flex w-full items-start gap-3 text-left">
      <div className="relative shrink-0">
        <Avatar src={notification.actor?.avatar?.url ?? notification.actor?.avatar?.secureUrl} name={notification.actor?.name} />
        <span className={cn("absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full ring-2 ring-white dark:ring-ink-900", meta.className)}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-6 text-ink-700 dark:text-ink-300">
          <span className="font-semibold text-ink-950 dark:text-ink-50">{notification.actor?.name ?? "Someone"}</span>{" "}
          {notification.message}
        </p>
        <p className="mt-1 text-xs text-ink-500">{formatRelative(notification.createdAt)}</p>
      </div>
      {unread ? <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-accent-500" aria-label="Unread" /> : null}
    </div>
  );

  return (
    <Card
      className={cn(
        "p-4 transition-colors duration-150 hover:border-accent-300 dark:hover:border-accent-800",
        unread && "border-accent-200 bg-accent-50/40 dark:border-accent-900 dark:bg-accent-950/10",
        activation.isActivating && "border-accent bg-surface-active/60"
      )}
    >
      <Link
        to={href}
        {...(articleSlug ? activation.linkAttributes : {})}
        onPointerDown={articleSlug ? activation.handlePointerDown : undefined}
        onPointerUp={articleSlug ? activation.clearActivating : undefined}
        onPointerLeave={articleSlug ? activation.clearActivating : undefined}
        onPointerCancel={articleSlug ? activation.clearActivating : undefined}
        onKeyDown={articleSlug ? activation.handleKeyDown : undefined}
        onBlur={articleSlug ? activation.clearActivating : undefined}
        onClick={(event) => {
          if (articleSlug) {
            activation.handleClick(event);
          }
          onRead?.();
        }}
        className="block"
      >
        {content}
      </Link>
    </Card>
  );
};
