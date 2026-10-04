export const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
] as const;
export type AcceptedMimeType = (typeof ACCEPTED_MIME_TYPES)[number];

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isIsoDate(value: string): boolean {
  const m = ISO_DATE.exec(value);
  if (!m) return false;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

export function isExpiryAfterIssue(issueDate: string, expiryDate: string): boolean {
  if (!isIsoDate(issueDate) || !isIsoDate(expiryDate)) return false;
  // Equal-width ISO dates sort chronologically.
  return expiryDate > issueDate;
}

export function isAcceptedMimeType(value: string): value is AcceptedMimeType {
  return (ACCEPTED_MIME_TYPES as readonly string[]).includes(value);
}
