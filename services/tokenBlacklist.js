const blacklist = new Map();

const CLEANUP_INTERVAL = 60 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, exp] of blacklist) {
    if (exp <= now) blacklist.delete(key);
  }
}, CLEANUP_INTERVAL);

export function addToBlacklist(token, ttlMs) {
  blacklist.set(token, Date.now() + ttlMs);
}

export function isBlacklisted(token) {
  const exp = blacklist.get(token);
  if (!exp) return false;
  if (exp <= Date.now()) {
    blacklist.delete(token);
    return false;
  }
  return true;
}
