import tailwind from '@tailwindcss/postcss';
import prefixSelector from 'postcss-prefix-selector';

export const ROOT = '[data-passport-form-root]';

export function scopeSelector(prefix, selector, prefixedSelector) {
  const scopedSelector = selector.replaceAll(':is(.dark *)', `:is(${prefix}.dark *)`);
  const globals = scopedSelector.split(',').map((part) => part.trim());

  if (globals.every((part) => [':root', 'html', ':host', 'body'].includes(part))) return prefix;
  if (selector === '.dark' || selector.startsWith('.dark ')) {
    return selector.replace(/^\.dark/, `${prefix}.dark`);
  }
  if (selector.startsWith(prefix)) return scopedSelector;
  return prefixedSelector.replaceAll(':is(.dark *)', `:is(${prefix}.dark *)`);
}

export default {
  plugins: [
    tailwind(),
    prefixSelector({
      prefix: ROOT,
      ignoreFiles: [/standalone\./],
      transform: scopeSelector,
    }),
  ],
};
