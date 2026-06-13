import { baseApi, unwrapResponse } from "../../services/baseApi";
import type { ApiResponse } from "../../types/api";
import type { AppearanceSettings, PrivacySettings, User } from "../../types/models";

export interface SessionInfo {
  id: string;
  device: string;
  browser: string;
  os: string;
  ipAddress?: string;
  location?: string;
  lastActiveAt?: string;
  createdAt?: string;
  expiresAt?: string;
  current: boolean;
}

export interface SecurityActivity {
  id: string;
  type: string;
  device?: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  location?: string;
  time?: string;
  metadata?: Record<string, unknown>;
}

export interface SettingsOverview {
  user: User;
  sessions: SessionInfo[];
  activity: SecurityActivity[];
  monitoring: {
    newDeviceLogin: boolean;
    unusualLocationLogin: boolean;
    multipleFailedAttempts: boolean;
  };
}

export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
  account: string;
}

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    settingsOverview: builder.query<SettingsOverview, void>({
      query: () => "/settings",
      transformResponse: (response: ApiResponse<SettingsOverview>) => unwrapResponse(response),
      providesTags: ["Settings"]
    }),
    updateAppearance: builder.mutation<User, Partial<AppearanceSettings>>({
      query: (body) => ({ url: "/settings/appearance", method: "PATCH", body }),
      transformResponse: (response: ApiResponse<User>) => unwrapResponse(response),
      invalidatesTags: ["Settings", "Auth", "User"]
    }),
    resetAppearance: builder.mutation<User, void>({
      query: () => ({ url: "/settings/appearance/reset", method: "POST" }),
      transformResponse: (response: ApiResponse<User>) => unwrapResponse(response),
      invalidatesTags: ["Settings", "Auth", "User"]
    }),
    updatePrivacy: builder.mutation<User, Partial<PrivacySettings>>({
      query: (body) => ({ url: "/settings/privacy", method: "PATCH", body }),
      transformResponse: (response: ApiResponse<User>) => unwrapResponse(response),
      invalidatesTags: ["Settings", "Auth", "User"]
    }),
    updatePassword: builder.mutation<null, { currentPassword: string; newPassword: string; confirmPassword: string }>({
      query: (body) => ({ url: "/settings/password", method: "PATCH", body }),
      transformResponse: (response: ApiResponse<null>) => unwrapResponse(response),
      invalidatesTags: ["Settings", "Auth"]
    }),
    revokeSession: builder.mutation<null, string>({
      query: (id) => ({ url: `/settings/sessions/${id}`, method: "DELETE" }),
      transformResponse: (response: ApiResponse<null>) => unwrapResponse(response),
      invalidatesTags: ["Settings"]
    }),
    startTwoFactor: builder.mutation<TwoFactorSetup, void>({
      query: () => ({ url: "/settings/2fa/start", method: "POST" }),
      transformResponse: (response: ApiResponse<TwoFactorSetup>) => unwrapResponse(response)
    }),
    enableTwoFactor: builder.mutation<{ user: User; backupCodes: string[] }, { secret: string; token: string }>({
      query: (body) => ({ url: "/settings/2fa/enable", method: "POST", body }),
      transformResponse: (response: ApiResponse<{ user: User; backupCodes: string[] }>) => unwrapResponse(response),
      invalidatesTags: ["Settings", "Auth", "User"]
    }),
    disableTwoFactor: builder.mutation<User, { password: string }>({
      query: (body) => ({ url: "/settings/2fa/disable", method: "POST", body }),
      transformResponse: (response: ApiResponse<User>) => unwrapResponse(response),
      invalidatesTags: ["Settings", "Auth", "User"]
    }),
    regenerateBackupCodes: builder.mutation<{ backupCodes: string[] }, { password: string }>({
      query: (body) => ({ url: "/settings/2fa/backup-codes", method: "POST", body }),
      transformResponse: (response: ApiResponse<{ backupCodes: string[] }>) => unwrapResponse(response),
      invalidatesTags: ["Settings"]
    }),
    updateRecovery: builder.mutation<User, { recoveryEmail?: string; emailAlerts?: boolean; inAppNotifications?: boolean }>({
      query: (body) => ({ url: "/settings/recovery", method: "PATCH", body }),
      transformResponse: (response: ApiResponse<User>) => unwrapResponse(response),
      invalidatesTags: ["Settings", "Auth", "User"]
    }),
    completeOnboarding: builder.mutation<
      User,
      {
        interests: string[];
        identity: NonNullable<User["onboarding"]>["identity"];
        goals: NonNullable<User["onboarding"]>["goals"];
        learningPreferences: NonNullable<User["onboarding"]>["learningPreferences"];
        writingPreferences: NonNullable<User["onboarding"]>["writingPreferences"];
        tourCompleted?: boolean;
      }
    >({
      query: (body) => ({ url: "/settings/onboarding", method: "POST", body }),
      transformResponse: (response: ApiResponse<User>) => unwrapResponse(response),
      invalidatesTags: ["Settings", "Auth", "User", "Feed", "Explore"]
    }),
    completeProductTour: builder.mutation<User, void>({
      query: () => ({ url: "/settings/onboarding/tour", method: "POST" }),
      transformResponse: (response: ApiResponse<User>) => unwrapResponse(response),
      invalidatesTags: ["Settings", "Auth", "User"]
    }),
    resendVerification: builder.mutation<null, void>({
      query: () => ({ url: "/settings/verification/resend", method: "POST" }),
      transformResponse: (response: ApiResponse<null>) => unwrapResponse(response),
      invalidatesTags: ["Settings"]
    }),
    deleteAccount: builder.mutation<null, { password: string; confirmation: string }>({
      query: (body) => ({ url: "/settings/account", method: "DELETE", body }),
      transformResponse: (response: ApiResponse<null>) => unwrapResponse(response),
      invalidatesTags: ["Settings", "Auth"]
    })
  })
});

export const {
  useSettingsOverviewQuery,
  useUpdateAppearanceMutation,
  useResetAppearanceMutation,
  useUpdatePrivacyMutation,
  useUpdatePasswordMutation,
  useRevokeSessionMutation,
  useStartTwoFactorMutation,
  useEnableTwoFactorMutation,
  useDisableTwoFactorMutation,
  useRegenerateBackupCodesMutation,
  useUpdateRecoveryMutation,
  useCompleteOnboardingMutation,
  useCompleteProductTourMutation,
  useResendVerificationMutation,
  useDeleteAccountMutation
} = settingsApi;
