declare const messageKeyBrand: unique symbol;

const dateParamBrand = Symbol('dateParam');
const messageBrand = Symbol('message');

export type MessageKey<Path extends string = string> = Path & {
  readonly [messageKeyBrand]: Path;
};

export type IsoDate = `${number}${number}${number}${number}-${number}${number}-${number}${number}`;

export interface DateParam {
  readonly iso: IsoDate;
  readonly [dateParamBrand]: true;
}

export type MessageParam = string | number | DateParam;

export type ReservedTranslationVarName =
  | 'count'
  | 'lng'
  | 'lngs'
  | 'fallbackLng'
  | 'ns'
  | 'keySeparator'
  | 'nsSeparator'
  | 'context'
  | 'defaultValue'
  | 'returnObjects'
  | 'returnDetails'
  | 'joinArrays'
  | 'ordinal'
  | 'replace'
  | 'keyPrefix'
  | 'postProcess'
  | 'interpolation';

export type TranslationVars = Record<string, MessageParam> &
  Partial<Record<ReservedTranslationVarName, never>>;

export interface Message<Resources extends object> {
  readonly key: TranslationKey<Resources>;
  readonly params?: TranslationVars;
  readonly [messageBrand]: true;
}

interface KeyedMessage<Key extends MessageKey> {
  readonly key: Key;
  readonly params?: TranslationVars;
  readonly [messageBrand]: true;
}

type TranslationPath<Resources> = {
  [K in keyof Resources & string]: Resources[K] extends string
    ? K
    : Resources[K] extends readonly unknown[]
      ? never
      : Resources[K] extends object
        ? `${K}.${TranslationPath<Resources[K]>}`
        : never;
}[keyof Resources & string];

export type TranslationKey<Resources> = MessageKey<TranslationPath<Resources>>;

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function isIsoDate(value: string): value is IsoDate {
  return isValidIsoDate(value);
}

export function dateParam(iso: IsoDate): DateParam {
  if (!isValidIsoDate(iso)) throw new TypeError(`Invalid ISO date: ${iso}`);
  return Object.freeze({ iso, [dateParamBrand]: true as const });
}

export function message<Key extends MessageKey>(
  key: Key,
  params?: TranslationVars,
): KeyedMessage<Key> {
  return Object.freeze(
    params === undefined
      ? { key, [messageBrand]: true as const }
      : { key, params, [messageBrand]: true as const },
  );
}

export function isDateParam(value: MessageParam): value is DateParam {
  return typeof value === 'object' && value !== null && value[dateParamBrand] === true;
}

export function isMessage<Resources extends object>(
  value: TranslationKey<Resources> | Message<Resources>,
): value is Message<Resources> {
  return typeof value === 'object' && value !== null && value[messageBrand] === true;
}
