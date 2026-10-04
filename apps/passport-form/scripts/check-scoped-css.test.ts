import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from '@rstest/core';

const tempDirs: string[] = [];

function fixture(
  css: string,
  assets: string[] = ['static/css/PassportForm.css'],
  manifest = true,
): string {
  const dist = mkdtempSync(path.join(tmpdir(), 'passport-form-css-'));
  tempDirs.push(dist);
  const cssDir = path.join(dist, 'static', 'css');
  mkdirSync(cssDir, { recursive: true });
  if (assets.length > 0) writeFileSync(path.join(cssDir, 'PassportForm.css'), css);
  if (manifest) {
    writeFileSync(
      path.join(dist, 'mf-manifest.json'),
      JSON.stringify({
        exposes: [
          {
            path: './PassportForm',
            assets: { css: { sync: assets, async: [] } },
          },
        ],
      }),
    );
  }
  return dist;
}

function runCheck(dist: string): { status: number; output: string } {
  try {
    const output = execFileSync(process.execPath, ['scripts/check-scoped-css.mjs'], {
      cwd: import.meta.dirname + '/..',
      env: { ...process.env, CHECK_SCOPED_CSS_DIST: dist },
      encoding: 'utf8',
    });
    return { status: 0, output };
  } catch (error) {
    const result = error as { status: number; stdout: string; stderr: string };
    return { status: result.status, output: `${result.stdout}${result.stderr}` };
  }
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('check-scoped-css', () => {
  it('accepts selectors scoped to the remote root while preserving Tailwind at-rules', () => {
    const result = runCheck(
      fixture(`
        @layer utilities { [data-passport-form-root] .rounded-md { border-radius: 0.375rem; } }
        @property --tw-rotate-x { syntax: '*'; inherits: false; initial-value: 0deg; }
        @keyframes enter { 12.5% { opacity: 0; } to { opacity: 1; } }
      `),
    );

    expect(result).toMatchObject({ status: 0 });
  });

  it('fails when a remote selector loses its root scope', () => {
    const result = runCheck(fixture('.rounded-md { border-radius: 0.375rem; }'));

    expect(result.status).toBe(1);
    expect(result.output).toContain('Unscoped selectors');
  });

  it('fails when a dark condition can follow the host class', () => {
    const result = runCheck(
      fixture(`${'[data-passport-form-root]'} .dark\\:bg-input\\/30:is(.dark *) { color: red; }`),
    );

    expect(result.status).toBe(1);
    expect(result.output).toContain('Unanchored dark selector');
  });

  it('fails when the exposed module has no CSS assets', () => {
    const result = runCheck(fixture('', []));

    expect(result.status).toBe(1);
    expect(result.output).toContain('has no CSS assets');
  });

  it('fails when the federation manifest is missing', () => {
    const result = runCheck(
      fixture('.btn { color: red; }', ['static/css/PassportForm.css'], false),
    );

    expect(result.status).toBe(1);
    expect(result.output).toContain('Missing mf-manifest.json');
  });
});
