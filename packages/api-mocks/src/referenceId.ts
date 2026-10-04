const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function referenceIdFor(key: string | null): string {
  let seed = key ? hash(key) : Math.floor(Math.random() * 0xffffffff);
  let out = '';
  for (let i = 0; i < 6; i += 1) {
    out += ALPHABET.charAt(seed % ALPHABET.length);
    seed = Math.floor(seed / ALPHABET.length) || hash(`${key ?? ''}${i}`);
  }
  return `APP-${out}`;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}
