const cache = new Map();
const pending = new Map();

export function getCached(key, ttl = 60) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCache(key, data, ttl = 60) {
  cache.set(key, { data, expires: Date.now() + ttl * 1000 });
}

export function delCache(key) {
  cache.delete(key);
}

export function delCachePrefix(prefix) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

export async function withCache(key, fn, ttl = 60) {
  const cached = getCached(key, ttl);
  if (cached) return cached;

  if (pending.has(key)) return pending.get(key);

  const promise = fn().then(data => {
    setCache(key, data, ttl);
    pending.delete(key);
    return data;
  }).catch(err => {
    pending.delete(key);
    throw err;
  });

  pending.set(key, promise);
  return promise;
}

export function clearAllCache() {
  cache.clear();
  pending.clear();
}
