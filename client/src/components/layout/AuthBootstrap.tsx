import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { setCredentials, setCurrentUser, setInitialized } from "../../features/auth/authSlice";
import { useLazyMeQuery, useRefreshMutation } from "../../features/auth/authApi";
import { setTheme } from "../../features/ui/uiSlice";

export const AuthBootstrap = () => {
  const dispatch = useAppDispatch();
  const initialized = useAppSelector((state) => state.auth.initialized);
  const started = useRef(false);
  const [refresh] = useRefreshMutation();
  const [loadMe] = useLazyMeQuery();

  useEffect(() => {
    if (initialized || started.current) return;
    started.current = true;

    const boot = async () => {
      try {
        const tokenResult = await refresh().unwrap();
        dispatch(setCredentials({ accessToken: tokenResult.accessToken }));
        const user = await loadMe().unwrap();
        dispatch(setCurrentUser(user));
        dispatch(setTheme(user.appearanceSettings?.theme ?? "system"));
      } catch {
        dispatch(setCurrentUser(null));
      } finally {
        dispatch(setInitialized(true));
      }
    };

    void boot();
  }, [dispatch, initialized, loadMe, refresh]);

  return null;
};
