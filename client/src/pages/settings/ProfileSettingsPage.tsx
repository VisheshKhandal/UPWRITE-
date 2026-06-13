import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { Download, KeyRound, Laptop, Lock, PlayCircle, RefreshCcw, ShieldCheck, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { UploadDropzone } from "../../components/common/UploadDropzone";
import { ProductTourOverlay } from "../../components/onboarding/ProductTourOverlay";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Tabs } from "../../components/ui/Tabs";
import { useLogoutAllMutation } from "../../features/auth/authApi";
import { logout, setCurrentUser } from "../../features/auth/authSlice";
import {
  useDeleteAccountMutation,
  useDisableTwoFactorMutation,
  useEnableTwoFactorMutation,
  useCompleteProductTourMutation,
  useRegenerateBackupCodesMutation,
  useResetAppearanceMutation,
  useResendVerificationMutation,
  useRevokeSessionMutation,
  useSettingsOverviewQuery,
  useStartTwoFactorMutation,
  useUpdateAppearanceMutation,
  useUpdatePasswordMutation,
  useUpdatePrivacyMutation,
  useUpdateRecoveryMutation
} from "../../features/settings/settingsApi";
import { useUpdateProfileMutation } from "../../features/profiles/profilesApi";
import { pushToast, setTheme } from "../../features/ui/uiSlice";
import { useUploadImageMutation } from "../../features/uploads/uploadsApi";
import type { AppearanceSettings, PrivacySettings } from "../../types/models";
import { getErrorMessage } from "../../utils/errors";
import { formatDate } from "../../utils/formatDate";

type SettingsSection = "profile" | "account" | "appearance" | "security";

const appearanceDefaults: AppearanceSettings = {
  theme: "system",
  fontSize: "medium",
  readingWidth: "comfortable",
  reduceMotion: false,
  highContrast: false,
  compactLayout: false,
  showReadingTime: true,
  showViewCounts: true,
  showLikeCounts: true,
  showAuthorStats: true,
  language: "en",
  autoSaveInterval: "1m",
  focusWritingMode: false
};

const privacyDefaults: PrivacySettings = {
  profileVisibility: "public",
  showEmail: false,
  showJoinDate: true,
  showSocialLinks: true
};

const strengthLabel = (password: string) => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score <= 2 ? "Weak" : score === 3 ? "Medium" : score === 4 ? "Strong" : "Very Strong";
};

const settingLabel: Record<string, string> = {
  login_success: "Successful login",
  login_failed: "Failed login",
  password_changed: "Password changed",
  two_factor_enabled: "Two-factor enabled",
  two_factor_disabled: "Two-factor disabled",
  backup_codes_regenerated: "Backup codes regenerated",
  new_device_login: "New device login",
  unusual_location_login: "Unusual location login",
  multiple_failed_attempts: "Multiple failed attempts",
  session_revoked: "Session logged out",
  data_export_requested: "Data export requested",
  verification_email_sent: "Verification email sent"
};

