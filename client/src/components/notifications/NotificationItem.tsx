import { Bell } from "lucide-react";
import type { Notification } from "../../types/models";
import { formatRelative } from "../../utils/formatDate";
import { Avatar } from "../ui/Avatar";
import { Card } from "../ui/Card";

export const NotificationItem = ({ notification, onRead }: { notification: Notification; onRead?: () => void }) => (
  <Card className="p-4">
    <button type="button" onClick={onRead} className="flex w-full items-start gap-3 text-left">
      <Avatar src={notification.actor?.avatar?.url} name={notification.actor?.name} />
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-6 text-ink-700 dark:text-ink-300">
          <span className="font-medium text-ink-950 dark:text-ink-50">{notification.actor?.name ?? "Someone"}</span>{" "}
          {notification.message}
        </p>
        <p className="mt-1 text-xs text-ink-500">{formatRelative(notification.createdAt)}</p>
      </div>
      {!notification.readAt ? <Bell className="h-4 w-4 text-accent-600" /> : null}
    </button>
  </Card>
);
