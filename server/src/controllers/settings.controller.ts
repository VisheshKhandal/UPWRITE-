import type { Request } from "express";
import { settingsService } from "../services/settings.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { routeParam } from "../utils/request";

const refreshCookieName = "upwrite_refresh";

const clientContext = (req: Request) => ({
  userAgent: req.headers["user-agent"],
  ipAddress: req.ip
});

export const settingsController = {
  overview: asyncHandler(async (req, res) => {
    const overview = await settingsService.getOverview(req.user!.id, req.cookies?.[refreshCookieName]);
    return sendSuccess(res, overview, "Settings overview");
  }),

  updateAppearance: asyncHandler(async (req, res) => {
    const user = await settingsService.updateAppearance(req.user!.id, req.body);
    return sendSuccess(res, user, "Appearance updated");
  }),

  resetAppearance: asyncHandler(async (req, res) => {
    const user = await settingsService.resetAppearance(req.user!.id);
    return sendSuccess(res, user, "Appearance reset");
  }),

  updatePrivacy: asyncHandler(async (req, res) => {
    const user = await settingsService.updatePrivacy(req.user!.id, req.body);
    return sendSuccess(res, user, "Privacy updated");
  }),

  updatePassword: asyncHandler(async (req, res) => {
    await settingsService.updatePassword(req.user!.id, req.body, clientContext(req));
    return sendSuccess(res, null, "Password updated");
  }),

  sessions: asyncHandler(async (req, res) => {
    const sessions = await settingsService.listSessions(req.user!.id, req.cookies?.[refreshCookieName]);
    return sendSuccess(res, sessions, "Active sessions");
  }),

  revokeSession: asyncHandler(async (req, res) => {
    await settingsService.revokeSession(req.user!.id, routeParam(req, "id"), clientContext(req));
    return sendSuccess(res, null, "Session logged out");
  }),

  startTwoFactor: asyncHandler(async (req, res) => {
    const setup = await settingsService.startTwoFactor(req.user!.id);
    return sendSuccess(res, setup, "Two-factor setup started");
  }),

  enableTwoFactor: asyncHandler(async (req, res) => {
    const result = await settingsService.enableTwoFactor(req.user!.id, req.body, clientContext(req));
    return sendSuccess(res, result, "Two-factor authentication enabled");
  }),

  disableTwoFactor: asyncHandler(async (req, res) => {
    const user = await settingsService.disableTwoFactor(req.user!.id, req.body.password, clientContext(req));
    return sendSuccess(res, user, "Two-factor authentication disabled");
  }),

  regenerateBackupCodes: asyncHandler(async (req, res) => {
    const backupCodes = await settingsService.regenerateBackupCodes(req.user!.id, req.body.password, clientContext(req));
    return sendSuccess(res, { backupCodes }, "Backup codes regenerated");
  }),

  updateRecovery: asyncHandler(async (req, res) => {
    const user = await settingsService.updateRecovery(req.user!.id, req.body);
    return sendSuccess(res, user, "Recovery settings updated");
  }),

  completeOnboarding: asyncHandler(async (req, res) => {
    const user = await settingsService.completeOnboarding(req.user!.id, req.body);
    return sendSuccess(res, user, "Onboarding completed");
  }),

  completeTour: asyncHandler(async (req, res) => {
    const user = await settingsService.markTourComplete(req.user!.id);
    return sendSuccess(res, user, "Product tour completed");
  }),

  resendVerification: asyncHandler(async (req, res) => {
    await settingsService.resendVerification(req.user!.id, clientContext(req));
    return sendSuccess(res, null, "Verification email queued");
  }),

  exportData: asyncHandler(async (req, res) => {
    const format = req.query.format === "csv" ? "csv" : "json";
    const exportResult = await settingsService.exportData(req.user!.id, format, clientContext(req));
    res.setHeader("Content-Type", exportResult.contentType);
    res.setHeader("Content-Disposition", `attachment; filename="upwrite-export.${format}"`);
    return res.status(200).send(exportResult.body);
  }),

  deleteAccount: asyncHandler(async (req, res) => {
    await settingsService.deleteAccount(req.user!.id, req.body, clientContext(req));
    res.clearCookie("upwrite_refresh");
    return sendSuccess(res, null, "Account deleted");
  })
};
