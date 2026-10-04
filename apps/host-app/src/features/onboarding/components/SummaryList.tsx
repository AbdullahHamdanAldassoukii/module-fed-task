import { dateParam, isIsoDate } from '@repo/i18n';
import type { AcceptedMimeType } from '@repo/passport-contract';
import type { ReactNode } from 'react';
import { M, useT, type AppMessageKey } from '../../../lib/i18n';
import { nationalityName, type ApplicationSummary } from '../model';

const DOCUMENT_TYPE = {
  'application/pdf': M.submitted.documentType.pdf,
  'image/png': M.submitted.documentType.png,
  'image/jpeg': M.submitted.documentType.jpeg,
  'image/jpg': M.submitted.documentType.jpeg,
} satisfies Record<AcceptedMimeType, AppMessageKey>;

interface Row {
  label: AppMessageKey;
  value: ReactNode;
}

const isolate = (text: string) => `\u2068${text}\u2069`;

const Ltr = ({ children }: { children: string }) => <bdi dir="ltr">{children}</bdi>;

export function SummaryList({ summary, locale }: { summary: ApplicationSummary; locale: string }) {
  const { t } = useT();
  const { issueDate, expiryDate } = summary;
  const validity =
    isIsoDate(issueDate) && isIsoDate(expiryDate)
      ? t(M.submitted.summary.validityRange, {
          from: dateParam(issueDate),
          to: dateParam(expiryDate),
        })
      : `${issueDate} – ${expiryDate}`;

  const rows: Row[] = [
    {
      label: M.submitted.summary.name,
      value: t(M.submitted.summary.fullName, {
        firstName: summary.firstName,
        lastName: summary.lastName,
      }),
    },
    { label: M.submitted.summary.passportNumber, value: <Ltr>{summary.passportNumber}</Ltr> },
    { label: M.submitted.summary.validity, value: validity },
    {
      label: M.submitted.summary.document,
      value: t(M.submitted.summary.documentValue, {
        fileName: isolate(summary.documentName),
        fileType: t(DOCUMENT_TYPE[summary.documentType]),
      }),
    },
    { label: M.submitted.summary.idNumber, value: <Ltr>{summary.idNumber}</Ltr> },
    {
      label: M.submitted.summary.nationality,
      value: nationalityName(summary.nationality, locale),
    },
  ];

  return (
    <dl className="wizard-summary">
      {rows.map((row) => (
        <div className="wizard-summary-row" key={row.label}>
          <dt>{t(row.label)}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
