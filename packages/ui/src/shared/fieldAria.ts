export const fieldLabelId = (id: string) => `${id}-label`;

export function fieldAria(
  id: string,
  opts: { description?: string; error?: string; required?: boolean },
) {
  const ids = [opts.description && `${id}-description`, opts.error && `${id}-error`]
    .filter(Boolean)
    .join(' ');
  return {
    'aria-describedby': ids || undefined,
    'aria-invalid': opts.error ? ('true' as const) : undefined,
    'aria-required': opts.required ? ('true' as const) : undefined,
  };
}
