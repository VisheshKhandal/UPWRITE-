import { Router } from "express";
import { settingsController } from "../controllers/settings.controller";
import { requireAuth } from "../middleware/auth";
import { validateRequest } from "../middleware/validateRequest";
import {
  accountDeletionSchema,
  appearanceSettingsSchema,
  exportQuerySchema,
  onboardingSchema,
  passwordConfirmationSchema,
  passwordUpdateSchema,
  privacySettingsSchema,
  recoverySettingsSchema,
  sessionParamsSchema,
  twoFactorEnableSchema
} from "../validations/settings.validation";

const router = Router();

router.use(requireAuth);

router.get("/", settingsController.overview);
router.patch("/appearance", validateRequest(appearanceSettingsSchema), settingsController.updateAppearance);
router.post("/appearance/reset", settingsController.resetAppearance);
router.patch("/privacy", validateRequest(privacySettingsSchema), settingsController.updatePrivacy);
router.patch("/password", validateRequest(passwordUpdateSchema), settingsController.updatePassword);
router.get("/sessions", settingsController.sessions);
router.delete("/sessions/:id", validateRequest(sessionParamsSchema), settingsController.revokeSession);
router.post("/2fa/start", settingsController.startTwoFactor);
router.post("/2fa/enable", validateRequest(twoFactorEnableSchema), settingsController.enableTwoFactor);
router.post("/2fa/disable", validateRequest(passwordConfirmationSchema), settingsController.disableTwoFactor);
router.post("/2fa/backup-codes", validateRequest(passwordConfirmationSchema), settingsController.regenerateBackupCodes);
router.patch("/recovery", validateRequest(recoverySettingsSchema), settingsController.updateRecovery);
router.post("/onboarding", validateRequest(onboardingSchema), settingsController.completeOnboarding);
router.post("/onboarding/tour", settingsController.completeTour);
router.post("/verification/resend", settingsController.resendVerification);
router.get("/export", validateRequest(exportQuerySchema), settingsController.exportData);
router.delete("/account", validateRequest(accountDeletionSchema), settingsController.deleteAccount);

export default router;
