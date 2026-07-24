export type OAuthProvider = "google" | "github";

const API_URL = import.meta.env.VITE_API_URL ?? "/api/v1";

export const startOAuth = (provider: OAuthProvider) => {
  const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.assign(`${API_URL}/auth/${provider}?returnTo=${encodeURIComponent(returnTo)}`);
};
