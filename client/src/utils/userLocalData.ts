/**
 * Some features keep user-specific data in localStorage (draft history snapshots and
 * recent searches). On a shared device, or when switching accounts, that data must not be
 * shown to the next person, so it is tied to the user who created it.
 */

const OWNER_KEY = "upwrite.localData.owner.v1";
const USER_SCOPED_PREFIXES = ["upwrite-article-history-", "upwrite-recent-searches"];

const userScopedKeys = () => {
  const keys: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key && USER_SCOPED_PREFIXES.some((prefix) => key.startsWith(prefix))) keys.push(key);
  }
  return keys;
};

export const clearUserScopedStorage = () => {
  try {
    userScopedKeys().forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem(OWNER_KEY);
  } catch {
    // Storage can be unavailable (private mode / quota); nothing to clear then.
  }
};

/** Call when a user is signed in. Clears data left behind by a different account. */
export const claimUserScopedStorage = (userId: string) => {
  try {
    const owner = localStorage.getItem(OWNER_KEY);
    if (owner && owner !== userId) {
      userScopedKeys().forEach((key) => localStorage.removeItem(key));
    }
    localStorage.setItem(OWNER_KEY, userId);
  } catch {
    // Ignore storage failures.
  }
};

