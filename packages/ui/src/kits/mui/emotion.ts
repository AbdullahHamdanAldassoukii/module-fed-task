import createCache, { type EmotionCache } from '@emotion/cache';
import rtlPlugin from '@mui/stylis-plugin-rtl';
import { prefixer } from 'stylis';
import type { Direction } from '../../api';

const caches = new Map<string, EmotionCache>();

export function getEmotionCache(scope: string, direction: Direction): EmotionCache {
  const key = direction === 'rtl' ? `${scope}-rtl` : scope;
  let cache = caches.get(key);
  if (!cache) {
    // Separate keys prevent host and remote class-name collisions.
    cache = createCache({
      key,
      prepend: true,
      stylisPlugins: direction === 'rtl' ? [prefixer, rtlPlugin] : [prefixer],
    });
    caches.set(key, cache);
  }
  return cache;
}
