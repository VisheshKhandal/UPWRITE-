import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../app/hooks";

export const PublicOnlyRoute = () => {
  const { accessToken, initialized } = useAppSelector((state) => state.auth);

  if (!initialized) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-300 border-t-ink-950 dark:border-ink-700 dark:border-t-ink-50" />
      </div>
    );
  }

  return accessToken ? <Navigate to="/" replace /> : <Outlet />;
};
