import { Heart, UserPlus } from "lucide-react";
import { NotificationItem } from "../../components/notifications/NotificationItem";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import { Card } from "../../components/ui/Card";
import { FeedSkeleton } from "../../components/ui/Skeleton";
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery
} from "../../features/notifications/notificationsApi";
import type { Notification } from "../../types/models";
import { formatDate } from "../../utils/formatDate";

type NotificationRow =
  | { kind: "single"; notification: Notification }
  | { kind: "group"; key: string; type: "like" | "follow"; notifications: Notification[]; date: string };

const dayKey = (value: string) => new Date(value).toISOString().slice(0, 10);

function groupNotifications(notifications: Notification[]): NotificationRow[] {
  const rows: NotificationRow[] = [];
  const groups = new Map<string, Extract<NotificationRow, { kind: "group" }>>();

  notifications.forEach((notification) => {
    if (notification.type !== "like" && notification.type !== "follow") {
      rows.push({ kind: "single", notification });
      return;
    }
    const actorKey = notification.type === "like" ? notification.actor?._id ?? notification.actor?.username ?? "unknown" : "followers";
    const key = `${notification.type}:${actorKey}:${dayKey(notification.createdAt)}`;
    const existing = groups.get(key);
    if (existing) {
      existing.notifications.push(notification);
      return;
    }
    const group = { kind: "group" as const, key, type: notification.type, notifications: [notification], date: notification.createdAt };
    groups.set(key, group);
    rows.push(group);
  });

  return rows;
}

export default function NotificationsPage() {
  const { data: notifications = [], isLoading, error } = useNotificationsQuery({ limit: 30 });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, markAllState] = useMarkAllNotificationsReadMutation();
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;
  const rows = groupNotifications(notifications);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Notifications</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">Useful signals, not noise.</h1>
          <p className="mt-2 text-sm text-ink-500">{unreadCount ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}` : "You are all caught up."}</p>
        </div>
        <Button variant="secondary" loading={markAllState.isLoading} disabled={!unreadCount} onClick={() => markAllRead()}>
          Mark All As Read
        </Button>
      </section>
      {isLoading ? <FeedSkeleton /> : null}
      {error ? <ErrorState error={error} /> : null}
      {!isLoading && !notifications.length ? (
        <EmptyState title="No notifications yet" description="Likes, follows, comments, and article activity will appear here." />
      ) : null}
      <div className="space-y-3">
        {rows.map((row) => row.kind === "single" ? (
          <NotificationItem
            key={row.notification._id}
            notification={row.notification}
            onRead={() => {
              if (!row.notification.readAt) markRead(row.notification._id);
            }}
          />
        ) : (
          <GroupedNotification
            key={row.key}
            row={row}
            onRead={() => row.notifications.filter((notification) => !notification.readAt).forEach((notification) => markRead(notification._id))}
          />
        ))}
      </div>
    </div>
  );
}

function GroupedNotification({ row, onRead }: { row: Extract<NotificationRow, { kind: "group" }>; onRead: () => void }) {
  const unread = row.notifications.some((notification) => !notification.readAt);
  const first = row.notifications[0];
  const Icon = row.type === "like" ? Heart : UserPlus;
  const message = row.type === "like"
    ? `${first.actor?.name ?? "Someone"} liked ${row.notifications.length} of your article${row.notifications.length === 1 ? "" : "s"}`
    : row.notifications.length === 1
      ? `${first.actor?.name ?? "Someone"} started following you`
      : `${row.notifications.length} people started following you`;

  return (
    <Card className={`p-4 transition-colors duration-200 hover:border-accent-300 dark:hover:border-accent-800 ${unread ? "border-accent-200 bg-accent-50/40 dark:border-accent-900 dark:bg-accent-950/10" : ""}`}>
      <button type="button" onClick={onRead} className="flex w-full items-start gap-3 text-left">
        <div className="relative flex shrink-0 -space-x-3">
          {row.notifications.slice(0, 3).map((notification) => <Avatar key={notification._id} src={notification.actor?.avatar?.url} name={notification.actor?.name} />)}
          <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-accent-50 text-accent-700 ring-2 ring-white dark:bg-accent-950/40 dark:text-accent-300 dark:ring-ink-900">
            <Icon className="h-3.5 w-3.5" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-6 text-ink-700 dark:text-ink-300">{message}</p>
          <p className="mt-1 text-xs text-ink-500">{formatDate(row.date)}</p>
        </div>
        {unread ? <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-accent-500" aria-label="Unread" /> : null}
      </button>
    </Card>
  );
}
