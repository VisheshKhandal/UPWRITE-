import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RootLayout } from "../layouts/RootLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { AppLayout } from "../layouts/AppLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicOnlyRoute } from "./PublicOnlyRoute";

const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("../pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("../pages/auth/ResetPasswordPage"));
const FeedPage = lazy(() => import("../pages/feed/FeedPage"));
const ArticleDetailPage = lazy(() => import("../pages/articles/ArticleDetailPage"));
const WritePage = lazy(() => import("../pages/write/WritePage"));
const ProfilePage = lazy(() => import("../pages/profile/ProfilePage"));
const SearchPage = lazy(() => import("../pages/search/SearchPage"));
const NotificationsPage = lazy(() => import("../pages/notifications/NotificationsPage"));
const SavedPage = lazy(() => import("../pages/collections/SavedPage"));
const ProfileSettingsPage = lazy(() => import("../pages/settings/ProfileSettingsPage"));
const AboutPage = lazy(() => import("../pages/about/AboutPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));

const PageLoader = () => (
  <div className="grid min-h-[50vh] place-items-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-300 border-t-ink-950 dark:border-ink-700 dark:border-t-ink-50" />
  </div>
);

export const AppRouter = () => (
  <BrowserRouter>
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<RootLayout />}>
          <Route element={<PublicOnlyRoute />}>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>
          </Route>

          <Route element={<AppLayout />}>
            <Route path="/articles/:username/:slug" element={<ArticleDetailPage />} />
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/about" element={<AboutPage />} />

            <Route element={<ProtectedRoute />}>
              <Route index element={<FeedPage />} />
              <Route path="/write" element={<WritePage />} />
              <Route path="/write/:id" element={<WritePage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/saved" element={<SavedPage />} />
              <Route path="/bookmarks" element={<Navigate to="/saved" replace />} />
              <Route path="/collections" element={<Navigate to="/saved" replace />} />
              <Route path="/settings/profile" element={<ProfileSettingsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  </BrowserRouter>
);
