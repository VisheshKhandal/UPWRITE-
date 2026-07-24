export type OAuthProvider = "google" | "github";

const API_URL = import.meta.env.VITE_API_URL ?? "/api/v1";

export const startOAuth = (provider: OAuthProvider) => {
  window.location.assign(`${API_URL}/auth/${provider}`);
};
