export interface AuthIntent {
  path: string;
  reason?: string;
  action?: string;
}

const AUTH_INTENT_KEY = "upwrite.authIntent.v1";

export const getCurrentAuthPath = () => `${window.location.pathname}${window.location.search}${window.location.hash}`;

export const saveAuthIntent = (intent: AuthIntent) => {
  sessionStorage.setItem(AUTH_INTENT_KEY, JSON.stringify(intent));
};

export const consumeAuthIntent = (): AuthIntent | null => {
  const value = sessionStorage.getItem(AUTH_INTENT_KEY);
  if (!value) return null;
  sessionStorage.removeItem(AUTH_INTENT_KEY);

  try {
    return JSON.parse(value) as AuthIntent;
  } catch {
    return null;
  }
};
