import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../src/kits/shadcn');
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
  );

for (const file of walk(root).filter((f) => /\.(ts|tsx)$/.test(f))) {
  const src = readFileSync(file, 'utf8');
  const out = src.replace(/from ["']@\/([^"']+)["']/g, (_match, target) => {
    let rel = path.relative(path.dirname(file), path.join(root, target)).replace(/\\/g, '/');
    if (!rel.startsWith('.')) rel = `./${rel}`;
    return `from '${rel}'`;
  });
  if (out !== src) writeFileSync(file, out);
}
