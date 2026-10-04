import type { MessageKey } from './message';

type JoinPath<Prefix extends string, Key extends string> = Prefix extends ''
  ? Key
  : `${Prefix}.${Key}`;

export type MessageKeyTree<Resources, Prefix extends string = ''> = {
  readonly [Key in keyof Resources]: Resources[Key] extends string
    ? MessageKey<JoinPath<Prefix, Key & string>>
    : Resources[Key] extends readonly unknown[]
      ? never
      : Resources[Key] extends object
        ? MessageKeyTree<Resources[Key], JoinPath<Prefix, Key & string>>
        : never;
};

export interface MessageResources {
  readonly [key: string]: string | MessageResources;
}

function buildMessageKeys(
  resources: Record<string, unknown>,
  prefix = '',
): Readonly<Record<string, unknown>> {
  const keys: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(resources)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      keys[key] = path;
      continue;
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys[key] = buildMessageKeys(value as Record<string, unknown>, path);
      continue;
    }
    throw new TypeError(`Message resource at "${path}" must be a string or object`);
  }
  return Object.freeze(keys);
}

export function createMessageKeys<Resources extends MessageResources>(
  resources: Resources,
): MessageKeyTree<Resources> {
  return buildMessageKeys(resources) as MessageKeyTree<Resources>;
}
