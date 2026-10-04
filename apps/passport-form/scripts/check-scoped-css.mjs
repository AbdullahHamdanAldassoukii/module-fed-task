import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';

const ROOT = '[data-passport-form-root]';
const dist = path.resolve(import.meta.dirname, process.env.CHECK_SCOPED_CSS_DIST ?? '../dist');

function splitSelectors(selector) {
  const selectors = [];
  let start = 0;
  let depth = 0;
  let quote = '';

  for (let index = 0; index < selector.length; index += 1) {
    const character = selector[index];
    if (character === '\\') {
      index += 1;
      continue;
    }
    if (quote) {
      if (character === quote) quote = '';
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === '(' || character === '[') depth += 1;
    if (character === ')' || character === ']') depth -= 1;
    if (character === ',' && depth === 0) {
      selectors.push(selector.slice(start, index).trim());
      start = index + 1;
    }
  }

  selectors.push(selector.slice(start).trim());
  return selectors.filter(Boolean);
}

const manifestPath = path.join(dist, 'mf-manifest.json');

if (!existsSync(manifestPath)) {
  console.error(`Missing mf-manifest.json: ${manifestPath}`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const expose = manifest.exposes?.find((item) => item.path === './PassportForm');
const cssAssets = expose
  ? [...(expose.assets.css.sync ?? []), ...(expose.assets.css.async ?? [])]
  : [];

if (cssAssets.length === 0) {
  console.error('The ./PassportForm expose has no CSS assets.');
  process.exit(1);
}

const remoteCss = cssAssets.map((asset) => path.join(dist, asset));
const offenders = [];

for (const file of remoteCss) {
  if (!existsSync(file)) {
    offenders.push(`Missing CSS asset: ${path.relative(dist, file)}`);
    continue;
  }

  const css = readFileSync(file, 'utf8');
  const stylesheet = postcss.parse(css, { from: file });

  stylesheet.walkRules((rule) => {
    if (rule.parent?.type === 'atrule' && /keyframes$/.test(rule.parent.name ?? '')) return;

    for (const part of splitSelectors(rule.selector)) {
      if (!part.startsWith(ROOT) && !/^(from|to|\d+%)$/.test(part)) {
        offenders.push(`${path.basename(file)}: ${part}`);
      }
      for (const match of part.matchAll(/(?<!\\)\.dark(?![\\\w-])/g)) {
        if (part.slice(match.index - ROOT.length, match.index) !== ROOT) {
          offenders.push(`Unanchored dark selector: ${path.basename(file)}: ${part}`);
        }
      }
    }
  });
}

if (offenders.length > 0) {
  console.error(`Unscoped selectors in remote CSS:\n${offenders.slice(0, 30).join('\n')}`);
  process.exit(1);
}

console.log(`ok: ${remoteCss.length} remote css file(s) fully scoped under ${ROOT}`);
