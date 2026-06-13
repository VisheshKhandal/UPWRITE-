import { NotificationItem } from "../../components/notifications/NotificationItem";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { Button } from "../../components/ui/Button";
import { FeedSkeleton } from "../../components/ui/Skeleton";
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery
} from "../../features/notifications/notificationsApi";

export default function NotificationsPage() {
  const { data: notifications = [], isLoading, error } = useNotificationsQuery({ limit: 30 });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, markAllState] = useMarkAllNotificationsReadMutation();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Notifications</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">Useful signals, not noise.</h1>
        </div>
        <Button variant="secondary" loading={markAllState.isLoading} onClick={() => markAllRead()}>
          Mark all read
        </Button>
      </section>
      {isLoading ? <FeedSkeleton /> : null}
      {error ? <ErrorState error={error} /> : null}
      {!isLoading && !notifications.length ? (
        <EmptyState title="No notifications yet" description="Likes, follows, comments, and article activity will appear here." />
      ) : null}
      <div className="space-y-3">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification._id}
            notification={notification}
            onRead={() => {
              if (!notification.readAt) markRead(notification._id);
            }}
          />
        ))}
      </div>
    </div>
  );
}
