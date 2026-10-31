import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { setCredentials, setCurrentUser, setInitialized } from "../../features/auth/authSlice";
import { useLazyMeQuery, useRefreshMutation } from "../../features/auth/authApi";
import { setTheme } from "../../features/ui/uiSlice";
import { buildResumeNavigationState, consumeAuthIntent } from "../../features/auth/authIntent";
import { isNetworkError } from "../../utils/errors";

export const AuthBootstrap = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const initialized = useAppSelector((state) => state.auth.initialized);
  const started = useRef(false);
  const removeRetryListener = useRef<(() => void) | null>(null);
  const [refresh] = useRefreshMutation();
  const [loadMe] = useLazyMeQuery();

  // Only remove the reconnect listener on unmount (the effect below re-runs when
  // `initialized` flips, which must not cancel a pending retry).
  useEffect(() => () => removeRetryListener.current?.(), []);

  useEffect(() => {
    if (initialized || started.current) return;
    started.current = true;

    const boot = async (isRetry: boolean) => {
      try {
        const tokenResult = await refresh().unwrap();
        dispatch(setCredentials({ accessToken: tokenResult.accessToken }));
        const user = await loadMe().unwrap();
        dispatch(setCurrentUser(user));
        const storedTheme = localStorage.getItem("upwrite-theme") as "light" | "dark" | "system" | null;
        if (storedTheme === "light" || storedTheme === "dark") {
          dispatch(setTheme(storedTheme));
        } else if (user.appearanceSettings?.theme === "light" || user.appearanceSettings?.theme === "dark") {
          dispatch(setTheme(user.appearanceSettings.theme));
        } else {
          dispatch(setTheme("dark"));
        }
        const intent = consumeAuthIntent();
        if (intent) {
          navigate(intent.path, { replace: true, state: buildResumeNavigationState(intent) });
        }
      } catch (error) {
        if (!isRetry) dispatch(setCurrentUser(null));
        // Opened while offline (e.g. launching the installed app without a connection):
        // restore the session automatically once the network is back.
        if (isNetworkError(error) && !removeRetryListener.current) {
          const onOnline = () => {
            removeRetryListener.current?.();
            void boot(true);
          };
          window.addEventListener("online", onOnline);
          removeRetryListener.current = () => {
            window.removeEventListener("online", onOnline);
            removeRetryListener.current = null;
          };
        }
      } finally {
        if (!isRetry) dispatch(setInitialized(true));
      }
    };

    void boot(false);
  }, [dispatch, initialized, loadMe, navigate, refresh]);

  return null;
};
