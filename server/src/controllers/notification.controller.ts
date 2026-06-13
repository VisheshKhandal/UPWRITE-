import { notificationService } from "../services/notification.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { routeParam } from "../utils/request";

export const notificationController = {
  list: asyncHandler(async (req, res) => {
    const result = await notificationService.listForUser(req, req.user!.id);
    return sendSuccess(res, result.items, "Notifications", 200, result.meta);
  }),

  markRead: asyncHandler(async (req, res) => {
    const notification = await notificationService.markRead(routeParam(req, "id"), req.user!.id);
    return sendSuccess(res, notification, "Notification marked as read");
  }),

  markAllRead: asyncHandler(async (req, res) => {
    await notificationService.markAllRead(req.user!.id);
    return sendSuccess(res, null, "All notifications marked as read");
  })
};
