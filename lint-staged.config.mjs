import { existsSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

const CODE_FILES = '*.{ts,tsx,js,mjs,cjs}';
const ESLINT_CONFIG_NAMES = [
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  'eslint.config.ts',
];

function packageDirectory(file) {
  let directory = dirname(resolve(file));
  const root = resolve('.');

  while (directory.startsWith(root)) {
    if (existsSync(join(directory, 'package.json'))) return directory;
    if (directory === root) return undefined;
    directory = dirname(directory);
  }

  return undefined;
}

function hasEslintConfig(file) {
  const directory = packageDirectory(file);
  const sourceFile =
    directory === undefined ? undefined : relative(join(directory, 'src'), resolve(file));

  return (
    directory !== undefined &&
    sourceFile !== undefined &&
    sourceFile !== '' &&
    sourceFile !== '..' &&
    !sourceFile.startsWith(`..${sep}`) &&
    !isAbsolute(sourceFile) &&
    ESLINT_CONFIG_NAMES.some((name) => existsSync(join(directory, name)))
  );
}

function stringArgvQuote(file) {
  const relativeFile = relative(resolve('.'), resolve(file));

  if (
    relativeFile === '' ||
    relativeFile === '..' ||
    relativeFile.startsWith(`..${sep}`) ||
    isAbsolute(relativeFile)
  ) {
    throw new Error(`Staged file is outside the repository: ${file}`);
  }
  if (relativeFile.includes('"')) {
    throw new Error(`Staged file contains an unsupported double quote: ${relativeFile}`);
  }

  return `"${relativeFile}"`;
}

function formatFiles(files) {
  return `prettier --write ${files.map(stringArgvQuote).join(' ')}`;
}

export default {
  [CODE_FILES]: (files) => {
    const eslintFiles = files.filter(hasEslintConfig);
    const commands = [formatFiles(files)];

    if (eslintFiles.length > 0) {
      commands.unshift(
        `eslint --flag v10_config_lookup_from_file --fix --no-warn-ignored ${eslintFiles.map(stringArgvQuote).join(' ')}`,
      );
    }

    return commands;
  },
  '*.{json,md,yml,yaml,css}': ['prettier --write'],
};
