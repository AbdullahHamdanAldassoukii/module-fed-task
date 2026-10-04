# @repo/i18n

`@repo/i18n` provides typed translation keys and isolated i18next instances for each app.

```ts
import {
  createI18n,
  createMessageKeys,
  createUseT,
  dateParam,
  I18nProvider,
  isIsoDate,
  message,
} from '@repo/i18n';

const M = createMessageKeys(en);
const useT = createUseT<typeof en>();
const i18n = createI18n({ resources, lng: 'en' });

function EventDate({ value }: { value: string }) {
  const { t } = useT();
  if (!isIsoDate(value)) return null;
  return t(message(M.event.date, { when: dateParam(value) }));
}

const app = <I18nProvider i18n={i18n}>{/* application */}</I18nProvider>;
```

`createMessageKeys` mirrors a resource tree with deeply frozen key constants. Pass these
constants to `t`, never a free-text or template-string key. The shared `translationKeyGuard`
ESLint block enforces that rule for direct and member `t()` calls.

`message(key, params)` creates a descriptor for translated content that can travel through
application code. `dateParam` accepts only real `YYYY-MM-DD` calendar dates. Use `isIsoDate`
to narrow an untrusted string before passing it to `dateParam`.

Interpolation values may be strings, numbers, or date parameters. Parameter names cannot use
i18next option names such as `count`, `lng`, `lngs`, `fallbackLng`, `ns`, `keySeparator`,
`nsSeparator`, `context`, `defaultValue`, `returnObjects`, `returnDetails`, `joinArrays`,
`ordinal`, `replace`, `keyPrefix`, `postProcess`, or `interpolation`.
