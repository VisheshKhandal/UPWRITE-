import type { ContentType } from "../../types/models";

export interface AuthIntent {
  path: string;
  reason?: string;
  action?: string;
  contentType?: ContentType;
  contentId?: string;
}

export interface ResumeAuthActionState {
  resumeAction?: string;
  resumeContentType?: ContentType;
  resumeContentId?: string;
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

export const buildResumeNavigationState = (
  intent: AuthIntent | null | undefined
): ResumeAuthActionState | undefined => {
  if (!intent?.action) return undefined;
  return {
    resumeAction: intent.action,
    resumeContentType: intent.contentType,
    resumeContentId: intent.contentId
  };
};

export const matchesResumedContentAction = (
  state: unknown,
  expectedAction: string,
  contentType: ContentType,
  contentId: string
): boolean => {
  if (!state || typeof state !== "object") return false;
  const candidate = state as ResumeAuthActionState;
  return (
    candidate.resumeAction === expectedAction &&
    candidate.resumeContentType === contentType &&
    Boolean(contentId) &&
    candidate.resumeContentId === contentId
  );
};