function SettingRow({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-ink-200 bg-white p-4 dark:border-ink-800 dark:bg-ink-900 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-medium text-ink-950 dark:text-ink-50">{title}</p>
        {description ? <p className="mt-1 text-sm leading-6 text-ink-600 dark:text-ink-400">{description}</p> : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`h-6 w-11 rounded-full p-1 transition-colors disabled:opacity-60 ${checked ? "bg-ink-950 dark:bg-ink-100" : "bg-ink-300 dark:bg-ink-700"}`}
      aria-pressed={checked}
    >
      <span className={`block h-4 w-4 rounded-full bg-white transition-transform dark:bg-ink-950 ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}

export default function ProfileSettingsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.accessToken);
  const { data: overview, isLoading: overviewLoading, isError: overviewError } = useSettingsOverviewQuery(undefined, { skip: !token });
  const effectiveUser = overview?.user ?? user;
  const appearance = { ...appearanceDefaults, ...effectiveUser?.appearanceSettings };
  const privacy = { ...privacyDefaults, ...effectiveUser?.privacySettings };

  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const [updateProfile, updateState] = useUpdateProfileMutation();
  const [logoutAll, logoutAllState] = useLogoutAllMutation();
  const [uploadImage, uploadState] = useUploadImageMutation();
  const [updateAppearance, appearanceState] = useUpdateAppearanceMutation();
  const [resetAppearance, resetAppearanceState] = useResetAppearanceMutation();
  const [updatePrivacy, privacyState] = useUpdatePrivacyMutation();
  const [updatePassword, passwordState] = useUpdatePasswordMutation();
  const [revokeSession, revokeSessionState] = useRevokeSessionMutation();
  const [startTwoFactor, startTwoFactorState] = useStartTwoFactorMutation();
  const [enableTwoFactor, enableTwoFactorState] = useEnableTwoFactorMutation();
  const [disableTwoFactor, disableTwoFactorState] = useDisableTwoFactorMutation();
  const [regenerateBackupCodes, backupCodesState] = useRegenerateBackupCodesMutation();
  const [updateRecovery, recoveryState] = useUpdateRecoveryMutation();
  const [resendVerification, resendState] = useResendVerificationMutation();
  const [deleteAccount, deleteState] = useDeleteAccountMutation();
  const [completeProductTour] = useCompleteProductTourMutation();

  const [form, setForm] = useState({
    name: effectiveUser?.name ?? "",
    bio: effectiveUser?.bio ?? "",
    skills: effectiveUser?.skills?.join(", ") ?? "",
    interests: effectiveUser?.interests?.join(", ") ?? "",
    website: effectiveUser?.socialLinks?.website ?? "",
    github: effectiveUser?.socialLinks?.github ?? "",
    linkedin: effectiveUser?.socialLinks?.linkedin ?? "",
    twitter: effectiveUser?.socialLinks?.twitter ?? ""
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [twoFactorSetup, setTwoFactorSetup] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState(effectiveUser?.securitySettings?.recoveryEmail ?? "");
  const [deleteForm, setDeleteForm] = useState({ password: "", confirmation: "" });
  const [replayTour, setReplayTour] = useState(false);

  useEffect(() => {
    if (overview?.user) {
      dispatch(setCurrentUser(overview.user));
      dispatch(setTheme(overview.user.appearanceSettings?.theme ?? "system"));
      setRecoveryEmail(overview.user.securitySettings?.recoveryEmail ?? "");
    }
  }, [dispatch, overview?.user]);

  useEffect(() => {
    const section = new URLSearchParams(location.search).get("section");
    if (section === "appearance" || section === "security" || section === "account" || section === "profile") {
      setActiveSection(section);
    }
  }, [location.search]);

  const settingsTabs = [
    { value: "profile", label: "Profile" },
    { value: "account", label: "Account" },
    { value: "appearance", label: "Appearance" },
    { value: "security", label: "Security" }
  ] as const;

  const list = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);
  const saveUser = (updated: typeof effectiveUser) => {
    if (updated) dispatch(setCurrentUser(updated));
  };
  const toastError = (error: unknown, fallback: string) => dispatch(pushToast({ title: getErrorMessage(error, fallback), tone: "error" }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!effectiveUser) return;
    try {
      const updated = await updateProfile({
        name: form.name,
        bio: form.bio,
        skills: list(form.skills),
        interests: list(form.interests),
        socialLinks: { website: form.website, github: form.github, linkedin: form.linkedin, twitter: form.twitter }
      }).unwrap();
      saveUser({ ...effectiveUser, ...updated });
      dispatch(pushToast({ title: "Profile updated", tone: "success" }));
    } catch (error) {
      toastError(error, "Could not update profile");
    }
  };

  const onAvatar = async (file: File) => {
    try {
      await uploadImage({ file, context: "avatar" }).unwrap();
      dispatch(pushToast({ title: "Avatar uploaded", tone: "success" }));
    } catch (error) {
      toastError(error, "Avatar upload failed");
    }
  };

  const patchAppearance = async (patch: Partial<AppearanceSettings>) => {
    try {
      const updated = await updateAppearance(patch).unwrap();
      saveUser(updated);
      if (patch.theme) dispatch(setTheme(patch.theme));
      dispatch(pushToast({ title: "Appearance saved", tone: "success" }));
    } catch (error) {
      toastError(error, "Could not save appearance");
    }
  };

  const patchPrivacy = async (patch: Partial<PrivacySettings>) => {
    try {
      const updated = await updatePrivacy(patch).unwrap();
      saveUser(updated);
      dispatch(pushToast({ title: "Privacy saved", tone: "success" }));
    } catch (error) {
      toastError(error, "Could not save privacy");
    }
  };

  const onPassword = async (event: FormEvent) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      dispatch(pushToast({ title: "Passwords do not match", tone: "error" }));
      return;
    }
    try {
      await updatePassword(passwordForm).unwrap();
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      dispatch(logout());
      dispatch(pushToast({ title: "Password updated. Please sign in again.", tone: "success" }));
      navigate("/login");
    } catch (error) {
      toastError(error, "Could not update password");
    }
  };

  const exportData = async (format: "json" | "csv") => {
    try {
      const response = await fetch(`/api/v1/settings/export?format=${format}`, {
        headers: token ? { authorization: `Bearer ${token}` } : undefined,
        credentials: "include"
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `upwrite-export.${format}`;
      link.click();
      URL.revokeObjectURL(url);
      dispatch(pushToast({ title: `${format.toUpperCase()} export downloaded`, tone: "success" }));
    } catch (error) {
      toastError(error, "Could not export data");
    }
  };

  const previewData = useMemo(
    () => ({
      name: form.name || effectiveUser?.name || "Creator Name",
      bio: form.bio || effectiveUser?.bio || "Share your creative focus and what you build.",
      skills: list(form.skills)
    }),
    [form, effectiveUser]
  );

  if (!effectiveUser) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="space-y-3">
        <p className="text-sm uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Settings</p>
        <h1 className="text-3xl font-semibold text-ink-950 dark:text-ink-50">Creator settings</h1>
        <p className="max-w-3xl text-sm leading-7 text-ink-600 dark:text-ink-400">
          Manage your profile, personalization, privacy, sessions, verification, and account protection.
        </p>
      </section>

      {overviewLoading ? <Card className="h-24 animate-pulse bg-ink-100 dark:bg-ink-900" /> : null}
      {overviewError ? <Card className="border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">Settings could not be loaded. Saved changes will retry through the API.</Card> : null}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <Card className="p-5">
            <Tabs value={activeSection} onChange={setActiveSection} items={settingsTabs} />
          </Card>

          <Card className="p-6">
            {activeSection === "profile" ? (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-ink-950 dark:text-ink-50">Profile</h2>
                  <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">Update your creator bio, skills, and public links.</p>
                </div>
                <UploadDropzone label="Upload your avatar" onFile={onAvatar} loading={uploadState.isLoading} />
                <form onSubmit={onSubmit} className="space-y-4">
                  <Input label="Display name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required minLength={2} maxLength={80} />
                  <Textarea label="Bio" value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} maxLength={280} />
                  <Input label="Skills" value={form.skills} onChange={(event) => setForm({ ...form, skills: event.target.value })} />
                  <Input label="Interests" value={form.interests} onChange={(event) => setForm({ ...form, interests: event.target.value })} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Website" value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} />
                    <Input label="Twitter" value={form.twitter} onChange={(event) => setForm({ ...form, twitter: event.target.value })} />
                    <Input label="LinkedIn" value={form.linkedin} onChange={(event) => setForm({ ...form, linkedin: event.target.value })} />
                    <Input label="GitHub" value={form.github} onChange={(event) => setForm({ ...form, github: event.target.value })} />
                  </div>
                  <Button loading={updateState.isLoading}>Save profile</Button>
                </form>
              </div>
            ) : null}

            {activeSection === "account" ? (
              <div className="space-y-5">
                <h2 className="text-xl font-semibold text-ink-950 dark:text-ink-50">Account</h2>
                <div className="grid gap-4">
                  <SettingRow title="Replay product tour" description="Walk through Feed, Explore, Write, Saved, Notifications, Profile, and Settings again.">
                    <Button type="button" variant="secondary" onClick={() => setReplayTour(true)}>
                      <PlayCircle size={16} />
                      Replay
                    </Button>
                  </SettingRow>
                  <SettingRow title="Email" description={effectiveUser.email ?? "Not provided"}>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${effectiveUser.emailVerified ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"}`}>
                      {effectiveUser.emailVerified ? "Verified" : "Unverified"}
                    </span>
                  </SettingRow>
                  <SettingRow title="Username" description={`@${effectiveUser.username}`}><span /></SettingRow>
                  <SettingRow title="Join date" description={effectiveUser.createdAt ? formatDate(effectiveUser.createdAt) : "Unknown"}><span /></SettingRow>
                  <SettingRow title="Profile URL" description={`${window.location.origin}/profile/${effectiveUser.username}`}><span /></SettingRow>
                  <SettingRow title="Export your data" description="Download articles, posts, comments, bookmarks, and profile data.">
                    <div className="flex gap-2">
                      <Button type="button" variant="secondary" onClick={() => exportData("json")}><Download size={16} /> JSON</Button>
                      <Button type="button" variant="secondary" onClick={() => exportData("csv")}><Download size={16} /> CSV</Button>
                    </div>
                  </SettingRow>
                </div>
              </div>
            ) : null}

            {activeSection === "appearance" ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-ink-950 dark:text-ink-50">Appearance</h2>
                  <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">Personalization saves to your account and follows you across devices.</p>
                </div>
                <SettingRow title="Theme" description="Use light, dark, or your operating system preference.">
                  <Tabs value={appearance.theme} onChange={(theme) => patchAppearance({ theme })} items={[{ value: "system", label: "System" }, { value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} />
                </SettingRow>
                <SettingRow title="Font size"><Tabs value={appearance.fontSize} onChange={(fontSize) => patchAppearance({ fontSize })} items={[{ value: "small", label: "Small" }, { value: "medium", label: "Medium" }, { value: "large", label: "Large" }, { value: "extra-large", label: "XL" }]} /></SettingRow>
                <SettingRow title="Reading width"><Tabs value={appearance.readingWidth} onChange={(readingWidth) => patchAppearance({ readingWidth })} items={[{ value: "narrow", label: "Narrow" }, { value: "comfortable", label: "Comfort" }, { value: "wide", label: "Wide" }]} /></SettingRow>
                {[
                  ["Reduce motion", "Disable transitions, hover movement, and loading animation flourish.", "reduceMotion"],
                  ["High contrast mode", "Increase legibility for text, surfaces, and controls.", "highContrast"],
                  ["Compact layout", "Use denser spacing for repeated workflows.", "compactLayout"],
                  ["Reading time", "Show reading time on articles and cards.", "showReadingTime"],
                  ["View counts", "Show article view counters.", "showViewCounts"],
                  ["Like counts", "Show likes across posts, articles, and comments.", "showLikeCounts"],
                  ["Author statistics", "Show creator stats on profiles and reading pages.", "showAuthorStats"],
                  ["Focus writing mode", "Hide sidebar and nonessential writing UI.", "focusWritingMode"]
                ].map(([title, description, key]) => (
                  <SettingRow key={key} title={title} description={description}>
                    <Toggle checked={Boolean(appearance[key as keyof AppearanceSettings])} disabled={appearanceState.isLoading} onChange={(checked) => patchAppearance({ [key]: checked } as Partial<AppearanceSettings>)} />
                  </SettingRow>
                ))}
                <SettingRow title="Language" description="Hindi is available now; more languages can be added without changing the settings model.">
                  <Tabs value={appearance.language} onChange={(language) => patchAppearance({ language })} items={[{ value: "en", label: "English" }, { value: "hi", label: "Hindi" }]} />
                </SettingRow>
                <SettingRow title="Auto save" description="Choose how often drafts save while writing.">
                  <Tabs value={appearance.autoSaveInterval} onChange={(autoSaveInterval) => patchAppearance({ autoSaveInterval })} items={[{ value: "30s", label: "30 sec" }, { value: "1m", label: "1 min" }, { value: "5m", label: "5 min" }, { value: "disabled", label: "Off" }]} />
                </SettingRow>
                <Button type="button" variant="secondary" loading={resetAppearanceState.isLoading} onClick={async () => {
                  if (!window.confirm("Reset all appearance settings?")) return;
                  try {
                    const updated = await resetAppearance().unwrap();
                    saveUser(updated);
                    dispatch(setTheme(updated.appearanceSettings?.theme ?? "system"));
                    dispatch(pushToast({ title: "Appearance reset", tone: "success" }));
                  } catch (error) {
                    toastError(error, "Could not reset appearance");
                  }
                }}><RefreshCcw size={16} /> Reset appearance</Button>
              </div>
            ) : null}

            {activeSection === "security" ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-ink-950 dark:text-ink-50">Security</h2>
                  <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">Control password, sessions, two-factor authentication, alerts, privacy, and deletion.</p>
                </div>

                <form onSubmit={onPassword} className="space-y-4 rounded-lg border border-ink-200 p-4 dark:border-ink-800">
                  <div className="flex items-center gap-2 font-medium text-ink-950 dark:text-ink-50"><Lock size={18} /> Password management</div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Input label="Current password" type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} required />
                    <Input label="New password" type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} required />
                    <Input label="Confirm password" type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} required />
                  </div>
                  <div className="text-sm text-ink-600 dark:text-ink-400">Strength: <span className="font-semibold text-ink-950 dark:text-ink-50">{strengthLabel(passwordForm.newPassword)}</span></div>
                  <Button loading={passwordState.isLoading}>Update password</Button>
                </form>

                <div className="space-y-3 rounded-lg border border-ink-200 p-4 dark:border-ink-800">
                  <div className="flex items-center gap-2 font-medium text-ink-950 dark:text-ink-50"><Laptop size={18} /> Active sessions</div>
                  {overview?.sessions.length ? overview.sessions.map((session) => (
                    <SettingRow key={session.id} title={`${session.device} - ${session.browser}`} description={`${session.os} - ${session.location ?? "Location unavailable"} - Last active ${session.lastActiveAt ? formatDate(session.lastActiveAt) : "Unknown"}`}>
                      {session.current ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">Current device</span> : <Button type="button" variant="secondary" loading={revokeSessionState.isLoading} onClick={() => revokeSession(session.id).unwrap().then(() => dispatch(pushToast({ title: "Session logged out", tone: "success" }))).catch((error) => toastError(error, "Could not log out session"))}>Log out</Button>}
                    </SettingRow>
                  )) : <p className="text-sm text-ink-500">No active sessions found.</p>}
                  <Button type="button" variant="secondary" loading={logoutAllState.isLoading} onClick={async () => {
                    if (!window.confirm("Log out every device?")) return;
                    await logoutAll().unwrap();
                    dispatch(logout());
                    navigate("/login");
                  }}>Log out all devices</Button>
                </div>

                <div className="space-y-3 rounded-lg border border-ink-200 p-4 dark:border-ink-800">
                  <div className="flex items-center gap-2 font-medium text-ink-950 dark:text-ink-50"><KeyRound size={18} /> Two-factor authentication</div>
                  <p className="text-sm text-ink-600 dark:text-ink-400">{effectiveUser.securitySettings?.twoFactorEnabled ? "Authenticator app protection is enabled." : "Add an authenticator app for an extra sign-in check."}</p>
                  {!effectiveUser.securitySettings?.twoFactorEnabled ? (
                    <div className="space-y-3">
                      <Button type="button" variant="secondary" loading={startTwoFactorState.isLoading} onClick={async () => setTwoFactorSetup(await startTwoFactor().unwrap())}>Start setup</Button>
                      {twoFactorSetup ? (
                        <div className="space-y-3 rounded-lg bg-ink-50 p-4 dark:bg-ink-950/60">
                          <p className="break-all text-sm text-ink-700 dark:text-ink-300">Secret: {twoFactorSetup.secret}</p>
                          <p className="break-all text-xs text-ink-500">{twoFactorSetup.otpauthUrl}</p>
                          <Input label="Authenticator code" value={twoFactorCode} onChange={(event) => setTwoFactorCode(event.target.value)} maxLength={6} />
                          <Button type="button" loading={enableTwoFactorState.isLoading} onClick={async () => {
                            try {
                              const result = await enableTwoFactor({ secret: twoFactorSetup.secret, token: twoFactorCode }).unwrap();
                              saveUser(result.user);
                              setBackupCodes(result.backupCodes);
                              dispatch(pushToast({ title: "Two-factor enabled", tone: "success" }));
                            } catch (error) {
                              toastError(error, "Could not enable two-factor authentication");
                            }
                          }}>Enable</Button>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Input label="Password confirmation" type="password" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} />
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="secondary" loading={backupCodesState.isLoading} onClick={async () => {
                          try {
                            const result = await regenerateBackupCodes({ password: passwordConfirm }).unwrap();
                            setBackupCodes(result.backupCodes);
                          } catch (error) {
                            toastError(error, "Could not regenerate backup codes");
                          }
                        }}>Regenerate codes</Button>
                        <Button type="button" variant="danger" loading={disableTwoFactorState.isLoading} onClick={async () => {
                          try {
                            const updated = await disableTwoFactor({ password: passwordConfirm }).unwrap();
                            saveUser(updated);
                            dispatch(pushToast({ title: "Two-factor disabled", tone: "success" }));
                          } catch (error) {
                            toastError(error, "Could not disable two-factor authentication");
                          }
                        }}>Disable 2FA</Button>
                      </div>
                    </div>
                  )}
                  {backupCodes.length ? <div className="grid gap-2 rounded-lg bg-ink-50 p-4 font-mono text-sm dark:bg-ink-950/60">{backupCodes.map((code) => <span key={code}>{code}</span>)}</div> : null}
                </div>

                <div className="space-y-3 rounded-lg border border-ink-200 p-4 dark:border-ink-800">
                  <div className="flex items-center gap-2 font-medium text-ink-950 dark:text-ink-50"><ShieldCheck size={18} /> Recovery, monitoring, and privacy</div>
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <Input label="Recovery email" value={recoveryEmail} onChange={(event) => setRecoveryEmail(event.target.value)} />
                    <Button className="self-end" type="button" loading={recoveryState.isLoading} onClick={async () => {
                      try {
                        saveUser(await updateRecovery({ recoveryEmail }).unwrap());
                        dispatch(pushToast({ title: "Recovery email saved", tone: "success" }));
                      } catch (error) {
                        toastError(error, "Could not save recovery email");
                      }
                    }}>Save</Button>
                  </div>
                  <SettingRow title="Email verification" description={effectiveUser.emailVerified ? "Your email is verified." : "Resend the verification email."}>
                    <Button type="button" variant="secondary" loading={resendState.isLoading} onClick={() => resendVerification().unwrap().then(() => dispatch(pushToast({ title: "Verification email queued", tone: "success" }))).catch((error) => toastError(error, "Could not resend verification"))}>Resend</Button>
                  </SettingRow>
                  <SettingRow title="Email alerts"><Toggle checked={effectiveUser.securitySettings?.emailAlerts ?? true} onChange={(emailAlerts) => updateRecovery({ emailAlerts }).unwrap().then(saveUser).catch((error) => toastError(error, "Could not save alerts"))} /></SettingRow>
                  <SettingRow title="In-app notifications"><Toggle checked={effectiveUser.securitySettings?.inAppNotifications ?? true} onChange={(inAppNotifications) => updateRecovery({ inAppNotifications }).unwrap().then(saveUser).catch((error) => toastError(error, "Could not save notifications"))} /></SettingRow>
                  {[
                    ["Public profile", privacy.profileVisibility === "public", (checked: boolean) => patchPrivacy({ profileVisibility: checked ? "public" : "private" })],
                    ["Show email", privacy.showEmail, (checked: boolean) => patchPrivacy({ showEmail: checked })],
                    ["Show join date", privacy.showJoinDate, (checked: boolean) => patchPrivacy({ showJoinDate: checked })],
                    ["Show social links", privacy.showSocialLinks, (checked: boolean) => patchPrivacy({ showSocialLinks: checked })]
                  ].map(([title, checked, onChange]) => (
                    <SettingRow key={title as string} title={title as string}><Toggle checked={checked as boolean} disabled={privacyState.isLoading} onChange={onChange as (checked: boolean) => void} /></SettingRow>
                  ))}
                </div>

                <div className="space-y-3 rounded-lg border border-ink-200 p-4 dark:border-ink-800">
                  <p className="font-medium text-ink-950 dark:text-ink-50">Login activity</p>
                  {overview?.activity.length ? overview.activity.map((event) => (
                    <div key={event.id} className="rounded-lg bg-ink-50 p-3 text-sm dark:bg-ink-950/60">
                      <p className="font-medium text-ink-950 dark:text-ink-50">{settingLabel[event.type] ?? event.type}</p>
                      <p className="mt-1 text-ink-600 dark:text-ink-400">{event.device ?? "Unknown device"} - {event.browser ?? "Unknown browser"} - {event.ipAddress ?? "IP unavailable"} - {event.time ? formatDate(event.time) : "Unknown time"}</p>
                    </div>
                  )) : <p className="text-sm text-ink-500">No login activity yet.</p>}
                </div>

                <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100">
                  <div className="flex items-center gap-2 font-semibold"><Trash2 size={18} /> Delete account</div>
                  <p className="text-sm">This removes your profile access, revokes every session, and schedules your content for removal from Upwrite.</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input label="Password" type="password" value={deleteForm.password} onChange={(event) => setDeleteForm({ ...deleteForm, password: event.target.value })} />
                    <Input label="Type DELETE MY ACCOUNT" value={deleteForm.confirmation} onChange={(event) => setDeleteForm({ ...deleteForm, confirmation: event.target.value })} />
                  </div>
                  <Button type="button" variant="danger" loading={deleteState.isLoading} onClick={async () => {
                    if (!window.confirm("Final confirmation: delete this account?")) return;
                    try {
                      await deleteAccount(deleteForm).unwrap();
                      dispatch(logout());
                      navigate("/login");
                    } catch (error) {
                      toastError(error, "Could not delete account");
                    }
                  }}>Delete account</Button>
                </div>
              </div>
            ) : null}
          </Card>
        </div>

        <div className="space-y-6">
          {activeSection === "profile" ? (
            <Card className="rounded-lg border border-ink-200 bg-ink-50 p-6 dark:border-ink-800 dark:bg-ink-950/70">
              <p className="text-sm uppercase tracking-[0.24em] text-accent-700 dark:text-accent-300">Preview</p>
              <div className="mt-6 space-y-5 rounded-lg border border-ink-200 bg-white p-5 shadow-sm dark:border-ink-800 dark:bg-ink-900">
                <p className="text-lg font-semibold text-ink-950 dark:text-ink-50">{previewData.name}</p>
                <p className="text-sm leading-6 text-ink-600 dark:text-ink-400">{previewData.bio}</p>
                <div className="flex flex-wrap gap-2">{previewData.skills.map((skill) => <span key={skill} className="rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-700 dark:bg-ink-800 dark:text-ink-200">{skill}</span>)}</div>
              </div>
            </Card>
          ) : (
            <Card className="space-y-4 rounded-lg border border-ink-200 bg-ink-50 p-6 dark:border-ink-800 dark:bg-ink-950/70">
              <h2 className="text-xl font-semibold text-ink-950 dark:text-ink-50">Protection summary</h2>
              <p className="text-sm text-ink-600 dark:text-ink-400">2FA: {effectiveUser.securitySettings?.twoFactorEnabled ? "Enabled" : "Disabled"}</p>
              <p className="text-sm text-ink-600 dark:text-ink-400">Sessions: {overview?.sessions.length ?? 0}</p>
              <p className="text-sm text-ink-600 dark:text-ink-400">Monitoring: {overview?.monitoring.multipleFailedAttempts ? "Recent failed-attempt alert" : "No recent alerts"}</p>
            </Card>
          )}
        </div>
      </div>
      <ProductTourOverlay
        open={replayTour}
        onClose={async (completed) => {
          setReplayTour(false);
          if (!completed) return;
          try {
            const updated = await completeProductTour().unwrap();
            saveUser(updated);
            dispatch(pushToast({ title: "Product tour replayed", tone: "success" }));
          } catch (error) {
            toastError(error, "Could not update tour status");
          }
        }}
      />
    </div>
  );
}
